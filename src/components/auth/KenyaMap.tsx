import { forwardRef } from "react";
import {
  KENYA_MESH,
  KENYA_OUTLINE,
  MAPPED_LAND_DOTS,
  SURVEY_DOTS,
} from "@/components/home/kenyaMapData";

// Nairobi as a share of the map's width and height, where the pulse ring sits.
const NAIROBI = { left: 37.14, top: 65.25 };

/** The Kenya mesh map with mapped-land dots. The wrapper takes a ref so a parent can move it (parallax). */
export const KenyaMap = forwardRef<HTMLDivElement>(function KenyaMap(_props, ref) {
  return (
    <div ref={ref} className="ga-map-wrap">
      <div className="ga-map">
        <svg className="ga-map-svg" viewBox="0 0 840 1010" preserveAspectRatio="none">
          <path className="ga-m-outline" d={KENYA_OUTLINE} />
          <path className="ga-m-mesh" d={KENYA_MESH} />
          <path className="ga-m-dots" d={SURVEY_DOTS} />
        </svg>
        {MAPPED_LAND_DOTS.map(([left, top, size, delay], i) => (
          <span
            key={i}
            className="ga-green"
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
        <span className="ga-ring" style={{ left: `${NAIROBI.left}%`, top: `${NAIROBI.top}%` }} />
      </div>
    </div>
  );
});
