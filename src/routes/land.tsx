import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { LandMap } from "@/components/LandMap";
import { MapSidebar, type Filters } from "@/components/MapSidebar";
import { ParcelPanel } from "@/components/PropertyPanel";
import { MapLegend } from "@/components/MapLegend";
import { landParcels, type LandParcel } from "@/lib/landData";

export const Route = createFileRoute("/land")({
  component: LandPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Land Parcels Map — LandVerify Kenya" },
      { name: "description", content: "Interactive GIS map of plotted, verified land parcels across Kenya." },
    ],
  }),
});

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

  const filtered = useMemo(
    () =>
      landParcels.filter(
        (p) =>
          (filters.county === "All" || p.county === filters.county) &&
          (filters.status === "all" || p.status === filters.status) &&
          (filters.listingType === "all" || p.listingType === filters.listingType) &&
          (filters.postedBy === "all" || p.postedBy === filters.postedBy) &&
          p.price >= filters.minPrice &&
          p.price <= filters.maxPrice,
      ),
    [filters],
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar compact />
      <div className="relative flex flex-1 overflow-hidden">
        <MapSidebar filters={filters} setFilters={setFilters} count={filtered.length} />
        <div className="relative flex-1">
          <LandMap mode="land" parcels={filtered} onSelectParcel={setSelected} selectedId={selected?.id ?? null} />
          <div className="pointer-events-none absolute bottom-4 left-4 z-10">
            <div className="pointer-events-auto"><MapLegend /></div>
          </div>
          {selected && <ParcelPanel parcel={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </div>
  );
}