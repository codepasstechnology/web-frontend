import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPinned, Eye, EyeOff, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — LandConnect Kenya" }] }),
  component: LoginPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email.trim()) { setErr("Email is required."); return; }
    if (!password)     { setErr("Password is required."); return; }
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      setSuccess(true);
      setTimeout(() => navigate({ to: "/dashboard", search: { tab: undefined } }), 1500);
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      setErr(e?.errors?.email?.[0] ?? e?.errors?.password?.[0] ?? e?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <span className="text-base font-semibold tracking-tight text-white drop-shadow">LandConnect</span>
        </Link>
      </div>

      {/* Back to home — top right */}
      <div className="absolute right-6 top-6 z-20 sm:right-8 sm:top-8">
        <Link to="/" className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* Photo credit — bottom left */}
      <p className="absolute bottom-4 left-6 z-20 text-[10px] text-white/30">
        David Clode / Unsplash — Samburu, Kenya
      </p>

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
                <div className="h-full rounded-full bg-emerald-400" style={{ animation: "lv-fill 1.5s linear forwards" }} />
              </div>
            </div>
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
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/40 text-xs font-bold text-red-200 ring-1 ring-red-400/50">!</span>
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
                <Link to="/forgot-password" className="text-xs font-semibold text-blue-300 hover:text-blue-200 hover:underline">
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
              {loading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <> Sign in <ArrowRight className="h-4 w-4" /> </>
              }
            </button>
          </form>

          {/* OR divider */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-xs text-white/40">or</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={() => { /* TODO: initiate Google OAuth once credentials are added */ }}
            className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-white/70">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-blue-300 hover:text-blue-200 hover:underline">
              Create one free
            </Link>
          </p>
          </>
          )}
        </div>

        {/* Terms & Privacy */}
        <p className="mt-5 text-center text-xs text-white/40">
          By signing in you agree to our{" "}
          <Link to="/terms" className="text-white/60 underline underline-offset-2 hover:text-white transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-white/60 underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</Link>.
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
