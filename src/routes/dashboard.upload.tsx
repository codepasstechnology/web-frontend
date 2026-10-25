import { preloadMap } from "@/lib/mapPreload";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Lock,
  MapPin,
  Paperclip,
  Spline,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { DOC_TYPES, REQUIRED_DOCS } from "@/lib/kyc";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { LandBoundaryMap } from "@/components/map/LazyMaps";
import { useAuth, type NewListingInput } from "@/lib/auth";
import { api } from "@/lib/api";
import { kenyaCounties, usePlans, type Plan } from "@/lib/plans";
import { formatThousands, toDigits } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { saveDraftPhotos, loadDraftPhotos, clearDraftPhotos } from "@/lib/draftPhotoStore";
import { hasSelfIntersection, polygonAreaAcres } from "@/lib/mapGeo";
import { plotStatus } from "@/lib/plotting";
import { Beacon } from "@/components/dashboard/parts";
import {
  DraftNotice,
  ErrorBox,
  Field,
  PhotoPicker,
  ReviewRows,
  Segmented,
  StepHeading,
  SuccessPanel,
  ToggleChips,
  WarnBox,
  WizardFooter,
  WizardHeader,
} from "@/components/dashboard/wizard";
import "@/components/site/site-pages.css";
import "@/components/map/map.css";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({
    meta: [{ title: "Upload Land — Geo Pin Properties Kenya" }],
    links: MARKETING_FONT_LINKS,
  }),
  component: UploadPage,
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    type: s.type === "land" ? ("land" as const) : undefined,
  }),
});

const steps = ["Basic details", "Location on map", "Photos & documents", "Review & submit"];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DEED_BYTES = 10 * 1024 * 1024;
const DESCRIPTION_MAX = 5000;
// Deeds come in many shapes (KAJ/KTG/4521, NAIVASHA/MARAIGUSHU BLOCK 7/2312,
// L.R. NO. 209/1234, IR 12345), so only the characters and a number are checked.
const TITLE_NUMBER = /^(?=.*\d)[A-Z0-9 ./(),'-]{3,100}$/;

const LAND_TYPES: Record<NonNullable<NewListingInput["landType"]>, string> = {
  residential: "Residential",
  commercial: "Commercial",
  agricultural: "Agricultural",
  mixed_use: "Mixed Use",
  industrial: "Industrial",
};

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
  clearDraftPhotos(DRAFT_KEY);
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

function ListingTypeChooser({
  photoLimit,
  onLand,
  onProperty,
}: {
  photoLimit: number | null;
  onLand: () => void;
  onProperty: () => void;
}) {
  const photos = photoLimit ? `Up to ${photoLimit} photos` : "Photos";
  return (
    <>
      <div className="gd-r">
        <h1 className="gd-h1">What are you posting?</h1>
        <p className="gd-sub">Both go live once our team approves them, usually within 24 hours.</p>
      </div>
      <div className="gd-r gd-choose">
        <button type="button" className="gd-card gd-pick" onClick={onLand}>
          <span className="gd-art" style={{ height: 130 }}>
            <svg
              viewBox="0 0 220 120"
              width="100%"
              height="130"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <path
                d="M0 98 C 60 90, 120 112, 220 80"
                stroke="var(--card)"
                strokeWidth="12"
                fill="none"
              />
              <path
                d="M44 30 152 16 176 92 66 106Z"
                fill="var(--brand)"
                fillOpacity=".18"
                stroke="var(--brand)"
                strokeWidth="2.5"
                strokeDasharray="7 5"
                strokeLinejoin="round"
              />
            </svg>
            {[
              [36, 10],
              [144, -4],
              [168, 72],
              [58, 86],
            ].map(([x, y]) => (
              <span
                key={`${x}-${y}`}
                className="absolute"
                style={{ left: `calc(50% - 110px + ${x}px)`, top: y }}
              >
                <Beacon width={16} height={22} />
              </span>
            ))}
          </span>
          <span className="gd-h2 text-[22px]">Land parcel</span>
          <span className="leading-normal text-muted-foreground">
            A plot or acreage with a mapped boundary and title documents.
          </span>
          <span className="gd-need">
            <span>Title number</span>
            <span>National ID + title deed</span>
            <span>{photos}</span>
          </span>
          <span className="gd-link">
            Upload land <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>
        <button type="button" className="gd-card gd-pick" onClick={onProperty}>
          <span className="gd-art" style={{ height: 130 }}>
            <svg
              viewBox="0 0 220 120"
              width="100%"
              height="130"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <path
                d="M0 98 C 60 90, 120 112, 220 80"
                stroke="var(--card)"
                strokeWidth="12"
                fill="none"
              />
              <path d="M84 92V58l26-22 26 22v34Z" fill="var(--brand)" />
              <path d="M102 92V74h16v18" fill="var(--background-2)" />
              <path d="M140 92V48h40v44Z" fill="var(--brand)" fillOpacity=".55" />
              <path
                d="M148 56h8v8h-8zM164 56h8v8h-8zM148 70h8v8h-8zM164 70h8v8h-8z"
                fill="var(--background-2)"
              />
            </svg>
          </span>
          <span className="gd-h2 text-[22px]">Rental, BnB or home for sale</span>
          <span className="leading-normal text-muted-foreground">
            An apartment, house or short stay pinned to a single location.
          </span>
          <span className="gd-need">
            <span>Estate or address</span>
            <span>{photos}</span>
            <span>Posting fee for rentals</span>
          </span>
          <span className="gd-link">
            Post a property <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>
      </div>
    </>
  );
}

const emptyForm = {
  parcelNumber: "",
  phone: "",
  county: "",
  area: "",
  sizeUnit: "acres" as SizeUnit,
  sizeAcres: "",
  sizeHectares: "",
  sizeWidthFt: "",
  sizeLengthFt: "",
  price: "",
  description: "",
  listingType: "sale" as "sale" | "lease",
  landType: "residential" as NewListingInput["landType"],
  utilities: [] as string[],
  pin: null as [number, number] | null,
  boundary: null as { lat: number; lng: number }[] | null,
  photos: [] as { name: string; url: string; file: File }[],
  documents: [] as { type: string; file: File }[],
};

type BasicsField = "parcelNumber" | "county" | "size" | "price";

function UploadPage() {
  const { user, ready, addListing, fetchListing, updateListing } = useAuth();
  const { data: plans = [] } = usePlans();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const search = Route.useSearch();
  const editId = search.edit;
  const draft = useRef(editId ? null : loadDraft()).current;
  const [step, setStep] = useState(draft?.step ?? 0);
  useEffect(() => {
    if (step === 0) preloadMap("plotting");
  }, [step]);
  const [maxStep, setMaxStep] = useState(draft?.step ?? 0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const [fileError, setFileError] = useState("");
  const [docError, setDocError] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [showDraftNotice, setShowDraftNotice] = useState(!!draft);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [showErrors, setShowErrors] = useState(false);
  const [loadingListing, setLoadingListing] = useState(!!editId);
  const [loadError, setLoadError] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<
    { id: string; url: string; isCover: boolean }[]
  >([]);
  const [removePhotoIds, setRemovePhotoIds] = useState<string[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | undefined>(undefined);
  // Bumped to shake the "crosses itself" note, and to open the map's walkthrough.
  const [mapAttention, setMapAttention] = useState(0);
  const [tutorialKey, setTutorialKey] = useState(0);
  const [overlapWarning, setOverlapWarning] = useState(false);
  const [savedWithOverlap, setSavedWithOverlap] = useState(false);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    parcelNumber: draft?.parcelNumber ?? emptyForm.parcelNumber,
    phone: draft?.phone ?? emptyForm.phone,
    county: draft?.county ?? emptyForm.county,
    area: draft?.area ?? emptyForm.area,
    sizeUnit: draft?.sizeUnit ?? emptyForm.sizeUnit,
    sizeAcres: draft?.sizeAcres ?? emptyForm.sizeAcres,
    sizeHectares: draft?.sizeHectares ?? emptyForm.sizeHectares,
    sizeWidthFt: draft?.sizeWidthFt ?? emptyForm.sizeWidthFt,
    sizeLengthFt: draft?.sizeLengthFt ?? emptyForm.sizeLengthFt,
    price: draft?.price ?? emptyForm.price,
    description: draft?.description ?? emptyForm.description,
    listingType: draft?.listingType ?? emptyForm.listingType,
    landType: draft?.landType ?? emptyForm.landType,
    utilities: draft?.utilities ?? emptyForm.utilities,
    pin: draft?.pin ?? emptyForm.pin,
    boundary: draft?.boundary ?? emptyForm.boundary,
    photos: emptyForm.photos,
    documents: emptyForm.documents,
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
        setMaxStep(steps.length - 1);
      })
      .catch(() => setLoadError("Couldn't load this listing. Please try again."))
      .finally(() => setLoadingListing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Autosave the wizard so an accidental refresh or nav-away doesn't lose
  // progress. Document files aren't restored — a title deed/ID re-attach is a
  // deliberate act, not something to silently resurrect — so they're excluded
  // here. Skipped while editing an existing listing so it doesn't clobber the
  // create-flow draft.
  useEffect(() => {
    if (typeof window === "undefined" || editId) return;
    const { photos: _photos, documents: _documents, ...draftFields } = form;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, ...draftFields }));
  }, [step, form, editId]);

  // Warn while plotting when the location covers land that is already listed.
  // The server flags it for review on submit either way; this only gives an
  // honest seller the chance to fix a mistake first.
  useEffect(() => {
    if (step !== 1 || (!form.pin && !form.boundary)) {
      setOverlapWarning(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .post<{ overlaps: boolean }>("/user/listings/overlap-check", {
          ...(form.boundary
            ? { boundary: form.boundary }
            : { latitude: form.pin?.[0], longitude: form.pin?.[1] }),
          except_id: editId,
        })
        .then(({ overlaps }) => !cancelled && setOverlapWarning(overlaps))
        .catch(() => {});
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [step, form.pin, form.boundary, editId]);

  // Photos live in IndexedDB (File objects aren't JSON-serializable, unlike
  // the fields above) so they're saved separately, in their own effect.
  useEffect(() => {
    if (typeof window === "undefined" || editId) return;
    saveDraftPhotos(
      DRAFT_KEY,
      form.photos.map((p) => p.file),
    );
  }, [form.photos, editId]);

  // Restoring photos is async (IndexedDB), so it arrives a tick after the
  // synchronous localStorage-backed fields above already populated the form.
  useEffect(() => {
    if (!draft || editId) return;
    let cancelled = false;
    loadDraftPhotos(DRAFT_KEY).then((files) => {
      if (cancelled || files.length === 0) return;
      const mapped = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }));
      setForm((f) => ({ ...f, photos: [...f.photos, ...mapped] }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || user.role === "account_manager") return null;

  const plan = plans.find((p) => p.id === user.plan);

  if (!editId && search.type !== "land") {
    return (
      <DashboardShell active="upload" onChange={() => {}}>
        <ListingTypeChooser
          photoLimit={plan?.photos ?? null}
          onLand={() =>
            navigate({ to: "/dashboard/upload", search: { edit: undefined, type: "land" } })
          }
          onProperty={() => navigate({ to: "/dashboard/properties", search: { edit: undefined } })}
        />
      </DashboardShell>
    );
  }

  const used = user.listings.length;
  const remaining = user.maxListings === Infinity ? Infinity : user.maxListings - used;
  const limitReached = !editId && remaining <= 0;
  const planName = plan?.name ?? user.plan;
  const photoLimit = plan?.photos ?? 0;
  const totalPhotoCount = existingPhotos.length + form.photos.length;
  const documentLimit = plan?.documents ?? 0;
  const propertyDocCount = form.documents.filter((d) => d.type !== "national_id").length;
  const attachedTypes = new Set(form.documents.map((d) => d.type));
  const hasRequiredDocs = !!editId || REQUIRED_DOCS.every((r) => attachedTypes.has(r.value));

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

  const basicsErrors: Partial<Record<BasicsField, string>> = {};
  if (!form.parcelNumber) basicsErrors.parcelNumber = "Enter the title number from the title deed.";
  else if (!TITLE_NUMBER.test(form.parcelNumber.trim()))
    basicsErrors.parcelNumber =
      "Use letters, numbers, spaces and / . - ( ) , as on the deed, including the plot number.";
  if (!form.county) basicsErrors.county = "Choose the county the land is in.";
  if (sizeAcres == null) basicsErrors.size = "Enter a size greater than 0.";
  if (!(Number(form.price) > 0)) basicsErrors.price = "Enter the asking price in KES.";
  const shownErrors = showErrors ? basicsErrors : {};

  const canNext =
    step === 0
      ? true
      : step === 1
        ? !!form.pin || !!form.boundary
        : step === 2
          ? hasRequiredDocs
          : true;

  const goTo = (s: number) => {
    setStep(s);
    setMaxStep((m) => Math.max(m, s));
  };

  // Step 1 is checked on Next rather than by disabling it, so the seller sees
  // what's missing. A boundary that crosses itself shakes the map note instead.
  const goNext = () => {
    if (step === 0) {
      const first = (["parcelNumber", "county", "size", "price"] as const).find(
        (k) => basicsErrors[k],
      );
      if (first) {
        setShowErrors(true);
        document.getElementById(`u-${first}`)?.focus();
        return;
      }
    }
    if (step === 1 && boundarySelfIntersects) {
      setMapAttention((n) => n + 1);
      return;
    }
    goTo(step + 1);
  };

  const addDocument = (f: File | null) => {
    if (!f) return;
    if (f.type && f.type !== "application/pdf" && !f.type.startsWith("image/")) {
      setDocError(`${f.name} must be a PDF or image file.`);
      return;
    }
    if (f.size > MAX_DEED_BYTES) {
      setDocError(`${f.name} is over the 10MB limit per document.`);
      return;
    }
    setDocError("");
    set("documents", [...form.documents, { type: docType, file: f }]);
  };

  const submit = async () => {
    if (limitReached) {
      setUpgradeOpen(true);
      return;
    }
    setSubmitting(true);
    setSubmitErr("");
    setUploadProgress(form.documents.length || form.photos.length ? 0 : null);
    const payload: NewListingInput = {
      title: form.parcelNumber.trim(),
      parcelNumber: form.parcelNumber.trim(),
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
        const saved = await updateListing(
          editId,
          {
            ...payload,
            removePhotoIds: removePhotoIds.length ? removePhotoIds : undefined,
            coverPhotoId,
          },
          setUploadProgress,
          abortRef,
        );
        setSavedWithOverlap(saved.locationOverlaps);
      } else {
        const saved = await addListing(payload, setUploadProgress, abortRef);
        setSavedWithOverlap(saved.locationOverlaps);
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

  // New photos go up in order and the first becomes the cover, so starring one
  // moves it to the front. Existing photos (editing) take a cover id instead.
  const pickerPhotos = [
    ...existingPhotos.map((p) => ({ key: p.id, url: p.url })),
    ...form.photos.map((p) => ({ key: p.url, url: p.url })),
  ];
  const coverKey = editId
    ? (coverPhotoId ?? (existingPhotos.length ? undefined : form.photos[0]?.url))
    : form.photos[0]?.url;

  const reviewRows = [
    { label: "Title number", value: form.parcelNumber || "—", step: 0, mono: true },
    { label: "County", value: `${form.county}${form.area ? ` · ${form.area}` : ""}`, step: 0 },
    { label: "Size", value: sizeDisplay || "—", step: 0 },
    {
      label: "Price",
      value: form.price ? `KES ${Number(form.price).toLocaleString()}` : "—",
      step: 0,
    },
    { label: "Contact phone", value: form.phone || "From your profile", step: 0 },
    {
      label: "Listing type",
      value: form.listingType === "sale" ? "For sale" : "For lease",
      step: 0,
    },
    { label: "Land type", value: LAND_TYPES[form.landType!] ?? "—", step: 0 },
    {
      label: "Location",
      value: form.boundary
        ? `Traced (${form.boundary.length} corners)`
        : form.pin
          ? `${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}`
          : "Not set",
      step: 1,
      mono: !form.boundary && !!form.pin,
    },
    { label: "Photos", value: `${totalPhotoCount} attached`, step: 2 },
    {
      label: "Documents",
      value: form.documents.length ? `${form.documents.length} attached` : "None",
      step: 2,
    },
  ];

  const nextLabel =
    step < steps.length - 1
      ? "Next"
      : submitting
        ? editId
          ? "Saving…"
          : "Publishing…"
        : editId
          ? "Save changes"
          : "Publish listing";

  return (
    <DashboardShell active="upload" onChange={() => {}}>
      {step === 1 && isMobile && !submitted && (
        <div className="gs-root gm-full">
          <div className="gm-mtop">
            <button type="button" className="gm-link" onClick={() => setStep(0)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Pin or trace your land</span>
            <button
              type="button"
              className="gm-mbtn"
              onClick={() => setTutorialKey((n) => n + 1)}
              aria-label="How it works"
              style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "none" }}
            >
              <CircleHelp className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="gm-fullmap">
            <LandBoundaryMap
              pin={form.pin}
              boundary={form.boundary}
              onPinChange={(p) => set("pin", p)}
              onBoundaryChange={(b) => set("boundary", b)}
              county={form.county}
              hintText=""
              heightClassName="h-full"
              notes={false}
              openTutorialKey={tutorialKey}
            />
          </div>
          <div className="gm-mbot">
            <span className="gm-pline" role="status" style={{ fontWeight: 600 }}>
              {plotStatus(form.pin, form.boundary)}
            </span>
            {overlapWarning && (
              <span className="gm-pline" data-tone="warn" role="status" style={{ fontSize: 13 }}>
                Part of this location is already listed. We&apos;ll compare title deeds before it
                goes live.
              </span>
            )}
            {boundarySelfIntersects && (
              <span
                key={mapAttention}
                className={`gm-pline${mapAttention ? " gm-shake" : ""}`}
                data-tone="error"
                role="alert"
                style={{ fontSize: 13 }}
              >
                This boundary crosses itself. Tap &quot;Retrace boundary&quot; to redraw it.
              </span>
            )}
            <button type="button" className="gm-btn" onClick={goNext} disabled={!canNext}>
              Confirm location
            </button>
          </div>
        </div>
      )}

      <WizardHeader
        backLabel={editId ? "Back to my listings" : "What are you posting?"}
        onBack={() =>
          editId
            ? navigate({ to: "/dashboard", search: { tab: "listings" } })
            : navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } })
        }
        title={editId ? "Edit listing" : "Upload land"}
        sub={
          editId
            ? "Changes go back under review before they're visible again."
            : "List a parcel in 4 quick steps. Everything saves as you go."
        }
        steps={steps}
        step={submitted ? steps.length : step}
        maxStep={submitted ? -1 : maxStep}
        onStep={setStep}
      />

      {showDraftNotice && !submitted && !editId && (
        <DraftNotice
          text="Restored your unsaved draft from earlier, including your photos. Documents aren't saved in drafts, so you'll need to re-attach those."
          onDismiss={() => setShowDraftNotice(false)}
        />
      )}

      <div className="gd-r gd-card p-[26px]">
        {loadingListing ? (
          <div className="flex justify-center py-10">
            <span className="gd-spin" />
          </div>
        ) : loadError ? (
          <ErrorBox>{loadError}</ErrorBox>
        ) : submitted ? (
          <SuccessPanel
            title={editId ? "Changes saved" : "Listing submitted"}
            text={
              editId
                ? "Your changes have been saved and the listing is back under review."
                : "Your listing is under review and will appear on the map within 24 hours."
            }
          >
            {savedWithOverlap && (
              <div className="max-w-[520px]">
                <WarnBox>
                  This location overlaps another listing, so our team will compare the title deeds
                  before it goes live. This can take a little longer.
                </WarnBox>
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                className="gd-btn"
                onClick={() => navigate({ to: "/dashboard", search: { tab: "listings" } })}
              >
                Go to my listings
              </button>
              {!editId && (
                <button
                  type="button"
                  className="gd-btn gd-o"
                  onClick={() => {
                    setSubmitted(false);
                    setStep(0);
                    setMaxStep(0);
                    setShowErrors(false);
                    setForm(emptyForm);
                  }}
                >
                  Upload another
                </button>
              )}
            </div>
          </SuccessPanel>
        ) : (
          <>
            <StepHeading title={steps[step]} step={step} total={steps.length} />

            {step === 0 && (
              <div className="gd-form">
                <Field
                  id="u-parcelNumber"
                  label="Title number"
                  hint="Exactly as it appears on the title deed."
                  error={shownErrors.parcelNumber}
                  full
                >
                  <input
                    id="u-parcelNumber"
                    className="gd-input gd-mono"
                    placeholder="e.g. KAJ/KTG/4521 or NAIVASHA/MARAIGUSHU BLOCK 7/2312"
                    autoCapitalize="characters"
                    value={form.parcelNumber}
                    onChange={(e) => set("parcelNumber", e.target.value.toUpperCase())}
                    aria-invalid={!!shownErrors.parcelNumber}
                  />
                </Field>
                <Field id="u-county" label="County" error={shownErrors.county}>
                  <select
                    id="u-county"
                    className="gd-input"
                    value={form.county}
                    onChange={(e) => set("county", e.target.value)}
                    aria-invalid={!!shownErrors.county}
                  >
                    <option value="">Select county</option>
                    {kenyaCounties.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="u-area" label="Sub-county / Area" optional>
                  <input
                    id="u-area"
                    className="gd-input"
                    placeholder="e.g. Kitengela"
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                  />
                </Field>
                <Field label="Land size" error={shownErrors.size} full>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Segmented
                      label="Size unit"
                      value={form.sizeUnit}
                      onChange={(u) => set("sizeUnit", u)}
                      options={[
                        ["acres", "Acres"],
                        ["hectares", "Hectares"],
                        ["feet", "Feet W × L"],
                      ]}
                    />
                    {form.sizeUnit === "feet" ? (
                      <>
                        <input
                          id="u-size"
                          className="gd-input w-[120px]"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          placeholder="Width"
                          aria-label="Width in feet"
                          value={form.sizeWidthFt}
                          onChange={(e) => set("sizeWidthFt", e.target.value)}
                          aria-invalid={!!shownErrors.size}
                        />
                        <span className="text-muted-foreground">×</span>
                        <input
                          className="gd-input w-[120px]"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          placeholder="Length"
                          aria-label="Length in feet"
                          value={form.sizeLengthFt}
                          onChange={(e) => set("sizeLengthFt", e.target.value)}
                          aria-invalid={!!shownErrors.size}
                        />
                        <span className="text-muted-foreground">ft</span>
                      </>
                    ) : (
                      <input
                        id="u-size"
                        className="gd-input w-40"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={
                          form.sizeUnit === "acres" ? "Size in acres" : "Size in hectares"
                        }
                        placeholder={form.sizeUnit === "acres" ? "e.g. 1.5" : "e.g. 0.5"}
                        value={form.sizeUnit === "acres" ? form.sizeAcres : form.sizeHectares}
                        onChange={(e) =>
                          set(
                            form.sizeUnit === "acres" ? "sizeAcres" : "sizeHectares",
                            e.target.value,
                          )
                        }
                        aria-invalid={!!shownErrors.size}
                      />
                    )}
                    {sizeAcres != null && form.sizeUnit !== "acres" && (
                      <span className="gd-mono text-[13.5px] text-muted-foreground">
                        ≈ {sizeAcres.toFixed(2)} acres
                      </span>
                    )}
                  </div>
                </Field>
                <Field id="u-price" label="Asking price (KES)" error={shownErrors.price}>
                  <input
                    id="u-price"
                    className="gd-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1,850,000"
                    value={formatThousands(form.price)}
                    onChange={(e) => set("price", toDigits(e.target.value))}
                    aria-invalid={!!shownErrors.price}
                  />
                </Field>
                <Field
                  id="u-phone"
                  label="Contact phone"
                  optional
                  hint="Leave blank to use the number on your profile."
                >
                  <input
                    id="u-phone"
                    className="gd-input"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="Listing type">
                  <Segmented
                    label="Listing type"
                    grid
                    value={form.listingType}
                    onChange={(v) => set("listingType", v)}
                    options={[
                      ["sale", "For sale"],
                      ["lease", "For lease"],
                    ]}
                  />
                </Field>
                <Field id="u-use" label="Land type">
                  <select
                    id="u-use"
                    className="gd-input"
                    value={form.landType}
                    onChange={(e) => set("landType", e.target.value as NewListingInput["landType"])}
                  >
                    {Object.entries(LAND_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Utilities available" full>
                  <ToggleChips
                    options={["Water", "Electricity", "Fibre", "Sewer", "3-Phase"]}
                    selected={form.utilities}
                    onChange={(v) => set("utilities", v)}
                  />
                </Field>
                <Field
                  id="u-desc"
                  label="Description"
                  hint={`${form.description.length.toLocaleString()} / ${DESCRIPTION_MAX.toLocaleString()}`}
                  full
                >
                  <textarea
                    id="u-desc"
                    className="gd-input"
                    rows={4}
                    maxLength={DESCRIPTION_MAX}
                    placeholder="Describe the parcel — access, nearby developments, why it's a good investment…"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 1 && !isMobile && (
              <div className="gs-root gm-wiz">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h2 className="gm-h" style={{ fontSize: "clamp(26px, 3vw, 36px)" }}>
                    Where is your land?
                  </h2>
                  <p style={{ margin: 0, fontSize: 16, color: "var(--muted)" }}>
                    Drop a pin, or trace your boundary so buyers can see exactly what they are
                    getting.
                  </p>
                </div>
                <div className="gm-wizgrid">
                  <div style={{ minWidth: 0 }}>
                    <LandBoundaryMap
                      pin={form.pin}
                      boundary={form.boundary}
                      onPinChange={(p) => set("pin", p)}
                      onBoundaryChange={(b) => set("boundary", b)}
                      county={form.county}
                      hintText=""
                      heightClassName="h-[560px] xl:h-[640px]"
                      typedSize={sizeAcres ? { acres: sizeAcres, label: sizeDisplay } : null}
                      attentionKey={mapAttention}
                      openTutorialKey={tutorialKey}
                      overlapWarning={overlapWarning}
                    />
                    {form.boundary && tracedAreaAcres != null && !boundarySelfIntersects && (
                      <button
                        type="button"
                        className="gd-link mt-1.5"
                        onClick={() => {
                          set("sizeUnit", "acres");
                          set("sizeAcres", tracedAreaAcres.toFixed(2));
                        }}
                      >
                        <Check size={15} aria-hidden="true" /> Use ≈ {tracedAreaAcres.toFixed(2)}{" "}
                        acres as the land size
                      </button>
                    )}
                  </div>
                  <aside className="gm-wizaside">
                    <div className="gm-wcard">
                      <span className="gm-mono gm-eyebrow">FROM STEP 1</span>
                      <span className="gm-h" style={{ fontSize: 22 }}>
                        {form.parcelNumber || "Your listing"}
                      </span>
                      <dl className="gm-facts">
                        <dt>County</dt>
                        <dd>{form.county || "—"}</dd>
                        <dt>Size</dt>
                        <dd>{sizeDisplay || "—"}</dd>
                        <dt>Listing</dt>
                        <dd>{form.listingType === "lease" ? "For lease" : "For sale"}</dd>
                      </dl>
                      <button type="button" className="gm-link" onClick={() => setStep(0)}>
                        Edit basic details
                      </button>
                    </div>
                    <div className="gm-wcard">
                      <span className="gm-h" style={{ fontSize: 19 }}>
                        Pin or trace?
                      </span>
                      <p className="gm-choice">
                        <span>
                          <MapPin className="h-[18px] w-[18px]" />
                        </span>
                        <span>
                          <strong>Drop a pin</strong> if you don&apos;t know the exact shape. Buyers
                          see an approximate area.
                        </span>
                      </p>
                      <p className="gm-choice">
                        <span>
                          <Spline className="h-[18px] w-[18px]" />
                        </span>
                        <span>
                          <strong>Trace the boundary</strong> by tapping each corner. Traced plots
                          show as outlines and are ready for document review.
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="gm-btn gm-ghost"
                      onClick={() => setTutorialKey((n) => n + 1)}
                    >
                      <CircleHelp className="h-[18px] w-[18px]" /> How it works
                    </button>
                  </aside>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-[22px]">
                <PhotoPicker
                  photos={pickerPhotos}
                  coverKey={coverKey}
                  limit={photoLimit}
                  planName={planName}
                  error={fileError}
                  sizeLine={
                    form.photos.length > 0 || form.documents.length > 0
                      ? `Total upload size: ${(
                          (form.photos.reduce((s, p) => s + p.file.size, 0) +
                            form.documents.reduce((s, d) => s + d.file.size, 0)) /
                          (1024 * 1024)
                        ).toFixed(1)} MB`
                      : undefined
                  }
                  onAdd={handlePhotos}
                  onUpgrade={() => setUpgradeOpen(true)}
                  onRemove={(key) => {
                    const existing = existingPhotos.find((p) => p.id === key);
                    if (existing) {
                      setExistingPhotos((prev) => prev.filter((x) => x.id !== key));
                      setRemovePhotoIds((prev) => [...prev, key]);
                      if (coverPhotoId === key) setCoverPhotoId(undefined);
                      return;
                    }
                    URL.revokeObjectURL(key);
                    set(
                      "photos",
                      form.photos.filter((p) => p.url !== key),
                    );
                  }}
                  onCover={(key) => {
                    if (existingPhotos.some((p) => p.id === key)) {
                      setCoverPhotoId(key);
                      return;
                    }
                    const chosen = form.photos.find((p) => p.url === key);
                    if (!chosen) return;
                    set("photos", [chosen, ...form.photos.filter((p) => p !== chosen)]);
                    if (editId) setCoverPhotoId(undefined);
                  }}
                />

                <div className="flex flex-col gap-2.5 border-t border-dashed border-border pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="gd-h2">Documents</span>
                    <span className="text-[13.5px] text-muted-foreground">
                      {propertyDocCount} of {documentLimit} on {planName}
                      {propertyDocCount >= documentLimit && (
                        <>
                          {" · "}
                          <button
                            type="button"
                            className="gd-link"
                            onClick={() => setUpgradeOpen(true)}
                          >
                            Upgrade to add more
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    A National ID and a Title Deed are required. Buyers never see your documents;
                    only our review team does.
                  </span>
                  <div className="gd-req">
                    {REQUIRED_DOCS.map((r) => (
                      <span key={r.value} className="gd-reqi" data-ok={attachedTypes.has(r.value)}>
                        <span className="gd-tick2">
                          <Check size={12} strokeWidth={3} aria-hidden="true" />
                        </span>
                        {r.label}
                        <span className="sr-only">
                          {attachedTypes.has(r.value) ? "(attached)" : "(missing)"}
                        </span>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="gd-input w-[240px]"
                      aria-label="Document type"
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
                      ref={docInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        addDocument(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      className="gd-btn gd-o min-h-12"
                      disabled={docType !== "national_id" && propertyDocCount >= documentLimit}
                      onClick={() => docInputRef.current?.click()}
                    >
                      <Paperclip size={16} aria-hidden="true" /> Attach file
                    </button>
                  </div>
                  <span className="text-[13px] text-muted-foreground">
                    PDF or image · max 10 MB per document
                  </span>
                  {docError && <ErrorBox>{docError}</ErrorBox>}
                  {form.documents.length > 0 && (
                    <ul className="flex flex-col gap-1.5">
                      {form.documents.map((d, i) => {
                        const label = DOC_TYPES.find((t) => t.value === d.type)?.label;
                        return (
                          <li
                            key={`${d.type}-${d.file.name}-${i}`}
                            className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-3 py-2.5"
                          >
                            <FileText size={17} className="text-brand" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate text-[14.5px]">
                              <strong>{label}</strong> ·{" "}
                              <span className="gd-mono text-[13px] text-muted-foreground">
                                {d.file.name}
                              </span>
                            </span>
                            <button
                              type="button"
                              className="gd-ib gd-del"
                              aria-label={`Remove ${label}`}
                              onClick={() =>
                                set(
                                  "documents",
                                  form.documents.filter((_, j) => j !== i),
                                )
                              }
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <ReviewRows rows={reviewRows} onEdit={setStep} />
                <div className="flex flex-wrap justify-between gap-3 rounded-2xl bg-track px-4 py-3.5">
                  <span className="gd-eyebrow self-center">Plan</span>
                  <span className="font-semibold">
                    {planName} · {used} of{" "}
                    {user.maxListings === Infinity ? "unlimited" : user.maxListings} listings used
                  </span>
                </div>
                {limitReached && (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-warning-subtle p-4 text-warning">
                    <Lock size={20} aria-hidden="true" />
                    <span className="min-w-[220px] flex-1">
                      <strong className="block">Listing limit reached</strong>
                      <span className="text-sm">
                        You&apos;ve used all {user.maxListings} listings on the {planName} plan.
                        Upgrade to publish this listing.
                      </span>
                    </span>
                    <button
                      type="button"
                      className="gd-btn gd-sm"
                      onClick={() => setUpgradeOpen(true)}
                    >
                      View plans
                    </button>
                  </div>
                )}
                {submitting && uploadProgress != null && (
                  <div className="flex flex-col gap-2" role="status">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">
                        {uploadProgress < 100
                          ? `Uploading… ${uploadProgress}%`
                          : "Upload complete — finishing up…"}
                      </span>
                      <button
                        type="button"
                        className="gd-link"
                        style={{ color: "var(--destructive)" }}
                        onClick={() => abortRef.current?.()}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="gd-bar">
                      <span style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
                {submitErr && <ErrorBox>{submitErr}</ErrorBox>}
              </div>
            )}

            <WizardFooter
              prevLabel={step === 1 ? "Basic details" : "Back"}
              onPrev={() => setStep((s) => Math.max(0, s - 1))}
              prevDisabled={step === 0}
              nextLabel={nextLabel}
              onNext={step < steps.length - 1 ? goNext : submit}
              nextDisabled={step < steps.length - 1 ? !canNext : submitting}
              arrow={step < steps.length - 1}
            />
          </>
        )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        currentPlan={user.plan}
        onClose={() => setUpgradeOpen(false)}
        onSelect={(id) => {
          const selected = plans.find((p) => p.id === id);
          if (selected && selected.price > 0) setCheckoutPlan(selected);
        }}
        reason="Upgrade to unlock more listings and photos."
      />

      {checkoutPlan && <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />}
    </DashboardShell>
  );
}
