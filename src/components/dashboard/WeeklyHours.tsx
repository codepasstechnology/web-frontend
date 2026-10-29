import { WEEK, type WeekHours } from "@/components/dashboard/weekHours";

/** Opening hours as a weekday grid: the agency page works out "Open now" from these. */
export function WeeklyHours({
  value,
  onChange,
  disabled,
}: {
  value: WeekHours;
  onChange: (next: WeekHours) => void;
  disabled?: boolean;
}) {
  const setDay = (day: number, t: { open: string; close: string } | null) =>
    onChange({ ...value, [day]: t });

  return (
    <div className="flex flex-col gap-2">
      {WEEK.map(({ day, label }) => {
        const t = value[day];
        return (
          <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex w-36 items-center gap-2">
              <input
                type="checkbox"
                checked={t !== null}
                disabled={disabled}
                onChange={(e) =>
                  setDay(day, e.target.checked ? { open: "08:30", close: "17:30" } : null)
                }
              />
              {label}
            </label>
            {t ? (
              <span className="flex items-center gap-2">
                <input
                  type="time"
                  className="gd-input"
                  style={{ minHeight: 40, width: 128 }}
                  aria-label={`${label} opens`}
                  value={t.open}
                  disabled={disabled}
                  onChange={(e) => setDay(day, { ...t, open: e.target.value })}
                />
                to
                <input
                  type="time"
                  className="gd-input"
                  style={{ minHeight: 40, width: 128 }}
                  aria-label={`${label} closes`}
                  value={t.close}
                  disabled={disabled}
                  onChange={(e) => setDay(day, { ...t, close: e.target.value })}
                />
              </span>
            ) : (
              <span className="text-muted-foreground">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
