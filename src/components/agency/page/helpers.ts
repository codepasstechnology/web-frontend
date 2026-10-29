import { countyCenter } from "@/lib/countyCenters";
import type { AgencyListingItem, AgencyProfile, OpeningHours } from "@/lib/agency";
import { TYPE_LABELS } from "@/lib/properties";

export type TypeKey = "rent" | "sale" | "bnb" | "lsale" | "llease";

/** Same colours as the map pages, so a listing looks the same in both places. */
export const TYPE_COLOR: Record<TypeKey, string> = {
  rent: "var(--s-rent)",
  sale: "var(--s-bsale)",
  bnb: "var(--s-bnb)",
  lsale: "var(--s-lsale)",
  llease: "var(--s-lease)",
};

export const TYPE_TAG: Record<TypeKey, string> = {
  rent: "For rent",
  sale: "For sale",
  bnb: "BnB",
  lsale: "Land for sale",
  llease: "Land for lease",
};

export function typeKey(l: AgencyListingItem): TypeKey {
  if (l.kind === "parcel") return l.item.listingType === "lease" ? "llease" : "lsale";
  return l.item.intent;
}

export function listingTitle(l: AgencyListingItem): string {
  return l.kind === "parcel" ? l.item.parcelNumber : l.item.title;
}

export function listingMeta(l: AgencyListingItem): string {
  const place = [l.item.area, l.item.county].filter(Boolean).join(", ");
  if (l.kind === "parcel") return [l.item.size, place].filter(Boolean).join(" · ");
  const beds = l.item.bedrooms > 0 ? `${l.item.bedrooms} bd` : TYPE_LABELS[l.item.type];
  return [beds, place].filter(Boolean).join(" · ");
}

export function listingPrice(l: AgencyListingItem): { price: string; per: string } {
  const price = `KES ${l.item.price.toLocaleString("en-KE")}`;
  if (l.kind === "parcel") return { price, per: l.item.listingType === "lease" ? "/ year" : "" };
  const per = { month: "/ month", night: "/ night", total: "" }[l.item.pricePeriod];
  return { price, per };
}

export function listingHref(l: AgencyListingItem): string {
  return l.kind === "parcel"
    ? `/explore?parcel=${encodeURIComponent(l.item.id)}`
    : `/explore?property=${encodeURIComponent(l.item.id)}`;
}

export function listingPosition(l: AgencyListingItem): [number, number] | null {
  if (l.kind === "property") return l.item.position;
  return l.item.latitude != null && l.item.longitude != null
    ? [l.item.latitude, l.item.longitude]
    : null;
}

/** "Let in 9 days", "Sold in 5 weeks". */
export function closedText(l: AgencyListingItem): string {
  const verb = l.kind === "property" && l.item.intent !== "sale" ? "Let" : "Sold";
  if (l.closedDays == null) return verb;
  return `${verb} in ${durationText(l.closedDays)}`;
}

export function durationText(days: number): string {
  if (days < 14) return `${Math.max(1, days)} ${days === 1 ? "day" : "days"}`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks} weeks`;
  return `${Math.round(days / 30)} months`;
}

/** "3 wks" for the stats strip. */
export function durationShort(days: number): string {
  if (days < 14) return `${Math.max(1, days)} days`;
  const weeks = Math.round(days / 7);
  return weeks < 9 ? `${weeks} wks` : `${Math.round(days / 30)} mo`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w) && !/^(ltd|limited|&|and)$/i.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function digits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[^\d+]/g, "");
}

export function waNumber(phone: string | null | undefined): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  if (d.length < 9) return null;
  return d.startsWith("0") ? `254${d.slice(1)}` : d;
}

export function waLink(phone: string | null | undefined, text: string): string | null {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

/** The message a buyer sends from a listing card: names the listing so the agency knows which. */
export function listingWaText(agency: string, l: AgencyListingItem, pageUrl: string): string {
  const ref = l.kind === "parcel" ? l.item.parcelNumber : l.item.reference;
  const where = l.item.area || l.item.county;
  return `Hi ${agency}, I saw ${listingTitle(l)}${ref && ref !== listingTitle(l) ? ` (${ref})` : ""} in ${where} on Geo Pin. Is it still available? ${pageUrl}`;
}

export function pageUrl(slug: string): string {
  const base =
    import.meta.env.VITE_SITE_URL ||
    (typeof window === "undefined" ? "https://geopin.co.ke" : window.location.origin);
  return `${base.replace(/\/$/, "")}/agency/${slug}`;
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** Cream triangle mesh from the landing page, laid over the brand colour when there's no cover. */
export const MESH_BG = (() => {
  let d = "";
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 9; i++) {
      const x = i * 40 + (j % 2 ? 20 : 0);
      const y = j * 34;
      d += `M${x} ${y}l40 0M${x} ${y}l20 34M${x} ${y}l-20 34`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="204"><path d="${d}" stroke="#FFFAF2" stroke-opacity=".22" stroke-width="1" fill="none"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
})();

const FALLBACK_BRAND = "#3F5A2A";

export function coverStyle(agency: Pick<AgencyProfile, "coverUrl" | "brandColor">) {
  if (agency.coverUrl) return { backgroundImage: `url("${agency.coverUrl}")` };
  return {
    backgroundColor: agency.brandColor ?? FALLBACK_BRAND,
    backgroundImage: MESH_BG,
    backgroundSize: "320px 204px",
  };
}

export function logoStyle(agency: Pick<AgencyProfile, "logoUrl" | "brandColor">) {
  if (agency.logoUrl) {
    return { backgroundImage: `url("${agency.logoUrl}")`, backgroundColor: "#FFFAF2" };
  }
  return { backgroundColor: agency.brandColor ?? FALLBACK_BRAND };
}

// ── Opening hours, always in Nairobi time ────────────────────────────────────

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weekday (0 = Sunday) and minutes since midnight in Africa/Nairobi. */
export function nairobiNow(now: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    day: DAY_SHORT.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** "17:30" → "5:30 pm", "09:00" → "9 am". */
export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
}

export interface OpenStatus {
  open: boolean;
  text: string;
  today: number;
}

export function openStatus(hours: OpeningHours[], now: Date = new Date()): OpenStatus {
  const { day, minutes } = nairobiNow(now);
  const todays = hours.filter((h) => h.days.includes(day));
  const current = todays.find((h) => minutes >= toMinutes(h.open) && minutes < toMinutes(h.close));
  if (current) {
    return { open: true, text: `Open now · closes ${formatTime(current.close)}`, today: day };
  }
  const later = todays
    .filter((h) => toMinutes(h.open) > minutes)
    .sort((a, b) => toMinutes(a.open) - toMinutes(b.open))[0];
  if (later) return { open: false, text: `Closed · opens ${formatTime(later.open)}`, today: day };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const next = hours.find((h) => h.days.includes(d));
    if (next) {
      const when = i === 1 ? "tomorrow" : DAY_LONG[d];
      return { open: false, text: `Closed · opens ${when} ${formatTime(next.open)}`, today: day };
    }
  }
  return { open: false, text: "Closed now", today: day };
}

/** Week rows for the details panel: Mon – Fri 8:30 am – 5:30 pm, Saturday 9 am – 1 pm, Sunday Closed. */
export function hourRows(hours: OpeningHours[]): { label: string; time: string; days: number[] }[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const timeOf = (d: number) => {
    const h = hours.find((r) => r.days.includes(d));
    return h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : "Closed";
  };
  const rows: { label: string; time: string; days: number[] }[] = [];
  for (const d of order) {
    const time = timeOf(d);
    const last = rows[rows.length - 1];
    if (last && last.time === time) last.days.push(d);
    else rows.push({ label: "", time, days: [d] });
  }
  for (const r of rows) {
    r.label =
      r.days.length === 1
        ? DAY_LONG[r.days[0]]
        : `${DAY_SHORT[r.days[0]]} – ${DAY_SHORT[r.days[r.days.length - 1]]}`;
  }
  return rows;
}

// ── Coverage map ────────────────────────────────────────────────────────────

/**
 * Where a county sits on the Kenya outline from the landing page, as a share
 * of its 840 × 1010 box. The outline spans roughly 33.9–41.9° E and
 * 5.0° N to 4.7° S.
 */
export function countyPoint(county: string): { x: number; y: number } | null {
  const c = countyCenter(county);
  if (!c) return null;
  const [lat, lng] = c;
  return {
    x: 25 + ((lng - 33.9) / 8) * 795,
    y: 30 + ((5 - lat) / 9.7) * 970,
  };
}
