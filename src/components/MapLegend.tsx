import type { MapMode } from "@/components/LandMap";
import { beaconSvg } from "@/components/map/markers";

export function MapLegend({ mode }: { mode: MapMode }) {
  return (
    <div className="gm-ctl gm-legend" aria-label="Legend">
      {mode !== "rentals" && (
        <>
          <span className="gm-flab" style={{ fontSize: 11 }}>
            Parcels
          </span>
          <span className="gm-lrow">
            <Swatch color="var(--s-lsale)" />
            For sale
          </span>
          <span className="gm-lrow">
            <Swatch color="var(--s-lease)" />
            For lease
          </span>
          <span className="gm-lrow">
            <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
              <rect
                x="2"
                y="2"
                width="22"
                height="12"
                rx="3"
                fill="var(--muted)"
                fillOpacity=".3"
                stroke="var(--surface)"
                strokeWidth="5"
              />
              <rect
                x="2"
                y="2"
                width="22"
                height="12"
                rx="3"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="2"
              />
            </svg>
            Verified: solid edge + tick
          </span>
          <span className="gm-lrow">
            <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
              <rect
                x="2"
                y="2"
                width="22"
                height="12"
                rx="3"
                fill="var(--muted)"
                fillOpacity=".15"
                stroke="var(--ink)"
                strokeWidth="1.6"
                strokeDasharray="4 3"
              />
            </svg>
            Available, not yet verified
          </span>
          <span className="gm-lrow" style={{ ["--pc" as string]: "var(--s-lsale)" }}>
            <span
              style={{ display: "flex", width: 26, justifyContent: "center" }}
              dangerouslySetInnerHTML={{ __html: beaconSvg(11, 15) }}
            />
            Beacon on each corner
          </span>
          <span className="gm-lrow">
            <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
              <circle
                cx="13"
                cy="8"
                r="6.5"
                fill="var(--muted)"
                fillOpacity=".18"
                stroke="var(--ink)"
                strokeWidth="1.6"
                strokeDasharray="3 2.5"
              />
            </svg>
            Approximate location
          </span>
        </>
      )}
      {mode !== "land" && (
        <>
          <span className="gm-flab" style={{ fontSize: 11 }}>
            Properties
          </span>
          <span className="gm-lrow">
            <span className="gm-dot" style={{ ["--pc" as string]: "var(--s-rent)" }} />
            For rent
            <span
              className="gm-dot"
              style={{ ["--pc" as string]: "var(--s-bsale)", marginLeft: 6 }}
            />
            Sale
            <span
              className="gm-dot"
              style={{ ["--pc" as string]: "var(--s-bnb)", marginLeft: 6 }}
            />
            BnB
          </span>
        </>
      )}
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="22"
        height="12"
        rx="3"
        fill={color}
        fillOpacity=".42"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
