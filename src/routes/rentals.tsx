import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { List, X, SlidersHorizontal } from "lucide-react";
import { LandMap } from "@/components/LandMap";
import { RentalPanel } from "@/components/PropertyPanel";
import {
  usePublicProperties,
  useProperty,
  formatPrice,
  INTENT_LABELS,
  TYPE_LABELS,
  type Property,
  type PropertyFilters,
  type PropertyIntent,
  type PropertyType,
} from "@/lib/properties";
import { kenyaCounties } from "@/lib/plans";
import { api } from "@/lib/api";
import type { FlyTarget } from "@/components/LandMap";

export const Route = createFileRoute("/rentals")({
  component: RentalsPage,
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { property?: string } => ({
    property: typeof s.property === "string" ? s.property : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Rentals Map — Geo Properties Kenya" },
      {
        name: "description",
        content: "Browse verified rental properties across Kenya on an interactive map.",
      },
    ],
  }),
});

function RentalsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PropertyFilters>({ intent: "all", type: "all" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const { data: properties = [], isLoading, isError, refetch } = usePublicProperties(filters);

  // The URL names the open listing. Resolve it from the loaded page when it is
  // there, and fetch it by id when it is not — the feed is paginated and
  // filtered, so a shared link often names a listing this page has not loaded.
  const openId = search.property;
  const fromList = properties.find((p) => p.id === openId);
  const { data: fetched } = useProperty(fromList ? undefined : openId);
  const selected = fromList ?? (fetched?.id === openId ? fetched : null);

  const [listOpen, setListOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    if (p) {
      centredFromLink.current = true;
      setFlyTarget({ lat: p.position[0], lng: p.position[1], zoom: 16 });
      api.post(`/properties/${p.id}/view`).catch(() => {});
    }
  };

  const set = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="relative flex flex-1 overflow-hidden">
        {isMobile && !listOpen && (
          <button
            onClick={() => setListOpen(true)}
            className="absolute left-3 top-3 z-[1100] flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-md md:hidden"
          >
            <List className="h-3.5 w-3.5" /> Listings
          </button>
        )}

        {isMobile && listOpen && (
          <div
            onClick={() => setListOpen(false)}
            className="fixed inset-0 z-[1050] bg-black/40 md:hidden"
          />
        )}

        {(listOpen || !isMobile) && (
          <aside
            className={`${
              isMobile ? "fixed left-0 top-0 z-[1060] h-full w-[85%] max-w-xs" : "relative w-72"
            } flex flex-col overflow-hidden border-r border-border bg-card`}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Property Listings</h3>
                <p className="text-[11px] text-muted-foreground">
                  {isLoading ? "Loading…" : `${properties.length} listings`}
                </p>
              </div>
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                aria-label="Filters"
                className={`ml-auto rounded-md p-1.5 ${
                  filtersOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              {isMobile && (
                <button
                  onClick={() => setListOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {filtersOpen && (
              <div className="grid gap-2 border-b border-border px-4 py-3">
                <select
                  aria-label="Listing type"
                  value={filters.intent ?? "all"}
                  onChange={(e) => set("intent", e.target.value as PropertyIntent | "all")}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="all">Any listing type</option>
                  {Object.entries(INTENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Property type"
                  value={filters.type ?? "all"}
                  onChange={(e) => set("type", e.target.value as PropertyType | "all")}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="all">Any property type</option>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="County"
                  value={filters.county ?? "All"}
                  onChange={(e) => set("county", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="All">Any county</option>
                  {kenyaCounties.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    aria-label="Minimum bedrooms"
                    placeholder="Min beds"
                    value={filters.bedrooms ?? ""}
                    onChange={(e) =>
                      set("bedrooms", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                  />
                  <input
                    type="number"
                    min={0}
                    aria-label="Maximum price"
                    placeholder="Max price"
                    value={filters.maxPrice ?? ""}
                    onChange={(e) =>
                      set("maxPrice", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                  />
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading && (
                <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                  Loading listings…
                </p>
              )}

              {isError && (
                <div className="px-4 py-10 text-center">
                  <p className="text-xs font-medium text-destructive">Could not load listings.</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!isLoading && !isError && properties.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                  No properties match these filters yet.
                </p>
              )}

              <ul>
                {properties.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        handleSelect(p);
                        if (isMobile) setListOpen(false);
                      }}
                      className={`flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left hover:bg-muted ${
                        selected?.id === p.id ? "bg-muted" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground">{p.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.area ? `${p.area}, ` : ""}
                        {p.county}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {formatPrice(p.price, p.pricePeriod)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        <div className="relative flex-1">
          <LandMap
            mode="rentals"
            properties={properties}
            onSelectProperty={handleSelect}
            selectedId={selected?.id ?? null}
            flyTarget={flyTarget}
          />
          {selected && <RentalPanel property={selected} onClose={() => handleSelect(null)} />}
        </div>
      </div>
    </div>
  );
}
