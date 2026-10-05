import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import L from "leaflet";

// Light, low-clutter basemap — reads closer to an illustrative map than a
// full street map, which suits a small decorative "where your interest is
// coming from" card better than the app's main OSM tiles do.
const GEO_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const GEO_HIGHLIGHT_ICON = L.divIcon({
  className: "lv-geo-pin",
  html: `<svg width="22" height="28" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2H16A6 6 0 0 1 22 8V16A6 6 0 0 1 16 22H15L12 29L9 22H8A6 6 0 0 1 2 16V8A6 6 0 0 1 8 2Z" fill="#15803D" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.5" fill="#fff"/>
  </svg>`,
  iconSize: [22, 28],
  iconAnchor: [11, 27],
});

export function GeoMiniMap({
  points,
  topCounty,
}: {
  points: { title: string; county: string; latitude: number; longitude: number; views: number }[];
  topCounty?: string;
}) {
  const maxViews = Math.max(1, ...points.map((p) => p.views));
  const highlightPoints = topCounty ? points.filter((p) => p.county === topCounty) : [];
  const centerSource = highlightPoints.length > 0 ? highlightPoints : points;
  const center: [number, number] = [
    centerSource.reduce((a, p) => a + p.latitude, 0) / centerSource.length,
    centerSource.reduce((a, p) => a + p.longitude, 0) / centerSource.length,
  ];

  return (
    <div className="mt-4 h-40 overflow-hidden rounded-md border border-border">
      <MapContainer
        center={center}
        zoom={points.length > 1 ? 7 : 9}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        className="h-full w-full"
      >
        <TileLayer url={GEO_TILES} attribution="&copy; OpenStreetMap, &copy; CARTO" />
        {points.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.latitude, p.longitude]}
            radius={4 + (p.views / maxViews) * 6}
            pathOptions={{ color: "#15803D", weight: 1, fillColor: "#15803D", fillOpacity: 0.35 }}
          >
            <LeafletTooltip direction="top" offset={[0, -4]}>
              {p.title} · {p.views.toLocaleString()} views
            </LeafletTooltip>
          </CircleMarker>
        ))}
        {highlightPoints.length > 0 && topCounty && (
          <Marker position={center} icon={GEO_HIGHLIGHT_ICON}>
            <LeafletTooltip permanent direction="right" offset={[4, -14]}>
              {topCounty}
            </LeafletTooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
