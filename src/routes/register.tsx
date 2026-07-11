import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPinned, User, Phone, Mail, Lock, Eye, EyeOff, ArrowLeft, Check, ArrowRight,
} from "lucide-react";
import { useAuth, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — LandConnect Kenya" }] }),
  component: RegisterPage,
});

const roles: { id: UserRole; label: string; desc: string }[] = [
  { id: "individual", label: "Individual",    desc: "Personal land owner"          },
  { id: "agent",      label: "Agent / Broker", desc: "Licensed professional"        },
  { id: "developer",  label: "Developer",      desc: "Development company"          },
];

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (pw.length >= 12)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: "Weak",   color: "#ef4444" };
  if (s === 2) return { score: 2, label: "Fair",   color: "#f97316" };
  if (s <= 3)  return { score: 3, label: "Good",   color: "#eab308" };
  return          { score: 4, label: "Strong", color: "#22c55e" };
}

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

function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", confirm: "" });
  const [role, setRole]         = useState<UserRole>("individual");
  const [showPw, setShowPw]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms]         = useState(false);
  const [err, setErr]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [registered, setRegistered] = useState(false);
  const strength = getStrength(form.password);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) return setErr("Please fill in all required fields.");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    if (!terms) return setErr("You must accept the terms and conditions.");
    setLoading(true);
    try {
      await register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, role });
      setRegistered(true);
    } catch (err: unknown) {
      const e   = err as { errors?: Record<string, string[]>; message?: string };
      const msg = Object.values(e?.errors ?? {})[0]?.[0];
      setErr(msg ?? e?.message ?? "Registration failed. Please try again.");
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
      <div className="absolute inset-0 bg-black/58 backdrop-blur-[2px]" />


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
        Joecalih / Unsplash — Nairobi, Kenya
      </p>

      {/* ── Form card ── */}
      <div className="relative z-10 w-full max-w-[480px] mx-4 mt-16">
        <div className="rounded-2xl bg-white/15 px-8 py-8 shadow-2xl shadow-black/50 ring-1 ring-white/25 backdrop-blur-2xl">

          {registered ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-white">You're all set!</h2>
              <p className="mt-2 text-sm text-white/70">
                Welcome to LandConnect,{" "}
                <span className="font-semibold text-white">{form.fullName.split(" ")[0]}</span>!
              </p>
              <p className="mt-1 text-sm text-white/50">
                We've sent a verification email to{" "}
                <span className="text-white/70">{form.email}</span>.
                Check your inbox before listing.
              </p>
              <button
                onClick={() => navigate({ to: "/dashboard", search: { tab: undefined } })}
                className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-[#1d4ed8] active:scale-[0.98]"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
          <>
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold leading-tight text-white drop-shadow">Create your account</h1>
            <p className="mt-1.5 text-sm text-white/70">
              List and manage verified land in minutes. No upfront payment required.
            </p>
          </div>

          {err && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-200">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/40 text-xs font-bold text-red-200 ring-1 ring-red-400/50">!</span>
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">

            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-white">Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input className="rg-input has-icon" value={form.fullName} onChange={set("fullName")} placeholder="Jane Wanjiku" autoComplete="name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-white">
                  Phone <span className="text-xs font-normal text-white/40">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input className="rg-input has-icon" value={form.phone} onChange={set("phone")} placeholder="+254 7XX XXX XXX" autoComplete="tel" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-white">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input type="email" className="rg-input has-icon" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-white">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input type={showPw ? "text" : "password"} className="rg-input has-icon pr-9" value={form.password} onChange={set("password")} placeholder="Min. 8 chars" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
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
                          style={{ backgroundColor: i <= strength.score ? strength.color : "rgba(255,255,255,0.12)" }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-medium" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-white">Confirm</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input type={showConfirm ? "text" : "password"} className="rg-input has-icon pr-9" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center rounded-xl border-2 px-2 py-2.5 text-center transition-all ${
                      role === r.id
                        ? "border-blue-400 bg-blue-500/25 shadow-sm"
                        : "border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15"
                    }`}
                  >
                    <span className={`text-xs font-bold ${role === r.id ? "text-blue-300" : "text-white"}`}>
                      {r.label}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-tight text-white/50">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-white/70">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded accent-[#2563EB]"
              />
              <span>
                I agree to LandConnect's{" "}
                <span className="font-bold text-blue-300 hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="font-bold text-blue-300 hover:underline">Privacy Policy</span>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-60"
            >
              {loading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : "Create free account"
              }
            </button>

            <p className="text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-blue-300 hover:text-blue-200 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
          </>
          )}

          {/* OR divider + Google — hide after registration */}
          {!registered && (
            <>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-xs text-white/40">or</span>
                <div className="h-px flex-1 bg-white/15" />
              </div>
              <button
                type="button"
                onClick={() => { /* TODO: initiate Google OAuth once credentials are added */ }}
                className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* Terms & Privacy */}
        {!registered && <p className="mt-5 text-center text-xs text-white/40">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="text-white/60 underline underline-offset-2 hover:text-white transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-white/60 underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</Link>.
        </p>}
      </div>

      <style>{`
        .rg-input {
          display: block; width: 100%; height: 42px;
          padding: 0 12px 0 12px; font-size: 14px;
          color: #fff; background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.25); border-radius: 10px;
          outline: none; transition: border-color .15s, box-shadow .15s, background .15s;
        }
        .rg-input.has-icon { padding-left: 2.75rem; }
        .rg-input:hover  { border-color: rgba(255,255,255,0.4); }
        .rg-input:focus  { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,.25); background: rgba(255,255,255,0.2); }
        .rg-input::placeholder { color: rgba(255,255,255,0.4); }
        .rg-input::-ms-reveal { display: none; }
        .rg-input:-webkit-autofill,
        .rg-input:-webkit-autofill:hover,
        .rg-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(30,40,60,0.85) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
          border-color: rgba(255,255,255,0.25) !important;
        }
      `}</style>
    </div>
  );
}
