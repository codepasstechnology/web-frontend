import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

const CONSENT_KEY = "gp_cookie_consent";
// Ask again a year after a choice, as consent guidance recommends.
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** "all" allows visit tracking; "essential" keeps only what the site needs to work. */
export type Consent = "all" | "essential";

type Source = "banner" | "settings" | "gpc" | "account";
type SavedChoice = { choice: Consent; at: number; version: string; id: string };
type ConsentState = { ready: boolean; consent: Consent | null; savedAt: number | null };
type ConsentResponse = {
  policy_version: string;
  saved: { choice: Consent; policy_version: string; at: string } | null;
};

const SERVER_STATE: ConsentState = { ready: false, consent: null, savedAt: null };
const listeners = new Set<() => void>();
let state: ConsentState | null = null;
let policyVersion: string | null = null;

function readSaved(): SavedChoice | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null") as SavedChoice | null;
    return saved && (saved.choice === "all" || saved.choice === "essential") ? saved : null;
  } catch {
    return null;
  }
}

/** A choice lasts 12 months, and only for the cookie policy version it was made under. */
function isCurrent(saved: SavedChoice | null): saved is SavedChoice {
  return (
    !!saved &&
    Date.now() - saved.at < MAX_AGE_MS &&
    (policyVersion === null || saved.version === policyVersion)
  );
}

export function getConsent(): Consent | null {
  const saved = readSaved();
  return isCurrent(saved) ? saved.choice : null;
}

function current(): Pick<ConsentState, "consent" | "savedAt"> {
  const saved = readSaved();
  return isCurrent(saved)
    ? { consent: saved.choice, savedAt: saved.at }
    : { consent: null, savedAt: null };
}

function snapshot(): ConsentState {
  state ??= { ready: false, ...current() };
  return state;
}

function update(next: Partial<ConsentState>): void {
  state = { ...snapshot(), ...next };
  listeners.forEach((l) => l());
}

function record(saved: SavedChoice, source: Source): void {
  api
    .post("/cookie-consent", {
      consent_id: saved.id,
      choice: saved.choice,
      policy_version: saved.version,
      source,
    })
    .catch(() => {});
}

function save(choice: Consent, at = Date.now()): SavedChoice {
  const saved = {
    choice,
    at,
    version: policyVersion ?? "0",
    id: readSaved()?.id ?? crypto.randomUUID(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(saved));
  } catch {
    /* storage is blocked; the choice lasts for this page only */
  }
  return saved;
}

export function setConsent(choice: Consent, source: "banner" | "settings" = "banner"): void {
  record(save(choice), source);
  update(current());
}

/**
 * Loads the current policy version and, for a signed-in visitor, the choice
 * saved on their account; the newer of that and this browser's choice wins.
 * A browser sending Global Privacy Control gets "essential" without asking.
 */
export async function syncConsent(signedIn: boolean): Promise<void> {
  const remote = await api.get<ConsentResponse>("/cookie-consent").catch(() => null);
  const local = readSaved();
  policyVersion = remote?.policy_version ?? local?.version ?? "0";

  const account = remote?.saved;
  const accountAt = account ? Date.parse(account.at) : 0;
  const accountCurrent =
    !!account && account.policy_version === policyVersion && Date.now() - accountAt < MAX_AGE_MS;
  const localCurrent = isCurrent(local);

  if (accountCurrent && (!localCurrent || accountAt > local.at)) {
    save(account.choice, accountAt);
  } else if (signedIn && localCurrent && (!account || local.at > accountAt)) {
    record(local, "account");
  } else if (
    !localCurrent &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  ) {
    record(save("essential"), "gpc");
  }

  update({ ready: true, ...current() });
}

export function useCookieConsent(): ConsentState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    snapshot,
    () => SERVER_STATE,
  );
}
