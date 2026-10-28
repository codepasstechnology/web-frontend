import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Clock, MapPin, Search, Sparkles, Star } from "lucide-react";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PageHero } from "@/components/site/PageHero";
import { AgencyLogo } from "@/components/agency/AgencyLogo";
import {
  responseLabel,
  SPECIALTIES,
  SPECIALTY_LABELS,
  useAgencies,
  type Specialty,
} from "@/lib/agency";
import { kenyaCounties } from "@/lib/plans";
import "@/components/agency/agency.css";

export const Route = createFileRoute("/agencies")({
  head: () => ({
    meta: [
      { title: "Find an agency — Geo Pin Properties Kenya" },
      {
        name: "description",
        content:
          "Browse property agencies on Geo Pin Properties by county and specialty, and see everything each one has listed.",
      },
    ],
    links: MARKETING_FONT_LINKS,
  }),
  component: AgenciesPage,
});

function AgenciesPage() {
  const [q, setQ] = useState("");
  const [county, setCounty] = useState("");
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const { data: agencies = [], isLoading } = useAgencies({ q: q.trim(), county, specialty });

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Agencies"
        title="Find an agency that"
        highlight="knows the area."
        lede="Every agency on Geo Pin Properties has a page with all of its live listings, where it works and what buyers and tenants say about it."
      />

      <section className="gs-wrap" style={{ paddingBottom: 112, display: "grid", gap: 20 }}>
        <div className="gs-card gs-ag-dir-bar">
          <label style={{ position: "relative" }}>
            <span className="gs-sr-only">Search agencies</span>
            <input
              className="gs-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search agencies by name"
              style={{ paddingLeft: 46 }}
            />
            <Search
              size={18}
              aria-hidden
              style={{
                position: "absolute",
                left: 17,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--faint)",
              }}
            />
          </label>
          <label>
            <span className="gs-sr-only">County</span>
            <select className="gs-input" value={county} onChange={(e) => setCounty(e.target.value)}>
              <option value="">All counties</option>
              {kenyaCounties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="gs-chips" role="group" aria-label="Specialty">
          <button
            type="button"
            className="gs-chip"
            aria-pressed={specialty === ""}
            onClick={() => setSpecialty("")}
          >
            Any specialty
          </button>
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              className="gs-chip"
              aria-pressed={specialty === s}
              onClick={() => setSpecialty(s)}
            >
              {SPECIALTY_LABELS[s]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="gs-text">Loading agencies…</p>
        ) : agencies.length === 0 ? (
          <div className="gs-ag-empty">No agencies match yet. Try another county or specialty.</div>
        ) : (
          <>
            <span className="gs-text" style={{ fontSize: 14 }}>
              {agencies.length} {agencies.length === 1 ? "agency" : "agencies"}
            </span>
            <div className="gs-ag-dir-grid">
              {agencies.map((a) => {
                const response = responseLabel(a.responseMinutes);
                return (
                  <Link
                    key={a.id}
                    to="/agency/$slug"
                    params={{ slug: a.slug }}
                    className="gs-card gs-lift gs-ag-dir-card"
                    style={{ ["--brand" as string]: a.brandColor ?? undefined }}
                  >
                    <div
                      className="gs-ag-dir-cover"
                      data-photo={Boolean(a.coverUrl)}
                      style={a.coverUrl ? { backgroundImage: `url("${a.coverUrl}")` } : undefined}
                    />
                    <div className="gs-ag-dir-body">
                      <span className="gs-ag-dir-logo">
                        <AgencyLogo
                          name={a.name}
                          logoUrl={a.logoUrl}
                          brandColor={a.brandColor}
                          size={60}
                          radius={16}
                        />
                      </span>
                      {a.featured && (
                        <span className="gs-ag-badge">
                          <Sparkles size={11} aria-hidden /> Featured
                        </span>
                      )}
                      <strong className="gs-h gs-ag-dir-name">{a.name}</strong>
                      {a.tagline && <p className="gs-ag-dir-tagline">{a.tagline}</p>}
                      <div className="gs-ag-meta" style={{ fontSize: 13.5 }}>
                        {a.rating != null && (
                          <span>
                            <Star size={14} aria-hidden fill="#d99a1c" color="#d99a1c" />
                            <strong>{a.rating.toFixed(1)}</strong> ({a.reviews})
                          </span>
                        )}
                        {response && (
                          <span>
                            <Clock size={13} aria-hidden /> {response}
                          </span>
                        )}
                        {a.areas.length > 0 && (
                          <span>
                            <MapPin size={13} aria-hidden />
                            {a.areas.slice(0, 2).join(", ")}
                            {a.areas.length > 2 ? ` +${a.areas.length - 2}` : ""}
                          </span>
                        )}
                      </div>
                      {a.specialties.length > 0 && (
                        <div className="gs-ag-pills">
                          {a.specialties.map((s) => (
                            <span key={s} className="gs-ag-pill">
                              {SPECIALTY_LABELS[s]}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="gs-ag-dir-foot">
                        <span>
                          <strong>{a.listings}</strong> live{" "}
                          {a.listings === 1 ? "listing" : "listings"}
                        </span>
                        <span>
                          View agency <ArrowRight size={14} aria-hidden />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </MarketingShell>
  );
}
