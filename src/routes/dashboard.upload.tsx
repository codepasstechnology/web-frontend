import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Map as MapIcon,
  Star,
  UploadCloud,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LandBoundaryMap } from "@/components/LandBoundaryMap";
import { useAuth, type NewListingInput } from "@/lib/auth";
import { kenyaCounties, usePlans } from "@/lib/plans";
import { formatThousands, toDigits } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({ meta: [{ title: "Upload Land — GeoPin Properties Kenya" }] }),
  component: UploadPage,
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    type: s.type === "land" ? ("land" as const) : undefined,
  }),
});

const steps = ["Basic Details", "Location on Map", "Photos & Documents", "Review & Submit"];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DEED_BYTES = 10 * 1024 * 1024;

const DOC_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "title_deed", label: "Title Deed" },
  { value: "mutation", label: "Mutation Form" },
  { value: "lease_agreement", label: "Lease Agreement" },
  { value: "certificate_of_occupancy", label: "Certificate of Occupancy" },
  { value: "survey_map", label: "Survey Map" },
  { value: "other", label: "Other" },
];

type SizeUnit = "acres" | "hectares" | "feet";

const DRAFT_KEY = "lv_upload_draft_v1";

interface UploadDraft {
  step: number;
  parcelNumber: string;
  phone: string;
  county: string;
  area: string;
  sizeUnit: SizeUnit;
  sizeAcres: string;
  sizeHectares: string;
  sizeWidthFt: string;
  sizeLengthFt: string;
  price: string;
  description: string;
  listingType: "sale" | "lease";
  landType: NewListingInput["landType"];
  utilities: string[];
  pin: [number, number] | null;
  boundary: { lat: number; lng: number }[] | null;
}

function loadDraft(): UploadDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as UploadDraft) : null;
  } catch {
    return null;
  }
}

function clearDraft(): void {
  if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
}

function sizeToAcres(
  unit: SizeUnit,
  acres: string,
  hectares: string,
  widthFt: string,
  lengthFt: string,
): number | null {
  if (unit === "acres") {
    const v = Number(acres);
    return acres && v > 0 ? v : null;
  }
  if (unit === "hectares") {
    const v = Number(hectares);
    return hectares && v > 0 ? v * 2.4710538 : null;
  }
  const w = Number(widthFt);
  const l = Number(lengthFt);
  return widthFt && lengthFt && w > 0 && l > 0 ? (w * l) / 43560 : null;
}

function sizeToDisplay(
  unit: SizeUnit,
  acres: string,
  hectares: string,
  widthFt: string,
  lengthFt: string,
): string {
  if (unit === "acres") return acres ? `${acres} ${Number(acres) === 1 ? "acre" : "acres"}` : "";
  if (unit === "hectares") return hectares ? `${hectares} ha` : "";
  return widthFt && lengthFt ? `${widthFt} x ${lengthFt} ft` : "";
}

type LatLng = { lat: number; lng: number };

function segmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
  const d = (a: LatLng, b: LatLng, c: LatLng) =>
    (c.lng - a.lng) * (b.lat - a.lat) - (b.lng - a.lng) * (c.lat - a.lat);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  return (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)
    ? (d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)
    : false;
}

function hasSelfIntersection(points: LatLng[]): boolean {
  const n = points.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      if (j === i || (j + 1) % n === i || (i + 1) % n === j) continue;
      if (segmentsIntersect(a1, a2, points[j], points[(j + 1) % n])) return true;
    }
  }
  return false;
}

function polygonAreaAcres(points: { lat: number; lng: number }[]): number {
  const R = 6378137;
  const lat0 = (points.reduce((s, p) => s + p.lat, 0) / points.length) * (Math.PI / 180);
  const xy = points.map((p): [number, number] => [
    R * (p.lng * (Math.PI / 180)) * Math.cos(lat0),
    R * (p.lat * (Math.PI / 180)),
  ]);
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2 / 4046.8564224;
}

function ListingTypeChooser({
  onLand,
  onProperty,
}: {
  onLand: () => void;
  onProperty: () => void;
}) {
  const options = [
    {
      icon: <MapIcon className="h-6 w-6 text-[#15803D]" />,
      title: "Land parcel",
      body: "A plot or acreage with a mapped boundary and title documents.",
      cta: "Upload land",
      onClick: onLand,
    },
    {
      icon: <Building2 className="h-6 w-6 text-[#15803D]" />,
      title: "Rental, BnB or home for sale",
      body: "An apartment, house or short stay pinned to a single location.",
      cta: "Post a property",
      onClick: onProperty,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-foreground md:text-2xl">What are you posting?</h1>
      <p className="text-sm text-muted-foreground">Both go live once our team approves them.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.title}
            onClick={o.onClick}
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-[#15803D] hover:bg-muted/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#15803D]/10">
              {o.icon}
            </div>
            <div>
              <div className="text-base font-semibold text-foreground">{o.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{o.body}</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#15803D]">
              {o.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadPage() {
  const { user, ready, addListing, fetchListing, updateListing } = useAuth();
  const { data: plans = [] } = usePlans();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const search = Route.useSearch();
  const editId = search.edit;
  const draft = useRef(editId ? null : loadDraft()).current;
  const [step, setStep] = useState(draft?.step ?? 0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(!!draft);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [loadingListing, setLoadingListing] = useState(!!editId);
  const [loadError, setLoadError] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<
    { id: string; url: string; isCover: boolean }[]
  >([]);
  const [removePhotoIds, setRemovePhotoIds] = useState<string[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | undefined>(undefined);

  const [form, setForm] = useState({
    parcelNumber: draft?.parcelNumber ?? "",
    phone: draft?.phone ?? "",
    county: draft?.county ?? "",
    area: draft?.area ?? "",
    sizeUnit: draft?.sizeUnit ?? ("acres" as SizeUnit),
    sizeAcres: draft?.sizeAcres ?? "",
    sizeHectares: draft?.sizeHectares ?? "",
    sizeWidthFt: draft?.sizeWidthFt ?? "",
    sizeLengthFt: draft?.sizeLengthFt ?? "",
    price: draft?.price ?? "",
    description: draft?.description ?? "",
    listingType: draft?.listingType ?? ("sale" as "sale" | "lease"),
    landType: draft?.landType ?? ("residential" as NewListingInput["landType"]),
    utilities: draft?.utilities ?? ([] as string[]),
    pin: draft?.pin ?? (null as [number, number] | null),
    boundary: draft?.boundary ?? (null as { lat: number; lng: number }[] | null),
    photos: [] as { name: string; url: string; file: File }[],
    documents: [] as { type: string; file: File }[],
  });

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
    else if (ready && user?.role === "account_manager") navigate({ to: "/manager" });
  }, [ready, user, navigate]);

  const photosRef = useRef(form.photos);
  photosRef.current = form.photos;
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoadingListing(true);
    setLoadError("");
    fetchListing(editId)
      .then((d) => {
        setForm((f) => ({
          ...f,
          parcelNumber: d.parcelNumber,
          phone: d.phone ?? "",
          county: d.county,
          area: d.area ?? "",
          sizeUnit: "acres",
          sizeAcres: d.areaAcres != null ? String(d.areaAcres) : "",
          price: String(d.price),
          description: d.description ?? "",
          listingType: d.listingType,
          landType: d.landType,
          utilities: d.utilities,
          pin: d.latitude != null && d.longitude != null ? [d.latitude, d.longitude] : null,
          boundary: d.boundary ?? null,
        }));
        setExistingPhotos(d.photos.map((p) => ({ id: p.id, url: p.url, isCover: p.isCover })));
        setCoverPhotoId(d.photos.find((p) => p.isCover)?.id);
      })
      .catch(() => setLoadError("Couldn't load this listing. Please try again."))
      .finally(() => setLoadingListing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Autosave the wizard so an accidental refresh or nav-away doesn't lose
  // progress. Photo/document files aren't serializable, so they're excluded —
  // the seller re-attaches those if a draft is restored. Skipped while
  // editing an existing listing so it doesn't clobber the create-flow draft.
  useEffect(() => {
    if (typeof window === "undefined" || editId) return;
    const { photos: _photos, documents: _documents, ...draftFields } = form;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, ...draftFields }));
  }, [step, form, editId]);

  if (!user || user.role === "account_manager") return null;

  if (!editId && search.type !== "land") {
    return (
      <DashboardShell active="upload" onChange={() => {}}>
        <ListingTypeChooser
          onLand={() =>
            navigate({ to: "/dashboard/upload", search: { edit: undefined, type: "land" } })
          }
          onProperty={() => navigate({ to: "/dashboard/properties" })}
        />
      </DashboardShell>
    );
  }

  const plan = plans.find((p) => p.id === user.plan);
  const used = user.listings.length;
  const remaining = user.maxListings === Infinity ? Infinity : user.maxListings - used;
  const limitReached = !editId && remaining <= 0;
  const photoLimit = plan?.photos ?? 0;
  const totalPhotoCount = existingPhotos.length + form.photos.length;
  const documentLimit = plan?.documents ?? 0;
  const propertyDocCount = form.documents.filter((d) => d.type !== "national_id").length;
  const hasRequiredDocs =
    !!editId ||
    (form.documents.some((d) => d.type === "national_id") &&
      form.documents.some((d) => d.type === "title_deed"));

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const wrongType = arr.filter((f) => f.type && !f.type.startsWith("image/"));
    const oversized = arr.filter((f) => !wrongType.includes(f) && f.size > MAX_PHOTO_BYTES);
    const valid = arr.filter((f) => !wrongType.includes(f) && f.size <= MAX_PHOTO_BYTES);
    const errors = [
      wrongType.length &&
        `${wrongType.map((f) => f.name).join(", ")} ${wrongType.length === 1 ? "isn't an image file" : "aren't image files"}.`,
      oversized.length &&
        `${oversized.map((f) => f.name).join(", ")} ${oversized.length === 1 ? "is" : "are"} over the 5MB limit per photo.`,
    ].filter(Boolean);
    setFileError(errors.join(" "));
    const allowed = photoLimit - existingPhotos.length - form.photos.length;
    const slice = valid.slice(0, Math.max(0, allowed));
    const mapped = slice.map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }));
    set("photos", [...form.photos, ...mapped]);
  };

  const sizeAcres = sizeToAcres(
    form.sizeUnit,
    form.sizeAcres,
    form.sizeHectares,
    form.sizeWidthFt,
    form.sizeLengthFt,
  );
  const sizeDisplay = sizeToDisplay(
    form.sizeUnit,
    form.sizeAcres,
    form.sizeHectares,
    form.sizeWidthFt,
    form.sizeLengthFt,
  );
  const tracedAreaAcres = form.boundary ? polygonAreaAcres(form.boundary) : null;
  const boundarySelfIntersects = form.boundary ? hasSelfIntersection(form.boundary) : false;

  const canNext =
    step === 0
      ? !!(form.parcelNumber && form.county && sizeAcres != null && form.price)
      : step === 1
        ? (!!form.pin || !!form.boundary) && !boundarySelfIntersects
        : step === 2
          ? hasRequiredDocs
          : true;

  const submit = async () => {
    if (limitReached) {
      setUpgradeOpen(true);
      return;
    }
    setSubmitting(true);
    setSubmitErr("");
    setUploadProgress(form.documents.length || form.photos.length ? 0 : null);
    const payload: NewListingInput = {
      title: form.parcelNumber,
      parcelNumber: form.parcelNumber,
      phone: form.phone || undefined,
      county: form.county,
      area: form.area || undefined,
      size: sizeDisplay || undefined,
      areaAcres: sizeAcres ?? undefined,
      price: Number(form.price) || 0,
      description: form.description || undefined,
      latitude: form.pin?.[0],
      longitude: form.pin?.[1],
      boundary: form.boundary ?? undefined,
      boundarySource: form.boundary ? "traced" : form.pin ? "approximate" : undefined,
      listingType: form.listingType,
      landType: form.landType,
      utilities: form.utilities.length ? form.utilities : undefined,
      documents: form.documents.length ? form.documents : undefined,
      photoFiles: form.photos.map((p) => p.file),
    };
    try {
      if (editId) {
        await updateListing(
          editId,
          {
            ...payload,
            removePhotoIds: removePhotoIds.length ? removePhotoIds : undefined,
            coverPhotoId,
          },
          setUploadProgress,
          abortRef,
        );
      } else {
        await addListing(payload, setUploadProgress, abortRef);
        clearDraft();
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { message?: string; aborted?: boolean };
      if (!e?.aborted) setSubmitErr(e?.message ?? "Failed to submit listing. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      abortRef.current = null;
    }
  };

  return (
    <DashboardShell active="upload" onChange={() => {}}>
      {step === 1 && isMobile && !submitted && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="mx-auto text-sm font-semibold text-foreground">
              Pin or trace your land
            </span>
            <span className="w-12 shrink-0" aria-hidden="true" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-3">
            <LandBoundaryMap
              pin={form.pin}
              boundary={form.boundary}
              onPinChange={(p) => set("pin", p)}
              onBoundaryChange={(b) => set("boundary", b)}
              county={form.county}
              hintText=""
              heightClassName="h-[calc(100dvh-12rem)]"
            />
          </div>
          <div className="shrink-0 border-t border-border p-3">
            <p
              className={`mb-2 truncate text-xs font-medium ${
                boundarySelfIntersects ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {boundarySelfIntersects
                ? 'This boundary crosses itself — tap "Retrace boundary" to redraw it.'
                : form.boundary
                  ? `Boundary traced — ${form.boundary.length} points${
                      tracedAreaAcres != null ? ` · ≈ ${tracedAreaAcres.toFixed(2)} acres` : ""
                    }`
                  : form.pin
                    ? `Pin set — ${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}`
                    : "Tap the map to drop a pin, or trace your land's exact edge."}
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canNext}
              className="w-full rounded-md bg-[#15803D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#166534] disabled:opacity-50"
            >
              Confirm location
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        <button
          onClick={() => navigate({ to: "/dashboard", search: { tab: undefined } })}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </button>
        <h1 className="text-2xl font-semibold text-foreground">
          {editId ? "Edit Listing" : "Upload Land"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {editId
            ? "Changes go back under review before they're visible again."
            : "List a parcel in 4 quick steps."}
        </p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  i < step
                    ? "bg-[#15803D] text-white"
                    : i === step
                      ? "border-2 border-[#15803D] bg-card text-[#15803D]"
                      : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <div className="hidden text-xs font-medium text-foreground sm:block">{s}</div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 ${i < step ? "bg-[#15803D]" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {showDraftNotice && !submitted && !editId && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-[#15803D]/30 bg-[#15803D]/5 px-3 py-2 text-xs text-foreground">
            <span>
              Restored your unsaved draft from earlier. Photos and documents aren't saved in drafts
              — you'll need to re-attach them.
            </span>
            <button
              onClick={() => setShowDraftNotice(false)}
              className="font-medium text-[#15803D] hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loadingListing ? (
          <div className="mt-8 flex justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#15803D] border-t-transparent" />
          </div>
        ) : loadError ? (
          <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-6 text-center text-sm text-red-700">
            {loadError}
          </div>
        ) : submitted ? (
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#16A34A]" />
            <h2 className="mt-3 text-lg font-semibold text-foreground">
              {editId ? "Changes saved" : "Listing submitted"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editId
                ? "Your changes have been saved and the listing is back under review."
                : "Your listing is under review and will appear on the map within 24 hours."}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => navigate({ to: "/dashboard", search: { tab: undefined } })}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Go to dashboard
              </button>
              {!editId && (
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setStep(0);
                    setForm({
                      parcelNumber: "",
                      phone: "",
                      county: "",
                      area: "",
                      sizeUnit: "acres",
                      sizeAcres: "",
                      sizeHectares: "",
                      sizeWidthFt: "",
                      sizeLengthFt: "",
                      price: "",
                      description: "",
                      listingType: "sale",
                      landType: "residential",
                      utilities: [],
                      pin: null,
                      boundary: null,
                      photos: [],
                      documents: [],
                    });
                  }}
                  className="rounded-md bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534]"
                >
                  Upload another
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title number" full>
                  <input
                    className="lv-input"
                    placeholder="e.g. KAJ/KTG/4521"
                    value={form.parcelNumber}
                    onChange={(e) => set("parcelNumber", e.target.value)}
                  />
                </Field>
                <Field label="County">
                  <select
                    className="lv-input"
                    value={form.county}
                    onChange={(e) => set("county", e.target.value)}
                  >
                    <option value="">Select county</option>
                    {kenyaCounties.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sub-county / Area">
                  <input
                    className="lv-input"
                    placeholder="e.g. Kitengela"
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                  />
                </Field>
                <Field label="Land size" full>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-40">
                      <select
                        className="lv-input"
                        value={form.sizeUnit}
                        onChange={(e) => set("sizeUnit", e.target.value as SizeUnit)}
                      >
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                        <option value="feet">Feet (W x L)</option>
                      </select>
                    </div>
                    {form.sizeUnit === "acres" && (
                      <div className="w-28">
                        <input
                          className="lv-input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 1.5"
                          value={form.sizeAcres}
                          onChange={(e) => set("sizeAcres", e.target.value)}
                        />
                      </div>
                    )}
                    {form.sizeUnit === "hectares" && (
                      <div className="w-28">
                        <input
                          className="lv-input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 0.5"
                          value={form.sizeHectares}
                          onChange={(e) => set("sizeHectares", e.target.value)}
                        />
                      </div>
                    )}
                    {form.sizeUnit === "feet" && (
                      <>
                        <div className="w-24">
                          <input
                            className="lv-input"
                            type="number"
                            min="0"
                            placeholder="Width"
                            value={form.sizeWidthFt}
                            onChange={(e) => set("sizeWidthFt", e.target.value)}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">x</span>
                        <div className="w-24">
                          <input
                            className="lv-input"
                            type="number"
                            min="0"
                            placeholder="Length"
                            value={form.sizeLengthFt}
                            onChange={(e) => set("sizeLengthFt", e.target.value)}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">ft</span>
                      </>
                    )}
                  </div>
                  {sizeAcres != null && form.sizeUnit !== "acres" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ≈ {sizeAcres.toFixed(2)} acres
                    </p>
                  )}
                </Field>
                <Field label="Asking price (Ksh)">
                  <input
                    className="lv-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1,850,000"
                    value={formatThousands(form.price)}
                    onChange={(e) => set("price", toDigits(e.target.value))}
                  />
                </Field>
                <Field label="Contact phone">
                  <input
                    className="lv-input"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="Listing type">
                  <select
                    className="lv-input"
                    value={form.listingType}
                    onChange={(e) => set("listingType", e.target.value as "sale" | "lease")}
                  >
                    <option value="sale">For Sale</option>
                    <option value="lease">For Lease</option>
                  </select>
                </Field>
                <Field label="Land type">
                  <select
                    className="lv-input"
                    value={form.landType}
                    onChange={(e) => set("landType", e.target.value as NewListingInput["landType"])}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="agricultural">Agricultural</option>
                    <option value="mixed_use">Mixed Use</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </Field>
                <Field label="Utilities available" full>
                  <div className="flex flex-wrap gap-2">
                    {["Water", "Electricity", "Fibre", "Sewer", "3-Phase"].map((u) => {
                      const checked = form.utilities.includes(u);
                      return (
                        <label
                          key={u}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium ${
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() =>
                              set(
                                "utilities",
                                checked
                                  ? form.utilities.filter((x) => x !== u)
                                  : [...form.utilities, u],
                              )
                            }
                          />
                          {u}
                        </label>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Description" full>
                  <textarea
                    className="lv-input"
                    rows={4}
                    maxLength={5000}
                    placeholder="Describe the parcel — access, nearby developments, why it's a good investment…"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 1 && !isMobile && (
              <div>
                <LandBoundaryMap
                  pin={form.pin}
                  boundary={form.boundary}
                  onPinChange={(p) => set("pin", p)}
                  onBoundaryChange={(b) => set("boundary", b)}
                  county={form.county}
                />
                {boundarySelfIntersects && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    This boundary crosses itself — tap &quot;Retrace boundary&quot; to redraw it
                    before continuing.
                  </p>
                )}
                {form.boundary && tracedAreaAcres != null && (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    Traced boundary: {form.boundary.length} points · ≈ {tracedAreaAcres.toFixed(2)}{" "}
                    acres
                    <button
                      type="button"
                      onClick={() => {
                        set("sizeUnit", "acres");
                        set("sizeAcres", tracedAreaAcres.toFixed(2));
                      }}
                      className="font-medium text-[#15803D] hover:underline"
                    >
                      Use this as land size
                    </button>
                  </p>
                )}
                {!form.boundary && form.pin && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Pin: {form.pin[0].toFixed(5)}, {form.pin[1].toFixed(5)}
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Photos ({totalPhotoCount}/{photoLimit} allowed on {plan?.name ?? user.plan})
                  </span>
                  {totalPhotoCount >= photoLimit && (
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="font-medium text-[#15803D] hover:underline"
                    >
                      Upgrade to upload more
                    </button>
                  )}
                </div>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handlePhotos(e.dataTransfer.files);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed py-10 text-sm text-muted-foreground hover:border-[#15803D] ${
                    dragActive ? "border-[#15803D] bg-[#15803D]/5" : "border-border bg-background"
                  }`}
                >
                  <UploadCloud className="h-6 w-6" />
                  <span>Drag and drop photos, or click to browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotos(e.target.files)}
                    disabled={totalPhotoCount >= photoLimit}
                  />
                </label>
                {(existingPhotos.length > 0 || form.photos.length > 0) && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {existingPhotos.map((p) => (
                      <div key={p.id} className="relative">
                        <img src={p.url} alt="" className="h-20 w-full rounded-md object-cover" />
                        <button
                          type="button"
                          onClick={() => setCoverPhotoId(p.id)}
                          title={coverPhotoId === p.id ? "Cover photo" : "Set as cover"}
                          className={`absolute left-1 top-1 rounded-full p-1 ${
                            coverPhotoId === p.id
                              ? "bg-[#15803D] text-white"
                              : "bg-black/60 text-white hover:bg-black/80"
                          }`}
                        >
                          <Star
                            className="h-3 w-3"
                            fill={coverPhotoId === p.id ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExistingPhotos((prev) => prev.filter((x) => x.id !== p.id));
                            setRemovePhotoIds((prev) => [...prev, p.id]);
                            if (coverPhotoId === p.id) setCoverPhotoId(undefined);
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {form.photos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p.url} alt="" className="h-20 w-full rounded-md object-cover" />
                        <button
                          onClick={() => {
                            URL.revokeObjectURL(p.url);
                            set(
                              "photos",
                              form.photos.filter((_, j) => j !== i),
                            );
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {fileError && (
                  <p className="mt-2 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">
                    {fileError}
                  </p>
                )}
                {(form.photos.length > 0 || form.documents.length > 0) && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Total upload size:{" "}
                    {(
                      (form.photos.reduce((s, p) => s + p.file.size, 0) +
                        form.documents.reduce((s, d) => s + d.file.size, 0)) /
                      (1024 * 1024)
                    ).toFixed(1)}{" "}
                    MB
                  </p>
                )}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Documents ({propertyDocCount}/{documentLimit} allowed on{" "}
                      {plan?.name ?? user.plan})
                    </span>
                    {propertyDocCount >= documentLimit && (
                      <button
                        onClick={() => setUpgradeOpen(true)}
                        className="font-medium text-[#15803D] hover:underline"
                      >
                        Upgrade to add more
                      </button>
                    )}
                  </div>
                  <Field label="Documents — National ID and Title Deed required">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        className="lv-input sm:w-56"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                      >
                        {DOC_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="lv-input"
                        disabled={docType !== "national_id" && propertyDocCount >= documentLimit}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          e.target.value = "";
                          if (!f) return;
                          if (
                            f.type &&
                            f.type !== "application/pdf" &&
                            !f.type.startsWith("image/")
                          ) {
                            setFileError(`${f.name} must be a PDF or image file.`);
                            return;
                          }
                          if (f.size > MAX_DEED_BYTES) {
                            setFileError(`${f.name} is over the 10MB limit per document.`);
                            return;
                          }
                          setFileError("");
                          set("documents", [...form.documents, { type: docType, file: f }]);
                        }}
                      />
                    </div>
                  </Field>
                  {!editId && !hasRequiredDocs && (
                    <p className="mt-2 text-xs text-amber-600">
                      A National ID and a Title Deed are required to continue.
                    </p>
                  )}
                  {form.documents.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {form.documents.map((d, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-xs"
                        >
                          <span>
                            <span className="font-medium text-foreground">
                              {DOC_TYPES.find((t) => t.value === d.type)?.label}:
                            </span>{" "}
                            <span className="text-muted-foreground">{d.file.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "documents",
                                form.documents.filter((_, j) => j !== i),
                              )
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 text-sm">
                <Summary label="Title number" value={form.parcelNumber || "—"} />
                <Summary
                  label="County"
                  value={`${form.county}${form.area ? " · " + form.area : ""}`}
                />
                <Summary label="Size" value={sizeDisplay || "—"} />
                <Summary
                  label="Price"
                  value={form.price ? `Ksh ${Number(form.price).toLocaleString()}` : "—"}
                />
                <Summary label="Contact phone" value={form.phone || "—"} />
                <Summary
                  label="Listing type"
                  value={form.listingType === "sale" ? "For Sale" : "For Lease"}
                />
                <Summary
                  label="Land type"
                  value={
                    {
                      residential: "Residential",
                      commercial: "Commercial",
                      agricultural: "Agricultural",
                      mixed_use: "Mixed Use",
                      industrial: "Industrial",
                    }[form.landType!] ?? "—"
                  }
                />
                <Summary
                  label="Location"
                  value={
                    form.boundary
                      ? `Traced (${form.boundary.length} points)`
                      : form.pin
                        ? `${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}`
                        : "Not set"
                  }
                />
                <Summary label="Photos" value={`${totalPhotoCount} attached`} />
                <Summary
                  label="Documents"
                  value={form.documents.length ? `${form.documents.length} attached` : "None"}
                />
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Plan</div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {plan?.name ?? user.plan} — {used}/
                    {user.maxListings === Infinity ? "∞" : user.maxListings} listings used
                  </div>
                </div>
                {submitting && uploadProgress != null && (
                  <div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#15803D] transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {uploadProgress < 100
                          ? `Uploading… ${uploadProgress}%`
                          : "Upload complete — finishing up…"}
                      </p>
                      <button
                        type="button"
                        onClick={() => abortRef.current?.()}
                        className="text-xs font-medium text-destructive hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {submitErr && (
                  <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {submitErr}
                  </div>
                )}
                {limitReached && (
                  <div className="rounded-md border border-[#D97706]/40 bg-[#D97706]/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#D97706]">
                      <Lock className="h-4 w-4" /> Listing limit reached
                    </div>
                    <p className="mt-1 text-xs text-foreground">
                      You've used all {user.maxListings} listings on the {plan?.name ?? user.plan}{" "}
                      plan. Upgrade to publish this listing.
                    </p>
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="mt-3 rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534]"
                    >
                      View plans
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] disabled:opacity-50"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] disabled:opacity-60"
                >
                  {submitting && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {submitting
                    ? editId
                      ? "Saving…"
                      : "Submitting…"
                    : editId
                      ? "Save changes"
                      : "Publish Listing"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        currentPlan={user.plan}
        onClose={() => setUpgradeOpen(false)}
        onSelect={() => {}}
        reason="Upgrade to unlock more listings and photos."
      />

      <style>{`.lv-input{display:block;height:40px;width:100%;border:1px solid #E2E8F0;border-radius:6px;padding:0 12px;font-size:14px;background:#fff;color:#0F172A;outline:none}.lv-input:focus{border-color:#15803D}textarea.lv-input{height:auto;padding:8px 12px}`}</style>
    </DashboardShell>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}
