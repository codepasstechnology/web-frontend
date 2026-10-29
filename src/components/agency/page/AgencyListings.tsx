import { useMemo, useState } from "react";
import {
  ChevronRight,
  ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AgencyListingsMap } from "@/components/map/LazyMaps";
import { beaconSvg } from "@/components/map/markers";
import type { AgencyListingItem, AgencyProfile, AgencyTab } from "@/lib/agency";
import {
  applyFilters,
  inTab,
  NO_FILTERS,
  type ListingFilters,
} from "@/components/agency/page/filters";
import { TYPE_LABELS } from "@/lib/properties";
import {
  closedText,
  listingHref,
  listingMeta,
  listingPrice,
  listingTitle,
  listingWaText,
  TYPE_COLOR,
  TYPE_TAG,
  typeKey,
  waLink,
} from "@/components/agency/page/helpers";
import { WhatsAppIcon } from "@/components/agency/page/icons";

const TABS: { id: AgencyTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rent", label: "For rent" },
  { id: "sale", label: "For sale" },
  { id: "land", label: "Land" },
  { id: "bnb", label: "BnB" },
  { id: "closed", label: "Recently let or sold" },
];

const PRICES = [20_000, 50_000, 100_000, 250_000, 1_000_000, 5_000_000, 20_000_000];
const PAGE = 9;

const kes = (n: number) =>
  n >= 1_000_000 ? `KES ${n / 1_000_000}M` : `KES ${(n / 1000).toLocaleString()}K`;

export function AgencyListings({
  agency,
  live,
  closed,
  loading,
  tab,
  onTab,
  filters,
  onFilters,
  view,
  onView,
  pageUrl,
}: {
  agency: AgencyProfile;
  live: AgencyListingItem[];
  closed: AgencyListingItem[];
  loading: boolean;
  tab: AgencyTab;
  onTab: (t: AgencyTab) => void;
  filters: ListingFilters;
  onFilters: (f: ListingFilters) => void;
  view: "grid" | "map";
  onView: (v: "grid" | "map") => void;
  pageUrl: string;
}) {
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState(false);

  const counts = useMemo(() => {
    const c: Record<AgencyTab, number> = {
      all: live.length,
      rent: 0,
      sale: 0,
      land: 0,
      bnb: 0,
      closed: closed.length,
    };
    for (const l of live) {
      for (const t of ["rent", "sale", "land", "bnb"] as const) if (inTab(l, t)) c[t]++;
    }
    return c;
  }, [live, closed]);

  const base = tab === "closed" ? closed : live.filter((l) => inTab(l, tab));
  const list = applyFilters(base, filters);
  const manyListings = live.length > 3;
  const set = (patch: Partial<ListingFilters>) => {
    setShown(PAGE);
    onFilters({ ...filters, ...patch });
  };

  const active: { label: string; clear: Partial<ListingFilters> }[] = [
    ...(filters.type
      ? [{ label: TYPE_LABELS[filters.type as keyof typeof TYPE_LABELS], clear: { type: "" } }]
      : []),
    ...(filters.county ? [{ label: filters.county, clear: { county: "" } }] : []),
    ...(filters.maxPrice
      ? [{ label: `Up to ${kes(filters.maxPrice)}`, clear: { maxPrice: 0 } }]
      : []),
    ...(filters.project ? [{ label: filters.project, clear: { project: "" } }] : []),
    ...(filters.beds ? [{ label: `${filters.beds}+ bedrooms`, clear: { beds: 0 } }] : []),
  ];

  const selects = [
    {
      label: "Property type",
      value: filters.type,
      onChange: (v: string) => set({ type: v }),
      options: [
        { v: "", t: "Any type" },
        ...Object.entries(TYPE_LABELS).map(([v, t]) => ({ v, t })),
      ],
    },
    {
      label: "County",
      value: filters.county,
      onChange: (v: string) => set({ county: v }),
      options: [{ v: "", t: "All counties" }, ...agency.areas.map((c) => ({ v: c, t: c }))],
    },
    {
      label: "Max price",
      value: String(filters.maxPrice),
      onChange: (v: string) => set({ maxPrice: Number(v) }),
      options: [
        { v: "0", t: "Any price" },
        ...PRICES.map((n) => ({ v: String(n), t: `Up to ${kes(n)}` })),
      ],
    },
    ...(agency.projects.length > 0
      ? [
          {
            label: "Project",
            value: filters.project,
            onChange: (v: string) => set({ project: v }),
            options: [
              { v: "", t: "All projects" },
              ...agency.projects.map((p) => ({ v: p.name, t: p.name })),
            ],
          },
        ]
      : []),
  ];

  const beds = (
    <>
      {[0, 1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={filters.beds === n}
          onClick={() => set({ beds: n })}
        >
          {n === 0 ? "Any" : `${n}+`}
        </button>
      ))}
    </>
  );

  const countText = loading
    ? "Loading listings…"
    : tab === "closed"
      ? `${list.length} ${list.length === 1 ? "listing" : "listings"} let or sold in the last 6 months`
      : `${list.length} ${list.length === 1 ? "listing" : "listings"}`;

  const noLiveAtAll = !loading && live.length === 0 && tab !== "closed";

  return (
    <section id="listings" className="ag-sec" aria-labelledby="h-listings">
      <div className="ag-sechead">
        <h2 id="h-listings" className="gs-h ag-h2">
          Listings
        </h2>
        <span style={{ color: "var(--muted)", fontSize: 14.5 }}>
          {live.length} live {live.length === 1 ? "listing" : "listings"}
        </span>
      </div>

      <div className="ag-tabs" role="tablist" aria-label="Listing type">
        {TABS.filter((t) => t.id === "all" || counts[t.id] > 0).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="gs-chip ag-tab"
            aria-selected={tab === t.id}
            aria-pressed={tab === t.id}
            onClick={() => {
              setShown(PAGE);
              onTab(t.id);
            }}
          >
            {t.label} <span className="ag-tabn">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {manyListings && (
        <div className="ag-filters ag-desk">
          {selects.map((f) => (
            <label key={f.label} className="ag-fsel">
              <span>{f.label}</span>
              <select value={f.value} onChange={(e) => f.onChange(e.target.value)}>
                {f.options.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.t}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="ag-beds" role="group" aria-label="Bedrooms">
            <span>Bedrooms</span>
            {beds}
          </div>
        </div>
      )}

      <div className="ag-resbar">
        {manyListings && (
          <button
            type="button"
            className="gs-chip ag-mob"
            onClick={() => setSheet(true)}
            style={{ minHeight: 42, alignItems: "center", gap: 8 }}
          >
            <SlidersHorizontal size={16} aria-hidden /> Filters
            {active.length > 0 && <span className="ag-fcount">{active.length}</span>}
          </button>
        )}
        <span className="ag-count" role="status">
          {countText}
        </span>
        {active.length > 0 && (
          <button type="button" className="ag-clear ag-desk" onClick={() => set(NO_FILTERS)}>
            Clear filters
          </button>
        )}
        <span style={{ flex: 1 }} />
        <div className="ag-seg" role="group" aria-label="View">
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => onView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} aria-hidden />
            <span className="ag-sl">Grid</span>
          </button>
          <button
            type="button"
            aria-pressed={view === "map"}
            onClick={() => onView("map")}
            aria-label="Map view"
          >
            <MapIcon size={15} aria-hidden />
            <span className="ag-sl">Map</span>
          </button>
        </div>
      </div>

      {active.length > 0 && (
        <div className="ag-active">
          {active.map((a) => (
            <button
              key={a.label}
              type="button"
              className="ag-achip"
              onClick={() => set(a.clear)}
              aria-label={`Remove filter: ${a.label}`}
            >
              {a.label} <X size={13} strokeWidth={2.6} aria-hidden />
            </button>
          ))}
        </div>
      )}

      {list.length === 0 && !loading ? (
        <div className="ag-empty">
          <span
            style={{ ["--pc" as string]: "var(--accent)", display: "flex" }}
            dangerouslySetInnerHTML={{ __html: beaconSvg(26, 36) }}
          />
          <strong>
            {noLiveAtAll ? "No listings yet" : "No listings match these filters right now."}
          </strong>
          <span>
            {noLiveAtAll
              ? `Message ${agency.name} to ask what's coming up.`
              : tab === "closed"
                ? "Nothing let or sold in the last six months."
                : "Try another type, county or price."}
          </span>
          {active.length > 0 && (
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={() => set(NO_FILTERS)}
              style={{ minHeight: 44, fontSize: 14 }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : view === "map" ? (
        <AgencyListingsMap items={list} />
      ) : (
        <>
          <div className="ag-grid">
            {list.slice(0, shown).map((l) => (
              <ListingCard
                key={`${l.kind}-${l.item.id}`}
                listing={l}
                faded={tab === "closed"}
                agencyName={agency.name}
                agencyPhone={agency.whatsapp ?? agency.phone}
                pageUrl={pageUrl}
              />
            ))}
          </div>
          {list.length > shown && (
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={() => setShown(list.length)}
              style={{ alignSelf: "center", minHeight: 46, fontSize: 15 }}
            >
              Show {list.length - shown} more
            </button>
          )}
        </>
      )}

      {sheet && (
        <div
          className="ag-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Filter listings"
          onClick={(e) => e.target === e.currentTarget && setSheet(false)}
        >
          <div className="ag-mcard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="gs-h" style={{ fontSize: 22 }}>
                Filters
              </h2>
              <button
                type="button"
                className="ag-x"
                onClick={() => setSheet(false)}
                aria-label="Close"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            {selects.map((f) => (
              <label key={f.label} className="ag-fsel ag-fselm">
                <span>{f.label}</span>
                <select value={f.value} onChange={(e) => f.onChange(e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <div
              className="ag-beds"
              role="group"
              aria-label="Bedrooms"
              style={{ flexWrap: "wrap" }}
            >
              <span style={{ width: "100%" }}>Bedrooms</span>
              {beds}
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, marginTop: 6 }}
            >
              <button type="button" className="gs-btn gs-ghost" onClick={() => set(NO_FILTERS)}>
                Clear
              </button>
              <button type="button" className="gs-btn" onClick={() => setSheet(false)}>
                Show {list.length} {list.length === 1 ? "listing" : "listings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ListingCard({
  listing: l,
  faded,
  agencyName,
  agencyPhone,
  pageUrl,
}: {
  listing: AgencyListingItem;
  faded: boolean;
  agencyName: string;
  agencyPhone: string | null;
  pageUrl: string;
}) {
  const key = typeKey(l);
  const title = listingTitle(l);
  const meta = listingMeta(l);
  const { price, per } = listingPrice(l);
  const photo = l.item.photos?.[0];
  const units = l.kind === "property" ? (l.item.units ?? []) : [];
  const total = units.reduce((n, u) => n + u.totalUnits, 0);
  const available = units.reduce((n, u) => n + u.availableUnits, 0);
  const wa = !faded ? waLink(agencyPhone, listingWaText(agencyName, l, pageUrl)) : null;

  return (
    <article className="ag-card" data-faded={faded}>
      <a
        href={listingHref(l)}
        className="ag-cardlink"
        aria-label={`${title}, ${meta}, ${price}${per ? ` ${per}` : ""}`}
      />
      <div
        className="ag-ph"
        style={
          photo
            ? { backgroundImage: `url("${photo}")` }
            : {
                background:
                  "repeating-linear-gradient(135deg, var(--bg2) 0 6px, var(--line2) 6px 8px)",
              }
        }
      >
        <span className="ag-tt" style={{ ["--tc" as string]: TYPE_COLOR[key] }}>
          <span className="ag-tdot" />
          {faded ? (key === "rent" || key === "bnb" ? "Let" : "Sold") : TYPE_TAG[key]}
        </span>
        {!photo && (
          <span className="ag-np">
            <ImageIcon size={18} aria-hidden />
            <span>No photo yet</span>
          </span>
        )}
        {faded && <span className="ag-done">{closedText(l)}</span>}
        {l.item.project && !faded && <span className="ag-proj">{l.item.project}</span>}
      </div>
      <div className="ag-cb">
        <span
          className={l.kind === "parcel" ? "gs-mono" : undefined}
          style={{ fontWeight: 700, fontSize: l.kind === "parcel" ? 15 : 16, lineHeight: 1.3 }}
        >
          {title}
        </span>
        <span className="ag-meta">{meta}</span>
        {total > 0 && (
          <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="ag-units" aria-hidden>
              {Array.from({ length: Math.min(total, 24) }, (_, i) => (
                <span key={i} data-on={i < Math.round((available / total) * Math.min(total, 24))} />
              ))}
            </span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              {available} of {total} units available · From {price}
            </span>
          </span>
        )}
        <span className="ag-pricerow">
          <span className="ag-price">
            {price}
            {per && <span className="ag-per">{per}</span>}
          </span>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="ag-mini"
              aria-label={`Ask ${agencyName} about ${title} on WhatsApp`}
              title="Ask about this on WhatsApp"
            >
              <WhatsAppIcon size={17} />
            </a>
          )}
        </span>
      </div>
    </article>
  );
}

export function ProjectCards({
  agency,
  selected,
  onSelect,
}: {
  agency: AgencyProfile;
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="ag-projs">
      {agency.projects.map((p) => {
        const on = selected === p.name;
        return (
          <button
            key={p.id}
            type="button"
            className="ag-projc"
            aria-pressed={on}
            onClick={() => onSelect(on ? "" : p.name)}
          >
            <span
              className="ag-projart"
              style={{
                background: "var(--soft)",
                color: "var(--soft-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-hidden
            >
              <LayoutGrid size={30} />
            </span>
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</span>
              {p.location && (
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{p.location}</span>
              )}
              {p.description && (
                <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>{p.description}</span>
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--accent)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {on ? `Showing its ${p.listings} listings` : `See ${p.listings} listings`}
                <ChevronRight size={13} strokeWidth={2.4} aria-hidden />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
