import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, MapPin } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { LandBoundaryMap } from "@/components/LandBoundaryMap";
import { StkCheckoutModal } from "@/components/StkCheckoutModal";
import { kenyaCounties } from "@/lib/plans";
import { formatThousands, toDigits } from "@/lib/utils";
import {
  useCreateProperty,
  INTENT_LABELS,
  TYPE_LABELS,
  formatPrice,
  type PropertyIntent,
  type PropertyType,
} from "@/lib/properties";

export const Route = createFileRoute("/dashboard/properties")({
  component: PostPropertyPage,
  ssr: false,
  head: () => ({ meta: [{ title: "Post a Property — Geo Properties Kenya" }] }),
});

const steps = ["Property Details", "Location", "Photos", "Review & Submit"];

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

function PostPropertyPage() {
  const navigate = useNavigate();
  const create = useCreateProperty();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feeDue, setFeeDue] = useState<{ id: string; amount: number } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canNext =
    step === 0
      ? !!(form.title && form.county && form.type && Number(form.price) > 0)
      : step === 1
        ? !!form.pin
        : true;

  const submit = async () => {
    if (!form.pin) return;
    setError("");
    try {
      const created = await create.mutateAsync({
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
        cleaningFee:
          form.intent === "bnb" && form.cleaningFee ? Number(form.cleaningFee) : undefined,
        postedBy: form.postedBy,
        agentName: form.agentName || undefined,
        agentPhone: form.agentPhone || undefined,
        agentAgency: form.agentAgency || undefined,
        latitude: form.pin[0],
        longitude: form.pin[1],
        photos: form.photos,
      });

      if (created.postingPaymentStatus === "pending") {
        setFeeDue({ id: created.id, amount: created.postingFeeAmount });
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

  if (submitted) {
    return (
      <DashboardShell active="upload">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16A34A]/10">
            <Check className="h-7 w-7 text-[#16A34A]" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Listing submitted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {feeDue
              ? "Pay the posting fee to send it for review."
              : "Our team will review it shortly. You'll see it on the public map once it's approved."}
          </p>

          {feeDue && (
            <p className="mt-5 text-sm font-medium text-[#2563EB]">
              Posting fee due: KES {feeDue.amount.toLocaleString()}
            </p>
          )}

          <button
            onClick={() => navigate({ to: "/dashboard", search: { tab: "listings" } })}
            className="mt-6 w-full rounded-md bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            Go to my listings
          </button>
        </div>

        {feeDue && (
          <StkCheckoutModal
            initiatePath="/user/properties/posting-fee"
            payload={{ property_id: feeDue.id }}
            amount={feeDue.amount}
            title="Property posting fee"
            onPaid={() => setFeeDue(null)}
            onClose={() => setFeeDue(null)}
          />
        )}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell active="upload">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Post a property</h1>
        <p className="text-sm text-muted-foreground">
          Rentals, BnBs and homes for sale. Listings go live once approved.
        </p>

        <ol className="mt-5 flex flex-wrap gap-2">
          {steps.map((label, i) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === step
                  ? "bg-[#2563EB] text-white"
                  : i < step
                    ? "bg-[#2563EB]/10 text-[#2563EB]"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Listing title" className="sm:col-span-2">
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Kilimani 2BR Apartment"
                  className="dp-input"
                />
              </Field>

              <Field label="Listing type">
                <select
                  value={form.intent}
                  onChange={(e) => set("intent", e.target.value as PropertyIntent)}
                  className="dp-input"
                >
                  {Object.entries(INTENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Property type">
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value as PropertyType)}
                  className="dp-input"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={PRICE_LABEL[form.intent]}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 45,000"
                  value={formatThousands(form.price)}
                  onChange={(e) => set("price", toDigits(e.target.value))}
                  className="dp-input"
                />
              </Field>

              <Field label="County">
                <select
                  value={form.county}
                  onChange={(e) => set("county", e.target.value)}
                  className="dp-input"
                >
                  <option value="">Select a county</option>
                  {kenyaCounties.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Area / estate">
                <input
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="Kilimani"
                  className="dp-input"
                />
              </Field>

              <Field label="Bedrooms">
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 2"
                  value={form.bedrooms}
                  onChange={(e) => set("bedrooms", e.target.value)}
                  className="dp-input"
                />
              </Field>

              <Field label="Bathrooms">
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 1"
                  value={form.bathrooms}
                  onChange={(e) => set("bathrooms", e.target.value)}
                  className="dp-input"
                />
              </Field>

              {form.intent === "bnb" && (
                <>
                  <Field label="Minimum nights">
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 2"
                      value={form.minNights}
                      onChange={(e) => set("minNights", e.target.value)}
                      className="dp-input"
                    />
                  </Field>
                  <Field label="Cleaning fee (KES)">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 2,000"
                      value={formatThousands(form.cleaningFee)}
                      onChange={(e) => set("cleaningFee", toDigits(e.target.value))}
                      className="dp-input"
                    />
                  </Field>
                </>
              )}

              <Field label="Description" className="sm:col-span-2">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="Describe the property — layout, condition, nearby amenities…"
                  className="dp-input"
                />
              </Field>

              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_OPTIONS.map((a) => {
                    const on = form.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          set(
                            "amenities",
                            on ? form.amenities.filter((x) => x !== a) : [...form.amenities, a],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          on
                            ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.furnished}
                  onChange={(e) => set("furnished", e.target.checked)}
                />
                Furnished
              </label>

              <Field label="Posted by">
                <select
                  value={form.postedBy}
                  onChange={(e) => set("postedBy", e.target.value as "owner" | "broker")}
                  className="dp-input"
                >
                  <option value="owner">Owner</option>
                  <option value="broker">Broker / agent</option>
                </select>
              </Field>

              <Field label="Contact phone">
                <input
                  value={form.agentPhone}
                  onChange={(e) => set("agentPhone", e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="dp-input"
                />
              </Field>

              {form.postedBy === "broker" && (
                <>
                  <Field label="Agent name">
                    <input
                      value={form.agentName}
                      onChange={(e) => set("agentName", e.target.value)}
                      placeholder="e.g. Jane Wanjiru"
                      className="dp-input"
                    />
                  </Field>
                  <Field label="Agency">
                    <input
                      value={form.agentAgency}
                      onChange={(e) => set("agentAgency", e.target.value)}
                      placeholder="e.g. Prime Realty Kenya"
                      className="dp-input"
                    />
                  </Field>
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
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
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {form.pin
                  ? `Pin set — ${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}`
                  : "No pin yet — tap the map to place one."}
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 text-sm font-medium text-muted-foreground hover:bg-muted">
                <Plus className="h-4 w-4" /> Add photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    set("photos", [...form.photos, ...Array.from(e.target.files ?? [])])
                  }
                />
              </label>

              {form.photos.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                  {form.photos.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs"
                    >
                      <span className="truncate text-foreground">{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          set(
                            "photos",
                            form.photos.filter((_, idx) => idx !== i),
                          )
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                The first photo becomes the cover. Your plan sets how many you can upload.
              </p>
            </div>
          )}

          {step === 3 && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Review label="Title" value={form.title} />
              <Review label="Listing type" value={INTENT_LABELS[form.intent]} />
              <Review label="Property type" value={TYPE_LABELS[form.type]} />
              <Review
                label="Price"
                value={formatPrice(
                  Number(form.price || 0),
                  form.intent === "rent" ? "month" : form.intent === "bnb" ? "night" : "total",
                )}
              />
              <Review label="County" value={form.county} />
              <Review label="Area" value={form.area || "—"} />
              <Review label="Bedrooms" value={form.bedrooms || "—"} />
              <Review label="Bathrooms" value={form.bathrooms || "—"} />
              <Review
                label="Location"
                value={form.pin ? `${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}` : "—"}
              />
              <Review label="Photos" value={String(form.photos.length)} />
            </dl>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={create.isPending}
              className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {create.isPending ? "Submitting…" : "Submit listing"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .dp-input {
          display: block; width: 100%; height: 40px;
          padding: 0 10px; font-size: 14px;
          color: var(--foreground); background: transparent;
          border: 1px solid var(--border); border-radius: 6px; outline: none;
        }
        textarea.dp-input { height: auto; padding: 8px 10px; }
        .dp-input:focus { border-color: #2563EB; box-shadow: 0 0 0 2px rgba(37,99,235,.2); }
      `}</style>
    </DashboardShell>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
