import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, MapPin, UploadCloud, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useAuth } from "@/lib/auth";
import { kenyaCounties, planById } from "@/lib/plans";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({ meta: [{ title: "Upload Land — LandVerify Kenya" }] }),
  component: UploadPage,
});

const pinIcon = L.divIcon({
  className: "lv-marker",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#2563EB;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const steps = ["Basic Details", "Location on Map", "Photos & Documents", "Review & Submit"];

function UploadPage() {
  const { user, ready, addListing } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    parcelNumber: "",
    county: "",
    area: "",
    size: "",
    price: "",
    description: "",
    landStatus: "Available" as "Available" | "Reserved" | "Disputed",
    pin: null as [number, number] | null,
    photos: [] as { name: string; url: string }[],
    deedName: "",
  });

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  if (!user) return null;
  const plan = planById(user.plan);
  const used = user.listings.length;
  const remaining = plan.listings === Infinity ? Infinity : plan.listings - used;
  const limitReached = remaining <= 0;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const allowed = plan.photos - form.photos.length;
    const slice = arr.slice(0, Math.max(0, allowed));
    const mapped = slice.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    set("photos", [...form.photos, ...mapped]);
  };

  const canNext =
    step === 0
      ? !!(form.title && form.parcelNumber && form.county && form.size && form.price)
      : step === 1
      ? !!form.pin
      : true;

  const submit = () => {
    if (limitReached) {
      setUpgradeOpen(true);
      return;
    }
    addListing({
      title: form.title,
      parcelNumber: form.parcelNumber,
      county: form.county,
      price: Number(form.price) || 0,
    });
    setSubmitted(true);
  };

  return (
    <DashboardShell active="upload" onChange={() => {}}>
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate({ to: "/dashboard" })} className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </button>
        <h1 className="text-2xl font-semibold text-foreground">Upload Land</h1>
        <p className="text-sm text-muted-foreground">List a parcel in 4 quick steps.</p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i < step ? "bg-[#2563EB] text-white" : i === step ? "border-2 border-[#2563EB] bg-card text-[#2563EB]" : "border border-border bg-card text-muted-foreground"
              }`}>{i + 1}</div>
              <div className="hidden text-xs font-medium text-foreground sm:block">{s}</div>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-[#2563EB]" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#16A34A]" />
            <h2 className="mt-3 text-lg font-semibold text-foreground">Listing submitted</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your listing is under review and will appear on the map within 24 hours.</p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => navigate({ to: "/dashboard" })} className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Go to dashboard</button>
              <button onClick={() => { setSubmitted(false); setStep(0); setForm({ ...form, title: "", parcelNumber: "", price: "" }); }} className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">Upload another</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Property title" full><input className="lv-input" value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
                <Field label="Parcel number"><input className="lv-input" value={form.parcelNumber} onChange={(e) => set("parcelNumber", e.target.value)} /></Field>
                <Field label="County">
                  <select className="lv-input" value={form.county} onChange={(e) => set("county", e.target.value)}>
                    <option value="">Select county</option>
                    {kenyaCounties.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Sub-county / Area"><input className="lv-input" value={form.area} onChange={(e) => set("area", e.target.value)} /></Field>
                <Field label="Land size"><input className="lv-input" placeholder="50x100, 1 acre" value={form.size} onChange={(e) => set("size", e.target.value)} /></Field>
                <Field label="Asking price (Ksh)"><input className="lv-input" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
                <Field label="Land status">
                  <select className="lv-input" value={form.landStatus} onChange={(e) => set("landStatus", e.target.value as any)}>
                    <option>Available</option><option>Reserved</option><option>Disputed</option>
                  </select>
                </Field>
                <Field label="Description" full>
                  <textarea className="lv-input" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Click on the map to mark your land location.</p>
                <div className="h-80 overflow-hidden rounded-md border border-border">
                  <MapContainer center={[-1.286389, 36.817223]} zoom={11} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <PinDropper pin={form.pin} onPin={(p) => set("pin", p)} />
                  </MapContainer>
                </div>
                {form.pin && (
                  <p className="mt-2 text-xs text-muted-foreground">Pin: {form.pin[0].toFixed(5)}, {form.pin[1].toFixed(5)}</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Photos ({form.photos.length}/{plan.photos} allowed on {plan.name})</span>
                  {form.photos.length >= plan.photos && (
                    <button onClick={() => setUpgradeOpen(true)} className="font-medium text-[#2563EB] hover:underline">Upgrade to upload more</button>
                  )}
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-background py-10 text-sm text-muted-foreground hover:border-[#2563EB]">
                  <UploadCloud className="h-6 w-6" />
                  <span>Drag and drop photos, or click to browse</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotos(e.target.files)} disabled={form.photos.length >= plan.photos} />
                </label>
                {form.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {form.photos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p.url} alt="" className="h-20 w-full rounded-md object-cover" />
                        <button onClick={() => set("photos", form.photos.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5">
                  <Field label="Title deed (PDF, optional)">
                    <input type="file" accept="application/pdf" className="lv-input" onChange={(e) => set("deedName", e.target.files?.[0]?.name ?? "")} />
                  </Field>
                  {form.deedName && <p className="mt-1 text-xs text-muted-foreground">Selected: {form.deedName}</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 text-sm">
                <Summary label="Title" value={form.title} />
                <Summary label="Parcel" value={form.parcelNumber} />
                <Summary label="County" value={`${form.county}${form.area ? " · " + form.area : ""}`} />
                <Summary label="Size" value={form.size} />
                <Summary label="Price" value={form.price ? `Ksh ${Number(form.price).toLocaleString()}` : "—"} />
                <Summary label="Status" value={form.landStatus} />
                <Summary label="Pin" value={form.pin ? `${form.pin[0].toFixed(5)}, ${form.pin[1].toFixed(5)}` : "Not set"} />
                <Summary label="Photos" value={`${form.photos.length} attached`} />
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Plan</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{plan.name} — {used}/{plan.listings === Infinity ? "∞" : plan.listings} listings used</div>
                </div>
                {limitReached && (
                  <div className="rounded-md border border-[#D97706]/40 bg-[#D97706]/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#D97706]"><Lock className="h-4 w-4" /> Listing limit reached</div>
                    <p className="mt-1 text-xs text-foreground">You've used all {plan.listings} listings on the {plan.name} plan. Upgrade to publish this listing.</p>
                    <button onClick={() => setUpgradeOpen(true)} className="mt-3 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]">View plans</button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              {step < steps.length - 1 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button onClick={submit} className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
                  Publish Listing
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

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
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

function PinDropper({ pin, onPin }: { pin: [number, number] | null; onPin: (p: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onPin([e.latlng.lat, e.latlng.lng]);
    },
  });
  if (!pin) return null;
  return <Marker position={pin} icon={pinIcon} />;
}