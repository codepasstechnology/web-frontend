import { useEffect, useRef, type MouseEvent } from "react";
import { Columns2, MapPin, X } from "lucide-react";
import type { LandParcel } from "@/lib/landData";
import { compareRows, COMPARE_MAX, isMixedDeal } from "@/lib/compare";
import { DEAL_COLOR } from "@/components/map/markers";

export function CompareTray({
  parcels,
  onRemove,
  onOpen,
  onClear,
}: {
  parcels: LandParcel[];
  onRemove: (id: string) => void;
  onOpen: () => void;
  onClear: () => void;
}) {
  const short = 2 - parcels.length;
  return (
    <div className="gm-tray" role="region" aria-label="Compare plots">
      <strong>
        <Columns2 width={16} height={16} aria-hidden /> {parcels.length}/{COMPARE_MAX}
      </strong>
      {parcels.map((p) => (
        <span key={p.id} className="gm-tchip">
          <span
            className="gm-dot"
            style={{ ["--pc" as string]: DEAL_COLOR[p.listingType], width: 8, height: 8 }}
          />
          <span className="gm-mono">{p.parcelNumber}</span>
          <button
            type="button"
            onClick={() => onRemove(p.id)}
            aria-label={`Remove ${p.parcelNumber}`}
          >
            <X width={12} height={12} strokeWidth={2.6} aria-hidden />
          </button>
        </span>
      ))}
      <button
        type="button"
        className="gm-btn"
        onClick={onOpen}
        disabled={short > 0}
        style={{ minHeight: 40, padding: "0 18px", fontSize: 14, flex: "none" }}
      >
        {short > 0 ? `Pick ${short} more` : "Compare"}
      </button>
      <button type="button" onClick={onClear} aria-label="Clear compare" style={{ opacity: 0.75 }}>
        <X width={16} height={16} aria-hidden />
      </button>
    </div>
  );
}

export function CompareModal({
  parcels,
  onRemove,
  onView,
  onClose,
}: {
  parcels: LandParcel[];
  onRemove: (id: string) => void;
  onView: (p: LandParcel) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = compareRows(parcels);
  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="gm-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Compare plots"
      onClick={onBackdrop}
    >
      <div className="gm-mcard">
        <div className="gm-mhead">
          <h2 className="gm-h" style={{ fontSize: 28 }}>
            Compare plots
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="gm-mbtn"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "none" }}
          >
            <X width={16} height={16} aria-hidden />
          </button>
        </div>
        {isMixedDeal(parcels) && (
          <div className="gm-mixed">
            You&apos;re comparing land for sale with land for lease. Lease prices are per year, so
            price per acre isn&apos;t directly comparable.
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <div
            className="gm-cgrid"
            role="table"
            aria-label="Plot comparison"
            style={{
              gridTemplateColumns: `150px repeat(${parcels.length}, minmax(200px, 1fr))`,
              minWidth: 150 + 210 * parcels.length,
            }}
          >
            <span role="columnheader" />
            {parcels.map((p) => (
              <div key={p.id} className="gm-chead" role="columnheader">
                <div
                  className="gm-cthumb"
                  style={p.photos?.[0] ? { backgroundImage: `url("${p.photos[0]}")` } : undefined}
                >
                  <span
                    className="gm-stag"
                    style={{ ["--pc" as string]: DEAL_COLOR[p.listingType] }}
                  >
                    {p.listingType === "sale" ? "For sale" : "For lease"}
                  </span>
                  <button
                    type="button"
                    className="gm-cx"
                    onClick={() => onRemove(p.id)}
                    aria-label={`Remove ${p.parcelNumber} from compare`}
                  >
                    <X width={13} height={13} strokeWidth={2.6} aria-hidden />
                  </button>
                </div>
                <span className="gm-mono" style={{ fontWeight: 600, fontSize: 14 }}>
                  {p.parcelNumber}
                </span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  {p.area ? `${p.area}, ${p.county}` : p.county}
                </span>
                <button
                  type="button"
                  className="gm-act2"
                  onClick={() => onView(p)}
                  style={{ justifyContent: "center" }}
                >
                  <MapPin width={14} height={14} aria-hidden /> View on map
                </button>
              </div>
            ))}
            {rows.map((row) => (
              <div key={row.label} role="row" style={{ display: "contents" }}>
                <div role="rowheader" className={`gm-cl${row.sub ? " gm-sub" : ""}`}>
                  {row.label}
                </div>
                {row.cells.map((cell, i) => (
                  <div key={i} role="cell" className={`gm-cc${row.strong ? " gm-strong" : ""}`}>
                    {cell.text}
                    {cell.best && <span className="gm-best">{cell.best}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Price per acre uses the size the seller entered. Distances are from OpenStreetMap.
        </span>
      </div>
    </div>
  );
}
