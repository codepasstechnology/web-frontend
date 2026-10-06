import type { ReactNode } from "react";
import { PASSWORD_LABELS, passwordScore } from "./validation";

export function TickIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "ga-tick"}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12 5 5L20 7"
        stroke="#6E8B47"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg
      className="ga-arrow"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export type Shake = "a" | "b" | null;

interface FloatFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  valid?: boolean;
  shake?: Shake;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  prefix?: string;
  action?: ReactNode;
}

/** A floating-label field with the design's focus ring, valid tick and error shake. */
export function FloatField({
  id,
  label,
  value,
  onChange,
  error,
  valid,
  shake,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  prefix,
  action,
}: FloatFieldProps) {
  const errorId = `${id}-msg`;
  const classes = [
    "ga-float",
    prefix && "has-prefix",
    valid && !error && "has-tick",
    action && "has-action",
    shake === "a" && "ga-shake-a",
    shake === "b" && "ga-shake-b",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="ga-field">
      <div className={classes}>
        {prefix && (
          <span className="ga-prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          className="ga-input"
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <label htmlFor={id}>{label}</label>
        {valid && !error && <TickIcon />}
        {action}
      </div>
      {error && (
        <span id={errorId} className="ga-err">
          {error}
        </span>
      )}
    </div>
  );
}

/** The 4-segment strength meter and its hint, shared by sign-up, reset and the password step. */
export function StrengthMeter({ pw, error }: { pw: string; error?: string }) {
  const score = passwordScore(pw);
  const fills = ["#DCD3BF", "#C9B98F", "#A9C97A", "#6E8B47", "#3F5A2A"];
  const hint =
    error ||
    (score ? PASSWORD_LABELS[score] : "Use 8+ characters with a mix of letters and numbers.");
  return (
    <>
      <div className="ga-meter" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="ga-meter-track">
            <span
              className="ga-meter-fill"
              style={{
                background: fills[score],
                transform: `scaleX(${i <= score ? 1 : 0})`,
              }}
            />
          </span>
        ))}
      </div>
      <span className={`ga-hint${error ? " is-error" : ""}`}>{hint}</span>
    </>
  );
}

export function EyeButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="ga-eye"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#56594A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#56594A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export type BusyState = "idle" | "loading" | "success";

/** Primary action: arrow when idle, spinner while the request is in flight, tick on success. */
export function PrimaryButton({
  busy,
  onClick,
  type = "button",
  disabled = false,
  children,
}: {
  busy: BusyState;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      className="ga-btn ga-press ga-primary"
      onClick={onClick}
      disabled={disabled || busy !== "idle"}
      aria-busy={busy !== "idle"}
    >
      {busy === "idle" && (
        <span className="ga-row-inline">
          {children}
          <ArrowIcon />
        </span>
      )}
      {busy === "loading" && (
        <svg
          className="ga-spin"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          role="img"
          aria-label="Working"
        >
          <circle cx="12" cy="12" r="9" stroke="rgba(255,246,234,0.3)" strokeWidth="2.5" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="#FFF6EA" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      {busy === "success" && (
        <svg
          className="ga-fade-in"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          role="img"
          aria-label="Done"
        >
          <path
            d="m5 12 5 5L20 7"
            stroke="#FFF6EA"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
