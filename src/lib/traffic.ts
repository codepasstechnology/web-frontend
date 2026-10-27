import { api } from "@/lib/api";
import { getConsent } from "@/lib/consent";

const VISITOR_KEY = "gp_visitor";
const SESSION_KEY = "gp_session";
// The usual analytics definition: a visit ends after 30 minutes without a page view.
const SESSION_IDLE_MS = 30 * 60 * 1000;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/** Query parameter that ties a shared listing link back to who shared it. */
export const SHARE_PARAM = "s";

export type ShareChannel = "copy" | "whatsapp" | "native";

let landed = false;
let countedAnonymously = false;

function visitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function isExternal(referrer: string): boolean {
  try {
    return !!referrer && new URL(referrer).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Records one page view. The first page of a visit carries where it came from;
 * arriving again from a shared link, campaign or another site starts a new
 * visit even mid-session, so the new source is not lost. Until the visitor
 * agrees to analytics in the cookie banner, the page view only adds one to
 * the site's anonymous daily totals, and nothing is stored in the browser.
 */
export function trackPageView(path: string, now = Date.now()): void {
  if (typeof window === "undefined") return;
  if (getConsent() !== "all") {
    countAnonymously();
    return;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const landing = !landed;
    landed = true;
    const arrivedFromOutside =
      landing &&
      (params.has(SHARE_PARAM) ||
        UTM_KEYS.some((k) => params.has(k)) ||
        isExternal(document.referrer));

    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as {
      id: string;
      at: number;
    } | null;
    const entry = !saved || now - saved.at > SESSION_IDLE_MS || arrivedFromOutside;
    const sessionId = entry || !saved ? crypto.randomUUID() : saved.id;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: sessionId, at: now }));

    api
      .post("/traffic/visit", {
        visitor_id: visitorId(),
        session_id: sessionId,
        path,
        entry,
        ...(entry && {
          referrer: landing && isExternal(document.referrer) ? document.referrer : null,
          share: landing ? params.get(SHARE_PARAM) : null,
          ...Object.fromEntries(UTM_KEYS.map((k) => [k, landing ? params.get(k) : null])),
        }),
      })
      .catch(() => {});
  } catch {
    /* storage is blocked (private mode); the page works without tracking */
  }
}

function countAnonymously(): void {
  // A page load that didn't come from another page of ours starts a new visit.
  const visit = !countedAnonymously && (!document.referrer || isExternal(document.referrer));
  countedAnonymously = true;
  api.post("/traffic/anonymous", { visit }).catch(() => {});
}

/** Drops the visitor and visit ids when someone turns analytics off. */
export function forgetVisitor(): void {
  try {
    localStorage.removeItem(VISITOR_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage is blocked */
  }
}

export function newShareCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from(
    crypto.getRandomValues(new Uint8Array(10)),
    (b) => alphabet[b % alphabet.length],
  ).join("");
}

export function withShareCode(url: string, code: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}${SHARE_PARAM}=${code}`;
}

export function recordShare(
  code: string,
  listing: { type: "parcel" | "property"; id: string },
  channel: ShareChannel,
): void {
  let visitor: string | null = null;
  try {
    visitor = localStorage.getItem(VISITOR_KEY);
  } catch {
    /* storage is blocked */
  }
  api
    .post("/traffic/share", {
      code,
      listing_type: listing.type,
      listing_id: listing.id,
      channel,
      visitor_id: visitor,
    })
    .catch(() => {});
}
