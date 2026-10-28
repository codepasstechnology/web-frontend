import type { OpeningHours } from "@/lib/agency";

/** Monday first, as Kenyans read a week; values are JS weekdays (0 = Sunday). */
export const WEEK: { day: number; label: string }[] = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
  { day: 0, label: "Sunday" },
];

export type WeekHours = Record<number, { open: string; close: string } | null>;

export function weekFromHours(hours: OpeningHours[] | null): WeekHours {
  const week: WeekHours = {};
  for (const { day } of WEEK) week[day] = null;
  for (const row of hours ?? []) {
    for (const day of row.days) week[day] = { open: row.open, close: row.close };
  }
  return week;
}

/** Days sharing the same times become one row, so "Mon–Fri" stays one line on the page. */
export function hoursFromWeek(week: WeekHours): OpeningHours[] {
  const rows: OpeningHours[] = [];
  for (const { day } of WEEK) {
    const t = week[day];
    if (!t || !t.open || !t.close) continue;
    const same = rows.find((r) => r.open === t.open && r.close === t.close);
    if (same) same.days.push(day);
    else rows.push({ days: [day], open: t.open, close: t.close });
  }
  return rows;
}
