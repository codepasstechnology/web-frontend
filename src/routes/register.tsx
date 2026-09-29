import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { useAuth, type UserRole } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AuthShell, AuthTerms } from "@/components/site/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSignupsOpen } from "@/lib/settings";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — Geo Pin Properties Kenya" }] }),
  component: RegisterPage,
});

const roles: { id: UserRole; label: string; desc: string }[] = [
  { id: "individual", label: "Individual", desc: "Personal land owner" },
  { id: "agent", label: "Agent / Broker", desc: "Licensed professional" },
  { id: "developer", label: "Developer", desc: "Development company" },
];

function getStrength(pw: string): { score: number; label: string; bar: string; text: string } {
  if (!pw) return { score: 0, label: "", bar: "", text: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: "Weak", bar: "bg-destructive", text: "text-destructive" };
  if (s === 2) return { score: 2, label: "Fair", bar: "bg-warning", text: "text-warning" };
  if (s <= 3) return { score: 3, label: "Good", bar: "bg-brand", text: "text-brand" };
  return { score: 4, label: "Strong", bar: "bg-success", text: "text-success" };
}

function IconField({
  id,
  label,
  hint,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label} {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </Label>
      <div className="relative">
        <Icon
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        {children}
      </div>
    </div>
  );
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

  const passwordToggle = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <AuthShell
      wide
      image="https://images.unsplash.com/photo-1598941101837-e3fdd6d94b24?w=1920&q=90&auto=format&fit=crop"
      below={signupsOpen && !registered ? <AuthTerms action="creating an account" /> : undefined}
    >
      {!signupsOpen ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
            <Lock aria-hidden className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-5 text-2xl font-bold">Registrations are closed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            New accounts are paused right now. Please check back later.
          </p>
          <div className="mt-7 flex w-full flex-col gap-2.5">
            <Button
              asChild
              size="lg"
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              <Link to="/login">
                Sign in <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 w-full">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      ) : registered ? (
        <div role="status" className="flex flex-col items-center py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-success-subtle">
            <Check aria-hidden className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-5 text-2xl font-bold">You&apos;re all set!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to Geo Pin Properties,{" "}
            <span className="font-semibold text-foreground">{form.fullName.split(" ")[0]}</span>!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ve sent a verification email to{" "}
            <span className="text-foreground">{form.email}</span>. Check your inbox before listing.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: "/dashboard", search: { tab: undefined } })}
            className="mt-7 h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            Go to Dashboard <ArrowRight />
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold leading-tight">Create your account</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              List and manage verified land in minutes. No upfront payment required.
            </p>
          </div>

          {err && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle aria-hidden className="h-4 w-4" />
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
              <IconField id="reg-name" label="Full name" icon={User}>
                <Input
                  id="reg-name"
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder="Jane Wanjiku"
                  autoComplete="name"
                  className="h-11 pl-10"
                />
              </IconField>
              <IconField id="reg-phone" label="Phone" hint="(optional)" icon={Phone}>
                <Input
                  id="reg-phone"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+254 7XX XXX XXX"
                  autoComplete="tel"
                  className="h-11 pl-10"
                />
              </IconField>
            </div>

            <IconField id="reg-email" label="Email address" icon={Mail}>
              <Input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 pl-10"
              />
            </IconField>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <IconField id="reg-password" label="Password" icon={Lock}>
                  <Input
                    id="reg-password"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Min. 8 chars"
                    autoComplete="new-password"
                    className="h-11 pl-10 pr-9 [&::-ms-reveal]:hidden"
                  />
                  {passwordToggle(showPw, () => setShowPw((v) => !v))}
                </IconField>
                {form.password && (
                  <div className="flex flex-col gap-1" aria-live="polite">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            i <= strength.score ? strength.bar : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-medium ${strength.text}`}>{strength.label}</p>
                  </div>
                )}
              </div>
              <IconField id="reg-confirm" label="Confirm" icon={Lock}>
                <Input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="h-11 pl-10 pr-9 [&::-ms-reveal]:hidden"
                />
                {passwordToggle(showConfirm, () => setShowConfirm((v) => !v))}
              </IconField>
            </div>

            <div className="grid gap-2">
              <Label id="reg-role-label">I am a</Label>
              <ToggleGroup
                type="single"
                value={role}
                onValueChange={(v) => v && setRole(v as UserRole)}
                aria-labelledby="reg-role-label"
                className="grid grid-cols-3 gap-2"
              >
                {roles.map((r) => (
                  <ToggleGroupItem
                    key={r.id}
                    value={r.id}
                    className="flex h-auto flex-col items-center gap-0.5 rounded-md border border-border px-2 py-2.5 text-center data-[state=on]:border-brand data-[state=on]:bg-brand-subtle data-[state=on]:text-brand-subtle-foreground"
                  >
                    <span className="text-xs font-bold">{r.label}</span>
                    <span className="text-[10px] font-normal leading-tight text-muted-foreground">
                      {r.desc}
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="reg-terms"
                checked={terms}
                onCheckedChange={(v) => setTerms(v === true)}
                className="mt-0.5 border-input data-[state=checked]:border-brand data-[state=checked]:bg-brand"
              />
              <Label
                htmlFor="reg-terms"
                className="text-xs font-normal leading-relaxed text-muted-foreground"
              >
                I agree to Geo Pin Properties&apos;{" "}
                <span className="font-bold text-brand">Terms of Service</span> and{" "}
                <span className="font-bold text-brand">Privacy Policy</span>.
              </Label>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {loading ? <Spinner size="sm" label="Creating account…" /> : "Create free account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </form>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <GoogleSignInButton onCredential={onGoogleCredential} text="signup_with" />
        </>
      )}
    </AuthShell>
  );
}
