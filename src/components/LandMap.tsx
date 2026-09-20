import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Tooltip,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-rotate";
import { statusMeta, type LandParcel } from "@/lib/landData";
import { formatPrice, INTENT_LABELS, type Property } from "@/lib/properties";
import { MapSatelliteToggle, OSM_TILES, SATELLITE_TILES } from "@/components/MapSearchBar";

// Fix default marker icons in bundlers
const icon = L.divIcon({
  className: "lv-marker",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#15803D;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Small white glyph per status, drawn inside the pin's head.
const statusGlyphs: Record<string, string> = {
  verified:
    '<path d="M8 12.2l2.6 2.6L16.2 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  disputed:
    '<rect x="11.15" y="6.8" width="1.7" height="6" rx="0.85" fill="#fff"/><circle cx="12" cy="16" r="1.1" fill="#fff"/>',
  sold: '<path d="M9 9l6 6M15 9l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  reserved:
    '<circle cx="12" cy="12" r="5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M12 9.2v3l2.2 1.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  available: '<circle cx="12" cy="12" r="3.5" fill="#fff"/>',
};

// Rounded-square badge with a small callout tail — a shape of our own, not the
// generic teardrop everyone associates with Google Maps. Anchored at the tail tip.
// Selected parcels pop slightly larger with a glow.
const pinIconFor = (color: string, status: string, selected: boolean) => {
  const glyph = statusGlyphs[status] ?? statusGlyphs.available;
  const scale = selected ? 1.2 : 1;
  const w = Math.round(24 * scale);
  const h = Math.round(30 * scale);
  return L.divIcon({
    className: `lv-pin-icon${selected ? " lv-pin-icon-selected" : ""}`,
    html: `<svg width="${w}" height="${h}" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2H16A6 6 0 0 1 22 8V16A6 6 0 0 1 16 22H15L12 29L9 22H8A6 6 0 0 1 2 16V8A6 6 0 0 1 8 2Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      ${glyph}
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, Math.round(29 * scale)],
  });
};

// Anchored to the polygon's own rightmost vertex — a real point on the
// boundary line, not floating outside it, and never inside the land itself.
// Property pins are coloured by what the listing is for, the way land pins are
// coloured by parcel status.
const intentColors: Record<Property["intent"], string> = {
  rent: "#1E293B",
  bnb: "#7C3AED",
  sale: "#16A34A",
};

const polygonAnchorPoint = (poly: [number, number][]): [number, number] =>
  poly.reduce((best, p) => (p[1] > best[1] ? p : best), poly[0]);

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
  onSelectProperty?: (p: Property | null) => void;
  selectedId?: string | null;
  parcels?: LandParcel[];
  properties?: Property[];
  flyTarget?: FlyTarget | null;
}

// Fits map to all parcels/properties on first load, and zooms to the
// selected one when chosen.
function MapController({
  mode,
  selectedId,
  parcels,
  properties,
}: {
  mode: "land" | "rentals";
  selectedId?: string | null;
  parcels: LandParcel[];
  properties: Property[];
}) {
  const map = useMap();
  useEffect(() => {
    if (mode === "land") {
      if (parcels.length === 0) return;
      const all = parcels.flatMap(
        (p) =>
          p.polygon ??
          (p.latitude != null && p.longitude != null
            ? [[p.latitude, p.longitude] as [number, number]]
            : []),
      );
      if (all.length) map.fitBounds(all as L.LatLngBoundsLiteral, { padding: [40, 40] });
    } else {
      if (properties.length === 0) return;
      map.fitBounds(properties.map((p) => p.position) as L.LatLngBoundsLiteral, {
        padding: [40, 40],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mode]);
  useEffect(() => {
    if (!selectedId) return;

    let bounds: [number, number][] | null = null;
    if (mode === "land") {
      const p = parcels.find((x) => x.id === selectedId);
      if (!p) return;
      bounds =
        p.polygon ??
        (p.latitude != null && p.longitude != null
          ? [
              [p.latitude, p.longitude],
              [p.latitude, p.longitude],
            ]
          : null);
    } else {
      const p = properties.find((x) => x.id === selectedId);
      if (!p) return;
      bounds = [p.position, p.position];
    }
    if (!bounds) return;

    // The listing panel covers the right side of the map on desktop and the
    // bottom ~60% on mobile — pad the fly-to so the parcel lands in the
    // slice of map that's actually still visible, not hidden behind it.
    const isMobile = window.innerWidth < 768;
    const paddingBottomRight: [number, number] = isMobile
      ? [20, window.innerHeight * 0.58]
      : [400, 20];

    map.flyToBounds(bounds as L.LatLngBoundsLiteral, {
      paddingTopLeft: [20, 20],
      paddingBottomRight,
      maxZoom: 17,
      duration: 1,
    });
  }, [map, mode, selectedId, parcels, properties]);
  return null;
}

export function LandMap({
  mode,
  onSelectParcel,
  onSelectProperty,
  selectedId,
  parcels = [],
  properties = [],
  flyTarget,
}: Props) {
  const parcelList = parcels;
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
        zoomControl={false}
        rotate
        touchRotate
        rotateControl={{ position: "topleft", closeOnZeroBearing: false }}
        className="h-full w-full"
        style={{ background: "#e8eef5" }}
      >
        <ZoomControl position="topright" />
        <MapController
          mode={mode}
          selectedId={selectedId}
          parcels={parcelList}
          properties={properties}
        />
        <FlyToTarget target={flyTarget ?? null} />
        <TileLayer
          key={isSatellite ? "sat" : "osm"}
          url={isSatellite ? SATELLITE_TILES : OSM_TILES}
          attribution={isSatellite ? "Tiles &copy; Esri" : "&copy; OpenStreetMap contributors"}
        />

        {mode === "land" &&
          parcelList.map((p) => {
            if (!p.polygon) return null;
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
                      {meta.label} · KES {p.price.toLocaleString()}
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {mode === "land" &&
          parcelList.map((p) => {
            const position = p.polygon
              ? polygonAnchorPoint(p.polygon)
              : p.latitude != null && p.longitude != null
                ? ([p.latitude, p.longitude] as [number, number])
                : null;
            if (!position) return null;
            const meta = statusMeta[p.status];
            const isSelected = selectedId === p.id;
            return (
              <Marker
                key={`label-${p.id}`}
                position={position}
                icon={pinIconFor(meta.color, p.status, isSelected)}
                keyboard={false}
                eventHandlers={{ click: () => onSelectParcel?.(p) }}
              >
                <Tooltip direction="right" offset={[2, -16]}>
                  <div className="text-xs">
                    <div className="font-semibold text-foreground">{p.parcelNumber}</div>
                    <div className="text-muted-foreground">{p.size}</div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {mode === "rentals" &&
          properties.map((p) => (
            <Marker
              key={p.id}
              position={p.position}
              icon={pinIconFor(
                intentColors[p.intent],
                p.intent === "sale" ? "sold" : "available",
                selectedId === p.id,
              )}
              eventHandlers={{ click: () => onSelectProperty?.(p) }}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">{p.title}</div>
                  <div className="text-muted-foreground">
                    {INTENT_LABELS[p.intent]} · {formatPrice(p.price, p.pricePeriod)}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          ))}
      </MapContainer>
      <MapSatelliteToggle satellite={isSatellite} onToggle={() => setIsSatellite((s) => !s)} />
    </div>
  );
}
