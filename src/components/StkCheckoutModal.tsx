import { useEffect, useRef, useState } from "react";
import { X, Smartphone } from "lucide-react";
import { api } from "@/lib/api";

type Phase = "phone" | "waiting" | "paid" | "failed";

interface Props {
  /** Endpoint that creates the invoice and pushes the STK prompt. */
  initiatePath: string;
  /** Extra fields the endpoint needs alongside `phone`. */
  payload: Record<string, string>;
  amount: number;
  title: string;
  onPaid: () => void;
  onClose: () => void;
}

/**
 * Drives one M-Pesa STK payment: push the prompt, then poll the invoice until
 * the callback lands. Written against `initiatePath` so the subscription and
 * boost checkouts can reuse it.
 */
export function StkCheckoutModal({ initiatePath, payload, amount, title, onPaid, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "waiting" || !invoiceId) return;

    // Safaricom's callback is asynchronous, so the invoice is the only source
    // of truth for whether the customer actually completed the prompt.
    const started = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const { status } = await api.get<{ status: string }>(`/user/invoices/${invoiceId}/status`);
        if (status === "paid") {
          setPhase("paid");
          onPaid();
        } else if (status === "failed") {
          setPhase("failed");
          setError("The payment was not completed.");
        }
      } catch {
        // A transient poll failure is not a payment failure — keep waiting.
      }

      if (Date.now() - started > 120_000) {
        setPhase("failed");
        setError("Timed out waiting for the payment. Check your M-Pesa messages before retrying.");
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, invoiceId, onPaid]);

  const start = async () => {
    setError("");
    setPhase("waiting");
    try {
      const { invoice_id } = await api.post<{ invoice_id: string }>(initiatePath, {
        ...payload,
        phone,
      });
      setInvoiceId(invoice_id);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPhase("phone");
      setError(e?.message ?? "Could not start the payment. Please try again.");
    }
  };

  const cancel = async () => {
    if (invoiceId) await api.post(`/user/invoices/${invoiceId}/cancel`, {}).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">KES {amount.toLocaleString()}</p>
          </div>
          <button
            onClick={phase === "waiting" ? cancel : onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {phase === "phone" && (
          <>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              M-Pesa phone number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXX XXX"
              inputMode="tel"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              onClick={start}
              disabled={phone.trim().length < 9}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              <Smartphone className="h-4 w-4" /> Send payment request
            </button>
          </>
        )}

        {phase === "waiting" && (
          <div className="py-4 text-center">
            <p className="text-sm font-medium text-foreground">Check your phone</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your M-Pesa PIN to complete the payment. This screen updates on its own.
            </p>
            <button
              onClick={cancel}
              className="mt-4 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Cancel payment
            </button>
          </div>
        )}

        {phase === "paid" && (
          <div className="py-4 text-center">
            <p className="text-sm font-medium text-[#16A34A]">Payment received</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-md bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Done
            </button>
          </div>
        )}

        {phase === "failed" && (
          <button
            onClick={() => setPhase("phone")}
            className="mt-2 w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
