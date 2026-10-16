import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function VerifyAccountModal() {
  const { user, verifyEmail, resendVerificationCode, logout } = useAuth();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async () => {
    setVerifying(true);
    setError("");
    try {
      await verifyEmail(code);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Invalid or expired code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    setResent(false);
    try {
      await resendVerificationCode();
      setResent(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-[rgba(10,10,8,.48)] p-6 max-md:items-end max-md:p-0">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-title"
        className="flex w-full max-w-[460px] flex-col gap-4 rounded-[26px] bg-background p-[26px] text-foreground shadow-[0_30px_70px_rgba(0,0,0,.35)] max-md:max-w-none max-md:rounded-b-none"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-subtle text-brand-subtle-foreground">
          <ShieldCheck size={26} aria-hidden="true" />
        </span>
        <div>
          <h2 id="verify-title" className="gd-h1 text-[26px]">
            Verify your account
          </h2>
          <p className="gd-sub">
            We sent a 6-digit code to <strong className="text-foreground">{user?.email}</strong>.
            Enter it below to continue.
          </p>
        </div>

        <label className="gd-lab m-0" htmlFor="verify-code">
          Verification code
        </label>
        <input
          id="verify-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          aria-invalid={!!error}
          className="gd-input gd-mono min-h-[60px] text-center text-2xl tracking-[.5em]"
        />

        {error && (
          <div className="gd-err m-0" role="alert">
            {error}
          </div>
        )}
        {resent && !error && (
          <div className="text-sm font-semibold text-brand-subtle-foreground">
            A new code has been sent.
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={verifying || code.length !== 6}
          className="gd-btn min-h-[52px]"
        >
          {verifying ? "Verifying…" : "Verify"}
        </button>

        <div className="flex justify-between">
          <button type="button" onClick={resend} disabled={resending} className="gd-link">
            {resending ? "Sending…" : "Resend code"}
          </button>
          <button type="button" onClick={() => logout()} className="gd-link" data-tone="muted">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
