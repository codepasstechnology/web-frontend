import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, UploadCloud, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LandBoundaryMap } from "@/components/LandBoundaryMap";
import { useAuth, type NewListingInput } from "@/lib/auth";
import { kenyaCounties, usePlans } from "@/lib/plans";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({ meta: [{ title: "Upload Land — Geo Properties Kenya" }] }),
  component: UploadPage,
  ssr: false,
});

const steps = ["Basic Details", "Location on Map", "Photos & Documents", "Review & Submit"];

type SizeUnit = "acres" | "hectares" | "feet";

const DRAFT_KEY = "lv_upload_draft_v1";

interface UploadDraft {
  step: number;
  title: string;
  parcelNumber: string;
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

function UploadPage() {
  const { user, ready, addListing } = useAuth();
  const { data: plans = [] } = usePlans();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const draft = useRef(loadDraft()).current;
  const [step, setStep] = useState(draft?.step ?? 0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(!!draft);

  const [form, setForm] = useState({
    title: draft?.title ?? "",
    parcelNumber: draft?.parcelNumber ?? "",
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
    deedFile: null as File | null,
  });

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
    else if (ready && user?.role === "account_manager") navigate({ to: "/manager" });
  }, [ready, user, navigate]);

  // Autosave the wizard so an accidental refresh or nav-away doesn't lose
  // progress. Photo/deed files aren't serializable, so they're excluded —
  // the seller re-attaches those if a draft is restored.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { photos: _photos, deedFile: _deedFile, ...draftFields } = form;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, ...draftFields }));
  }, [step, form]);

  if (!user || user.role === "account_manager") return null;
  const plan = plans.find((p) => p.id === user.plan);
  const used = user.listings.length;
  const remaining = user.maxListings === Infinity ? Infinity : user.maxListings - used;
  const limitReached = remaining <= 0;
  const photoLimit = plan?.photos ?? 0;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const allowed = photoLimit - form.photos.length;
    const slice = arr.slice(0, Math.max(0, allowed));
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
      ? !!(form.title && form.parcelNumber && form.county && sizeAcres != null && form.price)
      : step === 1
        ? (!!form.pin || !!form.boundary) && !boundarySelfIntersects
        : true;

  const submit = async () => {
    if (limitReached) {
      setUpgradeOpen(true);
      return;
    }
    setSubmitting(true);
    setSubmitErr("");
    try {
      await addListing({
        title: form.title,
        parcelNumber: form.parcelNumber,
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
        titleDeedFile: form.deedFile ?? undefined,
        photoFiles: form.photos.map((p) => p.file),
      });
      clearDraft();
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setSubmitErr(e?.message ?? "Failed to submit listing. Please try again.");
    } finally {
      setSubmitting(false);
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
              className="w-full rounded-md bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
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
        <h1 className="text-2xl font-semibold text-foreground">Upload Land</h1>
        <p className="text-sm text-muted-foreground">List a parcel in 4 quick steps.</p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  i < step
                    ? "bg-[#2563EB] text-white"
                    : i === step
                      ? "border-2 border-[#2563EB] bg-card text-[#2563EB]"
                      : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <div className="hidden text-xs font-medium text-foreground sm:block">{s}</div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 ${i < step ? "bg-[#2563EB]" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {showDraftNotice && !submitted && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-[#2563EB]/30 bg-[#2563EB]/5 px-3 py-2 text-xs text-foreground">
            <span>Restored your unsaved draft from earlier.</span>
            <button
              onClick={() => setShowDraftNotice(false)}
              className="font-medium text-[#2563EB] hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {submitted ? (
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#16A34A]" />
            <h2 className="mt-3 text-lg font-semibold text-foreground">Listing submitted</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your listing is under review and will appear on the map within 24 hours.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => navigate({ to: "/dashboard", search: { tab: undefined } })}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Go to dashboard
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(0);
                  setForm({
                    title: "",
                    parcelNumber: "",
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
                    deedFile: null,
                  });
                }}
                className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
              >
                Upload another
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Property title" full>
                  <input
                    className="lv-input"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </Field>
                <Field label="Parcel number">
                  <input
                    className="lv-input"
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
                    type="number"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
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
                      className="font-medium text-[#2563EB] hover:underline"
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
                    Photos ({form.photos.length}/{photoLimit} allowed on {plan?.name ?? user.plan})
                  </span>
                  {form.photos.length >= photoLimit && (
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="font-medium text-[#2563EB] hover:underline"
                    >
                      Upgrade to upload more
                    </button>
                  )}
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-background py-10 text-sm text-muted-foreground hover:border-[#2563EB]">
                  <UploadCloud className="h-6 w-6" />
                  <span>Drag and drop photos, or click to browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotos(e.target.files)}
                    disabled={form.photos.length >= photoLimit}
                  />
                </label>
                {form.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {form.photos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p.url} alt="" className="h-20 w-full rounded-md object-cover" />
                        <button
                          onClick={() =>
                            set(
                              "photos",
                              form.photos.filter((_, j) => j !== i),
                            )
                          }
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5">
                  <Field label="Title deed (PDF or image, optional)">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="lv-input"
                      onChange={(e) => set("deedFile", e.target.files?.[0] ?? null)}
                    />
                  </Field>
                  {form.deedFile && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selected: {form.deedFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 text-sm">
                <Summary label="Title" value={form.title} />
                <Summary label="Parcel" value={form.parcelNumber || "—"} />
                <Summary
                  label="County"
                  value={`${form.county}${form.area ? " · " + form.area : ""}`}
                />
                <Summary label="Size" value={sizeDisplay || "—"} />
                <Summary
                  label="Price"
                  value={form.price ? `Ksh ${Number(form.price).toLocaleString()}` : "—"}
                />
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
                <Summary label="Photos" value={`${form.photos.length} attached`} />
                <Summary label="Title deed" value={form.deedFile ? form.deedFile.name : "None"} />
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Plan</div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {plan?.name ?? user.plan} — {used}/
                    {user.maxListings === Infinity ? "∞" : user.maxListings} listings used
                  </div>
                </div>
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
                      className="mt-3 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
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
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
                >
                  {submitting && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {submitting ? "Submitting…" : "Publish Listing"}
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

      <style>{`.lv-input{display:block;height:40px;width:100%;border:1px solid #E2E8F0;border-radius:6px;padding:0 12px;font-size:14px;background:#fff;color:#0F172A;outline:none}.lv-input:focus{border-color:#2563EB}textarea.lv-input{height:auto;padding:8px 12px}`}</style>
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
