import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { LandMap, type FlyTarget } from "@/components/LandMap";
import { MapSidebar, type Filters } from "@/components/MapSidebar";
import { ParcelPanel } from "@/components/PropertyPanel";
import { MapLegend } from "@/components/MapLegend";
import { MapSearchBar } from "@/components/MapSearchBar";
import { landParcels as staticParcels, type LandParcel, type LandStatus } from "@/lib/landData";
import { api } from "@/lib/api";

export const Route = createFileRoute("/land")({
  component: LandPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Land Parcels Map — LandVerify Kenya" },
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
  status: string;
  latitude: number;
  longitude: number;
  seller_name: string;
  seller_phone: string;
  seller_agency: string;
}

// Generate a 4-point polygon around a lat/lng point, same formula as landData.ts
function makePolygon(lat: number, lng: number): [number, number][] {
  const dLat = 0.0035,
    dLng = 0.0045,
    skew = 0.18;
  const sx = dLng * skew,
    sy = dLat * skew;
  return [
    [lat - dLat + sy * 0.4, lng - dLng - sx * 0.2],
    [lat - dLat - sy * 0.6, lng + dLng + sx * 0.3],
    [lat + dLat - sy * 0.2, lng + dLng - sx * 0.5],
    [lat + dLat + sy * 0.5, lng - dLng + sx * 0.4],
  ];
}

function mapApiParcel(p: ApiParcel): LandParcel {
  return {
    id: p.id,
    title: p.title,
    parcelNumber: p.parcel_number,
    size: p.size || "—",
    price: p.price,
    status: (p.status === "verified" ? "verified" : "available") as LandStatus,
    listingType: p.listing_type,
    postedBy: p.posted_by,
    county: p.county,
    description: p.description || "",
    verified: p.verified,
    seller: {
      name: p.seller_name || "—",
      phone: p.seller_phone || "—",
      agency: p.seller_agency || "",
    },
    amenities: {
      school: "—",
      hospital: "—",
      shopping: "—",
      mainRoad: "—",
      distanceToTarmac: "—",
      utilities: [],
      developmentScore: 0,
    },
    polygon: makePolygon(p.latitude, p.longitude),
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
  const [filters, setFilters] = useState<Filters>({
    county: "All",
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

  // Fetch real parcels from backend; static demo parcels fill the rest
  useEffect(() => {
    api
      .get<ApiParcel[]>("/parcels")
      .then((data) => setDbParcels(data.map(mapApiParcel)))
      .catch(() => {});
  }, []);

  // Merge: real DB parcels first, then any static demo parcels whose ID isn't in the DB set
  const allParcels = useMemo(() => {
    const dbIds = new Set(dbParcels.map((p) => p.id));
    return [...dbParcels, ...staticParcels.filter((p) => !dbIds.has(p.id))];
  }, [dbParcels]);

  const filtered = useMemo(
    () =>
      allParcels.filter(
        (p) =>
          (filters.county === "All" || p.county === filters.county) &&
          (filters.status === "all" || p.status === filters.status) &&
          (filters.listingType === "all" || p.listingType === filters.listingType) &&
          (filters.postedBy === "all" || p.postedBy === filters.postedBy) &&
          p.price >= filters.minPrice &&
          p.price <= filters.maxPrice,
      ),
    [allParcels, filters],
  );

  const handleSelectParcel = (p: LandParcel | null) => {
    setSelected(p);
    // Fire a view event only for real DB parcels (UUID IDs), with the classified referrer source
    if (p && UUID_RE.test(p.id)) {
      api.post(`/parcels/${p.id}/view`, { source: viewSource }).catch(() => {});
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar compact />
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
          {selected && <ParcelPanel parcel={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </div>
  );
}
