import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPinned,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  ArrowRight,
} from "lucide-react";
import { useAuth, type UserRole } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useSignupsOpen } from "@/lib/settings";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — GeoPin Properties Kenya" }] }),
  component: RegisterPage,
});

const roles: { id: UserRole; label: string; desc: string }[] = [
  { id: "individual", label: "Individual", desc: "Personal land owner" },
  { id: "agent", label: "Agent / Broker", desc: "Licensed professional" },
  { id: "developer", label: "Developer", desc: "Development company" },
];

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (s === 2) return { score: 2, label: "Fair", color: "#f97316" };
  if (s <= 3) return { score: 3, label: "Good", color: "#eab308" };
  return { score: 4, label: "Strong", color: "#22c55e" };
}

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const signupsOpen = useSignupsOpen();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [role, setRole] = useState<UserRole>("individual");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const strength = getStrength(form.password);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password)
      return setErr("Please fill in all required fields.");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    if (!terms) return setErr("You must accept the terms and conditions.");
    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      });
      setRegistered(true);
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      const msg = Object.values(e?.errors ?? {})[0]?.[0];
      setErr(msg ?? e?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleCredential = async (credential: string) => {
    setErr("");
    setLoading(true);
    try {
      const result = await loginWithGoogle(credential, role);
      if (result.status === "two_factor_required") {
        // An existing account with 2FA on — the code screen lives on /login.
        navigate({ to: "/login" });
      } else {
        // Google already verified the address, so skip the "check your inbox" card.
        navigate({ to: "/dashboard", search: { tab: undefined } });
      }
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      const msg = Object.values(e?.errors ?? {})[0]?.[0];
      setErr(msg ?? e?.message ?? "Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black py-10">
      {/* Full-screen background photo */}
      <img
        src="https://images.unsplash.com/photo-1598941101837-e3fdd6d94b24?w=1920&q=90&auto=format&fit=crop"
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
      <div className="relative z-10 w-full max-w-[480px] mx-4 mt-16">
        <div className="rounded-lg border border-border bg-card px-8 py-8 shadow-md">
          {!signupsOpen ? (
            /* ── Sign-ups closed by the platform ── */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-foreground">Registrations are closed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                New accounts are paused right now. Please check back later.
              </p>
              <div className="mt-7 flex w-full flex-col gap-2.5">
                <Link
                  to="/login"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
                >
                  Sign in <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/"
                  className="flex h-11 w-full items-center justify-center rounded-md border border-border text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : registered ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-success-subtle">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-foreground">You're all set!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Welcome to GeoPin Properties,{" "}
                <span className="font-semibold text-foreground">{form.fullName.split(" ")[0]}</span>
                !
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                We've sent a verification email to{" "}
                <span className="text-foreground">{form.email}</span>. Check your inbox before
                listing.
              </p>
              <button
                onClick={() => navigate({ to: "/dashboard", search: { tab: undefined } })}
                className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold leading-tight text-foreground">
                  Create your account
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  List and manage verified land in minutes. No upfront payment required.
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
                {/* Name + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">Full name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className="rg-input has-icon"
                        value={form.fullName}
                        onChange={set("fullName")}
                        placeholder="Jane Wanjiku"
                        autoComplete="name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">
                      Phone{" "}
                      <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className="rg-input has-icon"
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder="+254 7XX XXX XXX"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-foreground">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      className="rg-input has-icon"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPw ? "text" : "password"}
                        className="rg-input has-icon pr-9"
                        value={form.password}
                        onChange={set("password")}
                        placeholder="Min. 8 chars"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  i <= strength.score ? strength.color : "var(--border)",
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] font-medium" style={{ color: strength.color }}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">Confirm</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        className="rg-input has-icon pr-9"
                        value={form.confirm}
                        onChange={set("confirm")}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">I am a</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`flex flex-col items-center rounded-md border px-2 py-2.5 text-center transition-colors ${
                          role === r.id
                            ? "border-brand bg-brand-subtle"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${role === r.id ? "text-brand-subtle-foreground" : "text-foreground"}`}
                        >
                          {r.label}
                        </span>
                        <span className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                          {r.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terms */}
                <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded accent-brand"
                  />
                  <span>
                    I agree to GeoPin Properties'{" "}
                    <span className="font-bold text-brand hover:underline">Terms of Service</span>{" "}
                    and <span className="font-bold text-brand hover:underline">Privacy Policy</span>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "Create free account"
                  )}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-brand hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}

          {/* OR divider + Google — hide after registration */}
          {signupsOpen && !registered && (
            <>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <GoogleSignInButton onCredential={onGoogleCredential} text="signup_with" />
            </>
          )}
        </div>

        {/* Terms & Privacy */}
        {signupsOpen && !registered && (
          <p className="mt-5 text-center text-xs text-white/70">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-2 hover:text-white">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-white">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </div>

      <style>{`
        .rg-input {
          display: block; width: 100%; height: 42px;
          padding: 0 12px 0 12px; font-size: 14px;
          color: var(--foreground); background: var(--background);
          border: 1.5px solid var(--border); border-radius: var(--radius-md);
          outline: none; transition: border-color .15s, box-shadow .15s;
        }
        .rg-input.has-icon { padding-left: 2.75rem; }
        .rg-input:hover  { border-color: var(--muted-foreground); }
        .rg-input:focus  { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in oklch, var(--brand) 20%, transparent); }
        .rg-input::placeholder { color: var(--muted-foreground); }
        .rg-input::-ms-reveal { display: none; }
      `}</style>
    </div>
  );
}
