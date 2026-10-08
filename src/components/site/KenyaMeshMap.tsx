import {
  KENYA_MESH,
  KENYA_OUTLINE,
  MAPPED_LAND_DOTS,
  SURVEY_DOTS,
} from "@/components/home/kenyaMapData";

export interface KenyaMeshMapProps {
  /** Glowing dots marking the land already mapped. */
  mappedLand?: boolean;
  /** Share of the map's width/height where a dropped pin with a pulsing ring renders. */
  pin?: { left: number; top: number };
}

/** The theme-aware Kenya mesh map for the marketing pages (About, Contact); the caller sizes and frames it. */
export function KenyaMeshMap({ mappedLand = false, pin }: KenyaMeshMapProps) {
  return (
    <div className="gs-map">
      <svg viewBox="0 0 840 1010" preserveAspectRatio="none" aria-hidden="true">
        <path d={KENYA_OUTLINE} className="gs-map-outline" />
        <path d={KENYA_MESH} className="gs-map-mesh" />
        <path d={SURVEY_DOTS} className="gs-map-dots" />
      </svg>
      {mappedLand &&
        MAPPED_LAND_DOTS.map(([left, top, size, delay], i) => (
          <span
            key={i}
            className="gs-map-glow"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              margin: `${-size / 2}px 0 0 ${-size / 2}px`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      {pin && (
        <>
          <span
            className="gs-map-ring"
            style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
            aria-hidden="true"
          />
          <span
            className="gs-map-pin"
            style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
            aria-hidden="true"
          >
            <svg width="36" height="46" viewBox="0 0 24 30">
              <path
                d="M12 29s-10-8.6-10-16a10 10 0 0 1 20 0c0 7.4-10 16-10 16z"
                fill="var(--glow)"
              />
              <circle cx="12" cy="12.5" r="3.6" fill="var(--bg)" />
            </svg>
          </span>
        </>
      )}
    </div>
  );
}
