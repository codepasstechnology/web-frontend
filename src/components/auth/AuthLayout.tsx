import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { KenyaMap } from "./KenyaMap";
import "./auth.css";

export interface AuthMessage {
  h: string;
  n: string;
}

const ROTATE_MS = 5500;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** The split layout shared by sign in, register and forgot password. */
export function AuthLayout({
  messages,
  perks,
  children,
  wide = false,
}: {
  messages: AuthMessage[];
  perks?: { icon: ReactNode; text: string }[];
  children: ReactNode;
  wide?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [run, setRun] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
      setRun((r) => r + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  const show = (i: number) => {
    setIndex(i);
    setRun((r) => r + 1);
  };

  // The map drifts a little toward the cursor, the way the design's parallax does.
  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = mapRef.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.style.setProperty("--mx", `${(-dx * 16).toFixed(1)}px`);
    el.style.setProperty("--my", `${(-dy * 12).toFixed(1)}px`);
  };
  const onLeave = () => {
    mapRef.current?.style.setProperty("--mx", "0px");
    mapRef.current?.style.setProperty("--my", "0px");
  };

  const message = messages[index];
  const swap = run % 2 ? "ga-swap-b" : "ga-swap-a";

  return (
    <div className="ga-page">
      <div className="ga-split">
        <aside className="ga-side" onMouseMove={onMove} onMouseLeave={onLeave}>
          <Link to="/" className="ga-side-brand">
            <span className="ga-brand-tile">
              <svg
                width="19"
                height="19"
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
            <span className="ga-brand-text">Geo Pin</span>
          </Link>

          <div className="ga-side-map" aria-hidden="true">
            <KenyaMap ref={mapRef} />
          </div>

          <div className="ga-side-copy">
            <div className="ga-message" aria-live="polite">
              <h2 className={swap}>{message.h}</h2>
              <span className={`ga-note ${swap}`}>{message.n}</span>
            </div>
            {perks && (
              <ul className="ga-perks">
                {perks.map((p) => (
                  <li key={p.text}>
                    <span className="ga-perk-icon">{p.icon}</span>
                    {p.text}
                  </li>
                ))}
              </ul>
            )}
            <div className="ga-dots">
              {messages.map((m, i) => (
                <button
                  key={m.h}
                  type="button"
                  className="ga-dot-btn"
                  onClick={() => show(i)}
                  aria-label={`Show message ${i + 1}`}
                >
                  <span className={`ga-dot${i === index ? " is-active" : ""}`} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="ga-main">
          <div className={`ga-form-col${wide ? " is-wide" : ""}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
