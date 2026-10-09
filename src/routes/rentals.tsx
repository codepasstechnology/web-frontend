import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { List } from "lucide-react";
import { LandMap } from "@/components/map/LazyMaps";
import type { FlyTarget } from "@/components/LandMap";
import { MapSidebar, SegFilter, SelectFilter } from "@/components/MapSidebar";
import { RentalPanel } from "@/components/PropertyPanel";
import { ListingCard } from "@/components/map/ListingCard";
import { MapToastOutlet } from "@/components/map/MapToast";
import { MapPageShell } from "@/components/map/MapPageShell";
import { useKnownListings, useRecentlyViewed } from "@/components/map/useMapPage";
import { INTENT_COLOR, propertyShortLabel } from "@/components/map/markers";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import {
  usePublicProperties,
  useProperty,
  formatPrice,
  INTENT_LABELS,
  type Property,
  type PropertyIntent,
} from "@/lib/properties";
import type { Bbox } from "@/lib/mapGeo";
import { shareHead, shareQuery } from "@/lib/shareMeta";
import { api } from "@/lib/api";

export const Route = createFileRoute("/rentals")({
  component: RentalsPage,
  // Browser-only page; the loader runs on the server for link previews.
  ssr: "data-only",
  validateSearch: (s: Record<string, unknown>): { property?: string } => ({
    property: typeof s.property === "string" ? s.property : undefined,
  }),
  loaderDeps: ({ search }) => ({ property: search.property }),
  loader: ({ deps }) => shareQuery(undefined, deps.property),
  head: ({ loaderData }) => ({
    ...shareHead(loaderData, {
      title: "Rentals Map — Geo Pin Properties Kenya",
      description: "Browse verified rental properties across Kenya on an interactive map.",
    }),
    links: MARKETING_FONT_LINKS,
  }),
});

type Beds = "all" | "0" | "1" | "2" | "3";

const matchesBeds = (p: Property, beds: Beds) =>
  beds === "all" || (beds === "3" ? p.bedrooms >= 3 : p.bedrooms === Number(beds));

function RentalsPage() {
  return (
    <MapPageShell>
      <RentalsContent />
    </MapPageShell>
  );
}

function RentalsContent() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [intent, setIntent] = useState<PropertyIntent | "all">("all");
  const [beds, setBeds] = useState<Beds>("all");
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [hotIds, setHotIds] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const recent = useRecentlyViewed();
  const query = usePublicProperties({ intent }, bbox);
  const loaded = useMemo(() => query.data ?? [], [query.data]);
  const known = useKnownListings(loaded);
  const properties = useMemo(() => loaded.filter((p) => matchesBeds(p, beds)), [loaded, beds]);

  // The URL names the open listing. Resolve it from what has loaded when it
  // is there, and fetch it by id when it is not — the feed is paginated and
  // filtered, so a shared link often names a listing this page has not loaded.
  const openId = search.property;
  const fromList = openId ? known.get(openId) : undefined;
  const { data: fetched } = useProperty(fromList ? undefined : openId);
  const selected = fromList ?? (fetched?.id === openId ? fetched : null);

  // Centre the map on a listing opened from a shared link, once — without the
  // guard every re-render would yank the map back and the viewer could not pan.
  const centredFromLink = useRef(false);
  useEffect(() => {
    if (centredFromLink.current || !selected) return;
    centredFromLink.current = true;
    setFlyTarget({ lat: selected.position[0], lng: selected.position[1], zoom: 16 });
    api.post(`/properties/${selected.id}/view`).catch(() => {});
  }, [selected]);

  const handleSelect = (p: Property | null) => {
    navigate({ to: "/rentals", search: { property: p?.id }, replace: true });
    if (!p) return;
    centredFromLink.current = true;
    setDrawer(false);
    recent.push(p.id);
    api.post(`/properties/${p.id}/view`).catch(() => {});
  };

  const recentChips = recent.ids
    .map((id) => known.get(id))
    .filter((p): p is Property => !!p)
    .map((p) => ({
      id: p.id,
      label: p.title,
      mono: false,
      color: INTENT_COLOR[p.intent],
      onOpen: () => handleSelect(p),
    }));
  const filtersActive = intent !== "all" || beds !== "all";

  return (
    <>
      <MapSidebar
        view="/rentals"
        title="Rentals and homes"
        count={properties.length}
        recent={recentChips}
        onClearRecent={recent.clear}
        filtersActive={filtersActive}
        onReset={() => {
          setIntent("all");
          setBeds("all");
        }}
        empty={!query.isLoading && properties.length === 0}
        drawerOpen={drawer}
        onCloseDrawer={() => setDrawer(false)}
        filters={
          <>
            <SegFilter
              label="Listing type"
              value={intent}
              onChange={setIntent}
              options={[
                { value: "all", label: "All" },
                { value: "rent", label: "Rent", color: INTENT_COLOR.rent },
                { value: "sale", label: "Sale", color: INTENT_COLOR.sale },
                { value: "bnb", label: "BnB", color: INTENT_COLOR.bnb },
              ]}
            />
            <div className="gm-field">
              <SelectFilter
                id="f-beds"
                label="Bedrooms"
                value={beds}
                onChange={(v) => setBeds(v as Beds)}
                options={[
                  { value: "all", label: "Any" },
                  { value: "0", label: "Bedsitter / studio" },
                  { value: "1", label: "1 bedroom" },
                  { value: "2", label: "2 bedrooms" },
                  { value: "3", label: "3 or more" },
                ]}
              />
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
          {properties.map((p) => (
            <li key={p.id}>
              <ListingCard
                title={p.title}
                mono={false}
                sub={`${propertyShortLabel(p)} · ${p.area ? `${p.area}, ` : ""}${p.county}`}
                price={formatPrice(p.price, p.pricePeriod)}
                tag={INTENT_LABELS[p.intent]}
                color={INTENT_COLOR[p.intent]}
                photo={p.photos[0]}
                seen={recent.ids.includes(p.id) && p.id !== selected?.id}
                selected={p.id === selected?.id}
                hot={hotIds.includes(p.id)}
                onSelect={() => handleSelect(p)}
                onHover={(on) => setHotIds(on ? [p.id] : [])}
              />
            </li>
          ))}
        </ul>
      </MapSidebar>

      <div className="gm-mapwrap" data-panel={!!selected}>
        <LandMap
          mode="rentals"
          properties={properties}
          onSelectProperty={handleSelect}
          selectedId={selected?.id ?? null}
          flyTarget={flyTarget}
          hotIds={hotIds}
          onHover={setHotIds}
          seenIds={recent.ids}
          onBoundsChange={setBbox}
          areaLoading={query.isPlaceholderData}
          loadError={query.isError}
          retrying={query.isError && query.isFetching}
          onRetry={() => query.refetch()}
        />
        <button type="button" className="gm-btn gm-fab" onClick={() => setDrawer(true)}>
          <List width={18} height={18} aria-hidden /> Listings ({properties.length})
        </button>
        {selected && (
          <RentalPanel key={selected.id} property={selected} onClose={() => handleSelect(null)} />
        )}
        <MapToastOutlet />
      </div>
    </>
  );
}
