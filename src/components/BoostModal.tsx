import { useEffect, useRef, useState } from "react";
import { X, Smartphone, CreditCard, CheckCircle2, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface AddOn {
  id: string;
  name: string;
  price: number;
  period: string;
}

interface Props {
  addOn: AddOn;
  onClose: () => void;
}

type Stage = "form" | "waiting" | "success" | "failed" | "pending";
type Method = "mpesa" | "card";

const POLL_INTERVAL = 4000;
const POLL_TIMEOUT = 90_000;

export function BoostModal({ addOn, onClose }: Props) {
  const { user, startBoostCheckout, startBoostCardCheckout, getInvoiceStatus, reloadUser } =
    useAuth();
  const listings = (user?.listings ?? []).filter((l) => l.status !== "sold");
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [method, setMethod] = useState<Method>("mpesa");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const boostType = addOn.id === "featured" ? "featured" : "boost";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStage("waiting");

    if (method === "card") {
      try {
        const { authorizationUrl } = await startBoostCardCheckout(listingId, boostType);
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
      const { invoiceId } = await startBoostCheckout(listingId, boostType, phone);
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        const status = await getInvoiceStatus(invoiceId).catch(() => "pending");
        if (status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          await reloadUser();
          setStage("success");
        } else if (status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStage("failed");
          setError("The payment was cancelled or failed. Please try again.");
        } else if (Date.now() - startedAt > POLL_TIMEOUT) {
          if (pollRef.current) clearInterval(pollRef.current);
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
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Payment received</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your listing is now {boostType === "featured" ? "featured" : "boosted to the top"} for{" "}
              {addOn.period}.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
            >
              Done
            </button>
          </div>
        ) : stage === "pending" ? (
          <div className="py-6 text-center">
            <Clock className="mx-auto h-12 w-12 text-brand" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Still processing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              M-Pesa is taking longer than usual. You don&apos;t need to pay again — if it went
              through, your listing is updated automatically.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
            >
              Done
            </button>
          </div>
        ) : stage === "waiting" && method === "card" ? (
          <div className="py-6 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Redirecting to checkout…</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Taking you to a secure page to complete your card payment.
            </p>
          </div>
        ) : stage === "waiting" ? (
          <div className="py-6 text-center">
            <Smartphone className="mx-auto h-12 w-12 text-brand" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Check your phone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your M-Pesa PIN on the prompt sent to {phone} to complete the payment.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Waiting for confirmation…
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 className="pr-10 text-lg font-semibold text-foreground">{addOn.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Active for {addOn.period}. Pay with {method === "mpesa" ? "M-Pesa" : "card"} to
              activate.
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
                      ? "border-brand bg-brand-subtle text-brand-subtle-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <m.icon className="h-4 w-4" /> {m.label}
                </button>
              ))}
            </div>

            {listings.length === 0 ? (
              <p className="mt-5 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                You need an active listing before you can boost one.
              </p>
            ) : (
              <>
                <label
                  className="mt-4 block text-sm font-medium text-foreground"
                  htmlFor="boost-listing"
                >
                  Choose a listing
                </label>
                <select
                  id="boost-listing"
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-brand focus:outline-none"
                >
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>

                {method === "mpesa" ? (
                  <>
                    <label
                      className="mt-4 block text-sm font-medium text-foreground"
                      htmlFor="boost-phone"
                    >
                      M-Pesa phone number
                    </label>
                    <input
                      id="boost-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="07XX XXX XXX"
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-brand focus:outline-none"
                    />
                  </>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">
                    You&apos;ll be redirected to a secure page to enter your card details.
                  </p>
                )}
              </>
            )}

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={listings.length === 0}
              className="mt-5 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-hover disabled:opacity-60"
            >
              Pay Ksh {addOn.price.toLocaleString()}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
