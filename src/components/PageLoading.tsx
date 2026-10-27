import { KENYA_OUTLINE } from "@/components/home/kenyaMapData";
import "@/components/auth/auth.css";

// Nairobi as a share of the map's width and height, where the pin sits.
const NAIROBI = { left: 37.14, top: 65.25 };

/**
 * Shown while the next page's code is still downloading: a smaller take on
 * the sign-in loading screen, so moving between pages never shows a blank one.
 */
export function PageLoading() {
  return (
    <div className="ga-load ga-load-page" role="status" aria-label="Loading">
      <div className="ga-load-logo" aria-hidden="true">
        <img src="/favicon.svg" alt="" width={30} height={30} />
        <span className="ga-brand-text">Geo Pin Properties</span>
      </div>
      <div className="ga-load-map" aria-hidden="true">
        <svg className="ga-load-svg" viewBox="0 0 840 1010" preserveAspectRatio="none">
          <path
            className="ga-trace"
            d={KENYA_OUTLINE}
            pathLength={1}
            fill="rgba(169,201,122,0.05)"
            stroke="#C4D6A0"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="ga-load-ring"
          style={{ left: `${NAIROBI.left}%`, top: `${NAIROBI.top}%` }}
        />
        <span className="ga-load-pin" style={{ left: `${NAIROBI.left}%`, top: `${NAIROBI.top}%` }}>
          <svg width="28" height="35" viewBox="0 0 24 30">
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
      <div className="ga-load-status">
        Loading
        <span aria-hidden="true" className="ga-load-blinks">
          <span className="ga-blink" />
          <span className="ga-blink" style={{ animationDelay: "0.2s" }} />
          <span className="ga-blink" style={{ animationDelay: "0.4s" }} />
        </span>
      </div>
    </div>
  );
}
