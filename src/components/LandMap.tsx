import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { rentals, statusMeta, type LandParcel, type Rental } from "@/lib/landData";
import { MapSatelliteToggle, OSM_TILES, SATELLITE_TILES } from "@/components/MapSearchBar";

// Fix default marker icons in bundlers
const icon = L.divIcon({
  className: "lv-marker",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#2563EB;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Stable label anchored at the polygon centroid (does not flicker on zoom).
const labelIcon = (parcelNumber: string, size: string) =>
  L.divIcon({
    className: "lv-parcel-label-icon",
    html: `<div class="lv-parcel-chip"><div class="lv-parcel-chip-num">${parcelNumber}</div><div class="lv-parcel-chip-size">${size}</div></div>`,
    iconSize: [110, 28],
    iconAnchor: [55, 14],
  });

const centroid = (poly: [number, number][]): [number, number] => {
  const [sLat, sLng] = poly.reduce(([a, b], [la, ln]) => [a + la, b + ln], [0, 0]);
  return [sLat / poly.length, sLng / poly.length];
};

export interface FlyTarget {
  lat: number;
  lng: number;
  zoom?: number;
}

function FlyToTarget({ target }: { target: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? 14, { duration: 1.2 });
  }, [map, target]);
  return null;
}

interface Props {
  mode: "land" | "rentals";
  onSelectParcel?: (p: LandParcel | null) => void;
  onSelectRental?: (r: Rental | null) => void;
  selectedId?: string | null;
  parcels?: LandParcel[];
  rentalItems?: Rental[];
  flyTarget?: FlyTarget | null;
}

// Fits map to all parcels on first load, and zooms to a selected parcel when chosen.
function MapController({
  mode,
  selectedId,
  parcels,
}: {
  mode: "land" | "rentals";
  selectedId?: string | null;
  parcels: LandParcel[];
}) {
  const map = useMap();
  useEffect(() => {
    if (mode !== "land" || parcels.length === 0) return;
    const all = parcels.flatMap((p) => p.polygon);
    if (all.length) map.fitBounds(all as L.LatLngBoundsLiteral, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mode]);
  useEffect(() => {
    if (!selectedId) return;
    const p = parcels.find((x) => x.id === selectedId);
    if (p) map.fitBounds(p.polygon as L.LatLngBoundsLiteral, { padding: [80, 80], maxZoom: 17 });
  }, [map, selectedId, parcels]);
  return null;
}

export function LandMap({
  mode,
  onSelectParcel,
  onSelectRental,
  selectedId,
  parcels = [],
  rentalItems,
  flyTarget,
}: Props) {
  const parcelList = parcels;
  const rentalList = rentalItems ?? rentals;
  const [mounted, setMounted] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Loading GIS map…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
    <MapContainer
      center={[-1.286389, 36.817223]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#e8eef5" }}
    >
      <MapController mode={mode} selectedId={selectedId} parcels={parcelList} />
      <FlyToTarget target={flyTarget ?? null} />
      <TileLayer
        key={isSatellite ? "sat" : "osm"}
        url={isSatellite ? SATELLITE_TILES : OSM_TILES}
        attribution={isSatellite ? "Tiles &copy; Esri" : "&copy; OpenStreetMap contributors"}
      />

      {mode === "land" &&
        parcelList.map((p) => {
          const meta = statusMeta[p.status];
          const isSelected = selectedId === p.id;
          return (
            <Polygon
              key={p.id}
              positions={p.polygon}
              pathOptions={{
                color: meta.color,
                weight: isSelected ? 3.5 : 2,
                fillColor: meta.fill,
                fillOpacity: isSelected ? 0.6 : 0.42,
                dashArray: p.status === "disputed" ? "6 4" : undefined,
              }}
              eventHandlers={{ click: () => onSelectParcel?.(p) }}
            >
              <Tooltip direction="top" sticky offset={[0, -4]}>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">{p.title}</div>
                  <div className="text-muted-foreground">
                    {p.parcelNumber} · {meta.label} · KES {p.price.toLocaleString()}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

      {mode === "land" &&
        parcelList.map((p) => (
          <Marker
            key={`label-${p.id}`}
            position={centroid(p.polygon)}
            icon={labelIcon(p.parcelNumber, p.size)}
            interactive
            keyboard={false}
            eventHandlers={{ click: () => onSelectParcel?.(p) }}
          />
        ))}

      {mode === "rentals" &&
        rentalList.map((r) => (
          <Marker
            key={r.id}
            position={r.position}
            icon={icon}
            eventHandlers={{ click: () => onSelectRental?.(r) }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{r.title}</div>
                <div>KES {r.price.toLocaleString()} / mo</div>
                <div className="text-muted-foreground">
                  {r.area}, {r.county}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
    <MapSatelliteToggle satellite={isSatellite} onToggle={() => setIsSatellite((s) => !s)} />
    </div>
  );
}
