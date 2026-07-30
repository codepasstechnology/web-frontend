import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import type { DrawEvents } from "leaflet";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  MapSearchBar,
  FlyToLocation,
  MapSatelliteToggle,
  OSM_TILES,
  SATELLITE_TILES,
} from "@/components/MapSearchBar";

const pinIcon = L.divIcon({
  className: "lv-marker",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#2563EB;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function PinDropper({
  pin,
  onPin,
  disabled,
}: {
  pin: [number, number] | null;
  onPin: (p: [number, number]) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onPin([e.latlng.lat, e.latlng.lng]);
    },
  });
  if (!pin) return null;
  return <Marker position={pin} icon={pinIcon} />;
}

function PolygonDrawTrigger({
  trigger,
  cancelTrigger,
  color,
  onCreated,
  onTracingChange,
}: {
  trigger: number;
  cancelTrigger: number;
  color: string;
  onCreated: (boundary: { lat: number; lng: number }[]) => void;
  onTracingChange: (tracing: boolean) => void;
}) {
  const map = useMap();
  const [ready, setReady] = useState(false);
  const handlerRef = useRef<L.Draw.Polygon | null>(null);

  // leaflet-draw touches `window` at import time, so it must never load during SSR.
  useEffect(() => {
    let cancelled = false;
    import("leaflet-draw").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || trigger === 0) return;
    const handler = new L.Draw.Polygon(map as L.DrawMap, {
      showArea: true,
      shapeOptions: { color, weight: 2 },
    });
    handlerRef.current = handler;
    handler.enable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, trigger, map]);

  useEffect(() => {
    if (!ready || cancelTrigger === 0) return;
    handlerRef.current?.disable();
  }, [ready, cancelTrigger]);

  useEffect(() => {
    if (!ready) return;
    const onDrawStart = () => onTracingChange(true);
    const onDrawStop = () => onTracingChange(false);
    const onCreatedEvt = (e: L.LeafletEvent) => {
      const de = e as unknown as DrawEvents.Created;
      if (de.layerType !== "polygon" || !(de.layer instanceof L.Polygon)) return;
      const [ring] = de.layer.getLatLngs() as L.LatLng[][];
      onCreated(ring.map((p) => ({ lat: p.lat, lng: p.lng })));
    };
    map.on(L.Draw.Event.DRAWSTART, onDrawStart);
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop);
    map.on(L.Draw.Event.CREATED, onCreatedEvt);
    return () => {
      map.off(L.Draw.Event.DRAWSTART, onDrawStart);
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop);
      map.off(L.Draw.Event.CREATED, onCreatedEvt);
    };
  }, [ready, map, onCreated, onTracingChange]);

  return null;
}

interface LandBoundaryMapProps {
  pin: [number, number] | null;
  boundary: { lat: number; lng: number }[] | null;
  onPinChange: (p: [number, number]) => void;
  onBoundaryChange: (b: { lat: number; lng: number }[] | null) => void;
  initialCenter?: [number, number];
  hintText?: string;
  heightClassName?: string;
  county?: string;
  /**
   * When true, the map ignores taps/drags until the user deliberately taps
   * once to "wake it up" — for maps embedded inline in a scrollable page,
   * so a scroll gesture that starts on the map doesn't get mistaken for a
   * pin drop or pan. Full-screen/dedicated map steps don't need this.
   */
  requireTapToActivate?: boolean;
}

export function LandBoundaryMap({
  pin,
  boundary,
  onPinChange,
  onBoundaryChange,
  initialCenter = [-1.286389, 36.817223],
  hintText = 'Tap "Trace boundary", then click points around your land\'s edge on the satellite map — click the first point again to close the shape. Not sure of the exact shape? Just drop a pin instead.',
  heightClassName = "h-[65vh] sm:h-80 lg:h-[28rem]",
  county,
  requireTapToActivate = false,
}: LandBoundaryMapProps) {
  const [activated, setActivated] = useState(!requireTapToActivate);
  const [flyCoords, setFlyCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Center on the chosen county before the seller has placed anything —
  // never overrides a pin/boundary they've already set.
  useEffect(() => {
    if (!county || pin || boundary) return;
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${county} County, Kenya`)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((data: { lat: string; lon: string }[]) => {
        if (data[0]) setFlyCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [county]);

  const [countyMismatch, setCountyMismatch] = useState<string | null>(null);

  // Reverse-geocode the dropped pin so we can flag it if it's nowhere near
  // the county the seller picked in step 1 — a non-blocking sanity check.
  useEffect(() => {
    if (!pin || !county) {
      setCountyMismatch(null);
      return;
    }
    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pin[0]}&lon=${pin[1]}&format=json&zoom=8`,
      { headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((data: { address?: Record<string, string> }) => {
        if (cancelled) return;
        const detected = data.address?.county ?? data.address?.state;
        if (!detected) {
          setCountyMismatch(null);
          return;
        }
        const norm = (s: string) =>
          s
            .toLowerCase()
            .replace(/\s*county\s*$/i, "")
            .trim();
        const same =
          norm(detected) === norm(county) ||
          norm(detected).includes(norm(county)) ||
          norm(county).includes(norm(detected));
        setCountyMismatch(same ? null : detected);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pin, county]);

  const [isSatellite, setIsSatellite] = useState(true);
  const [drawTrigger, setDrawTrigger] = useState(0);
  const [cancelTrigger, setCancelTrigger] = useState(0);
  const [tracing, setTracing] = useState(false);
  const [colorMode, setColorMode] = useState<"fresh" | "retrace">("fresh");
  const shapeColor = colorMode === "retrace" ? "#F97316" : "#2563EB";

  const handleBoundaryCreated = (b: { lat: number; lng: number }[]) => {
    onBoundaryChange(b);
    const centroid = b.reduce<[number, number]>(
      (acc, p) => [acc[0] + p.lat / b.length, acc[1] + p.lng / b.length],
      [0, 0],
    );
    onPinChange(centroid);
  };

  const startCenter: [number, number] =
    pin ?? (boundary && boundary.length ? [boundary[0].lat, boundary[0].lng] : initialCenter);

  return (
    <div>
      {hintText && (
        <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {hintText}
        </p>
      )}
      <div className={`relative rounded-md border border-border ${heightClassName}`}>
        <div className="h-full overflow-hidden rounded-md">
          <MapContainer
            center={startCenter}
            zoom={pin || boundary?.length ? 15 : 11}
            zoomControl={false}
            className="h-full w-full"
          >
            <ZoomControl position="bottomleft" />
            <TileLayer
              key={isSatellite ? "sat" : "osm"}
              url={isSatellite ? SATELLITE_TILES : OSM_TILES}
              attribution={isSatellite ? "Tiles &copy; Esri" : "&copy; OpenStreetMap contributors"}
            />
            <PolygonDrawTrigger
              trigger={drawTrigger}
              cancelTrigger={cancelTrigger}
              color={shapeColor}
              onCreated={handleBoundaryCreated}
              onTracingChange={setTracing}
            />
            {boundary && (
              <Polygon
                positions={boundary.map((p): [number, number] => [p.lat, p.lng])}
                pathOptions={{ color: shapeColor, weight: 2, fillOpacity: 0.15 }}
              />
            )}
            <PinDropper pin={pin} onPin={onPinChange} disabled={tracing} />
            {flyCoords && <FlyToLocation lat={flyCoords.lat} lng={flyCoords.lng} />}
          </MapContainer>
        </div>
        <MapSearchBar
          onFly={(lat, lng) => setFlyCoords({ lat, lng })}
          onNearMe={(lat, lng) => {
            if (!tracing) onPinChange([lat, lng]);
          }}
        />
        <MapSatelliteToggle satellite={isSatellite} onToggle={() => setIsSatellite((s) => !s)} />
        <div className="absolute bottom-2.5 right-2.5 z-[800] flex flex-wrap items-center justify-end gap-1.5">
          {tracing ? (
            <>
              <span className="rounded-md bg-background/95 px-2.5 py-2 text-xs text-muted-foreground shadow-sm sm:px-2 sm:py-1.5">
                Click points on the map…
              </span>
              <button
                type="button"
                onClick={() => setCancelTrigger((n) => n + 1)}
                className="rounded-md border border-border bg-background/95 px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted sm:px-2.5 sm:py-1.5 sm:text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {boundary && (
                <button
                  type="button"
                  onClick={() => {
                    onBoundaryChange(null);
                    setColorMode("fresh");
                  }}
                  className="rounded-md border border-border bg-background/95 px-3.5 py-2.5 text-sm font-semibold text-destructive shadow-sm hover:bg-muted sm:px-2.5 sm:py-1.5 sm:text-xs"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setColorMode(boundary ? "retrace" : "fresh");
                  setDrawTrigger((n) => n + 1);
                  toast("Trace your land's boundary", {
                    description:
                      "Tap points around the edge of your land on the map. Tap the first point again to close the shape.",
                  });
                }}
                className={
                  boundary
                    ? "rounded-md border border-[#F97316]/40 bg-background/95 px-3.5 py-2.5 text-sm font-semibold text-[#C2410C] shadow-sm hover:bg-[#FFF7ED] sm:px-2.5 sm:py-1.5 sm:text-xs"
                    : "rounded-md border border-border bg-background/95 px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted sm:px-2.5 sm:py-1.5 sm:text-xs"
                }
              >
                {boundary ? "Retrace boundary" : "Trace boundary"}
              </button>
            </>
          )}
        </div>
        {requireTapToActivate && !activated && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActivated(true)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActivated(true)}
            className="absolute inset-0 z-[950] flex items-center justify-center rounded-md bg-black/10"
          >
            <span className="rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md">
              Tap to edit location
            </span>
          </div>
        )}
      </div>
      {countyMismatch && (
        <p className="mt-2 text-xs font-medium text-[#D97706]">
          This location looks like it&apos;s in {countyMismatch}, but you selected {county}.
          Double-check the pin before continuing.
        </p>
      )}
      <style>{`.leaflet-draw-tooltip{display:none!important}`}</style>
    </div>
  );
}
