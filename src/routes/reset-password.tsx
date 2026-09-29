import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { AuthShell } from "@/components/site/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Geo Pin Properties Kenya" }] }),
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
    <AuthShell image="https://images.unsplash.com/photo-1535342604578-a175d3fc4f22?w=1920&q=90&auto=format&fit=crop">
      {!token || !email ? (
        <>
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-destructive-subtle">
              <Lock aria-hidden className="h-7 w-7 text-destructive" />
            </div>
          </div>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold">Invalid reset link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is missing or malformed. Request a new one below.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </>
      ) : success ? (
        <div role="status" className="flex flex-col items-center py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle">
            <Check aria-hidden className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-5 text-xl font-bold">Password reset</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-subtle">
              <Lock aria-hidden className="h-7 w-7 text-brand-subtle-foreground" />
            </div>
          </div>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter a new password for{" "}
              <span className="font-semibold text-foreground">{email}</span>.
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
              <Label htmlFor="reset-password">New password</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 pr-10 [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide passwords" : "Show passwords"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reset-confirm">Confirm new password</Label>
              <Input
                id="reset-confirm"
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 [&::-ms-reveal]:hidden"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {loading ? <Spinner size="sm" label="Resetting…" /> : "Reset password"}
            </Button>
          </form>
        </>
      )}

      {!success && (
        <div className="mt-6 flex justify-center">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to="/login">
              <ArrowLeft /> Back to sign in
            </Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
