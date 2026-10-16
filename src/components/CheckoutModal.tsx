import { useEffect, useRef, useState } from "react";
import { Check, CreditCard, Lock, Smartphone, Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Plan } from "@/lib/plans";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Props {
  plan: Plan;
  initialCycle?: "monthly" | "yearly";
  onClose: () => void;
}

type Stage = "form" | "waiting" | "success" | "failed" | "pending";
type Method = "mpesa" | "card";

const POLL_INTERVAL = 4000;
const POLL_TIMEOUT = 90_000;

export const MPESA_PHONE = /^(?:\+?254|0)(?:7|1)\d{8}$/;
export const MPESA_PHONE_ERROR = "Enter a Kenyan mobile number, like 0712 345 678.";

/** Shared by every checkout: M-Pesa and card as a segmented control. */
export function MethodSwitch({
  method,
  onChange,
}: {
  method: Method;
  onChange: (m: Method) => void;
}) {
  return (
    <div className="gd-seg grid grid-cols-2" role="group" aria-label="Payment method">
      <button
        type="button"
        className="justify-center"
        aria-pressed={method === "mpesa"}
        onClick={() => onChange("mpesa")}
      >
        <Smartphone size={16} aria-hidden="true" /> M-Pesa
      </button>
      <button
        type="button"
        className="justify-center"
        aria-pressed={method === "card"}
        onClick={() => onChange("card")}
      >
        <CreditCard size={16} aria-hidden="true" /> Card
      </button>
    </div>
  );
}

/** The M-Pesa phone field with the client-side format check. */
export function MpesaPhoneField({
  id,
  phone,
  onChange,
  showError,
}: {
  id: string;
  phone: string;
  onChange: (v: string) => void;
  showError: boolean;
}) {
  const bad = showError && !MPESA_PHONE.test(phone.replace(/\s/g, ""));
  return (
    <div>
      <label className="gd-lab" htmlFor={id}>
        M-Pesa phone number
      </label>
      <input
        id={id}
        className="gd-input"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="07XX XXX XXX"
        value={phone}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={bad}
        aria-describedby={bad ? `${id}-err` : undefined}
      />
      {bad && (
        <div id={`${id}-err`} className="gd-err">
          {MPESA_PHONE_ERROR}
        </div>
      )}
    </div>
  );
}

/** The waiting / success screens every checkout shares. */
export function CheckoutStatus({
  stage,
  method,
  phone,
  doneText,
  pendingText,
  onCancel,
  onClose,
}: {
  stage: "waiting" | "success" | "pending";
  method: Method;
  phone: string;
  doneText: string;
  pendingText: string;
  onCancel: () => void;
  onClose: () => void;
}) {
  if (stage === "success" || stage === "pending") {
    const done = stage === "success";
    return (
      <div className="flex flex-col items-center gap-3.5 py-3.5 text-center" role="status">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            done
              ? "animate-[gdPop_.5s_cubic-bezier(.2,.7,.2,1)_backwards] bg-brand text-brand-foreground"
              : "bg-warning-subtle text-warning"
          }`}
        >
          {done ? (
            <Check size={30} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <span className="gd-spin" />
          )}
        </span>
        <DialogTitle className="gd-h1 text-[26px]">
          {done ? "Payment received" : "Still processing"}
        </DialogTitle>
        <DialogDescription className="gd-sub m-0">
          {done ? doneText : pendingText}
        </DialogDescription>
        <button type="button" className="gd-btn min-w-40" onClick={onClose}>
          Done
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3.5 py-3.5 text-center" role="status">
      <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-subtle text-brand-subtle-foreground">
        {method === "mpesa" ? (
          <Smartphone size={28} aria-hidden="true" />
        ) : (
          <CreditCard size={28} aria-hidden="true" />
        )}
      </span>
      <DialogTitle className="gd-h1 text-[26px]">
        {method === "mpesa" ? "Check your phone" : "Redirecting to checkout…"}
      </DialogTitle>
      <DialogDescription className="gd-sub m-0 max-w-[340px]">
        {method === "mpesa"
          ? `Enter your M-Pesa PIN on the prompt sent to ${phone} to complete the payment.`
          : "Taking you to a secure page to complete your card payment."}
      </DialogDescription>
      <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span className="gd-spin" />
        {method === "mpesa" ? "Waiting for confirmation…" : "Opening the payment page…"}
      </span>
      {method === "mpesa" && (
        <>
          <span className="text-[13.5px] text-muted-foreground">
            Didn&apos;t get a prompt? Cancel and try again.
          </span>
          <button type="button" className="gd-btn gd-o" onClick={onCancel}>
            Cancel and try again
          </button>
        </>
      )}
    </div>
  );
}

export function CheckoutModal({ plan, initialCycle, onClose }: Props) {
  const {
    startPlanCheckout,
    startCardCheckout,
    previewPlanChange,
    getInvoiceStatus,
    reloadUser,
    cancelInvoice,
  } = useAuth();
  const [cycle, setCycle] = useState<"monthly" | "yearly">(initialCycle ?? "monthly");
  const [method, setMethod] = useState<Method>("mpesa");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [creditedDays, setCreditedDays] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    previewPlanChange(plan.id, cycle)
      .then((p) => active && setCreditedDays(p.credited_days))
      .catch(() => active && setCreditedDays(0));
    return () => {
      active = false;
    };
  }, [plan.id, cycle, previewPlanChange]);

  const yearly = plan.priceYearly ?? plan.price * 12;
  const amount = cycle === "yearly" ? yearly : plan.price;
  const savePct = Math.round((1 - yearly / (plan.price * 12)) * 100);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (method === "card") {
      setStage("waiting");
      try {
        const { authorizationUrl } = await startCardCheckout(plan.id, cycle);
        window.location.href = authorizationUrl;
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Could not start the payment. Please try again.";
        setStage("failed");
        setError(message);
      }
      return;
    }

    const msisdn = phone.replace(/\s/g, "");
    if (!MPESA_PHONE.test(msisdn)) {
      setPhoneTouched(true);
      return;
    }
    setStage("waiting");

    try {
      const { invoiceId } = await startPlanCheckout(plan.id, cycle, msisdn);
      setInvoiceId(invoiceId);
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        const status = await getInvoiceStatus(invoiceId).catch(() => "pending");
        if (status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          await reloadUser();
          setStage("success");
        } else if (status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          await reloadUser();
          setStage("failed");
          setError("The payment was cancelled or failed. Please try again.");
        } else if (Date.now() - startedAt > POLL_TIMEOUT) {
          if (pollRef.current) clearInterval(pollRef.current);
          await reloadUser();
          setStage("pending");
        }
      }, POLL_INTERVAL);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not start the payment. Please try again.";
      setStage("failed");
      setError(message);
    }
  };

  const cancel = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (invoiceId) await cancelInvoice(invoiceId).catch(() => {});
    setInvoiceId(null);
    setError(null);
    setStage("form");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gd-dialog [&>button:last-child]:hidden">
        {stage === "waiting" || stage === "success" || stage === "pending" ? (
          <CheckoutStatus
            stage={stage}
            method={method}
            phone={phone}
            doneText={`Your ${plan.name} plan is now active. Your receipt is in your email.`}
            pendingText={`M-Pesa is taking longer than usual. You don't need to pay again — if it went through, your ${plan.name} plan activates automatically and we'll email your receipt.`}
            onCancel={cancel}
            onClose={onClose}
          />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex justify-between gap-3">
              <div>
                <DialogTitle className="gd-h1 text-[26px]">Upgrade to {plan.name}</DialogTitle>
                <DialogDescription className="gd-sub">
                  Pay with {method === "mpesa" ? "M-Pesa" : "card"} to activate.
                </DialogDescription>
              </div>
              <button type="button" className="gd-ib" onClick={onClose} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <MethodSwitch method={method} onChange={setMethod} />

            <div className="grid grid-cols-2 gap-2.5">
              {(["monthly", "yearly"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className="gd-plan cursor-pointer gap-1 p-3.5 text-left"
                  data-cur={cycle === c}
                  aria-pressed={cycle === c}
                  onClick={() => setCycle(c)}
                >
                  <span className="flex justify-between font-semibold">
                    {c === "monthly" ? "Monthly" : "Yearly"}
                    {c === "yearly" && savePct > 0 && (
                      <span className="gd-st px-[7px] py-0.5 text-[11px]" data-k="ok">
                        Save {savePct}%
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    KES {(c === "yearly" ? yearly : plan.price).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            {creditedDays > 0 && (
              <div className="flex gap-2.5 rounded-[14px] bg-brand-subtle px-3.5 py-3 text-sm text-brand-subtle-foreground">
                <Sparkles size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  You&apos;ll pay for a full {cycle === "yearly" ? "year" : "month"} and keep about{" "}
                  {creditedDays} bonus {creditedDays === 1 ? "day" : "days"} carried over from your
                  current plan.
                </span>
              </div>
            )}

            {method === "mpesa" ? (
              <MpesaPhoneField
                id="mpesa-phone"
                phone={phone}
                onChange={setPhone}
                showError={phoneTouched}
              />
            ) : (
              <div className="flex items-center gap-2.5 rounded-[14px] bg-track px-3.5 py-3 text-sm text-muted-foreground">
                <Lock size={17} className="shrink-0" aria-hidden="true" />
                You&apos;ll be redirected to a secure page to enter your card details.
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-[14px] bg-destructive-subtle px-3.5 py-3 text-sm font-semibold text-destructive"
              >
                {error}
              </div>
            )}

            <button type="submit" className="gd-btn min-h-[52px] text-base">
              Pay KES {amount.toLocaleString()}
            </button>
            <span className="text-center text-[12.5px] text-muted-foreground">
              Secured by M-Pesa and Paystack. Your receipt is emailed to you.
            </span>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
