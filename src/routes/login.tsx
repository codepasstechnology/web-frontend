import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AuthShell, AuthTerms } from "@/components/site/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Geo Pin Properties Kenya" }] }),
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
    <AuthShell
      image="https://images.unsplash.com/photo-1535342604578-a175d3fc4f22?w=1920&q=90&auto=format&fit=crop"
      below={<AuthTerms action="signing in" />}
    >
      {success ? (
        <div role="status" className="flex flex-col items-center py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle">
            <Check aria-hidden className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-5 text-xl font-bold">Welcome back!</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Taking you to your dashboard…</p>
          <div className="mt-6 h-[3px] w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success"
              style={{ animation: "lv-fill 1.5s linear forwards" }}
            />
          </div>
          <style>{`@keyframes lv-fill { from { width: 0 } to { width: 100% } }`}</style>
        </div>
      ) : challenge ? (
        <>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              We sent a 6-digit sign-in code to{" "}
              <span className="font-semibold text-foreground">{challenge.email}</span>.
            </p>
          </div>

          {err && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle aria-hidden className="h-4 w-4" />
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}
          {resent && !err && (
            <Alert variant="success" className="mb-5">
              <AlertDescription>A new code is on its way.</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmitCode} className="flex flex-col gap-4">
            <Label htmlFor="login-code" className="sr-only">
              Sign-in code
            </Label>
            <Input
              id="login-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              className="h-12 text-center text-lg font-semibold tracking-[0.3em]"
            />
            <Button
              type="submit"
              size="lg"
              disabled={loading || code.length !== 6}
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {loading ? (
                <Spinner size="sm" label="Verifying…" />
              ) : (
                <>
                  Verify <ArrowRight />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onResend}
              className="font-semibold text-brand hover:underline"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={restart}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Use a different account
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to manage your verified land listings across Kenya.
            </p>
          </div>

          {err && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle aria-hidden className="h-4 w-4" />
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="login-email">Email address</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-10 [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="login-remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
                className="border-input data-[state=checked]:border-brand data-[state=checked]:bg-brand"
              />
              <Label htmlFor="login-remember" className="font-normal text-muted-foreground">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {loading ? (
                <Spinner size="sm" label="Signing in…" />
              ) : (
                <>
                  Sign in <ArrowRight />
                </>
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <GoogleSignInButton onCredential={onGoogleCredential} text="continue_with" />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-bold text-brand hover:underline">
              Create one free
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
