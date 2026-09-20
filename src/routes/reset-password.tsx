import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPinned, Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — GeoPin Properties Kenya" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, email } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setSuccess(true);
    } catch (error: unknown) {
      const e = error as { errors?: Record<string, string[]>; message?: string };
      setErr(
        e?.errors?.email?.[0] ??
          e?.errors?.password?.[0] ??
          e?.message ??
          "This reset link is invalid or has expired.",
      );
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
      <div className="absolute inset-0 bg-black/60" />

      {/* Logo — top left */}
      <div className="absolute left-6 top-6 z-20 sm:left-8 sm:top-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand">
            <MapPinned className="h-5 w-5 text-brand-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">
            GeoPin Properties
          </span>
        </Link>
      </div>

      {/* Back to home — top right */}
      <div className="absolute right-6 top-6 z-20 sm:right-8 sm:top-8">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-md border border-white/20 bg-black/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* ── Form card ── */}
      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="rounded-lg border border-border bg-card px-8 py-9 shadow-md">
          {!token || !email ? (
            /* ── Missing/invalid link ── */
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-destructive-subtle">
                  <Lock className="h-7 w-7 text-destructive" />
                </div>
              </div>
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-foreground">Invalid reset link</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This password reset link is missing or malformed. Request a new one below.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                Request a new link
              </Link>
            </>
          ) : success ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-foreground">Password reset</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-subtle">
                  <Lock className="h-7 w-7 text-brand-subtle-foreground" />
                </div>
              </div>

              {/* Heading */}
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter a new password for{" "}
                  <span className="font-semibold text-foreground">{email}</span>.
                </p>
              </div>

              {err && (
                <div className="mb-5 flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive-subtle-foreground">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-xs font-bold text-destructive">
                    !
                  </span>
                  {err}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-foreground">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rp-input pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-foreground">
                    Confirm new password
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="rp-input"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "Reset password"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Back to login */}
          {!success && (
            <div className="mt-6 flex justify-center">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .rp-input {
          display: block; width: 100%; height: 44px;
          padding: 0 14px; font-size: 14px;
          color: var(--foreground); background: var(--background);
          border: 1.5px solid var(--border); border-radius: var(--radius-md);
          outline: none; transition: border-color .15s, box-shadow .15s;
        }
        .rp-input:hover  { border-color: var(--muted-foreground); }
        .rp-input:focus  { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in oklch, var(--brand) 20%, transparent); }
        .rp-input::placeholder { color: var(--muted-foreground); }
      `}</style>
    </div>
  );
}
