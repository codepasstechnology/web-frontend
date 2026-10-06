import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { AuthLayout, type AuthMessage } from "@/components/auth/AuthLayout";
import {
  ArrowIcon,
  EyeButton,
  FloatField,
  PrimaryButton,
  StrengthMeter,
  type BusyState,
  type Shake,
} from "@/components/auth/AuthFields";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Geo Pin Properties Kenya" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: ResetPasswordPage,
});

const MESSAGES: AuthMessage[] = [
  { h: "Almost back in.", n: "one new password and you're done" },
  { h: "Your plots are safe.", n: "nothing changes while you are away" },
  { h: "Pick one you'll remember.", n: "at least 8 characters" },
];

function ResetPasswordPage() {
  const { token, email } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [tried, setTried] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const shake: Shake = attempt % 2 ? "b" : "a";

  const passwordError = password.length < 8 ? "Use at least 8 characters." : "";
  const confirmError = confirm !== password ? "Passwords do not match." : "";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setErr("");
    if (passwordError || confirmError) {
      setAttempt((n) => n + 1);
      return;
    }
    setBusy("loading");
    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setBusy("success");
      window.setTimeout(() => {
        setBusy("idle");
        setDone(true);
      }, 380);
    } catch (error: unknown) {
      const e = error as { errors?: Record<string, string[]>; message?: string };
      setErr(
        e?.errors?.email?.[0] ??
          e?.errors?.password?.[0] ??
          e?.message ??
          "This reset link is invalid or has expired.",
      );
      setBusy("idle");
    }
  };

  return (
    <AuthLayout messages={MESSAGES}>
      {done ? (
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
              Password reset<span className="ga-dot-mark">.</span>
            </h1>
            <p>You&apos;re all set. Sign in with your new password.</p>
          </div>
          <Link to="/login" className="ga-btn ga-press ga-primary">
            Back to sign in
            <ArrowIcon />
          </Link>
        </>
      ) : (
        <>
          <div className="ga-heading">
            <h1>
              Choose a new password<span className="ga-dot-mark">.</span>
            </h1>
            <p>Make it something you haven&apos;t used before on Geo Pin.</p>
          </div>

          <form onSubmit={onSubmit} className="ga-stack" noValidate>
            <FloatField
              id="rp-pw"
              label="New password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={setPassword}
              error={tried ? passwordError : ""}
              shake={tried && passwordError ? shake : null}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              action={<EyeButton shown={showPw} onToggle={() => setShowPw((v) => !v)} />}
            />
            <StrengthMeter pw={password} error={tried ? passwordError : ""} />
            <FloatField
              id="rp-pw2"
              label="Confirm new password"
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={setConfirm}
              error={tried ? confirmError : ""}
              valid={!!confirm && !confirmError}
              shake={tried && confirmError ? shake : null}
              placeholder="Type it again"
              autoComplete="new-password"
            />
            {err && (
              <p role="alert" className="ga-err">
                {err}
              </p>
            )}
            <PrimaryButton type="submit" busy={busy}>
              Reset password
            </PrimaryButton>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
