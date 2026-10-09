import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { LandMap } from "@/components/map/LazyMaps";
import { MapSidebar, SegFilter, SelectFilter } from "@/components/MapSidebar";
import { ParcelPanel } from "@/components/PropertyPanel";
import { ListingCard } from "@/components/map/ListingCard";
import { CompareModal, CompareTray } from "@/components/map/Compare";
import { MapToastOutlet } from "@/components/map/MapToast";
import { useMapToast } from "@/components/map/mapToastContext";
import { MapPageShell } from "@/components/map/MapPageShell";
import { useKnownListings, useRecentlyViewed } from "@/components/map/useMapPage";
import { DEAL_COLOR, DEAL_TAG } from "@/components/map/markers";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import type { LandParcel } from "@/lib/landData";
import { useMapParcels, useSavedParcels } from "@/lib/parcels";
import {
  DEFAULT_FILTERS,
  filtersActive as anyFilter,
  matchesFilters,
  parcelPrice,
  type Filters,
} from "@/lib/parcelFilters";
import { shareHead, shareQuery } from "@/lib/shareMeta";
import { COMPARE_MAX } from "@/lib/compare";
import type { Bbox } from "@/lib/mapGeo";
import { kenyaCounties } from "@/lib/plans";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/land")({
  component: LandPage,
  // The page itself is browser-only (Leaflet), but the loader runs on the
  // server so a shared ?parcel= link carries the plot's preview image.
  ssr: "data-only",
  validateSearch: (s: Record<string, unknown>): { parcel?: string; county?: string } => ({
    parcel: typeof s.parcel === "string" ? s.parcel : undefined,
    county: typeof s.county === "string" ? s.county : undefined,
  }),
  loaderDeps: ({ search }) => ({ parcel: search.parcel }),
  loader: ({ deps }) => shareQuery(deps.parcel),
  head: ({ loaderData }) => ({
    ...shareHead(loaderData, {
      title: "Land Parcels Map — Geo Pin Properties Kenya",
      description: "Interactive GIS map of plotted, verified land parcels across Kenya.",
    }),
    links: MARKETING_FONT_LINKS,
  }),
});

// UUID v4 pattern — real DB parcels have these; static demo parcels have IDs like "LV-001"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function classifyReferrer(ref: string): "direct" | "search" | "social" | "referral" {
  if (!ref || ref.startsWith(window.location.origin)) return "direct";
  try {
    const host = new URL(ref).hostname;
    if (/google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\./.test(host)) return "search";
    if (/facebook\.|twitter\.|instagram\.|whatsapp\.|linkedin\.|tiktok\./.test(host))
      return "social";
    return "referral";
  } catch {
    return "direct";
  }
}

const PRICE_STEPS = [0, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000];
const priceLabel = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1000}K`);

function LandPage() {
  return (
    <MapPageShell>
      <LandContent />
    </MapPageShell>
  );
}

function LandContent() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useMapToast();
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    county: search.county ?? "All",
  });
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [hotIds, setHotIds] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [viewSource] = useState(() => classifyReferrer(document.referrer));
  const recent = useRecentlyViewed();
  const { savedIds, toggleSaved } = useSavedParcels(!!user);

  // Keep the map reasonably fresh without the user having to refresh: a
  // background poll, plus React Query's refetch when the tab regains focus.
  const parcelsQuery = useMapParcels(bbox, 60_000);
  const parcels = useMemo(() => parcelsQuery.data ?? [], [parcelsQuery.data]);
  const known = useKnownListings(parcels);

  const filtered = useMemo(
    () => parcels.filter((p) => matchesFilters(p, filters)),
    [parcels, filters],
  );
  const filtersActive = anyFilter(filters);
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const selected = search.parcel ? (known.get(search.parcel) ?? null) : null;

  const select = (p: LandParcel | null) => {
    navigate({ to: "/land", search: { parcel: p?.id }, replace: true });
    if (!p) return;
    setDrawer(false);
    setCompareOpen(false);
    recent.push(p.id);
    // Fire a view event only for real DB parcels (UUID IDs), with the classified referrer source
    if (UUID_RE.test(p.id)) {
      api.post(`/parcels/${p.id}/view`, { source: viewSource }).catch(() => {});
    }
  };

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((x) => x !== id));
    } else if (compareIds.length >= COMPARE_MAX) {
      toast(`You can compare up to ${COMPARE_MAX} plots`);
    } else {
      setCompareIds([...compareIds, id]);
    }
  };
  const compared = compareIds.map((id) => known.get(id)).filter((p): p is LandParcel => !!p);

  const recentChips = recent.ids
    .map((id) => known.get(id))
    .filter((p): p is LandParcel => !!p)
    .map((p) => ({
      id: p.id,
      label: p.parcelNumber,
      mono: true,
      color: DEAL_COLOR[p.listingType],
      onOpen: () => select(p),
    }));

  return (
    <>
      <MapSidebar
        view="/land"
        title="Land"
        count={filtered.length}
        recent={recentChips}
        onClearRecent={recent.clear}
        filtersActive={filtersActive}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        empty={!parcelsQuery.isLoading && filtered.length === 0}
        drawerOpen={drawer}
        onCloseDrawer={() => setDrawer(false)}
        filters={
          <>
            <div className="gm-field">
              <label htmlFor="f-pn" className="gm-flab">
                Parcel number
              </label>
              <input
                id="f-pn"
                type="search"
                className="gm-input"
                placeholder="e.g. KAJ/KTG/4521"
                value={filters.query}
                onChange={(e) => set("query", e.target.value)}
              />
            </div>
            <div className="gm-field">
              <SelectFilter
                id="f-county"
                label="County"
                value={filters.county}
                onChange={(v) => set("county", v)}
                options={[
                  { value: "All", label: "All 47 counties" },
                  ...kenyaCounties.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
            <SegFilter
              label="Status"
              value={filters.status}
              onChange={(v) => set("status", v)}
              options={[
                { value: "all", label: "All" },
                { value: "verified", label: "Verified" },
                { value: "available", label: "Available" },
              ]}
            />
            <SegFilter
              label="Sale or lease"
              value={filters.listingType}
              onChange={(v) => set("listingType", v)}
              options={[
                { value: "all", label: "All" },
                { value: "sale", label: "Sale", color: DEAL_COLOR.sale },
                { value: "lease", label: "Lease", color: DEAL_COLOR.lease },
              ]}
            />
            <SegFilter
              label="Posted by"
              value={filters.postedBy}
              onChange={(v) => set("postedBy", v)}
              options={[
                { value: "all", label: "Anyone" },
                { value: "owner", label: "Owner" },
                { value: "broker", label: "Broker" },
              ]}
            />
            <div className="gm-field">
              <span className="gm-flab">Price (KES)</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SelectFilter
                  id="f-min"
                  label="Minimum price"
                  hideLabel
                  value={String(filters.minPrice)}
                  onChange={(v) => set("minPrice", Number(v))}
                  options={PRICE_STEPS.map((n) => ({
                    value: String(n),
                    label: n ? priceLabel(n) : "No min",
                  }))}
                />
                <span style={{ color: "var(--muted)" }}>to</span>
                <SelectFilter
                  id="f-max"
                  label="Maximum price"
                  hideLabel
                  value={String(filters.maxPrice)}
                  onChange={(v) => set("maxPrice", Number(v))}
                  options={PRICE_STEPS.map((n) => ({
                    value: String(n),
                    label: n ? priceLabel(n) : "No max",
                  }))}
                />
              </div>
            </div>
          </>
        }
      >
        <ul
          aria-label="Listings"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <li key={p.id}>
              <ListingCard
                title={p.parcelNumber}
                mono
                sub={`${p.size} · ${p.area ? `${p.area}, ` : ""}${p.county}`}
                price={parcelPrice(p)}
                tag={DEAL_TAG[p.listingType]}
                color={DEAL_COLOR[p.listingType]}
                photo={p.photos?.[0]}
                verified={p.status === "verified"}
                approx={!p.polygon}
                seen={recent.ids.includes(p.id) && p.id !== selected?.id}
                selected={p.id === selected?.id}
                hot={hotIds.includes(p.id)}
                compare={{ on: compareIds.includes(p.id), toggle: () => toggleCompare(p.id) }}
                onSelect={() => select(p)}
                onHover={(on) => setHotIds(on ? [p.id] : [])}
              />
            </li>
          ))}
        </ul>
      </MapSidebar>

      <div className="gm-mapwrap" data-panel={!!selected}>
        <LandMap
          mode="land"
          parcels={filtered}
          onSelectParcel={select}
          selectedId={selected?.id ?? null}
          hotIds={hotIds}
          onHover={setHotIds}
          seenIds={recent.ids}
          onBoundsChange={setBbox}
          areaLoading={parcelsQuery.isPlaceholderData}
          loadError={parcelsQuery.isError}
          retrying={parcelsQuery.isError && parcelsQuery.isFetching}
          onRetry={() => parcelsQuery.refetch()}
        />
        <button type="button" className="gm-btn gm-fab" onClick={() => setDrawer(true)}>
          <SlidersHorizontal width={18} height={18} aria-hidden /> Filters ({filtered.length})
        </button>
        {compared.length > 0 && !compareOpen && (
          <CompareTray
            parcels={compared}
            onRemove={toggleCompare}
            onOpen={() => setCompareOpen(true)}
            onClear={() => setCompareIds([])}
          />
        )}
        {compareOpen && compared.length > 0 && (
          <CompareModal
            parcels={compared}
            onRemove={toggleCompare}
            onView={select}
            onClose={() => setCompareOpen(false)}
          />
        )}
        {selected && (
          <ParcelPanel
            key={selected.id}
            parcel={selected}
            onClose={() => select(null)}
            saved={savedIds.includes(selected.id)}
            onToggleSaved={() => toggleSaved(selected.id)}
            page="land"
            inCompare={compareIds.includes(selected.id)}
            onToggleCompare={() => toggleCompare(selected.id)}
          />
        )}
        <MapToastOutlet />
      </div>
    </>
  );
}
