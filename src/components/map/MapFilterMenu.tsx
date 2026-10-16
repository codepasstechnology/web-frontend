import { useEffect, useRef, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

/** The page's filters in a panel over the map, so they're one tap away on any screen. */
export function MapFilterMenu({
  active,
  count,
  onReset,
  children,
}: {
  active: boolean;
  count: number;
  onReset: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="gm-ctl gm-ctl-filter">
      <button
        type="button"
        className="gm-filterbtn"
        aria-expanded={open}
        aria-controls="gm-filters"
        data-active={active}
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal width={16} height={16} aria-hidden />
        Filters
        {active && <span className="gm-fdot" aria-label="(on)" />}
      </button>
      {open && (
        <div id="gm-filters" className="gm-fpanel" role="dialog" aria-label="Filters">
          <div className="gm-fhead">
            <span className="gm-h" style={{ fontSize: 18 }}>
              Filters
            </span>
            <button
              type="button"
              className="gm-mbtn"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              style={{ width: 34, height: 34, boxShadow: "none" }}
            >
              <X width={16} height={16} aria-hidden />
            </button>
          </div>
          <div className="gm-fbody">{children}</div>
          <div className="gm-ffoot">
            {active && (
              <button type="button" className="gm-link" onClick={onReset}>
                Reset
              </button>
            )}
            <button type="button" className="gm-btn" onClick={() => setOpen(false)}>
              Show {count} {count === 1 ? "result" : "results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
