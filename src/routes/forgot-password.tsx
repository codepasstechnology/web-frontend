import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPinned, Mail, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — GeoPin Properties Kenya" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (error: unknown) {
      const e = error as { errors?: Record<string, string[]>; message?: string };
      setErr(e?.errors?.email?.[0] ?? e?.message ?? "Something went wrong. Please try again.");
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
          {!submitted ? (
            <>
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-subtle">
                  <Mail className="h-7 w-7 text-brand-subtle-foreground" />
                </div>
              </div>

              {/* Heading */}
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your registered email and we'll send you a link to reset your password.
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
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="fp-input has-icon"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Success state ── */
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-success-subtle">
                  <Mail className="h-7 w-7 text-success" />
                </div>
              </div>
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We've sent a password reset link to{" "}
                  <span className="font-semibold text-foreground">{email}</span>. Check your spam
                  folder if you don't see it.
                </p>
              </div>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="w-full rounded-md border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Try a different email
              </button>
            </>
          )}

          {/* Back to login */}
          <div className="mt-6 flex justify-center">
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .fp-input {
          display: block; width: 100%; height: 44px;
          padding: 0 14px; font-size: 14px;
          color: var(--foreground); background: var(--background);
          border: 1.5px solid var(--border); border-radius: var(--radius-md);
          outline: none; transition: border-color .15s, box-shadow .15s;
        }
        .fp-input.has-icon { padding-left: 2.75rem; }
        .fp-input:hover  { border-color: var(--muted-foreground); }
        .fp-input:focus  { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in oklch, var(--brand) 20%, transparent); }
        .fp-input::placeholder { color: var(--muted-foreground); }
      `}</style>
    </div>
  );
}
