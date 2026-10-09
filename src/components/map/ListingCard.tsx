import type { KeyboardEvent } from "react";
import { Check, Eye } from "lucide-react";

/** One result in the sidebar. The list is the keyboard path to every listing on the map. */
export function ListingCard({
  title,
  mono,
  sub,
  price,
  tag,
  color,
  photo,
  verified,
  approx,
  seen,
  selected,
  hot,
  compare,
  onSelect,
  onHover,
}: {
  title: string;
  mono: boolean;
  sub: string;
  price: string;
  tag: string;
  color: string;
  photo?: string;
  verified?: boolean;
  approx?: boolean;
  seen?: boolean;
  selected: boolean;
  hot: boolean;
  compare?: { on: boolean; toggle: () => void };
  onSelect: () => void;
  onHover: (on: boolean) => void;
}) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };
  const cmpLabel = compare
    ? `${compare.on ? "Remove" : "Add"} ${title} ${compare.on ? "from" : "to"} compare`
    : "";

  return (
    <div
      role="button"
      tabIndex={0}
      className="gm-card"
      aria-pressed={selected}
      data-hot={hot}
      onClick={onSelect}
      onKeyDown={onKey}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="gm-thumb" style={photo ? { backgroundImage: `url("${photo}")` } : undefined}>
        {compare && (
          <button
            type="button"
            className="gm-cmp"
            aria-pressed={compare.on}
            aria-label={cmpLabel}
            title={cmpLabel}
            onClick={(e) => {
              e.stopPropagation();
              compare.toggle();
            }}
          >
            <Check width={13} height={13} strokeWidth={3} aria-hidden />
          </button>
        )}
      </div>
      <div className="gm-cbody">
        <div className="gm-tags">
          <span className="gm-stag" style={{ ["--pc" as string]: color }}>
            {tag}
          </span>
          {verified && (
            <span className="gm-vtag">
              <Check width={11} height={11} strokeWidth={3} aria-hidden /> Verified
            </span>
          )}
          {approx && <span className="gm-atag">Approx. location</span>}
          {seen && (
            <span className="gm-seen">
              <Eye width={11} height={11} aria-hidden /> Viewed
            </span>
          )}
        </div>
        <span className={`gm-ctitle${mono ? " gm-mono" : ""}`}>{title}</span>
        <span className="gm-csub">{sub}</span>
        <span className="gm-cprice">{price}</span>
      </div>
    </div>
  );
}
