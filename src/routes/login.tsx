import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPinned, Eye, EyeOff, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Geo Properties Kenya" }] }),
  component: LoginPage,
});

export function LoginPage() {
  const { login, loginWithGoogle, verifyTwoFactor, resendTwoFactorCode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [challenge, setChallenge] = useState<{ token: string; email: string } | null>(null);
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  const goToDashboard = (role: string) => {
    setSuccess(true);
    setTimeout(() => {
      if (role === "account_manager") {
        navigate({ to: "/manager" });
      } else {
        navigate({ to: "/dashboard", search: { tab: undefined } });
      }
    }, 1500);
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email.trim()) {
      setErr("Email is required.");
      return;
    }
    if (!password) {
      setErr("Password is required.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      if (result.status === "two_factor_required") {
        setChallenge({ token: result.challenge, email: result.email });
        setPassword("");
      } else {
        goToDashboard(result.user.role);
      }
    } catch (err: unknown) {
      setErr(readError(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleCredential = async (credential: string) => {
    setErr("");
    setLoading(true);
    try {
      const result = await loginWithGoogle(credential);
      if (result.status === "two_factor_required") {
        setChallenge({ token: result.challenge, email: result.email });
      } else {
        goToDashboard(result.user.role);
      }
    } catch (err: unknown) {
      setErr(readError(err, "Google sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setErr("");
    setResent(false);
    setLoading(true);
    try {
      const u = await verifyTwoFactor(challenge.token, code, rememberMe);
      goToDashboard(u.role);
    } catch (err: unknown) {
      setErr(readError(err, "That code didn't work. Please try again."));
      setCode("");
    } finally {
      setLoading(false);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      {/* Full-screen background photo */}
      <img
        src="https://images.unsplash.com/photo-1535342604578-a175d3fc4f22?w=1920&q=90&auto=format&fit=crop"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
        draggable={false}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      {/* Logo — top left */}
      <div className="absolute left-6 top-6 z-20 sm:left-8 sm:top-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-blue-900/60">
            <MapPinned className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white drop-shadow">
            Geo Properties
          </span>
        </Link>
      </div>

      {/* Back to home — top right */}
      <div className="absolute right-6 top-6 z-20 sm:right-8 sm:top-8">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* ── Form card ── */}
      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="rounded-2xl bg-white/15 px-8 py-9 shadow-2xl shadow-black/50 ring-1 ring-white/25 backdrop-blur-2xl">
          {success ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-white">Welcome back!</h2>
              <p className="mt-1.5 text-sm text-white/60">Taking you to your dashboard…</p>
              <div className="mt-6 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ animation: "lv-fill 1.5s linear forwards" }}
                />
              </div>
            </div>
          ) : challenge ? (
            /* ── Two-factor code state ── */
            <>
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-white drop-shadow">Check your email</h1>
                <p className="mt-1.5 text-sm text-white/70">
                  We sent a 6-digit sign-in code to{" "}
                  <span className="font-semibold text-white">{challenge.email}</span>.
                </p>
              </div>

              {err && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-200">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/40 text-xs font-bold text-red-200 ring-1 ring-red-400/50">
                    !
                  </span>
                  {err}
                </div>
              )}
              {resent && !err && (
                <div className="mb-5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-200">
                  A new code is on its way.
                </div>
              )}

              <form onSubmit={onSubmitCode} className="space-y-4">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  className="lv-input text-center text-lg font-semibold tracking-[0.3em]"
                />

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      {" "}
                      Verify <ArrowRight className="h-4 w-4" />{" "}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={onResend}
                  className="font-semibold text-blue-300 hover:text-blue-200 hover:underline"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className="text-white/60 hover:text-white hover:underline"
                >
                  Use a different account
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-white drop-shadow">Welcome back</h1>
                <p className="mt-1.5 text-sm text-white/70">
                  Sign in to manage your verified land listings across Kenya.
                </p>
              </div>

              {err && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-200">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/40 text-xs font-bold text-red-200 ring-1 ring-red-400/50">
                    !
                  </span>
                  {err}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-white">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="lv-input"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-white">Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-blue-300 hover:text-blue-200 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="lv-input pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-[#2563EB]"
                  />
                  Remember me
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      {" "}
                      Sign in <ArrowRight className="h-4 w-4" />{" "}
                    </>
                  )}
                </button>
              </form>

              {/* OR divider */}
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-xs text-white/40">or</span>
                <div className="h-px flex-1 bg-white/15" />
              </div>

              {/* Google sign-in */}
              <GoogleSignInButton onCredential={onGoogleCredential} text="continue_with" />

              <p className="mt-6 text-center text-sm text-white/70">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-blue-300 hover:text-blue-200 hover:underline"
                >
                  Create one free
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Terms & Privacy */}
        <p className="mt-5 text-center text-xs text-white/40">
          By signing in you agree to our{" "}
          <Link
            to="/terms"
            className="text-white/60 underline underline-offset-2 hover:text-white transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="text-white/60 underline underline-offset-2 hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <style>{`
        @keyframes lv-fill { from { width: 0 } to { width: 100% } }
        .lv-input {
          display: block; width: 100%; height: 44px;
          padding: 0 14px; font-size: 14px;
          color: #fff; background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.25); border-radius: 10px;
          outline: none; transition: border-color .15s, box-shadow .15s, background .15s;
        }
        .lv-input:hover  { border-color: rgba(255,255,255,0.4); }
        .lv-input:focus  { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,.25); background: rgba(255,255,255,0.2); }
        .lv-input::placeholder { color: rgba(255,255,255,0.4); }
        .lv-input::-ms-reveal { display: none; }
        .lv-input:-webkit-autofill,
        .lv-input:-webkit-autofill:hover,
        .lv-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(30,40,60,0.85) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
          border-color: rgba(255,255,255,0.25) !important;
        }
      `}</style>
    </div>
  );
}
