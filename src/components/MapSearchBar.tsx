import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { LocateFixed, Map as MapIcon, Satellite, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export function MapSatelliteToggle({
  satellite,
  onToggle,
}: {
  satellite: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={satellite ? "Switch to street map" : "Switch to satellite view"}
      className={`pointer-events-auto absolute left-2.5 top-[90px] z-[800] flex h-[30px] items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold tracking-wide shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        satellite
          ? "border-white/15 bg-primary/90 text-primary-foreground hover:bg-primary"
          : "border-border bg-card/95 text-foreground hover:bg-muted"
      }`}
    >
      {satellite ? (
        <>
          <MapIcon className="h-3.5 w-3.5" /> Map
        </>
      ) : (
        <>
          <Satellite className="h-3.5 w-3.5" /> Satellite
        </>
      )}
    </button>
  );
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// FlyTo controller — must live inside MapContainer
export function FlyToLocation({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [map, lat, lng]);
  return null;
}

// Search bar + near-me button rendered as a normal React div (outside MapContainer)
// Place it inside a `position: relative` wrapper alongside the MapContainer.
export function MapSearchBar({
  onFly,
  onNearMe,
}: {
  onFly: (lat: number, lng: number) => void;
  onNearMe?: (lat: number, lng: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=ke&format=json&limit=6`,
        { headers: { "Accept-Language": "en" } },
      )
        .then((r) => r.json())
        .then((data: NominatimResult[]) => {
          setResults(data);
          setOpen(data.length > 0);
        })
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNearMe = () => {
    setLocateError("");
    if (!navigator.geolocation) {
      setLocateError("Location isn't supported on this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onFly(coords.latitude, coords.longitude);
        onNearMe?.(coords.latitude, coords.longitude);
      },
      (err) => {
        setLocating(false);
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — enable it in your browser settings to see what's near you."
            : "Couldn't get your location. Try again.",
        );
      },
    );
  };

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto absolute left-28 right-3 top-3 z-[800] md:left-1/2 md:right-auto md:top-2.5 md:w-[300px] md:max-w-[calc(100%-70px)] md:-translate-x-1/2"
    >
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search location in Kenya…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            className="h-[34px] w-full rounded-md border border-border bg-card/95 pl-8 pr-2 text-xs text-foreground shadow-sm outline-none transition-colors hover:border-muted-foreground/40 focus:border-brand"
          />
          {open && results.length > 0 && (
            <div className="absolute inset-x-0 top-[calc(100%+4px)] z-[801] overflow-hidden rounded-md border border-border bg-card shadow-md">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onFly(parseFloat(r.lat), parseFloat(r.lon));
                    setQuery(r.display_name.split(",")[0].trim());
                    setOpen(false);
                  }}
                  className="block w-full truncate border-b border-border px-2.5 py-1.5 text-left text-xs text-foreground transition-colors last:border-0 hover:bg-muted"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleNearMe}
          disabled={locating}
          title={onNearMe ? "Drop pin at my location" : "Show what's near me"}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-60"
        >
          {locating ? <Spinner size="sm" /> : <LocateFixed className="h-3.5 w-3.5" />}
        </button>
        {locateError && (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] z-[801] rounded-md border border-destructive/30 bg-destructive-subtle px-2 py-1.5 text-[11px] text-destructive-subtle-foreground shadow-sm">
            {locateError}
          </div>
        )}
      </div>
    </div>
  );
}
