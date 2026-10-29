import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  Globe,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Share,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { KENYA_OUTLINE } from "@/components/home/kenyaMapData";
import {
  responseLabel,
  SOCIAL_LABELS,
  SPECIALTY_LABELS,
  type AgencyProfile,
  type Social,
} from "@/lib/agency";
import { TYPE_LABELS } from "@/lib/properties";
import {
  countyPoint,
  coverStyle,
  digits,
  displayUrl,
  durationShort,
  hourRows,
  initials,
  logoStyle,
  openStatus,
} from "@/components/agency/page/helpers";
import { StarIcon, WhatsAppIcon } from "@/components/agency/page/icons";

/** Joined in the last two months: gets the "New on Geo Pin" pill. */
function isNew(agency: AgencyProfile): boolean {
  return Date.now() - new Date(agency.memberSince).getTime() < 60 * 86_400_000;
}

export function AgencyHeader({
  agency,
  waHref,
  urlText,
  onShare,
  onBook,
}: {
  agency: AgencyProfile;
  waHref: string | null;
  urlText: string;
  onShare: () => void;
  onBook: () => void;
}) {
  const reply = responseLabel(agency.responseMinutes);
  const since = new Date(agency.memberSince).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
  const tel = digits(agency.phone);
  const counties =
    agency.areas.length > 2
      ? `${agency.areas.slice(0, 2).join(", ")} + ${agency.areas.length - 2} more`
      : agency.areas.join(", ");

  return (
    <section className="gs-wrap" style={{ paddingTop: 24 }}>
      <div
        className="ag-cover"
        style={coverStyle(agency)}
        role="img"
        aria-label={
          agency.coverUrl ? `Cover photo of ${agency.name}` : `${agency.name} brand colour`
        }
      >
        {isNew(agency) && (
          <span className="ag-newtag">
            <Sparkles size={14} aria-hidden /> New on Geo Pin
          </span>
        )}
      </div>
      <div className="ag-head">
        <div className="ag-logo" style={logoStyle(agency)}>
          {!agency.logoUrl && <span>{initials(agency.name)}</span>}
        </div>
        <div className="ag-id">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {agency.featured && (
              <span className="ag-feat">
                <StarIcon size={13} /> Featured agency
              </span>
            )}
            <span className="gs-mono" style={{ fontSize: 12.5, color: "var(--faint)" }}>
              {urlText}
            </span>
          </div>
          <h1 className="gs-h ag-name">{agency.name}</h1>
          {agency.tagline && <p className="ag-tagline">{agency.tagline}</p>}
          <ul className="ag-trust" aria-label="About this agency">
            {agency.rating != null && (
              <li>
                <a
                  href="#reviews"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ color: "var(--accent)", display: "flex" }}>
                    <StarIcon size={15} />
                  </span>
                  <strong>{agency.rating.toFixed(1)}</strong>
                  <span style={{ color: "var(--muted)" }}>
                    ({agency.reviews} {agency.reviews === 1 ? "review" : "reviews"})
                  </span>
                </a>
              </li>
            )}
            {reply && (
              <li>
                <Timer size={15} aria-hidden />
                {reply}
              </li>
            )}
            {counties && (
              <li>
                <MapPin size={15} aria-hidden />
                {counties}
              </li>
            )}
            <li>
              <CalendarDays size={15} aria-hidden />
              On Geo Pin since {since}
            </li>
          </ul>
        </div>
        <div className="ag-actions">
          {tel.length >= 9 && (
            <a href={`tel:${tel}`} className="gs-btn">
              <Phone size={18} aria-hidden /> Call
            </a>
          )}
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="gs-btn gs-ghost">
              <WhatsAppIcon /> WhatsApp
            </a>
          )}
          <button
            type="button"
            className="gs-btn gs-ghost ag-sq"
            onClick={onShare}
            aria-label="Share this agency"
          >
            <Share size={18} aria-hidden />
            <span className="ag-sqlab">Share</span>
          </button>
          <button type="button" className="ag-viewlink" onClick={onBook}>
            <CalendarDays size={16} aria-hidden /> Book a viewing
          </button>
        </div>
      </div>
    </section>
  );
}

/** Only the agency's own team sees this: what's still missing from the page. */
export function OwnerChecklist({ agency }: { agency: AgencyProfile }) {
  const tasks = [
    { t: "Logo", done: !!agency.logoUrl },
    { t: "Cover photo", done: !!agency.coverUrl },
    { t: "About", done: !!agency.about },
    { t: "3+ listings", done: agency.stats.listings >= 3 },
    {
      t: "Office and viewing hours",
      done: !!(agency.hours || agency.officeHours) && !!agency.viewingHours,
    },
  ];
  const done = tasks.filter((t) => t.done).length;
  if (done === tasks.length) return null;

  return (
    <section className="gs-wrap" style={{ marginTop: 20 }}>
      <div className="ag-owner">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <span className="ag-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={14} aria-hidden /> Only you can see this
            </span>
            <h2 className="gs-h" style={{ fontSize: 22, marginTop: 6 }}>
              Complete your page
            </h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14.5 }}>
              Agencies with a logo, cover and three or more listings get far more WhatsApp
              enquiries.
            </p>
          </div>
          <Link
            to="/dashboard"
            search={{ tab: "agency" }}
            className="gs-btn gs-ghost"
            style={{ minHeight: 44, fontSize: 14 }}
          >
            <Pencil size={16} aria-hidden /> Edit page
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className="ag-bar"
            style={{ flex: 1 }}
            role="progressbar"
            aria-label="Page completeness"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={tasks.length}
          >
            <span style={{ width: `${(done / tasks.length) * 100}%` }} />
          </div>
          <span className="gs-mono" style={{ fontSize: 13, color: "var(--muted)" }}>
            {done}/{tasks.length}
          </span>
        </div>
        <div className="ag-tasks">
          {tasks.map((t) => (
            <Link
              key={t.t}
              to="/dashboard"
              search={{ tab: "agency" }}
              className="ag-task"
              data-done={t.done}
            >
              <span className="ag-tick">
                <Check size={12} strokeWidth={3} aria-hidden />
              </span>
              {t.t}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatsStrip({ agency }: { agency: AgencyProfile }) {
  const s = agency.stats;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const mix = [
    ...Object.entries(s.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, n]) => {
        const label = (TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type).toLowerCase();
        return plural(n, label, `${label}s`);
      }),
    ...(s.land > 0 ? [plural(s.land, "plot", "plots")] : []),
  ].join(" · ");

  const items: { n: string; l: string; sub?: string }[] = [];
  if (s.listings > 0) items.push({ n: String(s.listings), l: "Live listings", sub: mix });
  if (s.land > 0 && s.land !== s.listings) {
    items.push({
      n: String(s.land),
      l: "Plots of land",
      sub: s.traced > 0 ? `${s.traced} with traced boundaries` : undefined,
    });
  }
  if (s.units > 0) items.push({ n: `${s.availableUnits} of ${s.units}`, l: "Units available" });
  if (s.counties > 0) items.push({ n: String(s.counties), l: "Counties covered" });
  if (s.daysToClose != null) {
    items.push({
      n: durationShort(s.daysToClose),
      l: "Typical time to let",
      sub: "From the last 6 months",
    });
  }
  if (agency.projects.length > 0) {
    items.push({
      n: String(agency.projects.length),
      l: "Projects",
      sub: agency.projects.map((p) => p.name).join(" · "),
    });
  }
  if (items.length === 0) return null;

  return (
    <section className="gs-wrap" style={{ marginTop: 22 }} aria-label="Agency at a glance">
      <div className="ag-stats">
        {items.map((i) => (
          <div key={i.l} className="ag-stat">
            <span className="gs-h ag-statn">{i.n}</span>
            <span className="ag-statl">{i.l}</span>
            {i.sub && <span className="ag-stats2">{i.sub}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutSection({
  agency,
  projects,
}: {
  agency: AgencyProfile;
  projects: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const paragraphs = (agency.about ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0 && agency.specialties.length === 0 && agency.projects.length === 0) {
    return null;
  }
  const long = paragraphs.length > 1 || (paragraphs[0]?.length ?? 0) > 240;

  return (
    <section className="ag-sec" aria-labelledby="h-about">
      <h2 id="h-about" className="gs-h ag-h2">
        About
      </h2>
      {paragraphs.length > 0 && (
        <div className="ag-about" data-open={open}>
          {(open ? paragraphs : paragraphs.slice(0, 1)).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {long && (
        <button
          type="button"
          className="ag-clear"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{ alignSelf: "flex-start" }}
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
      {agency.specialties.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {agency.specialties.map((s) => (
            <span key={s} className="ag-tag">
              {SPECIALTY_LABELS[s]}
            </span>
          ))}
        </div>
      )}
      {agency.projects.length > 0 && projects}
    </section>
  );
}

function CoverageMap({ counties, onClick }: { counties: string[]; onClick: () => void }) {
  return (
    <button
      type="button"
      className="ag-cov"
      onClick={onClick}
      aria-label="Show listings on the map"
    >
      <svg
        viewBox="0 0 840 1010"
        width="100%"
        style={{ display: "block", maxHeight: 190 }}
        aria-hidden
      >
        <path d={KENYA_OUTLINE} fill="var(--surface)" stroke="var(--line)" strokeWidth="6" />
        {counties.map((c) => {
          const p = countyPoint(c);
          return p ? (
            <circle
              key={c}
              cx={p.x}
              cy={p.y}
              r="42"
              fill="var(--accent)"
              fillOpacity=".38"
              stroke="var(--accent)"
              strokeWidth="5"
            />
          ) : null;
        })}
      </svg>
      <span className="ag-covlab">
        <MapPin size={12} aria-hidden /> See listings on the map
      </span>
    </button>
  );
}

export function DetailsPanel({
  agency,
  county,
  onCounty,
  onCoverage,
  onBook,
  onReport,
  reported,
}: {
  agency: AgencyProfile;
  county: string;
  onCounty: (c: string) => void;
  onCoverage: () => void;
  onBook: () => void;
  onReport: () => void;
  reported: boolean;
}) {
  const [emailShown, setEmailShown] = useState(false);
  const [allCounties, setAllCounties] = useState(false);
  const socials = Object.entries(agency.socials).filter(([, url]) => !!url) as [Social, string][];
  const status = agency.hours ? openStatus(agency.hours) : null;
  const tel = digits(agency.phone);
  const directions =
    agency.latitude != null && agency.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${agency.latitude},${agency.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(agency.address ?? "")}`;
  const counties = allCounties ? agency.areas : agency.areas.slice(0, 8);

  return (
    <aside className="ag-side" aria-label="Agency details">
      <div className="ag-panel">
        {agency.address && (
          <div className="ag-drow">
            <MapPin size={18} aria-hidden />
            <div>
              <span className="ag-dlab">Office</span>
              <span>{agency.address}</span>
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13.5, fontWeight: 600 }}
              >
                Get directions
              </a>
            </div>
          </div>
        )}
        {(agency.hours || agency.officeHours) && (
          <div className="ag-drow">
            <Clock size={18} aria-hidden />
            <div style={{ flex: 1 }}>
              <span className="ag-dlab">Office hours</span>
              {agency.hours && status ? (
                <>
                  <span className="ag-open" data-open={status.open}>
                    <i />
                    {status.text}
                  </span>
                  {hourRows(agency.hours).map((h) => (
                    <span
                      key={h.label}
                      className="ag-hrs"
                      data-today={h.days.includes(status.today)}
                    >
                      <span>{h.label}</span>
                      <span>{h.time}</span>
                    </span>
                  ))}
                </>
              ) : (
                <span>{agency.officeHours}</span>
              )}
            </div>
          </div>
        )}
        {agency.viewingHours && (
          <div className="ag-drow">
            <CalendarDays size={18} aria-hidden />
            <div>
              <span className="ag-dlab">Viewings</span>
              <span>{agency.viewingHours}</span>
              <button
                type="button"
                className="ag-clear"
                onClick={onBook}
                style={{ alignSelf: "flex-start" }}
              >
                Book a viewing
              </button>
            </div>
          </div>
        )}
        {tel.length >= 9 && (
          <div className="ag-drow">
            <Phone size={18} aria-hidden />
            <div>
              <span className="ag-dlab">Phone</span>
              <a
                href={`tel:${tel}`}
                className="gs-mono"
                style={{ color: "var(--ink)", textDecoration: "none", fontSize: 14.5 }}
              >
                {agency.phone}
              </a>
            </div>
          </div>
        )}
        {agency.email && (
          <div className="ag-drow">
            <Mail size={18} aria-hidden />
            <div>
              <span className="ag-dlab">Email</span>
              {emailShown ? (
                <a
                  href={`mailto:${agency.email}`}
                  style={{ fontSize: 14.5, overflowWrap: "anywhere" }}
                >
                  {agency.email}
                </a>
              ) : (
                <button
                  type="button"
                  className="ag-clear"
                  onClick={() => setEmailShown(true)}
                  style={{ alignSelf: "flex-start" }}
                >
                  Show email address
                </button>
              )}
            </div>
          </div>
        )}
        {agency.website && (
          <div className="ag-drow">
            <Globe size={18} aria-hidden />
            <div>
              <span className="ag-dlab">Website</span>
              <a
                href={agency.website}
                target="_blank"
                rel="noopener nofollow noreferrer"
                style={{ fontSize: 14.5, overflowWrap: "anywhere" }}
              >
                {displayUrl(agency.website)}
              </a>
            </div>
          </div>
        )}
        {agency.areas.length > 0 && (
          <div className="ag-drow" style={{ alignItems: "stretch" }}>
            <MapPin size={18} aria-hidden />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ag-dlab">
                Counties served{" "}
                <span style={{ color: "var(--faint)", fontWeight: 500 }}>
                  · {agency.areas.length}
                </span>
              </span>
              <CoverageMap counties={agency.areas} onClick={onCoverage} />
              <div className="ag-cpills">
                {counties.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="ag-cpill"
                    aria-pressed={county === c}
                    onClick={() => onCounty(county === c ? "" : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {agency.areas.length > 8 && (
                <button
                  type="button"
                  className="ag-clear"
                  onClick={() => setAllCounties((o) => !o)}
                  style={{ marginTop: 6 }}
                >
                  {allCounties ? "Show fewer" : `Show all ${agency.areas.length}`}
                </button>
              )}
            </div>
          </div>
        )}
        {socials.length > 0 && (
          <div className="ag-drow">
            <Hash size={18} aria-hidden />
            <div>
              <span className="ag-dlab">Follow</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener nofollow noreferrer"
                    className="ag-soc"
                  >
                    {SOCIAL_LABELS[key]}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
        <button type="button" className="ag-reportag" onClick={onReport} disabled={reported}>
          <Flag size={14} aria-hidden /> {reported ? "Reported. Thank you" : "Report this agency"}
        </button>
      </div>
      <Link to="/agencies" className="ag-others">
        <Users size={20} aria-hidden />
        <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontWeight: 700 }}>Browse other agencies</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Compare agencies across Kenya</span>
        </span>
        <ChevronRight size={18} aria-hidden />
      </Link>
    </aside>
  );
}
