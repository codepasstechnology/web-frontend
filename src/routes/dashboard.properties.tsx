import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { LandBoundaryMap } from "@/components/map/LazyMaps";
import { StkCheckoutModal } from "@/components/StkCheckoutModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useAuth } from "@/lib/auth";
import { kenyaCounties, usePlans, type Plan } from "@/lib/plans";
import { formatThousands, toDigits } from "@/lib/utils";
import { saveDraftPhotos, loadDraftPhotos, clearDraftPhotos } from "@/lib/draftPhotoStore";
import {
  useCreateProperty,
  useMyProperty,
  useUpdateProperty,
  INTENT_LABELS,
  TYPE_LABELS,
  formatPrice,
  type PropertyDraft as PropertyPayload,
  type PropertyIntent,
  type PropertyType,
} from "@/lib/properties";
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
  WizardFooter,
  WizardHeader,
} from "@/components/dashboard/wizard";

export const Route = createFileRoute("/dashboard/properties")({
  component: PostPropertyPage,
  ssr: false,
  head: () => ({
    meta: [{ title: "Post a Property — Geo Pin Properties Kenya" }],
    links: MARKETING_FONT_LINKS,
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
});

const steps = ["Property details", "Location", "Photos", "Review & submit"];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const AMENITY_OPTIONS = [
  "Water",
  "Electricity",
  "Parking",
  "Borehole",
  "Lift",
  "Security",
  "Wi-Fi",
  "Balcony",
  "Gym",
  "Swimming pool",
];

const PRICE_LABEL: Record<PropertyIntent, string> = {
  rent: "Monthly rent (KES)",
  bnb: "Nightly rate (KES)",
  sale: "Asking price (KES)",
};

const DRAFT_KEY = "lv_property_draft_v1";

interface PropertyDraft {
  step: number;
  title: string;
  county: string;
  area: string;
  description: string;
  intent: PropertyIntent;
  type: PropertyType;
  price: string;
  bedrooms: string;
  bathrooms: string;
  furnished: boolean;
  amenities: string[];
  minNights: string;
  cleaningFee: string;
  postedBy: "owner" | "broker";
  agentName: string;
  agentPhone: string;
  agentAgency: string;
  pin: [number, number] | null;
}

function loadDraft(): PropertyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PropertyDraft) : null;
  } catch {
    return null;
  }
}

function clearDraft(): void {
  if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
  clearDraftPhotos(DRAFT_KEY);
}

interface Form {
  title: string;
  county: string;
  area: string;
  description: string;
  intent: PropertyIntent;
  type: PropertyType;
  price: string;
  bedrooms: string;
  bathrooms: string;
  furnished: boolean;
  amenities: string[];
  minNights: string;
  cleaningFee: string;
  postedBy: "owner" | "broker";
  agentName: string;
  agentPhone: string;
  agentAgency: string;
  pin: [number, number] | null;
  photos: File[];
}

const emptyForm: Form = {
  title: "",
  county: "",
  area: "",
  description: "",
  intent: "rent",
  type: "apartment",
  price: "",
  bedrooms: "",
  bathrooms: "",
  furnished: false,
  amenities: [],
  minNights: "",
  cleaningFee: "",
  postedBy: "owner",
  agentName: "",
  agentPhone: "",
  agentAgency: "",
  pin: null,
  photos: [],
};

type DetailsField = "title" | "price" | "county";

function PostPropertyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: plans = [] } = usePlans();
  const create = useCreateProperty();
  const update = useUpdateProperty();
  const { edit: editId } = Route.useSearch();
  const existing = useMyProperty(editId);
  const draft = useRef(editId ? null : loadDraft()).current;
  const [step, setStep] = useState(draft?.step ?? 0);
  const [maxStep, setMaxStep] = useState(draft?.step ?? 0);
  const [form, setForm] = useState<Form>({
    title: draft?.title ?? emptyForm.title,
    county: draft?.county ?? emptyForm.county,
    area: draft?.area ?? emptyForm.area,
    description: draft?.description ?? emptyForm.description,
    intent: draft?.intent ?? emptyForm.intent,
    type: draft?.type ?? emptyForm.type,
    price: draft?.price ?? emptyForm.price,
    bedrooms: draft?.bedrooms ?? emptyForm.bedrooms,
    bathrooms: draft?.bathrooms ?? emptyForm.bathrooms,
    furnished: draft?.furnished ?? emptyForm.furnished,
    amenities: draft?.amenities ?? emptyForm.amenities,
    minNights: draft?.minNights ?? emptyForm.minNights,
    cleaningFee: draft?.cleaningFee ?? emptyForm.cleaningFee,
    postedBy: draft?.postedBy ?? emptyForm.postedBy,
    agentName: draft?.agentName ?? emptyForm.agentName,
    agentPhone: draft?.agentPhone ?? emptyForm.agentPhone,
    agentAgency: draft?.agentAgency ?? emptyForm.agentAgency,
    pin: draft?.pin ?? emptyForm.pin,
    photos: [],
  });
  const [existingPhotos, setExistingPhotos] = useState<{ id: string; url: string }[]>([]);
  const [removePhotoIds, setRemovePhotoIds] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feeDue, setFeeDue] = useState<{ id: string; amount: number } | null>(null);
  const [payingFee, setPayingFee] = useState<{ id: string; amount: number } | null>(null);
  const [showDraftNotice, setShowDraftNotice] = useState(!!draft);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Fill the form once when editing; later refetches must not overwrite edits.
  const loaded = useRef(false);
  useEffect(() => {
    const p = existing.data;
    if (!editId || !p || loaded.current) return;
    loaded.current = true;
    setForm({
      title: p.title,
      county: p.county,
      area: p.area,
      description: p.description,
      intent: p.intent,
      type: p.type,
      price: String(p.price),
      bedrooms: String(p.bedrooms),
      bathrooms: String(p.bathrooms),
      furnished: p.furnished,
      amenities: p.amenities,
      minNights: p.minNights != null ? String(p.minNights) : "",
      cleaningFee: p.cleaningFee != null ? String(p.cleaningFee) : "",
      postedBy: p.postedBy,
      agentName: p.agent.name,
      agentPhone: p.agent.phone,
      agentAgency: p.agent.agency,
      pin: p.position,
      photos: [],
    });
    setExistingPhotos(p.photoItems);
    setMaxStep(steps.length - 1);
  }, [editId, existing.data]);

  // One object URL per photo for the thumbnails, revoked on removal and unmount.
  const urlsRef = useRef(new Map<File, string>());
  const photoUrl = (f: File) => {
    let url = urlsRef.current.get(f);
    if (!url) {
      url = URL.createObjectURL(f);
      urlsRef.current.set(f, url);
    }
    return url;
  };
  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Autosave the wizard so an accidental refresh or nav-away doesn't lose
  // progress, the same way the land-upload wizard does.
  useEffect(() => {
    if (typeof window === "undefined" || submitted || editId) return;
    const { photos: _photos, ...draftFields } = form;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, ...draftFields }));
  }, [step, form, submitted, editId]);

  // Photos live in IndexedDB (File objects aren't JSON-serializable) and are
  // saved separately from the fields above.
  useEffect(() => {
    if (typeof window === "undefined" || submitted || editId) return;
    saveDraftPhotos(DRAFT_KEY, form.photos);
  }, [form.photos, submitted, editId]);

  // Restoring photos is async (IndexedDB), so it arrives a tick after the
  // synchronous localStorage-backed fields above already populated the form.
  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    loadDraftPhotos(DRAFT_KEY).then((files) => {
      if (cancelled || files.length === 0) return;
      setForm((f) => ({ ...f, photos: [...f.photos, ...files] }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = plans.find((p) => p.id === user?.plan);
  const planName = plan?.name ?? user?.plan ?? "";
  const photoLimit = plan?.photos ?? 0;
  const pricePeriod = form.intent === "rent" ? "month" : form.intent === "bnb" ? "night" : "total";

  const detailErrors: Partial<Record<DetailsField, string>> = {};
  if (!form.title.trim()) detailErrors.title = "Give the listing a title.";
  if (!(Number(form.price) > 0)) detailErrors.price = "Enter the price in KES.";
  if (!form.county) detailErrors.county = "Choose the county the property is in.";
  const shownErrors = showErrors ? detailErrors : {};

  const goTo = (s: number) => {
    setStep(s);
    setMaxStep((m) => Math.max(m, s));
  };

  const goNext = () => {
    if (step === 0) {
      const first = (["title", "price", "county"] as const).find((k) => detailErrors[k]);
      if (first) {
        setShowErrors(true);
        document.getElementById(`p-${first}`)?.focus();
        return;
      }
    }
    goTo(step + 1);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const wrongType = arr.filter((f) => f.type && !f.type.startsWith("image/"));
    const oversized = arr.filter((f) => !wrongType.includes(f) && f.size > MAX_PHOTO_BYTES);
    const valid = arr.filter((f) => !wrongType.includes(f) && f.size <= MAX_PHOTO_BYTES);
    setPhotoError(
      [
        wrongType.length &&
          `${wrongType.map((f) => f.name).join(", ")} ${wrongType.length === 1 ? "isn't an image file" : "aren't image files"}.`,
        oversized.length &&
          `${oversized.map((f) => f.name).join(", ")} ${oversized.length === 1 ? "is" : "are"} over the 5MB limit per photo.`,
      ]
        .filter(Boolean)
        .join(" "),
    );
    const allowed = photoLimit - existingPhotos.length - form.photos.length;
    set("photos", [...form.photos, ...valid.slice(0, Math.max(0, allowed))]);
  };

  const submit = async () => {
    if (!form.pin) return;
    setError("");
    const payload: PropertyPayload = {
      title: form.title,
      county: form.county,
      area: form.area || undefined,
      description: form.description || undefined,
      intent: form.intent,
      type: form.type,
      price: Number(form.price),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      furnished: form.furnished,
      amenities: form.amenities,
      minNights: form.intent === "bnb" && form.minNights ? Number(form.minNights) : undefined,
      cleaningFee: form.intent === "bnb" && form.cleaningFee ? Number(form.cleaningFee) : undefined,
      postedBy: form.postedBy,
      agentName: form.agentName || undefined,
      agentPhone: form.agentPhone || undefined,
      agentAgency: form.agentAgency || undefined,
      latitude: form.pin[0],
      longitude: form.pin[1],
      photos: form.photos,
    };
    try {
      if (editId) {
        await update.mutateAsync({
          id: editId,
          draft: { ...payload, removePhotoIds: removePhotoIds.length ? removePhotoIds : undefined },
        });
      } else {
        const created = await create.mutateAsync(payload);
        if (created.postingPaymentStatus === "pending") {
          setFeeDue({ id: created.id, amount: created.postingFeeAmount });
        }
        clearDraft();
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      setError(
        Object.values(e?.errors ?? {})[0]?.[0] ??
          e?.message ??
          "Could not post the listing. Please try again.",
      );
    }
  };

  const busy = create.isPending || update.isPending;

  const pickerPhotos = [
    ...existingPhotos.map((p) => ({ key: p.id, url: p.url })),
    ...form.photos.map((f) => ({ key: photoUrl(f), url: photoUrl(f) })),
  ];
  const coverKey = existingPhotos.length
    ? existingPhotos[0].id
    : form.photos[0] && photoUrl(form.photos[0]);

  const reviewRows = [
    { label: "Title", value: form.title || "—", step: 0 },
    { label: "Listing type", value: INTENT_LABELS[form.intent], step: 0 },
    { label: "Property type", value: TYPE_LABELS[form.type], step: 0 },
    { label: "Price", value: formatPrice(Number(form.price || 0), pricePeriod), step: 0 },
    { label: "County", value: `${form.county}${form.area ? ` · ${form.area}` : ""}`, step: 0 },
    {
      label: "Rooms",
      value: `${form.bedrooms || "—"} bed · ${form.bathrooms || "—"} bath${form.furnished ? " · furnished" : ""}`,
      step: 0,
    },
    {
      label: "Location",
      value: form.pin ? `${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}` : "Not set",
      step: 1,
      mono: !!form.pin,
    },
    { label: "Photos", value: `${pickerPhotos.length} attached`, step: 2 },
  ];

  return (
    <DashboardShell active="upload">
      <WizardHeader
        backLabel={editId ? "Back to my listings" : "What are you posting?"}
        onBack={() =>
          editId
            ? navigate({ to: "/dashboard", search: { tab: "listings" } })
            : navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } })
        }
        title={editId ? "Edit listing" : "Post a property"}
        sub={
          editId
            ? "Changes go back under review before they're visible again."
            : "Rentals, BnBs and homes for sale. Listings go live once approved."
        }
        steps={steps}
        step={submitted ? steps.length : step}
        maxStep={submitted ? -1 : maxStep}
        onStep={setStep}
      />

      {showDraftNotice && !submitted && !editId && (
        <DraftNotice
          text="Restored your unsaved draft from earlier, including your photos."
          onDismiss={() => setShowDraftNotice(false)}
        />
      )}

      <div className="gd-r gd-card p-[26px]">
        {editId && existing.isLoading ? (
          <div className="flex justify-center py-10">
            <span className="gd-spin" />
          </div>
        ) : editId && existing.isError ? (
          <ErrorBox>Couldn&apos;t load this listing. Please try again.</ErrorBox>
        ) : submitted ? (
          <SuccessPanel
            title={editId ? "Changes saved" : "Listing submitted"}
            text={
              editId
                ? "Your changes have been saved and the listing is back under review."
                : feeDue
                  ? "Pay the posting fee to send it for review."
                  : "Our team will review it shortly. You'll see it on the public map once it's approved."
            }
          >
            {feeDue && (
              <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-warning-subtle px-[18px] py-3.5 text-warning">
                <strong>Posting fee due: KES {feeDue.amount.toLocaleString()}</strong>
                <button type="button" className="gd-btn gd-sm" onClick={() => setPayingFee(feeDue)}>
                  Pay with M-Pesa
                </button>
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
                    setFeeDue(null);
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
                <Field id="p-title" label="Listing title" error={shownErrors.title} full>
                  <input
                    id="p-title"
                    className="gd-input"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Kilimani 2BR Apartment"
                    aria-invalid={!!shownErrors.title}
                  />
                </Field>
                <Field label="Listing type" full>
                  <Segmented
                    label="Listing type"
                    grid
                    className="max-w-[420px]"
                    value={form.intent}
                    onChange={(v) => set("intent", v)}
                    options={[
                      ["rent", "For rent"],
                      ["bnb", "BnB"],
                      ["sale", "For sale"],
                    ]}
                  />
                </Field>
                <Field id="p-type" label="Property type">
                  <select
                    id="p-type"
                    className="gd-input"
                    value={form.type}
                    onChange={(e) => set("type", e.target.value as PropertyType)}
                  >
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="p-price" label={PRICE_LABEL[form.intent]} error={shownErrors.price}>
                  <input
                    id="p-price"
                    className="gd-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 45,000"
                    value={formatThousands(form.price)}
                    onChange={(e) => set("price", toDigits(e.target.value))}
                    aria-invalid={!!shownErrors.price}
                  />
                </Field>
                <Field id="p-county" label="County" error={shownErrors.county}>
                  <select
                    id="p-county"
                    className="gd-input"
                    value={form.county}
                    onChange={(e) => set("county", e.target.value)}
                    aria-invalid={!!shownErrors.county}
                  >
                    <option value="">Select a county</option>
                    {kenyaCounties.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="p-area" label="Area / estate">
                  <input
                    id="p-area"
                    className="gd-input"
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                    placeholder="Kilimani"
                  />
                </Field>
                <Field id="p-beds" label="Bedrooms">
                  <input
                    id="p-beds"
                    className="gd-input"
                    type="number"
                    min={0}
                    placeholder="e.g. 2"
                    value={form.bedrooms}
                    onChange={(e) => set("bedrooms", e.target.value)}
                  />
                </Field>
                <Field id="p-baths" label="Bathrooms">
                  <input
                    id="p-baths"
                    className="gd-input"
                    type="number"
                    min={0}
                    placeholder="e.g. 1"
                    value={form.bathrooms}
                    onChange={(e) => set("bathrooms", e.target.value)}
                  />
                </Field>
                {form.intent === "bnb" && (
                  <>
                    <Field id="p-nights" label="Minimum nights">
                      <input
                        id="p-nights"
                        className="gd-input"
                        type="number"
                        min={1}
                        placeholder="e.g. 2"
                        value={form.minNights}
                        onChange={(e) => set("minNights", e.target.value)}
                      />
                    </Field>
                    <Field id="p-clean" label="Cleaning fee (KES)">
                      <input
                        id="p-clean"
                        className="gd-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 2,000"
                        value={formatThousands(form.cleaningFee)}
                        onChange={(e) => set("cleaningFee", toDigits(e.target.value))}
                      />
                    </Field>
                  </>
                )}
                <Field label="Amenities" full>
                  <ToggleChips
                    options={AMENITY_OPTIONS}
                    selected={form.amenities}
                    onChange={(v) => set("amenities", v)}
                  />
                </Field>
                <div className="col-span-full flex items-center justify-between gap-3 rounded-2xl bg-track px-4 py-3.5">
                  <span>
                    <span className="block font-semibold">Furnished</span>
                    <span className="text-[13.5px] text-muted-foreground">
                      Turn on if furniture is included.
                    </span>
                  </span>
                  <button
                    type="button"
                    className="gd-switch"
                    role="switch"
                    aria-checked={form.furnished}
                    aria-label="Furnished"
                    onClick={() => set("furnished", !form.furnished)}
                  />
                </div>
                <Field id="p-desc" label="Description" full>
                  <textarea
                    id="p-desc"
                    className="gd-input"
                    rows={4}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe the property — layout, condition, nearby amenities…"
                  />
                </Field>
                <Field label="Posted by">
                  <Segmented
                    label="Posted by"
                    grid
                    value={form.postedBy}
                    onChange={(v) => set("postedBy", v)}
                    options={[
                      ["owner", "Owner"],
                      ["broker", "Broker / agent"],
                    ]}
                  />
                </Field>
                <Field id="p-phone" label="Contact phone">
                  <input
                    id="p-phone"
                    className="gd-input"
                    type="tel"
                    value={form.agentPhone}
                    onChange={(e) => set("agentPhone", e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                  />
                </Field>
                {form.postedBy === "broker" && (
                  <>
                    <Field id="p-agent" label="Agent name">
                      <input
                        id="p-agent"
                        className="gd-input"
                        value={form.agentName}
                        onChange={(e) => set("agentName", e.target.value)}
                        placeholder="e.g. Jane Wanjiru"
                      />
                    </Field>
                    <Field id="p-agency" label="Agency">
                      <input
                        id="p-agency"
                        className="gd-input"
                        value={form.agentAgency}
                        onChange={(e) => set("agentAgency", e.target.value)}
                        placeholder="e.g. Prime Realty Kenya"
                      />
                    </Field>
                  </>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-3">
                <LandBoundaryMap
                  pin={form.pin}
                  boundary={null}
                  onPinChange={(p) => set("pin", p)}
                  onBoundaryChange={() => undefined}
                  county={form.county}
                  pinOnly
                  tutorial={false}
                  hintText="Tap the map to drop a pin on the property. Search for the estate or switch to satellite to find it."
                />
                <span className="gd-mono text-sm text-muted-foreground" role="status">
                  {form.pin
                    ? `Pin at ${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}`
                    : "No pin yet"}
                </span>
              </div>
            )}

            {step === 2 && (
              <PhotoPicker
                photos={pickerPhotos}
                coverKey={coverKey || undefined}
                limit={photoLimit}
                planName={planName}
                error={photoError}
                onAdd={addPhotos}
                onUpgrade={() => setUpgradeOpen(true)}
                onRemove={(key) => {
                  if (existingPhotos.some((p) => p.id === key)) {
                    setExistingPhotos((prev) => prev.filter((p) => p.id !== key));
                    setRemovePhotoIds((prev) => [...prev, key]);
                    return;
                  }
                  const removed = form.photos.find((f) => urlsRef.current.get(f) === key);
                  if (!removed) return;
                  URL.revokeObjectURL(key);
                  urlsRef.current.delete(removed);
                  set(
                    "photos",
                    form.photos.filter((f) => f !== removed),
                  );
                }}
                onCover={(key) => {
                  // The first new photo becomes the cover; existing covers stay put.
                  if (existingPhotos.length) return;
                  const chosen = form.photos.find((f) => urlsRef.current.get(f) === key);
                  if (chosen) set("photos", [chosen, ...form.photos.filter((f) => f !== chosen)]);
                }}
              />
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <ReviewRows rows={reviewRows} onEdit={setStep} />
                {error && <ErrorBox>{error}</ErrorBox>}
              </div>
            )}

            <WizardFooter
              prevLabel="Back"
              onPrev={() => setStep((s) => Math.max(0, s - 1))}
              prevDisabled={step === 0}
              nextLabel={
                step < steps.length - 1
                  ? "Next"
                  : busy
                    ? editId
                      ? "Saving…"
                      : "Submitting…"
                    : editId
                      ? "Save changes"
                      : "Submit listing"
              }
              onNext={step < steps.length - 1 ? goNext : submit}
              nextDisabled={step === 1 ? !form.pin : step === steps.length - 1 ? busy : false}
              arrow={step < steps.length - 1}
            />
          </>
        )}
      </div>

      {payingFee && (
        <StkCheckoutModal
          initiatePath="/user/properties/posting-fee"
          payload={{ property_id: payingFee.id }}
          amount={payingFee.amount}
          title="Property posting fee"
          onPaid={() => setFeeDue(null)}
          onClose={() => setPayingFee(null)}
        />
      )}

      {user && (
        <UpgradeModal
          open={upgradeOpen}
          currentPlan={user.plan}
          onClose={() => setUpgradeOpen(false)}
          onSelect={(id) => {
            const selected = plans.find((p) => p.id === id);
            if (selected && selected.price > 0) setCheckoutPlan(selected);
          }}
          reason="Upgrade to upload more photos per listing."
        />
      )}

      {checkoutPlan && <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />}
    </DashboardShell>
  );
}
