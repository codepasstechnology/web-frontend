import { statusMeta, type LandStatus } from "@/lib/landData";

// Only "available" and "sold" ever occur on the public marketplace — every
// listing goes live as available, with no separate verified/reserved/disputed stage.
const visibleStatuses: LandStatus[] = ["available", "sold"];

export function MapLegend() {
  const items = visibleStatuses;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Parcel Status
      </p>
      <ul className="space-y-1.5">
        {items.map((s) => (
          <li key={s} className="flex items-center gap-2 text-xs text-foreground">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: statusMeta[s].color, opacity: 0.9 }}
            />
            {statusMeta[s].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
