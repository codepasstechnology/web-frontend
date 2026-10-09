import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import {
  KENYA_MESH,
  KENYA_OUTLINE,
  MAPPED_LAND_DOTS,
  SURVEY_DOTS,
} from "@/components/home/kenyaMapData";
import { addBeacon, type Beacon } from "@/lib/maintenance";

const MAP_W = 840;
const MAP_H = 1010;
// Nairobi as a share of the map's width and height, where the survey beacon stands.
const NAIROBI = { left: 37.14, top: 65.25 };
const HOVER_RADIUS = 150;
const PIN_RADIUS = 70;
// The scan band takes this long to cross the map, so each dot pings as it passes.
const SCAN_S = 4.6;

const GREEN = MAPPED_LAND_DOTS.map(([left, top, size]) => ({
  x: (left / 100) * MAP_W,
  y: (top / 100) * MAP_H,
  size,
}));

const pos = (x: number, y: number) => ({
  left: `${((x / MAP_W) * 100).toFixed(2)}%`,
  top: `${((y / MAP_H) * 100).toFixed(2)}%`,
});

/** The survey beacon used on the map pages. */
export function BeaconIcon({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 16 22" aria-hidden="true">
      <path
        d="M2 6 8 9 8 20 2 17Z"
        fill="var(--mt-mkd)"
        stroke="rgba(0,0,0,.38)"
        strokeWidth=".7"
        strokeLinejoin="round"
      />
      <path
        d="M8 9 14 6 14 17 8 20Z"
        fill="var(--mt-mkd)"
        stroke="rgba(0,0,0,.38)"
        strokeWidth=".7"
        strokeLinejoin="round"
      />
      <path d="M8 9 14 6 14 17 8 20Z" fill="rgba(0,0,0,.24)" />
      <path d="M2 10.5 8 13.5 8 15.5 2 12.5Z" fill="var(--mt-pc)" />
      <path d="M8 13.5 14 10.5 14 12.5 8 15.5Z" fill="var(--mt-pc)" />
      <path d="M8 13.5 14 10.5 14 12.5 8 15.5Z" fill="rgba(0,0,0,.25)" />
      <path
        d="M8 3 14 6 8 9 2 6Z"
        fill="var(--mt-pc)"
        stroke="rgba(0,0,0,.38)"
        strokeWidth=".7"
        strokeLinejoin="round"
      />
      <path d="M8 3 14 6 8 9 2 6Z" fill="rgba(255,255,255,.18)" />
    </svg>
  );
}

/**
 * The loading screen's Kenya map, made playful while people wait: a survey scan
 * sweeps it, dots glow near the pointer, and a tap drops a beacon.
 * `onBeacon` gets the running total of beacons dropped.
 */
export function MaintenanceMap({ onBeacon }: { onBeacon: (total: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(false);
  const dropped = useRef(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [beacons, setBeacons] = useState<Beacon[]>([]);

  const toMap = (clientX: number, clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r?.width) return null;
    return {
      x: ((clientX - r.left) / r.width) * MAP_W,
      y: ((clientY - r.top) / r.height) * MAP_H,
    };
  };

  const drop = (x: number, y: number) => {
    dropped.current += 1;
    setBeacons((b) => addBeacon(b, { id: dropped.current, x, y }));
    onBeacon(dropped.current);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const at = toMap(e.clientX, e.clientY);
    if (!at || frame.current) return;
    frame.current = true;
    requestAnimationFrame(() => {
      frame.current = false;
      setHover(at);
    });
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const at = toMap(e.clientX, e.clientY);
    if (at) drop(at.x, at.y);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const spot = GREEN[Math.floor(Math.random() * GREEN.length)];
    drop(spot.x, spot.y);
  };

  const nairobi = { x: (NAIROBI.left / 100) * MAP_W, y: (NAIROBI.top / 100) * MAP_H };
  const hint = beacons.length
    ? `${beacons.length} ${beacons.length === 1 ? "beacon" : "beacons"} placed · tap to add more`
    : "While you wait, tap the map to drop a beacon";

  return (
    <div
      ref={ref}
      className="mt-map"
      role="button"
      tabIndex={0}
      aria-label="Map of Kenya. Tap anywhere to drop a survey beacon while you wait."
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHover(null)}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <svg
        className="mt-map-svg"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="mt-map-fade" d={KENYA_MESH} fill="none" stroke="var(--mt-mesh)" />
        <path className="mt-map-fade" d={SURVEY_DOTS} fill="var(--mt-mdot)" />
        <defs>
          <clipPath id="mtKenya">
            <path d={KENYA_OUTLINE} />
          </clipPath>
          <linearGradient id="mtScan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--mt-green)" stopOpacity="0" />
            <stop offset=".85" stopColor="var(--mt-green)" stopOpacity=".22" />
            <stop offset="1" stopColor="var(--mt-green)" stopOpacity=".9" />
          </linearGradient>
        </defs>
        <g clipPath="url(#mtKenya)">
          <g className="mt-scan">
            <rect x="0" y="-130" width={MAP_W} height="130" fill="url(#mtScan)" />
            <rect x="0" y="-2" width={MAP_W} height="2" fill="var(--mt-green)" />
          </g>
        </g>
        <path className="mt-map-outline" d={KENYA_OUTLINE} />
      </svg>

      {hover && (
        <span className="mt-spot" style={pos(hover.x, hover.y)} data-testid="map-spotlight" />
      )}

      {GREEN.map((d, i) => {
        const near = hover
          ? Math.max(0, 1 - Math.hypot(d.x - hover.x, d.y - hover.y) / HOVER_RADIUS)
          : 0;
        const pinNear = beacons.some((b) => Math.hypot(d.x - b.x, d.y - b.y) < PIN_RADIUS);
        const scale = 1 + near * 1.3 + (pinNear ? 0.5 : 0);
        const fadeIn = `mtFadeIn .5s ease ${(1.4 + i * 0.008).toFixed(2)}s backwards`;
        const ping = `mtPing 5s ease-in-out ${((d.y / MAP_H) * SCAN_S + 0.2).toFixed(2)}s infinite`;
        return (
          <span
            key={i}
            className="mt-g"
            aria-hidden="true"
            style={{
              ...pos(d.x, d.y),
              width: d.size,
              height: d.size,
              margin: `${-d.size / 2}px 0 0 ${-d.size / 2}px`,
              transform: `scale(${scale.toFixed(2)})`,
              boxShadow: `0 0 ${(8 + near * 16).toFixed(0)}px var(--mt-glow)`,
              animation: near > 0 ? fadeIn : `${fadeIn}, ${ping}`,
            }}
          />
        );
      })}

      <span className="mt-ring" aria-hidden="true" style={pos(nairobi.x, nairobi.y)} />
      <span className="mt-hq" aria-hidden="true" style={pos(nairobi.x, nairobi.y)}>
        <BeaconIcon width={30} height={41} />
      </span>

      {beacons.map((b) => (
        <span key={b.id} data-testid="beacon">
          <span className="mt-rip" aria-hidden="true" style={pos(b.x, b.y)} />
          <span className="mt-beacon" aria-hidden="true" style={pos(b.x, b.y)}>
            <BeaconIcon width={18} height={25} />
          </span>
        </span>
      ))}

      <span className="mt-hint mt-tapnote">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 11V6a2 2 0 1 1 4 0v5M13 10a2 2 0 1 1 4 0v3M17 12a2 2 0 1 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L4.3 15a2 2 0 0 1 3-2.6L9 14" />
        </svg>
        {hint}
      </span>
    </div>
  );
}
