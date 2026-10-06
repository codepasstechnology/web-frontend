import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { AuthLayout, type AuthMessage } from "@/components/auth/AuthLayout";
import {
  ArrowIcon,
  FloatField,
  PrimaryButton,
  type BusyState,
  type Shake,
} from "@/components/auth/AuthFields";
import { isValidEmail } from "@/components/auth/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — Geo Pin Properties Kenya" }] }),
  component: ForgotPasswordPage,
});

const MESSAGES: AuthMessage[] = [
  { h: "Happens to the best of us.", n: "we'll get you back in" },
  { h: "Your plots are safe.", n: "nothing changes while you are away" },
  { h: "Back on the map in a minute.", n: "just three quick steps" },
];

const RESEND_SECONDS = 30;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [err, setErr] = useState("");
  const shake: Shake = attempt % 2 ? "b" : "a";
  const emailError = !email.trim()
    ? "Enter your email address."
    : !isValidEmail(email)
      ? "Enter a valid email address."
      : "";

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const send = async (address: string) => {
    setErr("");
    setBusy("loading");
    try {
      await api.post("/auth/forgot-password", { email: address });
      setBusy("success");
      window.setTimeout(() => {
        setBusy("idle");
        setSentTo(address);
        setWait(RESEND_SECONDS);
      }, 380);
    } catch (error: unknown) {
      const e = error as { errors?: Record<string, string[]>; message?: string };
      setErr(e?.errors?.email?.[0] ?? e?.message ?? "Something went wrong. Please try again.");
      setBusy("idle");
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (emailError) {
      setAttempt((n) => n + 1);
      return;
    }
    void send(email.trim());
  };

  return (
    <AuthLayout messages={MESSAGES}>
      {sentTo ? (
        <>
          <span className="ga-success-badge">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                className="ga-tick-draw"
                d="m5 12 5 5L20 7"
                stroke="#2F4520"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div role="status" className="ga-heading">
            <h1>
              Check your email<span className="ga-dot-mark">.</span>
            </h1>
            <p>
              We sent a reset link to <strong style={{ color: "#1E2418" }}>{sentTo}</strong>. Open
              it to choose a new password.
            </p>
          </div>

          <div className="ga-stack">
            <p className="ga-progress-head">
              <span>Didn&apos;t get it? Check your spam folder.</span>
              <button
                type="button"
                className="ga-btn ga-link"
                disabled={wait > 0}
                onClick={() => void send(sentTo)}
              >
                {wait > 0 ? `Resend in ${wait}s` : "Resend link"}
              </button>
            </p>
            <button
              type="button"
              className="ga-btn ga-link"
              onClick={() => {
                setSentTo(null);
                setBusy("idle");
              }}
            >
              Use a different email
            </button>
          </div>

          <Link to="/login" className="ga-btn ga-press ga-primary">
            Back to sign in
            <ArrowIcon />
          </Link>
        </>
      ) : (
        <>
          <Link to="/login" className="ga-link ga-back">
            <svg
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
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to sign in
          </Link>

          <div className="ga-heading">
            <h1>
              Forgot your password<span className="ga-dot-mark">?</span>
            </h1>
            <p>Enter the email you signed up with and we&apos;ll send you a reset link.</p>
          </div>

          <form onSubmit={onSubmit} className="ga-stack" noValidate>
            <FloatField
              id="fp-email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              error={tried ? emailError : ""}
              valid={isValidEmail(email)}
              shake={tried && emailError ? shake : null}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {err && (
              <p role="alert" className="ga-err">
                {err}
              </p>
            )}
            <PrimaryButton type="submit" busy={busy}>
              Send reset link
            </PrimaryButton>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
