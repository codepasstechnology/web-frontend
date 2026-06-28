import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — LandVerify Kenya" }] }),
  component: RegisterPage,
});

const roles: { id: UserRole; label: string }[] = [
  { id: "individual", label: "Individual Seller" },
  { id: "agent", label: "Agent or Broker" },
  { id: "developer", label: "Developer" },
];

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", confirm: "" });
  const [role, setRole] = useState<UserRole>("individual");
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) return setErr("Please fill in all required fields.");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    if (!terms) return setErr("You must accept the terms.");
    register({ ...form, role });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">List and manage land in minutes.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <Field label="Full name"><input className="lv-input" value={form.fullName} onChange={set("fullName")} /></Field>
          <Field label="Phone number"><input className="lv-input" value={form.phone} onChange={set("phone")} placeholder="+254 7XX XXX XXX" /></Field>
          <Field label="Email"><input className="lv-input" type="email" value={form.email} onChange={set("email")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Password"><input className="lv-input" type="password" value={form.password} onChange={set("password")} /></Field>
            <Field label="Confirm password"><input className="lv-input" type="password" value={form.confirm} onChange={set("confirm")} /></Field>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-foreground">I am a</span>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                    role === r.id ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]" : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5" />
            <span>I agree to LandVerify's Terms of Service and Privacy Policy.</span>
          </label>
          <button type="submit" className="h-10 w-full rounded-md bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1d4ed8]">
            Create account
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-[#2563EB] hover:underline">Login</Link>
          </p>
        </form>
      </div>
      <style>{`.lv-input{display:block;height:40px;width:100%;border:1px solid #E2E8F0;border-radius:6px;padding:0 12px;font-size:14px;background:#fff;color:#0F172A;outline:none}.lv-input:focus{border-color:#2563EB}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}