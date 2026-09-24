import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LandMap, type FlyTarget } from "@/components/LandMap";
import { MapSidebar, type Filters } from "@/components/MapSidebar";
import { ParcelPanel } from "@/components/PropertyPanel";
import { MapLegend } from "@/components/MapLegend";
import { MapSearchBar } from "@/components/MapSearchBar";
import { type LandParcel, type LandStatus } from "@/lib/landData";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/land")({
  component: LandPage,
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { parcel?: string; county?: string } => ({
    parcel: typeof s.parcel === "string" ? s.parcel : undefined,
    county: typeof s.county === "string" ? s.county : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Land Parcels Map — Geo Properties Kenya" },
      {
        name: "description",
        content: "Interactive GIS map of plotted, verified land parcels across Kenya.",
      },
    ],
  }),
});

// UUID v4 pattern — real DB parcels have these; static demo parcels have IDs like "LV-001"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ApiParcel {
  id: string;
  title: string;
  parcel_number: string;
  county: string;
  price: number;
  size: string;
  area: string;
  description: string;
  land_type: string;
  listing_type: "sale" | "lease";
  posted_by: "owner" | "broker";
  verified: boolean;
  featured: boolean;
  status: string;
  latitude: number;
  longitude: number;
  boundary: { lat: number; lng: number }[] | null;
  boundary_source: string | null;
  seller_name: string;
  seller_phone: string;
  seller_agency: string;
  photos: string[];
  amenities: {
    school: string | null;
    hospital: string | null;
    shopping: string | null;
    main_road: string | null;
    distance_to_tarmac: string | null;
    utilities: string[];
    development_score: number;
  } | null;
}

function mapApiParcel(p: ApiParcel): LandParcel {
  return {
    id: p.id,
    title: p.parcel_number,
    parcelNumber: p.parcel_number,
    size: p.size || "—",
    price: p.price,
    status: (p.status === "verified" ? "verified" : "available") as LandStatus,
    listingType: p.listing_type,
    postedBy: p.posted_by,
    county: p.county,
    description: p.description || "",
    verified: p.verified,
    featured: p.featured,
    photos: p.photos ?? [],
    seller: {
      name: p.seller_name || "—",
      phone: p.seller_phone || "—",
      agency: p.seller_agency || "",
    },
    amenities: {
      school: p.amenities?.school ?? "—",
      hospital: p.amenities?.hospital ?? "—",
      shopping: p.amenities?.shopping ?? "—",
      mainRoad: p.amenities?.main_road ?? "—",
      distanceToTarmac: p.amenities?.distance_to_tarmac ?? "—",
      utilities: p.amenities?.utilities ?? [],
      developmentScore: p.amenities?.development_score ?? 0,
    },
    polygon:
      p.boundary && p.boundary.length >= 3
        ? p.boundary.map((v): [number, number] => [Number(v.lat), Number(v.lng)])
        : undefined,
    latitude: p.latitude != null ? Number(p.latitude) : undefined,
    longitude: p.longitude != null ? Number(p.longitude) : undefined,
  };
}

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

function LandPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    query: "",
    county: search.county ?? "All",
    status: "all",
    listingType: "all",
    postedBy: "all",
    minPrice: 0,
    maxPrice: 30000000,
  });
  const [selected, setSelected] = useState<LandParcel | null>(null);
  const [dbParcels, setDbParcels] = useState<LandParcel[]>([]);
  const [viewSource] = useState<string>(() => classifyReferrer(document.referrer));
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [openedFromLink, setOpenedFromLink] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    api
      .get<ApiParcel[]>("/parcels")
      .then((data) => {
        const mapped = data.map(mapApiParcel);
        setDbParcels(mapped);
        setSelected((prev) => (prev ? (mapped.find((p) => p.id === prev.id) ?? null) : prev));
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [reloadToken]);

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    api
      .get<string[]>("/user/favorites")
      .then((ids) => setSavedIds(new Set(ids)))
      .catch(() => {});
  }, [user]);

  const toggleSaved = (id: string) => {
    api
      .post<{ saved: boolean }>(`/parcels/${id}/favorite`)
      .then(({ saved }) => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (saved) next.add(id);
          else next.delete(id);
          return next;
        });
      })
      .catch(() => {});
  };

  // Keep the map reasonably fresh without the user having to manually
  // refresh — a background poll plus an immediate refetch when the tab
  // regains focus (e.g. after switching back from another window).
  useEffect(() => {
    const interval = setInterval(() => setReloadToken((n) => n + 1), 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") setReloadToken((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Open the parcel named in the URL once the list has loaded, so a shared
  // /land?parcel=<id> link lands directly on that listing.
  useEffect(() => {
    if (!search.parcel || openedFromLink || dbParcels.length === 0) return;
    setOpenedFromLink(true);
    const p = dbParcels.find((x) => x.id === search.parcel);
    if (!p) return;
    setSelected(p);
    if (p.latitude != null && p.longitude != null) {
      setFlyTarget({ lat: p.latitude, lng: p.longitude, zoom: 16 });
    }
  }, [search.parcel, dbParcels, openedFromLink]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return dbParcels.filter(
      (p) =>
        (q === "" || p.parcelNumber.toLowerCase().includes(q)) &&
        (filters.county === "All" || p.county === filters.county) &&
        (filters.status === "all" || p.status === filters.status) &&
        (filters.listingType === "all" || p.listingType === filters.listingType) &&
        (filters.postedBy === "all" || p.postedBy === filters.postedBy) &&
        p.price >= filters.minPrice &&
        p.price <= filters.maxPrice,
    );
  }, [dbParcels, filters]);

  const handleSelectParcel = (p: LandParcel | null) => {
    setSelected(p);
    navigate({ to: "/land", search: { parcel: p?.id }, replace: true });
    // Fire a view event only for real DB parcels (UUID IDs), with the classified referrer source
    if (p && UUID_RE.test(p.id)) {
      api.post(`/parcels/${p.id}/view`, { source: viewSource }).catch(() => {});
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="relative flex flex-1 overflow-hidden">
        <MapSidebar filters={filters} setFilters={setFilters} count={filtered.length} />
        <div className="relative flex-1">
          <LandMap
            mode="land"
            parcels={filtered}
            onSelectParcel={handleSelectParcel}
            selectedId={selected?.id ?? null}
            flyTarget={flyTarget}
          />
          <MapSearchBar onFly={(lat, lng) => setFlyTarget({ lat, lng, zoom: 14 })} />
          <div className="pointer-events-none absolute bottom-4 left-4 z-10">
            <div className="pointer-events-auto">
              <MapLegend />
            </div>
          </div>
          {!loading && loadError && (
            <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-md border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-md">
              Couldn't load listings.{" "}
              <button
                onClick={() => setReloadToken((n) => n + 1)}
                className="font-medium underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          {selected && (
            <ParcelPanel
              parcel={selected}
              onClose={() => handleSelectParcel(null)}
              saved={savedIds.has(selected.id)}
              onToggleSaved={() => toggleSaved(selected.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
