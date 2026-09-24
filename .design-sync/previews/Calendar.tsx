import { Calendar } from "land-eye-kenya-frontend";

export const SiteVisit = () => (
  <div className="rounded-lg border border-border bg-card">
    <Calendar mode="single" selected={new Date(2026, 8, 24)} defaultMonth={new Date(2026, 8, 1)} />
  </div>
);

export const Range = () => (
  <div className="rounded-lg border border-border bg-card">
    <Calendar
      mode="range"
      selected={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 11) }}
      defaultMonth={new Date(2026, 9, 1)}
    />
  </div>
);
