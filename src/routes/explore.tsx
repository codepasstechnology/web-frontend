import { ListingLoadStatus } from "@/components/map/ListingLoadStatus";
import { preloadMap } from "@/lib/mapPreload";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { List } from "lucide-react";
import { LandMap } from "@/components/map/LazyMaps";
import { MapFilterMenu } from "@/components/map/MapFilterMenu";
import { MapSidebar, PriceRangeFilter, SegFilter, SelectFilter } from "@/components/MapSidebar";
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
import type { LandParcel, ListingType } from "@/lib/landData";
import type { ListingAgency } from "@/lib/listingAgency";
import type { Bbox } from "@/lib/mapGeo";
import { parcelPrice } from "@/lib/parcelFilters";
import { ANY_PRICE, HOME_PRICE_KIND, inRange, LAND_PRICE_KIND } from "@/lib/priceRanges";
import { useMapParcels, useSavedParcels, useParcel, useParcelDetails } from "@/lib/parcels";
import {
  formatPrice,
  INTENT_LABELS,
  usePublicProperties,
  useProperty,
  type Property,
  type PropertyIntent,
} from "@/lib/properties";
import { shareHead, shareQuery } from "@/lib/shareMeta";

type Show = "land" | "rentals";
type ListedBy = "all" | "agency" | "owner";

/** Whether a listing passes the "Listed by" filter; `agencySlug` narrows it to one agency. */
function listedBy(agency: ListingAgency | null | undefined, by: ListedBy, agencySlug: string) {
  if (by === "all") return true;
  if (by === "owner") return !agency;
  return !!agency && (agencySlug === "" || agency.slug === agencySlug);
}

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
  loader: ({ deps }) => {
    preloadMap();
    return shareQuery(deps.parcel, deps.property);
  },
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
  const [hotIds, setHotIds] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [landType, setLandType] = useState<ListingType | "all">("all");
  const [homeIntent, setHomeIntent] = useState<PropertyIntent | "all">("all");
  // Each price is on the scale of the chosen type, so changing type clears it.
  const [landPrice, setLandPrice] = useState(ANY_PRICE);
  const [homePrice, setHomePrice] = useState(ANY_PRICE);
  const [by, setBy] = useState<ListedBy>("all");
  const [agencySlug, setAgencySlug] = useState("");
  const recent = useRecentlyViewed();
  const { savedIds, toggleSaved } = useSavedParcels(!!user);

  const parcelsQuery = useMapParcels(bbox);
  const propertiesQuery = usePublicProperties({}, bbox, true);
  const parcels = useMemo(() => parcelsQuery.data ?? [], [parcelsQuery.data]);
  const properties = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data]);
  const knownParcels = useKnownListings(parcels);
  const knownProperties = useKnownListings(properties);
  const loading = parcelsQuery.isLoading || propertiesQuery.isLoading;
  const shownParcels = useMemo(
    () =>
      search.show === "rentals"
        ? []
        : parcels.filter(
            (p) =>
              listedBy(p.agency, by, agencySlug) &&
              (landType === "all" || (p.listingType === landType && inRange(p.price, landPrice))),
          ),
    [parcels, search.show, landType, landPrice, by, agencySlug],
  );
  const shownProperties = useMemo(
    () =>
      search.show === "land"
        ? []
        : properties.filter(
            (p) =>
              listedBy(p.agency, by, agencySlug) &&
              (homeIntent === "all" || (p.intent === homeIntent && inRange(p.price, homePrice))),
          ),
    [properties, search.show, homeIntent, homePrice, by, agencySlug],
  );
  // The agencies with listings in the current map view, for the agency picker.
  const agencies = useMemo(() => {
    const seen = new Map<string, string>();
    for (const l of [...parcels, ...properties])
      if (l.agency) seen.set(l.agency.slug, l.agency.name);
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [parcels, properties]);
  const filtersActive = !!search.show || landType !== "all" || homeIntent !== "all" || by !== "all";
  const chooseLand = (t: ListingType | "all") => {
    setLandType(t);
    setLandPrice(ANY_PRICE);
  };
  const chooseHome = (i: PropertyIntent | "all") => {
    setHomeIntent(i);
    setHomePrice(ANY_PRICE);
  };
  const chooseBy = (b: ListedBy) => {
    setBy(b);
    setAgencySlug("");
  };
  const resetFilters = () => {
    setSearch({ show: undefined });
    chooseBy("all");
    chooseLand("all");
    chooseHome("all");
  };

  const parcelDetail = useParcel(search.parcel);
  const selectedParcel = parcelDetail.data;
  const comparison = useParcelDetails(compareOpen ? compareIds : []);
  const comparisonReady = comparison.length > 0 && comparison.every((q) => q.isSuccess);
  // The rentals feed is paginated, so a shared link can name a listing that is not loaded.
  const propertyDetail = useProperty(search.property);
  const fetchedProperty = propertyDetail.data;
  const selectedProperty = fetchedProperty;
  const selectedId = search.parcel ?? search.property ?? null;

  const setSearch = (next: Partial<ExploreSearch>) =>
    navigate({ to: "/explore", search: (prev) => ({ ...prev, ...next }), replace: true });

  const opened = (id: string) => {
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
        filtersActive={filtersActive}
        onReset={resetFilters}
        empty={!loading && count === 0}
        drawerOpen={drawer}
        onCloseDrawer={() => setDrawer(false)}
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
                agency={p.agency}
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
                agency={p.agency}
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
          focusedParcel={selectedParcel}
          focusedProperty={selectedProperty}
          hotIds={hotIds}
          onHover={setHotIds}
          seenIds={recent.ids}
          onBoundsChange={setBbox}
          areaLoading={parcelsQuery.isPlaceholderData || propertiesQuery.isPlaceholderData}
          loadError={loadError}
          retrying={loadError && (parcelsQuery.isFetching || propertiesQuery.isFetching)}
          onRetry={retry}
        />
        <MapFilterMenu active={filtersActive} count={count} onReset={resetFilters}>
          <SegFilter<"all" | Show>
            value={search.show ?? "all"}
            onChange={(v) => setSearch({ show: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: `All ${parcels.length + properties.length}` },
              { value: "land", label: `Land ${parcels.length}` },
              { value: "rentals", label: `Rentals ${properties.length}` },
            ]}
          />
          <SegFilter
            label="Listed by"
            value={by}
            onChange={chooseBy}
            options={[
              { value: "all", label: "Anyone" },
              { value: "agency", label: "Agencies" },
              { value: "owner", label: "Owners" },
            ]}
          />
          {by === "agency" && agencies.length > 0 && (
            <div className="gm-field">
              <SelectFilter
                id="explore-agency"
                label="Agency"
                value={agencySlug}
                onChange={setAgencySlug}
                options={[
                  { value: "", label: "Any agency" },
                  ...agencies.map(([slug, name]) => ({ value: slug, label: name })),
                ]}
              />
            </div>
          )}
          {search.show !== "rentals" && (
            <>
              <SegFilter
                label="Land"
                value={landType}
                onChange={chooseLand}
                options={[
                  { value: "all", label: "All" },
                  { value: "sale", label: "For sale", color: DEAL_COLOR.sale },
                  { value: "lease", label: "For lease", color: DEAL_COLOR.lease },
                ]}
              />
              <PriceRangeFilter
                kind={landType === "all" ? null : LAND_PRICE_KIND[landType]}
                value={landPrice}
                onChange={setLandPrice}
                pickFirst="for sale or for lease"
              />
            </>
          )}
          {search.show !== "land" && (
            <>
              <SegFilter
                label="Homes"
                value={homeIntent}
                onChange={chooseHome}
                options={[
                  { value: "all", label: "All" },
                  { value: "rent", label: "Rent", color: INTENT_COLOR.rent },
                  { value: "sale", label: "Sale", color: INTENT_COLOR.sale },
                  { value: "bnb", label: "BnB", color: INTENT_COLOR.bnb },
                ]}
              />
              <PriceRangeFilter
                kind={homeIntent === "all" ? null : HOME_PRICE_KIND[homeIntent]}
                value={homePrice}
                onChange={setHomePrice}
                pickFirst="rent, sale or BnB"
              />
            </>
          )}
        </MapFilterMenu>
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
        {compareOpen && comparisonReady && (
          <CompareModal
            parcels={comparison.map((q) => q.data!)}
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
        {search.parcel && (
          <ListingLoadStatus query={parcelDetail} onClose={() => selectParcel(null)} />
        )}
        {search.property && (
          <ListingLoadStatus query={propertyDetail} onClose={() => selectProperty(null)} />
        )}
        {compareOpen &&
          comparison.map((q, i) => (
            <ListingLoadStatus
              key={compareIds[i]}
              query={q}
              onClose={() => setCompareOpen(false)}
            />
          ))}
        <MapToastOutlet />
      </div>
    </>
  );
}
