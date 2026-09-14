import { useEffect, useRef, useState } from "react";
import { X, Smartphone, CreditCard, CheckCircle2, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Plan } from "@/lib/plans";

interface Props {
  plan: Plan;
  initialCycle?: "monthly" | "yearly";
  onClose: () => void;
}

type Stage = "form" | "waiting" | "success" | "failed" | "pending";
type Method = "mpesa" | "card";

const POLL_INTERVAL = 4000;
const POLL_TIMEOUT = 90_000;

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStage("waiting");

    if (method === "card") {
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

    try {
      const { invoiceId } = await startPlanCheckout(plan.id, cycle, phone);
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
    <div className="fixed inset-0 z-[2100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {stage === "success" ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#16A34A]" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Payment received</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {plan.name} plan is now active.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-md bg-[#15803d] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : stage === "pending" ? (
          <div className="py-6 text-center">
            <Clock className="mx-auto h-12 w-12 text-[#15803d]" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Still processing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              M-Pesa is taking longer than usual. You don't need to pay again — if it went through,
              your {plan.name} plan activates automatically and we'll email your receipt.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-md bg-[#15803d] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : stage === "waiting" && method === "card" ? (
          <div className="py-6 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#15803d]" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Redirecting to checkout…</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Taking you to a secure page to complete your card payment.
            </p>
          </div>
        ) : stage === "waiting" ? (
          <div className="py-6 text-center">
            <Smartphone className="mx-auto h-12 w-12 text-[#15803d]" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Check your phone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your M-Pesa PIN on the prompt sent to {phone} to complete the payment.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Waiting for confirmation…
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Didn't get a prompt? Cancel and try again.
            </p>
            <button
              onClick={cancel}
              className="mt-3 w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel and try again
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 className="pr-10 text-lg font-semibold text-foreground">Upgrade to {plan.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay with {method === "mpesa" ? "M-Pesa" : "card"} to activate.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                [
                  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
                  { id: "card", label: "Card", icon: CreditCard },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium ${
                    method === m.id
                      ? "border-[#15803d] bg-[#f0fdf4] text-[#15803d]"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <m.icon className="h-4 w-4" /> {m.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["monthly", "yearly"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    cycle === c
                      ? "border-[#15803d] bg-[#f0fdf4] text-[#15803d]"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c === "monthly" ? "Monthly" : "Yearly"}
                  <span className="mt-0.5 block text-xs font-normal">
                    KES {(c === "yearly" ? yearly : plan.price).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            {creditedDays > 0 && (
              <p className="mt-3 rounded-md bg-[#f0fdf4] px-3 py-2 text-xs text-[#15803d]">
                You&apos;ll pay for a full {cycle === "yearly" ? "year" : "month"} and keep about{" "}
                {creditedDays} bonus {creditedDays === 1 ? "day" : "days"} carried over from your
                current plan.
              </p>
            )}

            {method === "mpesa" ? (
              <>
                <label
                  className="mt-4 block text-sm font-medium text-foreground"
                  htmlFor="mpesa-phone"
                >
                  M-Pesa phone number
                </label>
                <input
                  id="mpesa-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="07XX XXX XXX"
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-[#15803d] focus:outline-none"
                />
              </>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                You&apos;ll be redirected to a secure page to enter your card details.
              </p>
            )}

            {error && <p className="mt-3 text-sm text-[#DC2626]">{error}</p>}

            <button
              type="submit"
              className="mt-5 w-full rounded-md bg-[#15803d] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Pay KES {amount.toLocaleString()}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
