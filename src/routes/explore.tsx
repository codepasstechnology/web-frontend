import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { List, X } from "lucide-react";
import { LandMap, type FlyTarget } from "@/components/LandMap";
import { MapLegend } from "@/components/MapLegend";
import { MapSearchBar } from "@/components/MapSearchBar";
import { ParcelPanel, RentalPanel } from "@/components/PropertyPanel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { type LandParcel } from "@/lib/landData";
import { useMapParcels } from "@/lib/parcels";
import { formatPrice, usePublicProperties, useProperty, type Property } from "@/lib/properties";

type Show = "land" | "rentals";

interface ExploreSearch {
  show?: Show;
  parcel?: string;
  property?: string;
}

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  ssr: false,
  validateSearch: (s: Record<string, unknown>): ExploreSearch => ({
    show: s.show === "land" || s.show === "rentals" ? s.show : undefined,
    parcel: typeof s.parcel === "string" ? s.parcel : undefined,
    property: typeof s.property === "string" ? s.property : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore Map — Geo Pin Properties Kenya" },
      {
        name: "description",
        content: "Land parcels and rental properties across Kenya on one interactive map.",
      },
    ],
  }),
});

function ExplorePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const parcelsQuery = useMapParcels();
  const propertiesQuery = usePublicProperties();
  const parcels = parcelsQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const loading = parcelsQuery.isLoading || propertiesQuery.isLoading;
  const shownParcels = search.show === "rentals" ? [] : parcels;
  const shownProperties = search.show === "land" ? [] : properties;

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [listOpen, setListOpen] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const selectedParcel = search.parcel ? parcels.find((p) => p.id === search.parcel) : undefined;
  // The rentals feed is paginated, so a shared link can name a listing that is not loaded.
  const listedProperty = properties.find((p) => p.id === search.property);
  const { data: fetchedProperty } = useProperty(listedProperty ? undefined : search.property);
  const selectedProperty =
    listedProperty ?? (fetchedProperty?.id === search.property ? fetchedProperty : undefined);

  const setSearch = (next: Partial<ExploreSearch>) =>
    navigate({ to: "/explore", search: (prev) => ({ ...prev, ...next }), replace: true });

  // Centre once on a listing opened from a shared link; after that the viewer pans freely.
  const centredFromLink = useRef(false);

  const selectParcel = (p: LandParcel | null) => {
    centredFromLink.current = true;
    setSearch({ parcel: p?.id, property: undefined });
    if (p) api.post(`/parcels/${p.id}/view`, { source: "direct" }).catch(() => {});
  };

  const selectProperty = (p: Property | null) => {
    centredFromLink.current = true;
    setSearch({ property: p?.id, parcel: undefined });
    if (p) api.post(`/properties/${p.id}/view`).catch(() => {});
  };

  useEffect(() => {
    if (centredFromLink.current) return;
    const target = selectedParcel
      ? selectedParcel.latitude != null && selectedParcel.longitude != null
        ? { lat: selectedParcel.latitude, lng: selectedParcel.longitude }
        : null
      : selectedProperty
        ? { lat: selectedProperty.position[0], lng: selectedProperty.position[1] }
        : null;
    if (!target) return;
    centredFromLink.current = true;
    setFlyTarget({ ...target, zoom: 16 });
  }, [selectedParcel, selectedProperty]);

  const loadError = parcelsQuery.isError || propertiesQuery.isError;
  const retry = () => {
    if (parcelsQuery.isError) parcelsQuery.refetch();
    if (propertiesQuery.isError) propertiesQuery.refetch();
  };

  const pick = (select: () => void) => {
    select();
    if (isMobile) setListOpen(false);
  };
  const rowClass = (selected: boolean) =>
    `flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none ${
      selected ? "bg-muted" : ""
    }`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-1px)] flex-col bg-background sm:h-[calc(100dvh-4rem-1px)]">
      <div className="relative flex flex-1 overflow-hidden">
        {isMobile && !listOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setListOpen(true)}
            className="absolute left-3 top-3 z-[1100] bg-card shadow-md"
          >
            <List /> Listings
          </Button>
        )}

        {isMobile && listOpen && (
          <div onClick={() => setListOpen(false)} className="fixed inset-0 z-[1050] bg-black/40" />
        )}

        {(listOpen || !isMobile) && (
          <aside
            className={`${
              isMobile ? "fixed left-0 top-0 z-[1060] h-full w-[85%] max-w-xs" : "relative w-72"
            } flex flex-col overflow-hidden border-r border-border bg-card`}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">Listings</h3>
                <p className="text-[11px] text-muted-foreground">
                  {loading
                    ? "Loading…"
                    : `${shownParcels.length + shownProperties.length} listings`}
                </p>
              </div>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close listings"
                  onClick={() => setListOpen(false)}
                  className="ml-auto h-8 w-8"
                >
                  <X />
                </Button>
              )}
            </div>

            <div className="border-b border-border px-4 py-3">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={search.show ?? "all"}
                onValueChange={(v) =>
                  v && setSearch({ show: v === "all" ? undefined : (v as Show) })
                }
                aria-label="Show listings"
                className="grid grid-cols-3"
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="land">Land {parcels.length}</ToggleGroupItem>
                <ToggleGroupItem value="rentals">Rentals {properties.length}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                  Loading listings…
                </p>
              ) : shownParcels.length + shownProperties.length === 0 ? (
                <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                  No listings yet.
                </p>
              ) : (
                <ul aria-label="Listings">
                  {shownParcels.map((p) => (
                    <li key={`land-${p.id}`}>
                      <button
                        type="button"
                        onClick={() => pick(() => selectParcel(p))}
                        className={rowClass(selectedParcel?.id === p.id)}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{p.parcelNumber}</span>
                          <Badge variant="success">Land</Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">{p.county}</span>
                        <span className="text-xs font-semibold">
                          KES {p.price.toLocaleString()}
                        </span>
                      </button>
                    </li>
                  ))}
                  {shownProperties.map((p) => (
                    <li key={`rental-${p.id}`}>
                      <button
                        type="button"
                        onClick={() => pick(() => selectProperty(p))}
                        className={rowClass(selectedProperty?.id === p.id)}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{p.title}</span>
                          <Badge variant="secondary">Rental</Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.area ? `${p.area}, ` : ""}
                          {p.county}
                        </span>
                        <span className="text-xs font-semibold">
                          {formatPrice(p.price, p.pricePeriod)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}

        <div className="relative flex-1">
          <LandMap
            mode="all"
            // The map frames whatever it gets first, so hold both until both have loaded.
            parcels={loading ? [] : shownParcels}
            properties={loading ? [] : shownProperties}
            onSelectParcel={selectParcel}
            onSelectProperty={selectProperty}
            selectedId={selectedParcel?.id ?? selectedProperty?.id ?? null}
            flyTarget={flyTarget}
          />
          <MapSearchBar onFly={(lat, lng) => setFlyTarget({ lat, lng, zoom: 14 })} />

          <div className="pointer-events-none absolute bottom-4 left-4 z-[800]">
            <div className="pointer-events-auto">
              <MapLegend kinds />
            </div>
          </div>

          {loadError && (
            <Alert
              variant="destructive"
              className="absolute left-1/2 top-16 z-[1000] w-auto -translate-x-1/2 bg-card shadow-md"
            >
              <AlertDescription className="flex items-center gap-3">
                Couldn&apos;t load listings.
                <Button size="sm" variant="outline" onClick={retry}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {selectedParcel && (
            <ParcelPanel
              parcel={selectedParcel}
              onClose={() => selectParcel(null)}
              saved={false}
              onToggleSaved={() =>
                user
                  ? navigate({ to: "/land", search: { parcel: selectedParcel.id } })
                  : navigate({ to: "/login" })
              }
            />
          )}
          {selectedProperty && (
            <RentalPanel property={selectedProperty} onClose={() => selectProperty(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
