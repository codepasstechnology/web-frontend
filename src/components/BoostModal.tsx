import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  CheckoutStatus,
  MethodSwitch,
  MPESA_PHONE,
  MpesaPhoneField,
} from "@/components/CheckoutModal";

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
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const boostType = addOn.id === "featured" ? "featured" : "boost";

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setError(null);
    setStage("form");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (method === "card") {
      setStage("waiting");
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

    const msisdn = phone.replace(/\s/g, "");
    if (!MPESA_PHONE.test(msisdn)) {
      setPhoneTouched(true);
      return;
    }
    setStage("waiting");

    try {
      const { invoiceId } = await startBoostCheckout(listingId, boostType, msisdn);
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
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gd-dialog [&>button:last-child]:hidden">
        {stage === "waiting" || stage === "success" || stage === "pending" ? (
          <CheckoutStatus
            stage={stage}
            method={method}
            phone={phone}
            doneText={`Your listing is now ${boostType === "featured" ? "featured" : "boosted to the top"} for ${addOn.period}.`}
            pendingText="M-Pesa is taking longer than usual. You don't need to pay again — if it went through, your listing is updated automatically."
            onCancel={stopPolling}
            onClose={onClose}
          />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex justify-between gap-3">
              <div>
                <DialogTitle className="gd-h1 text-[26px]">{addOn.name}</DialogTitle>
                <DialogDescription className="gd-sub">
                  Active for {addOn.period}. Pay with {method === "mpesa" ? "M-Pesa" : "card"} to
                  activate.
                </DialogDescription>
              </div>
              <button type="button" className="gd-ib" onClick={onClose} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="rounded-[14px] bg-track px-3.5 py-3 text-sm text-muted-foreground">
                You need an active listing before you can boost one.
              </div>
            ) : (
              <>
                <div>
                  <label className="gd-lab" htmlFor="boost-listing">
                    Choose a listing
                  </label>
                  <select
                    id="boost-listing"
                    className="gd-input"
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                  >
                    {listings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.parcelNumber} · {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <MethodSwitch method={method} onChange={setMethod} />

                {method === "mpesa" ? (
                  <MpesaPhoneField
                    id="boost-phone"
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
              </>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-[14px] bg-destructive-subtle px-3.5 py-3 text-sm font-semibold text-destructive"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={listings.length === 0}
              className="gd-btn min-h-[52px] text-base"
            >
              Pay KES {addOn.price.toLocaleString()}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
