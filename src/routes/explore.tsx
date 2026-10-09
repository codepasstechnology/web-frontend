import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { List } from "lucide-react";
import { LandMap } from "@/components/map/LazyMaps";
import type { FlyTarget } from "@/components/LandMap";
import { MapSidebar, SegFilter } from "@/components/MapSidebar";
import { ParcelPanel, RentalPanel } from "@/components/PropertyPanel";
import { ListingCard } from "@/components/map/ListingCard";
import { CompareModal, CompareTray } from "@/components/map/Compare";
import { MapToastOutlet } from "@/components/map/MapToast";
import { useMapToast } from "@/components/map/mapToastContext";
import { MapPageShell } from "@/components/map/MapPageShell";
import { useKnownListings, useRecentlyViewed } from "@/components/map/useMapPage";
import { DEAL_COLOR, DEAL_TAG, INTENT_COLOR, propertyShortLabel } from "@/components/map/markers";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMPARE_MAX } from "@/lib/compare";
import type { LandParcel } from "@/lib/landData";
import type { Bbox } from "@/lib/mapGeo";
import { parcelPrice } from "@/lib/parcelFilters";
import { useMapParcels, useSavedParcels } from "@/lib/parcels";
import {
  formatPrice,
  INTENT_LABELS,
  usePublicProperties,
  useProperty,
  type Property,
} from "@/lib/properties";
import { shareHead, shareQuery } from "@/lib/shareMeta";

type Show = "land" | "rentals";

interface ExploreSearch {
  show?: Show;
  parcel?: string;
  property?: string;
}

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  // Browser-only page; the loader runs on the server for link previews.
  ssr: "data-only",
  validateSearch: (s: Record<string, unknown>): ExploreSearch => ({
    show: s.show === "land" || s.show === "rentals" ? s.show : undefined,
    parcel: typeof s.parcel === "string" ? s.parcel : undefined,
    property: typeof s.property === "string" ? s.property : undefined,
  }),
  loaderDeps: ({ search }) => ({ parcel: search.parcel, property: search.property }),
  loader: ({ deps }) => shareQuery(deps.parcel, deps.property),
  head: ({ loaderData }) => ({
    ...shareHead(loaderData, {
      title: "Explore Map — Geo Pin Properties Kenya",
      description: "Land parcels and rental properties across Kenya on one interactive map.",
    }),
    links: MARKETING_FONT_LINKS,
  }),
});

function ExplorePage() {
  return (
    <MapPageShell>
      <ExploreContent />
    </MapPageShell>
  );
}

function ExploreContent() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useMapToast();
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [hotIds, setHotIds] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const recent = useRecentlyViewed();
  const { savedIds, toggleSaved } = useSavedParcels(!!user);

  const parcelsQuery = useMapParcels(bbox);
  const propertiesQuery = usePublicProperties({}, bbox);
  const parcels = useMemo(() => parcelsQuery.data ?? [], [parcelsQuery.data]);
  const properties = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data]);
  const knownParcels = useKnownListings(parcels);
  const knownProperties = useKnownListings(properties);
  const loading = parcelsQuery.isLoading || propertiesQuery.isLoading;
  const shownParcels = search.show === "rentals" ? [] : parcels;
  const shownProperties = search.show === "land" ? [] : properties;

  const selectedParcel = search.parcel ? knownParcels.get(search.parcel) : undefined;
  // The rentals feed is paginated, so a shared link can name a listing that is not loaded.
  const listedProperty = search.property ? knownProperties.get(search.property) : undefined;
  const { data: fetchedProperty } = useProperty(listedProperty ? undefined : search.property);
  const selectedProperty =
    listedProperty ?? (fetchedProperty?.id === search.property ? fetchedProperty : undefined);
  const selectedId = selectedParcel?.id ?? selectedProperty?.id ?? null;

  const setSearch = (next: Partial<ExploreSearch>) =>
    navigate({ to: "/explore", search: (prev) => ({ ...prev, ...next }), replace: true });

  // A listing fetched by id is not on the map, so centre on it once; the map
  // centres on loaded listings by itself.
  const centredFromLink = useRef(false);
  useEffect(() => {
    if (centredFromLink.current || !fetchedProperty || listedProperty) return;
    centredFromLink.current = true;
    setFlyTarget({ lat: fetchedProperty.position[0], lng: fetchedProperty.position[1], zoom: 16 });
  }, [fetchedProperty, listedProperty]);

  const opened = (id: string) => {
    centredFromLink.current = true;
    setDrawer(false);
    setCompareOpen(false);
    recent.push(id);
  };

  const selectParcel = (p: LandParcel | null) => {
    setSearch({ parcel: p?.id, property: undefined });
    if (!p) return;
    opened(p.id);
    api.post(`/parcels/${p.id}/view`, { source: "direct" }).catch(() => {});
  };

  const selectProperty = (p: Property | null) => {
    setSearch({ property: p?.id, parcel: undefined });
    if (!p) return;
    opened(p.id);
    api.post(`/properties/${p.id}/view`).catch(() => {});
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
  const compared = compareIds.map((id) => knownParcels.get(id)).filter((p): p is LandParcel => !!p);

  const loadError = parcelsQuery.isError || propertiesQuery.isError;
  const retry = () => {
    if (parcelsQuery.isError) parcelsQuery.refetch();
    if (propertiesQuery.isError) propertiesQuery.refetch();
  };

  const recentChips = recent.ids.flatMap((id) => {
    const p = knownParcels.get(id);
    if (p) {
      return [
        {
          id,
          label: p.parcelNumber,
          mono: true,
          color: DEAL_COLOR[p.listingType],
          onOpen: () => selectParcel(p),
        },
      ];
    }
    const r = knownProperties.get(id);
    return r
      ? [
          {
            id,
            label: r.title,
            mono: false,
            color: INTENT_COLOR[r.intent],
            onOpen: () => selectProperty(r),
          },
        ]
      : [];
  });
  const count = shownParcels.length + shownProperties.length;

  return (
    <>
      <MapSidebar
        view="/explore"
        title="Explore the map"
        count={count}
        recent={recentChips}
        onClearRecent={recent.clear}
        filtersActive={!!search.show}
        onReset={() => setSearch({ show: undefined })}
        empty={!loading && count === 0}
        drawerOpen={drawer}
        onCloseDrawer={() => setDrawer(false)}
        filters={
          <SegFilter<"all" | Show>
            value={search.show ?? "all"}
            onChange={(v) => setSearch({ show: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: `All ${parcels.length + properties.length}` },
              { value: "land", label: `Land ${parcels.length}` },
              { value: "rentals", label: `Rentals ${properties.length}` },
            ]}
          />
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
          {shownParcels.map((p) => (
            <li key={`land-${p.id}`}>
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
                seen={recent.ids.includes(p.id) && p.id !== selectedId}
                selected={p.id === selectedId}
                hot={hotIds.includes(p.id)}
                compare={{ on: compareIds.includes(p.id), toggle: () => toggleCompare(p.id) }}
                onSelect={() => selectParcel(p)}
                onHover={(on) => setHotIds(on ? [p.id] : [])}
              />
            </li>
          ))}
          {shownProperties.map((p) => (
            <li key={`rental-${p.id}`}>
              <ListingCard
                title={p.title}
                mono={false}
                sub={`${propertyShortLabel(p)} · ${p.area ? `${p.area}, ` : ""}${p.county}`}
                price={formatPrice(p.price, p.pricePeriod)}
                tag={INTENT_LABELS[p.intent]}
                color={INTENT_COLOR[p.intent]}
                photo={p.photos[0]}
                seen={recent.ids.includes(p.id) && p.id !== selectedId}
                selected={p.id === selectedId}
                hot={hotIds.includes(p.id)}
                onSelect={() => selectProperty(p)}
                onHover={(on) => setHotIds(on ? [p.id] : [])}
              />
            </li>
          ))}
        </ul>
      </MapSidebar>

      <div className="gm-mapwrap" data-panel={!!selectedId}>
        <LandMap
          mode="all"
          // The map frames whatever it gets first, so hold both until both have loaded.
          parcels={loading ? [] : shownParcels}
          properties={loading ? [] : shownProperties}
          onSelectParcel={selectParcel}
          onSelectProperty={selectProperty}
          selectedId={selectedId}
          flyTarget={flyTarget}
          hotIds={hotIds}
          onHover={setHotIds}
          seenIds={recent.ids}
          onBoundsChange={setBbox}
          areaLoading={parcelsQuery.isPlaceholderData || propertiesQuery.isPlaceholderData}
          loadError={loadError}
          retrying={loadError && (parcelsQuery.isFetching || propertiesQuery.isFetching)}
          onRetry={retry}
        />
        <button type="button" className="gm-btn gm-fab" onClick={() => setDrawer(true)}>
          <List width={18} height={18} aria-hidden /> Listings ({count})
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
            onView={selectParcel}
            onClose={() => setCompareOpen(false)}
          />
        )}
        {selectedParcel && (
          <ParcelPanel
            key={selectedParcel.id}
            parcel={selectedParcel}
            onClose={() => selectParcel(null)}
            saved={savedIds.includes(selectedParcel.id)}
            onToggleSaved={() => toggleSaved(selectedParcel.id)}
            page="explore"
            inCompare={compareIds.includes(selectedParcel.id)}
            onToggleCompare={() => toggleCompare(selectedParcel.id)}
          />
        )}
        {selectedProperty && (
          <RentalPanel
            key={selectedProperty.id}
            property={selectedProperty}
            onClose={() => selectProperty(null)}
            page="explore"
          />
        )}
        <MapToastOutlet />
      </div>
    </>
  );
}
