import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPinned, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — LandVerify Kenya" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email.trim()) { setErr("Email is required."); return; }
    if (!password) { setErr("Password is required."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    login(email, password);
    setLoading(false);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="hidden w-[45%] flex-col justify-between bg-[#0F172A] p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]">
            <MapPinned className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">LandVerify Kenya</span>
        </Link>

        <div>
          <blockquote className="space-y-3">
            <p className="text-2xl font-medium leading-snug text-white">
              "The most trusted platform for verified land listings across Kenya."
            </p>
            <footer className="text-sm text-slate-400">— LandVerify users, nationwide</footer>
          </blockquote>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/20 text-[#60A5FA] text-sm font-bold">12K+</div>
            <div>
              <div className="text-sm font-medium text-white">Verified parcels</div>
              <div className="text-xs text-slate-400">Across all 47 counties</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">99%</div>
            <div>
              <div className="text-sm font-medium text-white">Fraud-free listings</div>
              <div className="text-xs text-slate-400">GIS-verified coordinates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F172A]">
            <MapPinned className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-foreground">LandVerify Kenya</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to manage your listings and explore properties.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {err && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {err}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Email address</label>
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
                <label className="block text-sm font-medium text-foreground">Password</label>
                <button type="button" className="text-xs text-[#2563EB] hover:underline">Forgot password?</button>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-[#2563EB] hover:underline">Create one</Link>
          </p>
        </div>
      </div>

      <style>{`
        .lv-input {
          display: block; width: 100%; height: 40px;
          border: 1px solid #E2E8F0; border-radius: 8px;
          padding: 0 12px; font-size: 14px;
          background: #fff; color: #0F172A; outline: none;
          transition: border-color 0.15s;
        }
        .lv-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        .lv-input::placeholder { color: #94A3B8; }
      `}</style>
    </div>
  );
}
