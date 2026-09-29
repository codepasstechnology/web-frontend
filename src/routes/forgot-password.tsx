import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { AuthShell } from "@/components/site/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — Geo Pin Properties Kenya" }] }),
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
    <AuthShell image="https://images.unsplash.com/photo-1535342604578-a175d3fc4f22?w=1920&q=90&auto=format&fit=crop">
      {!submitted ? (
        <>
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-subtle">
              <Mail aria-hidden className="h-7 w-7 text-brand-subtle-foreground" />
            </div>
          </div>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold">Forgot your password?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your registered email and we&apos;ll send you a link to reset your password.
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
              <Label htmlFor="forgot-email">Email address</Label>
              <div className="relative">
                <Mail
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {loading ? <Spinner size="sm" label="Sending…" /> : "Send reset link"}
            </Button>
          </form>
        </>
      ) : (
        <div role="status">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-success-subtle">
              <Mail aria-hidden className="h-7 w-7 text-success" />
            </div>
          </div>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-semibold text-foreground">{email}</span>. Check your spam folder
              if you don&apos;t see it.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
            }}
          >
            Try a different email
          </Button>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to="/login">
            <ArrowLeft /> Back to sign in
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
