import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

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
      style={{
        position: "absolute",
        top: 90,
        left: 10,
        zIndex: 800,
        height: 30,
        padding: "0 10px",
        borderRadius: 6,
        border: "1px solid #e2e8f0",
        background: satellite ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.97)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color: satellite ? "#f1f5f9" : "#334155",
        letterSpacing: "0.02em",
        pointerEvents: "auto",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = satellite ? "rgba(30,41,59,0.95)" : "#f1f5f9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = satellite
          ? "rgba(15,23,42,0.85)"
          : "rgba(255,255,255,0.97)";
      }}
    >
      {satellite ? "🗺 Map" : "🛰 Satellite"}
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
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#94a3b8",
              width: 13,
              height: 13,
            }}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search location in Kenya…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            style={{
              height: 34,
              width: "100%",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: "rgba(255,255,255,0.97)",
              paddingLeft: 30,
              paddingRight: 8,
              fontSize: 12,
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              boxSizing: "border-box",
              color: "#0f172a",
            }}
          />
          {open && results.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 4px)",
                zIndex: 801,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
                overflow: "hidden",
              }}
            >
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onFly(parseFloat(r.lat), parseFloat(r.lon));
                    setQuery(r.display_name.split(",")[0].trim());
                    setOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "7px 10px",
                    textAlign: "left",
                    fontSize: 12,
                    color: "#0f172a",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: i < results.length - 1 ? "1px solid #f1f5f9" : "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
          style={{
            height: 34,
            width: 34,
            flexShrink: 0,
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            cursor: locating ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#334155",
            opacity: locating ? 0.6 : 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.97)")}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            className={locating ? "animate-spin" : undefined}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
        </button>
        {locateError && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 6px)",
              zIndex: 801,
              borderRadius: 6,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 11,
              padding: "6px 8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
            }}
          >
            {locateError}
          </div>
        )}
      </div>
    </div>
  );
}
