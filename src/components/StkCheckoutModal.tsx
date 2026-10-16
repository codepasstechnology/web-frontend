import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CheckoutStatus, MPESA_PHONE, MpesaPhoneField } from "@/components/CheckoutModal";

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
  const [phoneTouched, setPhoneTouched] = useState(false);
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

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    const msisdn = phone.replace(/\s/g, "");
    if (!MPESA_PHONE.test(msisdn)) {
      setPhoneTouched(true);
      return;
    }
    setError("");
    setPhase("waiting");
    try {
      const { invoice_id } = await api.post<{ invoice_id: string }>(initiatePath, {
        ...payload,
        phone: msisdn,
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
    <Dialog open onOpenChange={(o) => !o && (phase === "waiting" ? cancel() : onClose())}>
      <DialogContent className="gd-dialog [&>button:last-child]:hidden">
        {phase === "waiting" || phase === "paid" ? (
          <CheckoutStatus
            stage={phase === "paid" ? "success" : "waiting"}
            method="mpesa"
            phone={phone}
            doneText="Thanks. Your receipt is in your email."
            pendingText=""
            onCancel={cancel}
            onClose={onClose}
          />
        ) : (
          <form onSubmit={start} className="flex flex-col gap-4" noValidate>
            <div className="flex justify-between gap-3">
              <div>
                <DialogTitle className="gd-h1 text-[26px]">{title}</DialogTitle>
                <DialogDescription className="gd-sub">
                  KES {amount.toLocaleString()} · approve the charge on your phone.
                </DialogDescription>
              </div>
              <button type="button" className="gd-ib" onClick={onClose} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <MpesaPhoneField
              id="stk-phone"
              phone={phone}
              onChange={setPhone}
              showError={phoneTouched}
            />
            {error && (
              <div
                role="alert"
                className="rounded-[14px] bg-destructive-subtle px-3.5 py-3 text-sm font-semibold text-destructive"
              >
                {error}
              </div>
            )}
            <button type="submit" className="gd-btn min-h-[52px] text-base">
              {phase === "failed" ? "Try again" : `Pay KES ${amount.toLocaleString()}`}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
