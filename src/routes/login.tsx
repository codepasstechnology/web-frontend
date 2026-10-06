import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AuthLayout, type AuthMessage } from "@/components/auth/AuthLayout";
import {
  ArrowIcon,
  EyeButton,
  FloatField,
  PrimaryButton,
  TickIcon,
  type BusyState,
  type Shake,
} from "@/components/auth/AuthFields";
import { isValidEmail } from "@/components/auth/validation";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Geo Pin Properties Kenya" }] }),
  component: LoginPage,
});

const MESSAGES: AuthMessage[] = [
  { h: "Your plots are right where you left them.", n: "welcome back, karibu tena!" },
  { h: "See boundaries before you visit.", n: "no more guessing where it ends" },
  { h: "Every listing checked.", n: "look for the green badge ✓" },
];

export function LoginPage() {
  const { login, loginWithGoogle, verifyTwoFactor, resendTwoFactorCode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [tried, setTried] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<BusyState>("idle");
  const [challenge, setChallenge] = useState<{ token: string; email: string } | null>(null);
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  const emailError = !email.trim()
    ? "Enter your email address."
    : !isValidEmail(email)
      ? "Enter a valid email address."
      : "";
  const passwordError = password ? "" : "Enter your password.";
  const shake: Shake = attempt % 2 ? "b" : "a";

  const goToDashboard = () => {
    setBusy("success");
    navigate({ to: "/loading", search: { mode: "login" } });
  };

  const readError = (err: unknown, fallback: string) => {
    const e = err as { errors?: Record<string, string[]>; message?: string };
    return (
      e?.errors?.email?.[0] ??
      e?.errors?.code?.[0] ??
      e?.errors?.challenge?.[0] ??
      e?.errors?.credential?.[0] ??
      e?.errors?.password?.[0] ??
      e?.message ??
      fallback
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (emailError || passwordError) {
      setAttempt((n) => n + 1);
      return;
    }
    setErr("");
    setBusy("loading");
    try {
      const result = await login(email, password, rememberMe);
      if (result.status === "two_factor_required") {
        setChallenge({ token: result.challenge, email: result.email });
        setPassword("");
        setBusy("idle");
      } else {
        goToDashboard();
      }
    } catch (err: unknown) {
      setErr(readError(err, "Login failed. Please try again."));
      setAttempt((n) => n + 1);
      setBusy("idle");
    }
  };

  const onGoogleCredential = async (credential: string) => {
    setErr("");
    try {
      const result = await loginWithGoogle(credential);
      if (result.status === "two_factor_required") {
        setChallenge({ token: result.challenge, email: result.email });
      } else {
        goToDashboard();
      }
    } catch (err: unknown) {
      setErr(readError(err, "Google sign-in failed. Please try again."));
    }
  };

  const onSubmitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setErr("");
    setResent(false);
    setBusy("loading");
    try {
      const u = await verifyTwoFactor(challenge.token, code, rememberMe);
      goToDashboard();
    } catch (err: unknown) {
      setErr(readError(err, "That code didn't work. Please try again."));
      setCode("");
      setBusy("idle");
    }
  };

  const onResend = async () => {
    if (!challenge) return;
    setErr("");
    setResent(false);
    try {
      await resendTwoFactorCode(challenge.token);
      setResent(true);
    } catch (err: unknown) {
      setErr(readError(err, "Could not send a new code. Please try again."));
    }
  };

  const restart = () => {
    setChallenge(null);
    setCode("");
    setErr("");
    setResent(false);
  };

  return (
    <AuthLayout messages={MESSAGES}>
      {busy === "success" && (
        <div role="status" className="ga-status">
          <TickIcon className="ga-status-icon" />
          Signed in. Taking you to your dashboard…
        </div>
      )}
      {challenge ? (
        <>
          <div className="ga-heading">
            <h1>
              Check your email<span className="ga-dot-mark">.</span>
            </h1>
            <p>
              We sent a 6-digit sign-in code to{" "}
              <strong style={{ color: "#1E2418" }}>{challenge.email}</strong>.
            </p>
          </div>

          {err && (
            <p role="alert" className="ga-err">
              {err}
            </p>
          )}
          {resent && !err && <p className="ga-status">A new code is on its way.</p>}

          <form onSubmit={onSubmitCode} className="ga-stack">
            <FloatField
              id="login-code"
              label="Sign-in code"
              value={code}
              onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <PrimaryButton type="submit" busy={busy} disabled={code.length !== 6}>
              Verify
            </PrimaryButton>
          </form>

          <div className="ga-progress-head">
            <button type="button" className="ga-btn ga-link" onClick={onResend}>
              Resend code
            </button>
            <button type="button" className="ga-btn ga-link" onClick={restart}>
              Use a different account
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="ga-heading">
            <h1>
              Sign in<span className="ga-dot-mark">.</span>
            </h1>
          </div>

          <div className="ga-google-slot">
            <GoogleSignInButton onCredential={onGoogleCredential} text="continue_with" />
          </div>

          <div className="ga-or" aria-hidden="true">
            <span />
            or with your email
            <span />
          </div>

          <form onSubmit={onSubmit} className="ga-stack" noValidate>
            <FloatField
              id="login-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              error={tried ? emailError : ""}
              valid={isValidEmail(email)}
              shake={tried && emailError ? shake : null}
              placeholder="you@example.com"
              autoComplete="username"
            />
            <FloatField
              id="login-password"
              label="Password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={setPassword}
              error={tried ? passwordError : ""}
              shake={tried && passwordError ? shake : null}
              placeholder="Your password"
              autoComplete="current-password"
              action={<EyeButton shown={showPw} onToggle={() => setShowPw((v) => !v)} />}
            />
            {err && (
              <p role="alert" className="ga-err">
                {err}
              </p>
            )}

            <div className="ga-progress-head">
              <label className="ga-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Keep me signed in
              </label>
              <Link to="/forgot-password" className="ga-link">
                Forgot password?
              </Link>
            </div>

            <PrimaryButton type="submit" busy={busy}>
              Sign in
            </PrimaryButton>
          </form>

          <Link to="/register" className="ga-newcard ga-press">
            <span className="ga-newcard-icon">
              <svg width="22" height="22" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <path
                  d="M15 27s-9-7.8-9-14a9 9 0 0 1 18 0c0 6.2-9 14-9 14z"
                  stroke="#FFF6EA"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 9v8M11 13h8"
                  stroke="#FFF6EA"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="ga-newcard-text">
              <span className="ga-newcard-title">New to Geo Pin?</span>
              <span className="ga-newcard-desc">
                Create an account to save plots and get alerts for land near you.
              </span>
            </span>
            <span className="ga-newbtn">
              Sign up
              <ArrowIcon />
            </span>
            <span className="ga-doodle" aria-hidden="true">
              it&apos;s quick!
            </span>
          </Link>

          <p className="ga-help">
            Need help? <a href="/contact">Contact support</a>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
