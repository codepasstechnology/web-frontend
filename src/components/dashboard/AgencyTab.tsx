import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, ImagePlus, Plus, Save, Star, Trash2 } from "lucide-react";
import { AgencyLogo } from "@/components/agency/AgencyLogo";
import { ErrorBox, Field, ToggleChips } from "@/components/dashboard/wizard";
import {
  canManage,
  SOCIAL_LABELS,
  SOCIALS,
  SPECIALTIES,
  SPECIALTY_LABELS,
  useAgencyImage,
  useMyAgency,
  useMyAgencyReviews,
  useProjectMutations,
  useReplyToReview,
  useUpdateAgency,
  type AgencyProfileInput,
  type MyAgency,
  type Social,
  type Specialty,
} from "@/lib/agency";
import { kenyaCounties } from "@/lib/plans";
import { WeeklyHours } from "@/components/dashboard/WeeklyHours";
import { hoursFromWeek, weekFromHours, type WeekHours } from "@/components/dashboard/weekHours";

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="gd-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    />
  );
}

function errorText(err: unknown, fallback: string): string {
  const e = err as { errors?: Record<string, string[]>; message?: string };
  return Object.values(e?.errors ?? {})[0]?.[0] ?? e?.message ?? fallback;
}

/** The agency's brand, contact details, listing defaults, projects and reviews. */
export function AgencyTab() {
  const { data: agency, isLoading, isError } = useMyAgency();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="gd-spin" />
      </div>
    );
  }
  if (isError || !agency)
    return <ErrorBox>Couldn&apos;t load your agency. Please try again.</ErrorBox>;

  const editable = canManage(agency.myRole);

  return (
    <div className="flex flex-col gap-4">
      <div className="gd-r flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="gd-h1">Agency profile</h1>
          <p className="gd-sub">
            What buyers and tenants see on your agency page and on every listing.
          </p>
        </div>
        <Link
          to="/agency/$slug"
          params={{ slug: agency.slug }}
          className="gd-btn gd-o"
          target="_blank"
        >
          <ExternalLink size={16} aria-hidden="true" /> View public page
        </Link>
      </div>

      <PlanNote agency={agency} />
      <Branding agency={agency} editable={editable} />
      <Details agency={agency} editable={editable} />
      <Projects agency={agency} editable={editable} />
      <Reviews editable={editable} />
    </div>
  );
}

function PlanNote({ agency }: { agency: MyAgency }) {
  const seats = agency.plan.teamSeats === -1 ? "Unlimited" : String(agency.plan.teamSeats);

  return (
    <div className="gd-r gd-card flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="gd-eyebrow">Plan</span>
        <strong>{agency.plan.name ?? "Free"}</strong>
        <span className="text-sm text-muted-foreground">
          {seats} team {agency.plan.teamSeats === 1 ? "seat" : "seats"}
          {agency.plan.boostDiscount > 0 ? ` · ${agency.plan.boostDiscount}% off boosts` : ""}
          {agency.plan.insights ? " · Agency insights" : ""}
        </span>
      </div>
      {agency.myRole === "owner" &&
        (agency.plan.slug === "agency-free" || !agency.plan.isAgencyPlan) && (
          <Link to="/dashboard" search={{ tab: "billing" }} className="gd-btn">
            See agency plans
          </Link>
        )}
    </div>
  );
}

function ImagePick({
  kind,
  label,
  hint,
  current,
  editable,
  children,
}: {
  kind: "logo" | "cover";
  label: string;
  hint: string;
  current: string | null;
  editable: boolean;
  children: React.ReactNode;
}) {
  const { upload, remove } = useAgencyImage(kind);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      setError(errorText(err, "Couldn't upload that image."));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="gd-lab">{label}</span>
      {children}
      {editable && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label={`Upload ${label.toLowerCase()}`}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="gd-btn gd-o"
            onClick={() => input.current?.click()}
            disabled={upload.isPending}
          >
            <ImagePlus size={16} aria-hidden="true" />{" "}
            {upload.isPending ? "Uploading…" : current ? "Replace" : "Upload"}
          </button>
          {current && (
            <button
              type="button"
              className="gd-btn gd-o"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              <Trash2 size={16} aria-hidden="true" /> Remove
            </button>
          )}
        </div>
      )}
      <div className="gd-hint">{hint}</div>
      {error && <div className="gd-err">{error}</div>}
    </div>
  );
}

function Branding({ agency, editable }: { agency: MyAgency; editable: boolean }) {
  const update = useUpdateAgency();
  const [color, setColor] = useState(agency.brandColor ?? "#3f5a2a");

  return (
    <section className="gd-r gd-card flex flex-col gap-4">
      <h2 className="gd-h2">Brand</h2>
      <div className="gd-form2">
        <ImagePick
          kind="logo"
          label="Logo"
          hint="Square works best, at least 300 × 300. PNG, JPG or WebP up to 5 MB."
          current={agency.logoUrl}
          editable={editable}
        >
          <AgencyLogo
            name={agency.name}
            logoUrl={agency.logoUrl}
            brandColor={agency.brandColor}
            size={88}
          />
        </ImagePick>
        <ImagePick
          kind="cover"
          label="Cover banner"
          hint="Shown across the top of your agency page. Wide images, about 1600 × 400, look best."
          current={agency.coverUrl}
          editable={editable}
        >
          <div
            className="h-[88px] w-full rounded-[14px] bg-cover bg-center"
            style={{
              backgroundColor: agency.brandColor ?? "var(--primary)",
              backgroundImage: agency.coverUrl ? `url("${agency.coverUrl}")` : undefined,
            }}
          />
        </ImagePick>
        <Field
          id="ag-color"
          label="Brand colour"
          hint="Used for your page banner, logo initials and the edge of your listing cards."
        >
          <div className="flex items-center gap-2">
            <input
              id="ag-color"
              type="color"
              className="h-11 w-14 cursor-pointer rounded-[10px] border border-border"
              value={color}
              disabled={!editable}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              className="gd-input gd-mono w-[130px]"
              value={color}
              disabled={!editable}
              onChange={(e) => setColor(e.target.value)}
            />
            {editable && color !== agency.brandColor && /^#[0-9a-fA-F]{6}$/.test(color) && (
              <button
                type="button"
                className="gd-btn"
                onClick={() => update.mutate({ brand_color: color })}
                disabled={update.isPending}
              >
                Save colour
              </button>
            )}
          </div>
        </Field>
        <div className="flex flex-col gap-2">
          <span className="gd-lab">Your short link</span>
          <span className="gd-mono text-sm">geopinproperties.co.ke/agency/{agency.slug}</span>
          <span className="gd-hint">Put it on business cards and in your WhatsApp status.</span>
        </div>
      </div>
    </section>
  );
}

type DetailsForm = {
  name: string;
  tagline: string;
  about: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  office_hours: string;
  hours: WeekHours;
  viewing_hours: string;
  description_footer: string;
  areas: string[];
  specialties: Specialty[];
  socials: Partial<Record<Social, string>>;
  watermark_photos: boolean;
};

function formFrom(a: MyAgency): DetailsForm {
  return {
    name: a.name,
    tagline: a.tagline ?? "",
    about: a.about ?? "",
    phone: a.phone ?? "",
    whatsapp: a.whatsapp ?? "",
    email: a.email ?? "",
    website: a.website ?? "",
    address: a.address ?? "",
    office_hours: a.officeHours ?? "",
    hours: weekFromHours(a.hours),
    viewing_hours: a.viewingHours ?? "",
    description_footer: a.descriptionFooter ?? "",
    areas: a.areas,
    specialties: a.specialties,
    socials: a.socials,
    watermark_photos: a.watermarkPhotos,
  };
}

function Details({ agency, editable }: { agency: MyAgency; editable: boolean }) {
  const update = useUpdateAgency();
  const [form, setForm] = useState<DetailsForm>(() => formFrom(agency));
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof DetailsForm>(k: K, v: DetailsForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => setForm(formFrom(agency)), [agency]);

  const save = async () => {
    setNote(null);
    const blank = (v: string) => (v.trim() === "" ? null : v.trim());
    const payload: AgencyProfileInput = {
      name: form.name.trim(),
      tagline: blank(form.tagline),
      about: blank(form.about),
      phone: blank(form.phone),
      whatsapp: blank(form.whatsapp),
      email: blank(form.email),
      website: blank(form.website),
      address: blank(form.address),
      office_hours: blank(form.office_hours),
      hours: hoursFromWeek(form.hours),
      viewing_hours: blank(form.viewing_hours),
      description_footer: blank(form.description_footer),
      areas: form.areas,
      specialties: form.specialties,
      socials: Object.fromEntries(Object.entries(form.socials).filter(([, v]) => v && v.trim())),
      watermark_photos: form.watermark_photos,
    };
    try {
      await update.mutateAsync(payload);
      setNote({ ok: true, text: "Saved. Your agency page and listings show the changes now." });
    } catch (err) {
      setNote({ ok: false, text: errorText(err, "Couldn't save your agency details.") });
    }
  };

  const input = (
    key: keyof DetailsForm,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <input
      id={`ag-${key}`}
      className="gd-input"
      value={form[key] as string}
      disabled={!editable}
      onChange={(e) => set(key, e.target.value as never)}
      {...props}
    />
  );

  return (
    <section className="gd-r gd-card flex flex-col gap-4">
      <h2 className="gd-h2">Details</h2>
      <div className="gd-form2">
        <Field id="ag-name" label="Agency name">
          {input("name", { maxLength: 120 })}
        </Field>
        <Field id="ag-tagline" label="Tagline" optional>
          {input("tagline", {
            maxLength: 160,
            placeholder: "e.g. Homes across Nairobi since 2012",
          })}
        </Field>
        <Field id="ag-about" label="About us" optional full>
          <textarea
            id="ag-about"
            className="gd-input"
            rows={4}
            maxLength={3000}
            disabled={!editable}
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
          />
        </Field>
        <Field id="ag-phone" label="Phone">
          {input("phone", { type: "tel", placeholder: "+254 7XX XXX XXX" })}
        </Field>
        <Field
          id="ag-whatsapp"
          label="WhatsApp"
          optional
          hint="Leave blank to use the phone number."
        >
          {input("whatsapp", { type: "tel" })}
        </Field>
        <Field id="ag-email" label="Email" optional>
          {input("email", { type: "email" })}
        </Field>
        <Field id="ag-website" label="Website" optional>
          {input("website", { type: "url", placeholder: "https://" })}
        </Field>
        <Field id="ag-address" label="Office address" optional full>
          {input("address", { placeholder: "Building, street, town" })}
        </Field>
        <Field
          label="Opening hours"
          optional
          full
          hint="Your page shows “Open now” or “Closed” from these, in Nairobi time."
        >
          <WeeklyHours value={form.hours} onChange={(v) => set("hours", v)} disabled={!editable} />
        </Field>
        <Field
          id="ag-office_hours"
          label="Office hours note"
          optional
          hint="Shown only if you leave the hours above empty."
        >
          {input("office_hours", { placeholder: "Mon–Fri 8am–5pm, Sat 9am–1pm" })}
        </Field>
        <Field
          id="ag-viewing_hours"
          label="Viewing hours"
          optional
          hint="Shown when someone requests a viewing."
        >
          {input("viewing_hours", { placeholder: "Daily 9am–5pm" })}
        </Field>
        <Field label="Specialties" full>
          <ToggleChips
            options={SPECIALTIES.map((s) => SPECIALTY_LABELS[s])}
            selected={form.specialties.map((s) => SPECIALTY_LABELS[s])}
            onChange={(labels) =>
              editable &&
              set(
                "specialties",
                SPECIALTIES.filter((s) => labels.includes(SPECIALTY_LABELS[s])),
              )
            }
          />
        </Field>
        <Field
          label="Areas served"
          full
          hint="Counties buyers can find you under in the agency directory."
        >
          <ToggleChips
            options={kenyaCounties}
            selected={form.areas}
            onChange={(next) => editable && set("areas", next)}
          />
        </Field>
        {SOCIALS.map((key) => (
          <Field key={key} id={`ag-social-${key}`} label={SOCIAL_LABELS[key]} optional>
            <input
              id={`ag-social-${key}`}
              className="gd-input"
              type="url"
              placeholder="https://"
              disabled={!editable}
              value={form.socials[key] ?? ""}
              onChange={(e) => set("socials", { ...form.socials, [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>

      <h3 className="gd-h2 mt-2 text-base">Listing defaults</h3>
      <div className="gd-form2">
        <Field
          id="ag-description_footer"
          label="Description footer"
          optional
          full
          hint="Added to the end of every new listing's description, e.g. your viewing fee or office location."
        >
          <textarea
            id="ag-description_footer"
            className="gd-input"
            rows={3}
            maxLength={1000}
            disabled={!editable}
            value={form.description_footer}
            onChange={(e) => set("description_footer", e.target.value)}
          />
        </Field>
        <div className="col-span-full flex items-center justify-between gap-4">
          <span className="flex flex-col">
            <span className="gd-lab">Put our logo on photos</span>
            <span className="gd-hint">
              Stamps your logo in the corner of new listing photos, so others can&apos;t pass them
              off as theirs.
            </span>
          </span>
          <Switch
            checked={form.watermark_photos}
            label="Put our logo on photos"
            onChange={(v) => editable && set("watermark_photos", v)}
          />
        </div>
      </div>

      {note &&
        (note.ok ? (
          <div
            role="status"
            className="rounded-[14px] bg-brand-subtle px-3.5 py-3 text-sm font-semibold text-brand-subtle-foreground"
          >
            {note.text}
          </div>
        ) : (
          <ErrorBox>{note.text}</ErrorBox>
        ))}
      {editable ? (
        <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
          <button
            type="button"
            className="gd-btn gd-o"
            onClick={() => setForm(formFrom(agency))}
            disabled={update.isPending}
          >
            Reset
          </button>
          <button
            type="button"
            className="gd-btn"
            onClick={save}
            disabled={update.isPending || form.name.trim().length < 2}
          >
            <Save size={16} aria-hidden="true" /> {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the agency owner or a manager can change these.
        </p>
      )}
    </section>
  );
}

function Projects({ agency, editable }: { agency: MyAgency; editable: boolean }) {
  const { create, remove } = useProjectMutations();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  const add = async () => {
    setError("");
    try {
      await create.mutateAsync({ name: name.trim(), location: location.trim() || undefined });
      setName("");
      setLocation("");
    } catch (err) {
      setError(errorText(err, "Couldn't add that project."));
    }
  };

  return (
    <section className="gd-r gd-card flex flex-col gap-4">
      <div>
        <h2 className="gd-h2">Projects</h2>
        <p className="gd-sub mt-1 text-sm">
          Group listings under one development, like &ldquo;Phase 2, Kitengela&rdquo;. Buyers can
          filter your page by project.
        </p>
      </div>
      {agency.projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {agency.projects.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-[14px] border border-border px-3.5 py-2.5"
            >
              <span className="flex flex-col">
                <strong className="text-sm">{p.name}</strong>
                {p.location && <span className="text-xs text-muted-foreground">{p.location}</span>}
              </span>
              {editable && (
                <button
                  type="button"
                  className="gd-ib"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => remove.mutate(p.id)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="flex flex-wrap items-end gap-2">
          <Field id="pj-name" label="Project name">
            <input
              id="pj-name"
              className="gd-input"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field id="pj-loc" label="Location" optional>
            <input
              id="pj-loc"
              className="gd-input"
              value={location}
              maxLength={160}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
          <button
            type="button"
            className="gd-btn"
            onClick={add}
            disabled={!name.trim() || create.isPending}
          >
            <Plus size={16} aria-hidden="true" /> Add project
          </button>
        </div>
      )}
      {error && <ErrorBox>{error}</ErrorBox>}
    </section>
  );
}

function Reviews({ editable }: { editable: boolean }) {
  const { data: reviews = [] } = useMyAgencyReviews();
  const reply = useReplyToReview();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <section className="gd-r gd-card flex flex-col gap-4">
      <div>
        <h2 className="gd-h2">Reviews</h2>
        <p className="gd-sub mt-1 text-sm">Replies show under the review on your public page.</p>
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews yet. People who message you or book a viewing can leave one.
        </p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="flex flex-col gap-2 rounded-[14px] border border-border p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm">
                <span className="flex text-[#d99a1c]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      aria-hidden="true"
                      fill={n <= r.rating ? "currentColor" : "none"}
                    />
                  ))}
                </span>
                <strong>{r.author}</strong>
              </span>
              {r.hidden && (
                <span className="gd-st" data-k="muted">
                  Hidden by Geo Pin
                </span>
              )}
            </div>
            {r.body && <p className="text-sm">{r.body}</p>}
            {editable ? (
              <div className="flex flex-col gap-2">
                <textarea
                  className="gd-input"
                  rows={2}
                  maxLength={1500}
                  placeholder="Write a public reply"
                  aria-label={`Reply to ${r.author}`}
                  value={drafts[r.id] ?? r.reply ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                />
                {(drafts[r.id] ?? r.reply ?? "") !== (r.reply ?? "") && (
                  <button
                    type="button"
                    className="gd-btn self-start"
                    disabled={reply.isPending}
                    onClick={() => reply.mutate({ id: r.id, reply: drafts[r.id] ?? "" })}
                  >
                    Save reply
                  </button>
                )}
              </div>
            ) : (
              r.reply && <p className="text-sm text-muted-foreground">Your reply: {r.reply}</p>
            )}
          </div>
        ))
      )}
    </section>
  );
}
