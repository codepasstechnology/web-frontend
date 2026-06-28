import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, LayersControl, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { landParcels, rentals, statusMeta, type LandParcel, type Rental } from "@/lib/landData";

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

interface Props {
  mode: "land" | "rentals";
  onSelectParcel?: (p: LandParcel | null) => void;
  onSelectRental?: (r: Rental | null) => void;
  selectedId?: string | null;
  parcels?: LandParcel[];
  rentalItems?: Rental[];
}

// Fits map to all parcels on first load, and zooms to a selected parcel when chosen.
function MapController({ mode, selectedId }: { mode: "land" | "rentals"; selectedId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (mode !== "land") return;
    const all = landParcels.flatMap((p) => p.polygon);
    if (all.length) map.fitBounds(all as L.LatLngBoundsLiteral, { padding: [40, 40] });
  }, [map, mode]);
  useEffect(() => {
    if (!selectedId) return;
    const p = landParcels.find((x) => x.id === selectedId);
    if (p) map.fitBounds(p.polygon as L.LatLngBoundsLiteral, { padding: [80, 80], maxZoom: 17 });
  }, [map, selectedId]);
  return null;
}

export function LandMap({ mode, onSelectParcel, onSelectRental, selectedId, parcels, rentalItems }: Props) {
  const parcelList = parcels ?? landParcels;
  const rentalList = rentalItems ?? rentals;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Loading GIS map…
      </div>
    );
  }

  return (
    <MapContainer
      center={[-1.286389, 36.817223]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#e8eef5" }}
    >
      <MapController mode={mode} selectedId={selectedId} />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Road">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

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
                <div className="text-muted-foreground">{r.area}, {r.county}</div>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}