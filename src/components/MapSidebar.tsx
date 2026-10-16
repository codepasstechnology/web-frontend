import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Clock, PanelLeftClose, X } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { PRICE_SCALES, type PriceKind, type PriceRange } from "@/lib/priceRanges";

export interface RecentChip {
  id: string;
  label: string;
  mono: boolean;
  color: string;
  onOpen: () => void;
}

const VIEWS = [
  { to: "/explore", label: "Explore" },
  { to: "/land", label: "Land" },
  { to: "/rentals", label: "Rentals" },
] as const;

/** The left column on every browse map: header, recently viewed, filters and results. */
export function MapSidebar({
  view,
  title,
  count,
  recent,
  onClearRecent,
  filtersActive,
  onReset,
  empty,
  drawerOpen,
  onCloseDrawer,
  children,
}: {
  view: "/explore" | "/land" | "/rentals";
  title: string;
  count: number;
  recent: RecentChip[];
  onClearRecent: () => void;
  filtersActive: boolean;
  onReset: () => void;
  empty: boolean;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const countLabel = `${count} ${count === 1 ? "result" : "results"}`;

  return (
    <>
      {drawerOpen && (
        <button type="button" className="gm-backdrop" aria-label="Close" onClick={onCloseDrawer} />
      )}
      <aside
        className="gm-side"
        data-collapsed={collapsed}
        data-drawer={drawerOpen}
        aria-label="Listings and filters"
      >
        <div className="gm-srail">
          <button
            type="button"
            className="gm-mbtn"
            onClick={() => setCollapsed(false)}
            aria-label="Show filters and listings"
          >
            <ChevronRight width={18} height={18} aria-hidden />
          </button>
          <span className="gm-mono">{countLabel}</span>
        </div>
        <div className="gm-sbody">
          <div className="gm-shead">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <nav className="gm-seg" aria-label="Map views" style={{ boxShadow: "none" }}>
                {VIEWS.map((v) => (
                  <Link key={v.to} to={v.to} aria-current={v.to === view ? "page" : undefined}>
                    {v.label}
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                className="gm-mbtn gm-collbtn"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                style={{ width: 38, height: 38, boxShadow: "none" }}
              >
                <PanelLeftClose width={16} height={16} aria-hidden />
              </button>
              {drawerOpen && (
                <button
                  type="button"
                  className="gm-mbtn"
                  onClick={onCloseDrawer}
                  aria-label="Close"
                  style={{ width: 38, height: 38, boxShadow: "none" }}
                >
                  <X width={16} height={16} aria-hidden />
                </button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <h1 className="gm-h" style={{ fontSize: 26 }}>
                {title}
              </h1>
              <span
                role="status"
                style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}
              >
                {countLabel}
              </span>
            </div>
          </div>
          <div className="gm-sscroll">
            {recent.length > 0 && (
              <div className="gm-recent">
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span
                    className="gm-flab"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Clock width={13} height={13} aria-hidden /> Recently viewed
                  </span>
                  <button
                    type="button"
                    className="gm-link"
                    onClick={onClearRecent}
                    style={{ fontSize: 13 }}
                  >
                    Clear
                  </button>
                </div>
                <div className="gm-rvrow">
                  {recent.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="gm-rv"
                      onClick={r.onOpen}
                      aria-label={`Open ${r.label}`}
                    >
                      <span
                        className="gm-dot"
                        style={{ ["--pc" as string]: r.color, width: 8, height: 8 }}
                      />
                      <span
                        className={r.mono ? "gm-mono" : undefined}
                        style={r.mono ? { fontSize: 12 } : undefined}
                      >
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="gm-flab">Results</span>
              {filtersActive && (
                <button type="button" className="gm-link" onClick={onReset}>
                  Reset filters
                </button>
              )}
            </div>
            {children}
            {empty && (
              <div className="gm-empty">
                <span className="gm-hand">nothing here yet.</span>
                <span>No listings match these filters.</span>
                {filtersActive && (
                  <button
                    type="button"
                    className="gm-btn gm-ghost"
                    onClick={onReset}
                    style={{ minHeight: 44 }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export function SegFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const group = (
    <div className="gm-seg2" role="group" aria-label={label ?? "Show"}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.color && <span className="gm-dot" style={{ ["--pc" as string]: o.color }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
  if (!label) return group;
  return (
    <div className="gm-field">
      <span className="gm-flab">{label}</span>
      {group}
    </div>
  );
}

const kes = (n: number) =>
  n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1_000 ? `${n / 1_000}K` : String(n);

/**
 * A two-handle price slider on the scale for one kind of listing. The left end
 * is "no minimum" and the right end "no maximum". With no kind picked yet there
 * is no single scale, so it asks for one instead.
 */
export function PriceRangeFilter({
  kind,
  value,
  onChange,
  pickFirst,
}: {
  kind: PriceKind | null;
  value: PriceRange;
  onChange: (r: PriceRange) => void;
  /** What to choose before a price can be set, e.g. "sale or lease". */
  pickFirst: string;
}) {
  if (!kind) {
    return (
      <div className="gm-field">
        <span className="gm-flab">Price (KES)</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Choose {pickFirst} to set a price range.
        </span>
      </div>
    );
  }

  const { stops, unit } = PRICE_SCALES[kind];
  const last = stops.length - 1;
  const at = (n: number) => stops.reduce((i, s, j) => (s <= n ? j : i), 0);
  const lo = value.min ? at(value.min) : 0;
  const hi = value.max ? at(value.max) : last;
  const summary =
    lo === 0 && hi === last
      ? "Any price"
      : hi === last
        ? `KES ${kes(stops[lo])}+${unit}`
        : lo === 0
          ? `Up to KES ${kes(stops[hi])}${unit}`
          : `KES ${kes(stops[lo])} – ${kes(stops[hi])}${unit}`;

  return (
    <div className="gm-field">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span className="gm-flab">Price (KES)</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{summary}</span>
      </div>
      <SliderPrimitive.Root
        className="gm-range"
        min={0}
        max={last}
        step={1}
        minStepsBetweenThumbs={1}
        value={[lo, hi]}
        onValueChange={([a, b]) => onChange({ min: stops[a], max: b === last ? 0 : stops[b] })}
      >
        <SliderPrimitive.Track className="gm-range-track">
          <SliderPrimitive.Range className="gm-range-fill" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="gm-range-thumb"
          aria-label="Minimum price"
          aria-valuetext={lo === 0 ? "No minimum" : `KES ${kes(stops[lo])}${unit}`}
        />
        <SliderPrimitive.Thumb
          className="gm-range-thumb"
          aria-label="Maximum price"
          aria-valuetext={hi === last ? "No maximum" : `KES ${kes(stops[hi])}${unit}`}
        />
      </SliderPrimitive.Root>
    </div>
  );
}

export function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  hideLabel?: boolean;
}) {
  return (
    <>
      <label htmlFor={id} className={hideLabel ? "gm-sr" : "gm-flab"}>
        {label}
      </label>
      <select id={id} className="gm-fsel" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}
