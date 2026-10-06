import { useEffect, useMemo, useState } from "react";
import {
  KENYA_MESH,
  KENYA_OUTLINE,
  MAPPED_LAND_DOTS,
  SURVEY_DOTS,
} from "@/components/home/kenyaMapData";
import "./auth.css";

// Nairobi as a share of the map's width and height, where the pin drops.
const NAIROBI = { left: 37.14, top: 65.25 };
const MAP_W = 840;
const MAP_H = 1010;
const STATUS_MS = 2300;
// Progress eases toward this while the dashboard loads; it completes when the screen fades.
const PROGRESS_TARGET = 0.9;

const STATUSES = {
  login: ["Finding your saved plots", "Loading the latest listings", "Getting your map ready"],
  signup: ["Setting up your account", "Pinning Kenya's mapped land", "Getting your map ready"],
};

const NOTES = {
  login: "almost there…",
  signup: "your map is almost ready!",
};

/** Full-screen loading state shown after sign-in or sign-up, until the dashboard is ready. */
export function LoadingScreen({
  mode,
  name,
  fading,
}: {
  mode: "login" | "signup";
  name: string;
  fading: boolean;
}) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const statuses = STATUSES[mode];

  useEffect(() => {
    const timer = window.setInterval(
      () => setStep((s) => Math.min(s + 1, statuses.length - 1)),
      STATUS_MS,
    );
    return () => window.clearInterval(timer);
  }, [statuses.length]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setProgress((p) => p + (PROGRESS_TARGET - p) * 0.04),
      120,
    );
    return () => window.clearInterval(timer);
  }, []);

  const green = useMemo(() => {
    const nairobiX = (NAIROBI.left / 100) * MAP_W;
    const nairobiY = (NAIROBI.top / 100) * MAP_H;
    return MAPPED_LAND_DOTS.map(([left, top, size], i) => {
      const x = (left / 100) * MAP_W;
      const y = (top / 100) * MAP_H;
      // The wave starts at Nairobi and reaches the edges by about 2.9s.
      const dist = Math.hypot(x - nairobiX, y - nairobiY);
      const delay = 1.5 + (dist / MAP_W) * 1.4;
      return { key: i, left, top, size, delay };
    });
  }, []);

  const first = name.trim().split(/\s+/)[0] || "there";
  const title = mode === "signup" ? `Karibu, ${first}.` : `Welcome back, ${first}.`;

  return (
    <div className={`ga-load${fading ? " is-out" : ""}`}>
      <div className="ga-load-logo" aria-hidden="true">
        <span className="ga-brand-tile">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <span className="ga-brand-text">Geo Pin</span>
      </div>

      <div className="ga-load-map" aria-hidden="true">
        <div className="ga-load-breathe">
          <svg className="ga-load-svg" viewBox="0 0 840 1010" preserveAspectRatio="none">
            <path
              className="ga-fade-in"
              d={KENYA_MESH}
              fill="none"
              stroke="rgba(214,198,160,0.16)"
              strokeWidth="1"
            />
            <path className="ga-fade-in" d={SURVEY_DOTS} fill="rgba(214,198,160,0.4)" />
            <path
              className="ga-trace"
              d={KENYA_OUTLINE}
              pathLength={1}
              fill="rgba(169,201,122,0.05)"
              stroke="#C4D6A0"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          {green.map((d) => (
            <span
              key={d.key}
              className="ga-load-dot"
              style={{
                left: `${d.left}%`,
                top: `${d.top}%`,
                width: d.size,
                height: d.size,
                margin: `${-d.size / 2}px 0 0 ${-d.size / 2}px`,
                animationDelay: `${d.delay.toFixed(2)}s, ${(d.delay + 0.5).toFixed(2)}s`,
              }}
            />
          ))}
          <span
            className="ga-load-ring"
            style={{ left: `${NAIROBI.left}%`, top: `${NAIROBI.top}%`, animationDelay: "1.9s" }}
          />
          <span
            className="ga-load-ring"
            style={{ left: `${NAIROBI.left}%`, top: `${NAIROBI.top}%`, animationDelay: "2.9s" }}
          />
          <span
            className="ga-load-pin"
            style={{ left: `${NAIROBI.left}%`, top: `${NAIROBI.top}%` }}
          >
            <svg width="40" height="50" viewBox="0 0 24 30">
              <path
                d="M12 29s-10-8.6-10-16a10 10 0 0 1 20 0c0 7.4-10 16-10 16z"
                fill="#A9C97A"
                stroke="#15140F"
                strokeWidth="1.2"
              />
              <circle cx="12" cy="12.5" r="3.6" fill="#15140F" />
            </svg>
          </span>
        </div>
      </div>

      <div className="ga-load-copy">
        <h1 className="ga-load-title">{title}</h1>
        <div role="status" aria-live="polite" className="ga-load-status">
          <span key={step} className="ga-load-status-text">
            {statuses[step]}
          </span>
          <span aria-hidden="true" className="ga-load-blinks">
            <span className="ga-blink" />
            <span className="ga-blink" style={{ animationDelay: "0.2s" }} />
            <span className="ga-blink" style={{ animationDelay: "0.4s" }} />
          </span>
        </div>
        <div aria-hidden="true" className="ga-load-bar">
          <span
            className="ga-load-fill"
            style={{ transform: `scaleX(${fading ? 1 : progress})` }}
          />
        </div>
        <span className="ga-load-note">{NOTES[mode]}</span>
      </div>
    </div>
  );
}
