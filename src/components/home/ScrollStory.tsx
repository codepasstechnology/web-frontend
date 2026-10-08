import { useRef, type CSSProperties } from "react";
import { usePublicParcels } from "@/lib/parcels";
import { formatPrice } from "@/lib/properties";
import { KENYA_MESH, KENYA_OUTLINE, MAPPED_LAND_DOTS, SURVEY_DOTS } from "./kenyaMapData";
import { useScrollStory } from "./useScrollStory";

const STEPS = [
  {
    eyebrow: "01 · KENYA",
    title: "The whole country, mapped.",
    body: "Green points show land that has been plotted. Start anywhere.",
  },
  {
    eyebrow: "02 · COUNTY",
    title: "Zoom into any area.",
    body: "From all of Kenya to a single neighbourhood in one gesture.",
  },
  {
    eyebrow: "03 · BOUNDARIES",
    title: "See every boundary.",
    body: "Plots drawn on the map, so you know exactly where the land ends.",
  },
  {
    eyebrow: "04 · YOUR PLOT",
    title: "Pin it. Verify it. Own it.",
    body: "Check its status, message the owner and book a viewing.",
  },
] as const;

const PARCELS: { left: number; top: number; width: number; height: number; fill: number }[] = [
  { left: 4, top: 6, width: 26, height: 30, fill: 0.09 },
  { left: 32, top: 6, width: 17, height: 30, fill: 0.05 },
  { left: 56, top: 6, width: 40, height: 30, fill: 0.09 },
  { left: 4, top: 47, width: 18, height: 20, fill: 0.05 },
  { left: 56, top: 47, width: 18, height: 22, fill: 0.09 },
  { left: 76, top: 47, width: 20, height: 22, fill: 0.05 },
  { left: 4, top: 70, width: 44, height: 26, fill: 0.09 },
  { left: 56, top: 72, width: 40, height: 24, fill: 0.05 },
];

export function ScrollStory() {
  const ref = useRef<HTMLElement>(null);
  useScrollStory(ref);

  const { data: parcels = [] } = usePublicParcels();
  const verified = parcels.find((p) => p.verified);

  return (
    <section id="story" ref={ref} className="gp-story">
      <div className="gp-sticky">
        <div className="gp-stage">
          <div className="gp-steps-col">
            <div className="gp-progress" aria-hidden="true">
              <div className="gp-progress-fill" />
            </div>
            <div className="gp-steps">
              {STEPS.map((s, i) => (
                <div key={s.eyebrow} className={`gp-step gp-step-${i}`}>
                  <span className="gp-eyebrow">{s.eyebrow}</span>
                  <h2 className="gp-step-title">{s.title}</h2>
                  <p className="gp-step-body">{s.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="gp-vis">
            <div className="gp-note gp-doodle" aria-hidden="true">
              <span className="gp-note-stack">
                <span className="gp-note-line" style={{ opacity: "var(--t0)" }}>
                  green = mapped land
                </span>
                <span className="gp-note-line" style={{ opacity: "var(--t3)" }}>
                  this one could be yours!
                </span>
              </span>
              <svg className="gp-note-arrow" width="96" height="60" viewBox="0 0 96 60" fill="none">
                <path
                  d="M4 6 C 20 40, 50 50, 84 40"
                  stroke="var(--gp-olive)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M72 30 L 86 40 L 72 50"
                  stroke="var(--gp-olive)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="gp-map">
              <div className="gp-mesh">
                <svg
                  className="gp-mesh-svg"
                  viewBox="0 0 840 1010"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Mesh map of Kenya with mapped land as green dots"
                >
                  <path
                    className="gp-outline-path"
                    d={KENYA_OUTLINE}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{ vectorEffect: "non-scaling-stroke" }}
                  />
                  <path
                    className="gp-mesh-path"
                    d={KENYA_MESH}
                    fill="none"
                    strokeWidth="1"
                    style={{ vectorEffect: "non-scaling-stroke" }}
                  />
                  <path className="gp-dots-path" d={SURVEY_DOTS} />
                </svg>
                <div className="gp-dots">
                  {MAPPED_LAND_DOTS.map(([left, top, size, delay], i) => (
                    <span
                      key={i}
                      className="gp-dot gp-anim"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: size,
                        height: size,
                        margin: `-${size / 2}px 0 0 -${size / 2}px`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="gp-plots">
                <div className="gp-road gp-road-h" />
                <div className="gp-road gp-road-v" />
                <span className="gp-map-label" style={{ left: "6%", top: "41.6%" }}>
                  NAMANGA RD
                </span>
                {PARCELS.map((p, i) => (
                  <div
                    key={i}
                    className="gp-parcel"
                    style={
                      {
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: `${p.width}%`,
                        height: `${p.height}%`,
                        "--gp-parcel-fill": p.fill,
                      } as CSSProperties
                    }
                  />
                ))}
                <div className="gp-hi" />
                <div className="gp-pin">
                  <svg width="44" height="56" viewBox="0 0 24 30" aria-hidden="true">
                    <path
                      d="M12 29s-10-8.6-10-16a10 10 0 0 1 20 0c0 7.4-10 16-10 16z"
                      fill="var(--gp-sage)"
                      stroke="var(--gp-charcoal)"
                      strokeWidth="1.2"
                    />
                    <circle cx="12" cy="12.5" r="3.6" fill="var(--gp-charcoal)" />
                  </svg>
                </div>
                <span className="gp-map-label" style={{ left: "6%", top: "5%" }}>
                  KITENGELA · KAJIADO COUNTY
                </span>
              </div>

              {verified && (
                <div className="gp-card">
                  <div className="gp-card-row">
                    <span className="gp-card-meta">
                      PARCEL {verified.parcelNumber} · {verified.county}
                    </span>
                    <span className="gp-verified">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--gp-charcoal)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                      Verified
                    </span>
                  </div>
                  <span className="gp-card-title">{verified.parcelNumber}</span>
                  <span className="gp-card-sub">
                    {formatPrice(verified.price, "total")} · Message the owner
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
