import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type StepState = "done" | "active" | "next";

/** GET /api/status. Details the admin left blank are null. */
export interface MaintenanceStatus {
  maintenance: boolean;
  mode: "scheduled" | "unplanned";
  ends_at: string | null;
  started_at: string | null;
  window_label: string | null;
  progress: number | null;
  steps: { label: string; state: StepState }[];
  updated_at: string | null;
}

/** Static hosting can force the page on without the API. */
export const MAINTENANCE_FLAG = import.meta.env.VITE_MAINTENANCE === "1";

export const MAX_BEACONS = 12;
const POLL_MS = 60_000;

export function fetchStatus(): Promise<MaintenanceStatus> {
  return api.get<MaintenanceStatus>("/status");
}

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: ["maintenance-status"],
    queryFn: fetchStatus,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    retry: false,
  });
}

let checked: Promise<boolean> | null = null;

/** Asked once per page load; a 503 from any later call covers maintenance that starts mid-visit. */
export function isUnderMaintenance(): Promise<boolean> {
  if (MAINTENANCE_FLAG) return Promise.resolve(true);
  checked ??= fetchStatus()
    .then((s) => s.maintenance)
    .catch(() => false);
  return checked;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Seconds left, split into the units the countdown shows (hours only when there are any). */
export function formatCountdown(seconds: number) {
  const left = Math.max(0, Math.floor(seconds));
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const parts = [
    ...(h ? [{ value: pad(h), unit: "hrs" }] : []),
    { value: pad(m), unit: "min" },
    { value: pad(s), unit: "sec" },
  ];
  return { parts, label: `About ${h ? `${h} hours ` : ""}${m} minutes left` };
}

export function updatedAgo(seconds: number): string {
  return seconds < 60 ? "just now" : `${Math.floor(seconds / 60)} min ago`;
}

/** "Today, 20:41 EAT", or the date when it started on another day. */
export function formatStarted(iso: string, now = new Date()): string {
  const started = new Date(iso);
  const day = (d: Date) =>
    d.toLocaleDateString("en-GB", { timeZone: "Africa/Nairobi", day: "numeric", month: "short" });
  const time = started.toLocaleTimeString("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day(started) === day(now) ? "Today" : day(started)}, ${time} EAT`;
}

export function emailError(value: string): string {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return "That doesn't look like an email address. Check it and try again.";
  }
  return "";
}

export interface Beacon {
  id: number;
  x: number;
  y: number;
}

/** Adds a beacon, dropping the oldest once there are more than {@link MAX_BEACONS}. */
export function addBeacon(beacons: Beacon[], beacon: Beacon): Beacon[] {
  return [...beacons, beacon].slice(-MAX_BEACONS);
}
