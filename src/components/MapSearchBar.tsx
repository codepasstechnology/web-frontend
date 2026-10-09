import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function MapSatelliteToggle({
  satellite,
  onToggle,
}: {
  satellite: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="gm-ctl gm-ctl-tl gm-seg" role="group" aria-label="Map style">
      <button type="button" aria-pressed={!satellite} onClick={() => satellite && onToggle()}>
        Map
      </button>
      <button type="button" aria-pressed={satellite} onClick={() => !satellite && onToggle()}>
        Satellite
      </button>
    </div>
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
  const [results, setResults] = useState<NominatimResult[] | null>(null);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=ke&format=json&limit=6`,
        { headers: { "Accept-Language": "en" } },
      )
        .then((r) => r.json())
        .then((data: NominatimResult[]) => setResults(data))
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
    <div ref={wrapRef} className="gm-ctl gm-ctl-top">
      <div className="gm-search">
        <label htmlFor="gm-place" className="gm-sr">
          Search a place in Kenya
        </label>
        <Search width={18} height={18} aria-hidden />
        <input
          id="gm-place"
          type="search"
          autoComplete="off"
          className="gm-input"
          placeholder="Search a place in Kenya"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && results && (
          <div className="gm-sres" role="listbox" aria-label="Places">
            {results.map((r, i) => {
              const [name, ...rest] = r.display_name.split(",");
              return (
                <button
                  key={i}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onFly(parseFloat(r.lat), parseFloat(r.lon));
                    setQuery(name.trim());
                    setOpen(false);
                  }}
                >
                  <MapPin width={18} height={18} aria-hidden style={{ color: "var(--accent)" }} />
                  <span>
                    <span style={{ fontWeight: 600 }}>{name.trim()}</span>
                    <small>{rest.slice(0, 2).join(",").trim()}</small>
                  </span>
                </button>
              );
            })}
            {results.length === 0 && <span>No places found in Kenya</span>}
          </div>
        )}
        {locateError && (
          <div className="gm-sres" role="alert">
            <span>{locateError}</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleNearMe}
        disabled={locating}
        aria-label="Near me"
        title={onNearMe ? "Use my location" : "Near me"}
        className="gm-mbtn"
        style={{ borderRadius: "50%", width: 46, height: 46 }}
      >
        {locating ? <Spinner size="sm" /> : <LocateFixed width={20} height={20} aria-hidden />}
      </button>
    </div>
  );
}
