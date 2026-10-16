import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface Session {
  id: number;
  user_agent: string | null;
  ip_address: string | null;
  last_used_at: string | null;
  current: boolean;
}

export const sessionsKey = ["user", "sessions"] as const;

export function useSessions() {
  return useQuery({
    queryKey: sessionsKey,
    queryFn: () => api.get<Session[]>("/user/sessions"),
  });
}

export const revokeSession = (id: number) => api.delete(`/user/sessions/${id}`);
export const revokeOtherSessions = () => api.delete("/user/sessions/others");

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser/, "Samsung Internet"],
  [/Firefox\/|FxiOS/, "Firefox"],
  [/Chrome\/|CriOS/, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "Mac"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

/** "Chrome on Windows" from a user agent; good enough to recognise your own devices. */
export function describeDevice(userAgent: string | null): { name: string; mobile: boolean } {
  const ua = userAgent ?? "";
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1];
  const system = SYSTEMS.find(([re]) => re.test(ua))?.[1];
  const name =
    browser && system ? `${browser} on ${system}` : (browser ?? system ?? "Unknown device");
  return { name, mobile: /Mobi|iPhone|Android/.test(ua) };
}
