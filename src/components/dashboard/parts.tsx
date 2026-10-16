import { House } from "lucide-react";

export type ChipKind = "ok" | "warn" | "muted" | "err";

/** Status chip: a rotated-square dot plus a label, so status never relies on colour alone. */
export function StatusChip({ kind, label }: { kind: ChipKind; label: string }) {
  return (
    <span className="gd-st" data-k={kind}>
      {label}
    </span>
  );
}

const LISTING_STATUS: Record<string, [ChipKind, string]> = {
  active: ["ok", "Live"],
  available: ["ok", "Available"],
  pending: ["warn", "Pending review"],
  occupied: ["warn", "Occupied"],
  sold: ["muted", "Sold"],
  taken: ["muted", "Taken"],
  closed: ["muted", "Closed"],
  suspended: ["err", "Suspended"],
};

export function ListingStatus({ status }: { status: string }) {
  const [kind, label] = LISTING_STATUS[status] ?? ["muted", status.replace(/_/g, " ")];
  return <StatusChip kind={kind} label={label} />;
}

/** The survey beacon used for listing slots and empty states (filled when `used`). */
export function Beacon({
  used = true,
  width = 22,
  height = 30,
}: {
  used?: boolean;
  width?: number;
  height?: number;
}) {
  return (
    <span className="gd-slot" data-used={used}>
      <svg width={width} height={height} viewBox="0 0 16 22" aria-hidden="true">
        <path
          d="M2 6 8 9 8 20 2 17Z"
          fill="var(--mkd)"
          stroke="rgba(0,0,0,.38)"
          strokeWidth=".7"
          strokeLinejoin="round"
        />
        <path
          d="M8 9 14 6 14 17 8 20Z"
          fill="var(--mkd)"
          stroke="rgba(0,0,0,.38)"
          strokeWidth=".7"
          strokeLinejoin="round"
        />
        <path d="M8 9 14 6 14 17 8 20Z" fill="rgba(0,0,0,.24)" />
        <path d="M2 10.5 8 13.5 8 15.5 2 12.5Z" fill="var(--pc)" />
        <path d="M8 13.5 14 10.5 14 12.5 8 15.5Z" fill="var(--pc)" />
        <path d="M8 13.5 14 10.5 14 12.5 8 15.5Z" fill="rgba(0,0,0,.25)" />
        <path
          d="M8 3 14 6 8 9 2 6Z"
          fill="var(--pc)"
          stroke="rgba(0,0,0,.38)"
          strokeWidth=".7"
          strokeLinejoin="round"
        />
        <path d="M8 3 14 6 8 9 2 6Z" fill="rgba(255,255,255,.18)" />
      </svg>
    </span>
  );
}

/**
 * Listing thumbnail: the cover photo when there is one, otherwise a parcel
 * glyph with corner beacons (land) or a house (rentals).
 */
export function ListingThumb({
  kind,
  coverPhotoUrl,
  width = 56,
  height = 44,
}: {
  kind: "land" | "property";
  coverPhotoUrl: string | null;
  width?: number;
  height?: number;
}) {
  return (
    <span className="gd-thumb" style={{ width, height }}>
      {coverPhotoUrl ? (
        <img src={coverPhotoUrl} alt="" className="h-full w-full object-cover" />
      ) : kind === "land" ? (
        <svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true">
          <path
            d="M6 8 26 4 30 22 9 25Z"
            fill="var(--brand)"
            fillOpacity=".18"
            stroke="var(--brand)"
            strokeWidth="1.4"
            strokeDasharray="3 2"
          />
          {[
            [6, 8],
            [26, 4],
            [30, 22],
            [9, 25],
          ].map(([x, y]) => (
            <rect
              key={`${x}-${y}`}
              x={x - 2}
              y={y - 2}
              width="4"
              height="4"
              fill="var(--card)"
              stroke="var(--brand)"
              strokeWidth="1.2"
            />
          ))}
        </svg>
      ) : (
        <House size={22} className="text-brand" aria-hidden="true" />
      )}
    </span>
  );
}
