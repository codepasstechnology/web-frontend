import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { MaintenanceMap } from "@/components/maintenance/MaintenanceMap";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import {
  MAINTENANCE_FLAG,
  emailError,
  formatCountdown,
  formatStarted,
  updatedAgo,
  useMaintenanceStatus,
} from "@/lib/maintenance";
import { safeReturnPath } from "@/lib/maintenanceRedirect";
import { loadPage } from "@/lib/pageNavigation";
import "./maintenance.css";

const TOAST_MS = 2800;
// Long enough for the refresh icon to visibly turn.
const MIN_CHECK_MS = 800;

const BEACON_TOASTS: Record<number, string> = {
  1: "Beacon placed. Tap more spots while you wait.",
  5: "5 beacons. You'd make a great surveyor.",
  12: "12 beacons. Kenya is fully pinned.",
};

const Icon = ({ d, size = 18, width = 2 }: { d: string; size?: number; width?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const TICK = "M5 12.5l4.5 4.5L19 7.5";
const CHAT = "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z";

export function MaintenancePage({ from }: { from?: string }) {
  const back = safeReturnPath(from);
  const { data: status, refetch } = useMaintenanceStatus();
  const { theme, toggle } = useTheme();
  const [now, setNow] = useState(() => Date.now());
  const [beacons, setBeacons] = useState(0);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const toastId = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isBack = !MAINTENANCE_FLAG && status?.maintenance === false;
  useEffect(() => {
    if (isBack) loadPage(back, true);
  }, [isBack, back]);

  const showToast = (text: string) => {
    const id = ++toastId.current;
    setToast({ id, text });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), TOAST_MS);
  };

  const onBeacon = (total: number) => {
    setBeacons(total);
    if (BEACON_TOASTS[total]) showToast(BEACON_TOASTS[total]);
  };

  const subscribe = async (e?: FormEvent) => {
    e?.preventDefault();
    const problem = emailError(email);
    setError(problem);
    if (problem || sending) return;
    setSending(true);
    try {
      await api.post("/status/notify", { email: email.trim() });
      setEmail(email.trim());
      setSubscribed(true);
    } catch (err) {
      if ((err as { status?: number }).status === 409) loadPage(back, true);
      else setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const checkAgain = async () => {
    if (checking) return;
    setChecking(true);
    const [result] = await Promise.all([
      refetch(),
      new Promise((r) => window.setTimeout(r, MIN_CHECK_MS)),
    ]);
    setChecking(false);
    if (!MAINTENANCE_FLAG && result.data?.maintenance === false) {
      showToast("We're back. Taking you there…");
    } else {
      showToast("Still upgrading. We'll be back soon.");
    }
  };

  const unplanned = status?.mode === "unplanned";
  const left = status?.ends_at ? (Date.parse(status.ends_at) - now) / 1000 : null;
  const done = left !== null && left <= 0;
  const countdown = left !== null && !done ? formatCountdown(left) : null;
  const showEta = left !== null || unplanned;
  let win: { label: string; text: string } | null = null;
  if (unplanned && status?.started_at) {
    win = { label: "Started", text: formatStarted(status.started_at, new Date(now)) };
  } else if (!unplanned && status?.window_label) {
    win = { label: "Maintenance window", text: status.window_label };
  }
  const progress = status?.progress ?? null;
  const updated = status?.updated_at
    ? updatedAgo((now - Date.parse(status.updated_at)) / 1000)
    : null;
  const showCard = showEta || !!win || progress !== null;

  let etaLabel = "Back in about";
  if (done) etaLabel = "Almost there";
  else if (unplanned) etaLabel = "Estimated time";

  const facts = [
    {
      icon: "M12 3l7 3v5c0 5-3.4 8.6-7 10-3.6-1.4-7-5-7-10V6l7-3zM9 12l2 2 4-4",
      title: "Your data is safe",
      text: "Accounts, saved plots and listings were backed up first.",
    },
    {
      icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 9v6M14 9v6",
      title: "Posting is paused",
      text: unplanned
        ? "Drafts you were writing may need saving again."
        : "New listings and edits open again when we finish.",
    },
    {
      icon: CHAT,
      title: "Messages will send",
      text: "Anything you sent owners or agents goes out when we are back.",
    },
  ];

  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <div className="mt-root">
      <Link to="/" className="mt-logo" aria-label="Geo Pin home">
        <span className="mt-logo-tile">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <span className="mt-logo-text">Geo Pin</span>
      </Link>
      <button
        type="button"
        className="mt-tg"
        onClick={(e: MouseEvent<HTMLButtonElement>) =>
          toggle({ clientX: e.clientX, clientY: e.clientY })
        }
        aria-label={themeLabel}
        title={themeLabel}
      >
        {theme === "dark" ? (
          <Icon d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        ) : (
          <Icon d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </button>

      <div className="mt-wrap">
        <div className="mt-mapcol">
          <MaintenanceMap onBeacon={onBeacon} />
        </div>

        <main className="mt-col">
          <h1 className="mt-h mt-r" style={{ animationDelay: ".2s" }}>
            {unplanned ? "We're fixing something." : "We're re-surveying the map."}
          </h1>
          <p className="mt-lede mt-r" style={{ animationDelay: ".3s" }}>
            {unplanned
              ? "Something went wrong on our side and Geo Pin is offline while we fix it. Your account, saved plots and listings are safe. Nothing you posted has been lost."
              : "Geo Pin is down for a planned upgrade. We're moving to faster map tiles and re-checking plot boundaries so the map loads quicker and the corners sit exactly where they should. Your account, saved plots and listings are safe."}
          </p>

          {showCard && (
            <div className="mt-card mt-status mt-r" style={{ animationDelay: ".4s" }}>
              {(showEta || win) && (
                <div className="mt-status-top">
                  {showEta && (
                    <div className="mt-eta">
                      <span className="mt-unit">{etaLabel}</span>
                      {countdown ? (
                        <div
                          className="mt-countdown"
                          role="timer"
                          aria-live="off"
                          aria-label={countdown.label}
                        >
                          {countdown.parts.map((p) => (
                            <div key={p.unit} className="mt-count-part">
                              <span className="mt-num">{p.value}</span>
                              <span className="mt-unit">{p.unit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="mt-num mt-num-text">
                          {done ? "Any minute now" : "We're on it"}
                        </span>
                      )}
                    </div>
                  )}
                  {win && (
                    <div className="mt-win">
                      <span>{win.label}</span>
                      <span className="mt-mono mt-win-text">{win.text}</span>
                    </div>
                  )}
                </div>
              )}

              {progress !== null && (
                <>
                  <div className="mt-progress">
                    <div
                      className="mt-bar"
                      role="progressbar"
                      aria-label="Maintenance progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-progress-meta">
                      <span>{progress}% done</span>
                      {updated && <span>Updated {updated}</span>}
                    </div>
                  </div>
                  <ul className="mt-steps">
                    {status?.steps.map((s) => (
                      <li key={s.label} className="mt-step">
                        <span className="mt-sdot" data-s={s.state}>
                          {s.state === "done" && <Icon d={TICK} size={14} width={3} />}
                        </span>
                        <span
                          className={s.state === "next" ? "mt-step-label is-next" : "mt-step-label"}
                        >
                          {s.label}
                        </span>
                        <span className="mt-step-note">
                          {s.state === "done"
                            ? "Done"
                            : s.state === "active"
                              ? "In progress"
                              : "Up next"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="mt-facts mt-r" style={{ animationDelay: ".5s" }}>
            {facts.map((f) => (
              <div key={f.title} className="mt-card mt-fact">
                <span className="mt-fact-icon">
                  <Icon d={f.icon} />
                </span>
                <span className="mt-fact-copy">
                  <span className="mt-fact-title">{f.title}</span>
                  <span className="mt-fact-text">{f.text}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-notify mt-r" style={{ animationDelay: ".6s" }}>
            {subscribed ? (
              <div className="mt-card mt-done" role="status">
                <span className="mt-done-icon">
                  <Icon d={TICK} size={16} width={3} />
                </span>
                <span className="mt-done-copy">
                  <span className="mt-done-title">You're on the list.</span>
                  <span className="mt-done-text">
                    We'll email <strong>{email}</strong> when Geo Pin is back.
                  </span>
                </span>
                <button type="button" className="mt-change" onClick={() => setSubscribed(false)}>
                  Change
                </button>
              </div>
            ) : (
              <form className="mt-form" onSubmit={subscribe} noValidate>
                <label htmlFor="mt-email" className="mt-label">
                  Get an email the moment we're back
                </label>
                <div className="mt-form-row">
                  <input
                    id="mt-email"
                    className="mt-input"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby="mt-email-err"
                  />
                  <button type="submit" className="mt-btn" disabled={sending}>
                    <Icon d="M3 6h18v12H3zM3 7l9 6 9-6" />
                    Notify me
                  </button>
                </div>
                <span id="mt-email-err" className="mt-err" hidden={!error}>
                  {error}
                </span>
              </form>
            )}

            <div className="mt-actions">
              <button
                type="button"
                className="mt-ghost"
                onClick={checkAgain}
                aria-busy={checking ? "true" : "false"}
              >
                <span className={checking ? "mt-check-icon is-spinning" : "mt-check-icon"}>
                  <Icon
                    d="M20 11a8 8 0 0 0-14.9-3.9M4 4v4h4M4 13a8 8 0 0 0 14.9 3.9M20 20v-4h-4"
                    size={17}
                  />
                </span>
                {checking ? "Checking…" : "Check again"}
              </button>
              <Link to="/help" className="mt-ghost">
                <Icon
                  d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"
                  size={17}
                />
                Help centre
              </Link>
              <Link to="/contact" className="mt-ghost">
                <Icon d={CHAT} size={17} />
                Contact us
              </Link>
            </div>
            <span className="mt-note mt-tapnote">
              {beacons >= 5 ? "nice pinning!" : "thanks for your patience"}
            </span>
          </div>
        </main>
      </div>

      {toast && (
        <div key={toast.id} className="mt-toast" role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
