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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFF6FF]">
          <ShieldCheck className="h-5 w-5 text-[#1E3A8A]" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">Verify your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{user?.email}</span>. Enter it below to
          continue.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          className="mt-4 h-11 w-full rounded-md border border-border bg-background px-3 text-center text-lg font-semibold tracking-[0.3em] focus:border-[#2563EB] focus:outline-none"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {resent && !error && (
          <p className="mt-2 text-sm text-[#15803D]">A new code has been sent.</p>
        )}

        <button
          onClick={submit}
          disabled={verifying || code.length !== 6}
          className="mt-4 h-10 w-full rounded-md bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {verifying ? "Verifying…" : "Verify"}
        </button>

        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            onClick={resend}
            disabled={resending}
            className="font-medium text-[#2563EB] hover:underline disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
          <button onClick={() => logout()} className="text-muted-foreground hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
