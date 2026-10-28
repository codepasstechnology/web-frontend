import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  CreditCard,
  Crown,
  Download,
  Mail,
  Receipt,
  RefreshCw,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { addOns, freePlanFor, plansFor, type Plan } from "@/lib/plans";
import { BoostModal } from "@/components/BoostModal";
import { StatusChip, type ChipKind } from "@/components/dashboard/parts";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BOOST_COPY: Record<string, string> = {
  boost: "Your listing shows first in its county on the map and in search for 7 days.",
  featured: 'A "Featured" mark on the map label and listing page for 30 days.',
};

const PAY_KIND: Record<string, ChipKind> = {
  Paid: "ok",
  Pending: "warn",
  Failed: "err",
  Refunded: "muted",
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type Payment = {
  number: string;
  date: string;
  amount: number;
  plan: string;
  status: string;
  downloadUrl: string;
};

/** "Cancel your subscription?" — used by Billing and when Free is picked anywhere else. */
export function CancelPlanDialog({
  open,
  planName,
  endsAt,
  freePlan,
  onClose,
}: {
  open: boolean;
  planName: string;
  endsAt: string | null;
  freePlan: Plan | undefined;
  onClose: () => void;
}) {
  const { cancelSubscription } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const until = endsAt ? fmtDate(endsAt) : "the end of your billing period";
  const freeName = freePlan?.name ?? "Free";
  const freeListings = freePlan && freePlan.listings !== Infinity ? freePlan.listings : null;

  const confirm = async () => {
    setCancelling(true);
    setError("");
    try {
      await cancelSubscription();
      toast.success(`Cancelled. You keep ${planName} until ${until}.`);
      onClose();
    } catch {
      setError("Couldn't cancel your subscription. Check your connection and try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !cancelling && onClose()}>
      <AlertDialogContent className="gd-dialog" style={{ maxWidth: 440 }}>
        <AlertDialogTitle className="gd-h1 text-[26px]">Cancel your subscription?</AlertDialogTitle>
        <AlertDialogDescription className="gd-sub m-0 leading-relaxed">
          Your {planName} plan stays active until {until}. It won&apos;t renew after that, and
          you&apos;ll move to the {freeName} plan. You can resume anytime before then.
        </AlertDialogDescription>
        <div className="flex flex-col gap-2 rounded-2xl bg-track p-3.5 text-sm">
          <span className="font-semibold">On {freeName} you&apos;ll keep:</span>
          <span className="gd-feat">
            <Check size={15} strokeWidth={2.6} aria-hidden="true" />
            Your account, saved plots and invoices
          </span>
          {freeListings !== null && (
            <span className="gd-feat">
              <Check size={15} strokeWidth={2.6} aria-hidden="true" />
              Up to {freeListings} live {freeListings === 1 ? "listing" : "listings"} (others are
              paused, not deleted)
            </span>
          )}
        </div>
        {error && (
          <div role="alert" className="gd-err m-0">
            {error}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="gd-btn" onClick={onClose} disabled={cancelling}>
            Keep plan
          </button>
          <button
            type="button"
            className="gd-btn gd-o"
            data-tone="danger"
            onClick={confirm}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling…" : "Cancel subscription"}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type Return = "checking" | "success" | "failed" | "pending";

const RETURN: Record<Return, [string, string, ChipKind]> = {
  checking: ["Checking your card payment…", "This usually takes a few seconds.", "warn"],
  success: [
    "Payment received",
    "Your plan is now active. Your receipt is in your email and below.",
    "ok",
  ],
  failed: [
    "Payment failed",
    "The card payment was not completed. You have not been charged.",
    "err",
  ],
  pending: [
    "Still processing",
    "This can take a moment. Your plan updates automatically once confirmed.",
    "warn",
  ],
};

const RETURN_TONE: Record<ChipKind, string> = {
  ok: "bg-brand-subtle text-brand-subtle-foreground",
  warn: "bg-warning-subtle text-warning",
  err: "bg-destructive-subtle text-destructive",
  muted: "bg-track text-muted-foreground",
};

export function BillingTab({
  plan,
  billingCycle,
  planStatus,
  planEndsAt,
  planCancelledAt,
  plans,
  agencyRole,
  maxListings,
  usedListings,
  payments,
  onSelectPlan,
  manager,
}: {
  plan: string;
  billingCycle: "monthly" | "yearly" | null;
  planStatus: string | null;
  planEndsAt: string | null;
  planCancelledAt: string | null;
  plans: Plan[];
  /** The account's role in its agency, or undefined for individual accounts. */
  agencyRole?: string;
  maxListings: number;
  usedListings: number;
  payments: Payment[];
  onSelectPlan: (p: string, cycle?: "monthly" | "yearly") => void;
  manager: { name: string; email: string } | null;
}) {
  const { reloadUser, verifyCardPayment, resumeSubscription } = useAuth();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [boostAddOn, setBoostAddOn] = useState<(typeof addOns)[number] | null>(null);
  const [view, setView] = useState<"monthly" | "yearly">(billingCycle ?? "monthly");
  const isAgency = agencyRole !== undefined;
  const [audience, setAudience] = useState<"individual" | "agency">(
    isAgency ? "agency" : "individual",
  );
  const [ret, setRet] = useState<Return | null>(null);

  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  // Paystack redirects the browser back here with ?payment=paystack&reference=...
  // after checkout. These aren't part of the route's validated search (adding
  // them there would force every /dashboard navigation elsewhere in the app to
  // supply them), so they're read directly off the URL, once, on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (params.get("payment") !== "paystack" || !reference) return;

    let cancelled = false;
    const startedAt = Date.now();
    setRet("checking");

    const poll = async () => {
      const status = await verifyCardPayment(reference).catch(() => "pending");
      if (cancelled) return;

      if (status === "paid") {
        await reloadUser();
        setRet("success");
      } else if (status === "failed") {
        setRet("failed");
      } else if (Date.now() - startedAt < 60_000) {
        setTimeout(poll, 3000);
        return;
      } else {
        setRet("pending");
      }

      navigate({ to: "/dashboard", search: { tab: "billing" } });
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = plans.find((pl) => pl.id === plan);
  const unlimited = maxListings === Infinity;

  if (!p) {
    return <div className="gd-skel h-48" aria-label="Loading plan details" />;
  }

  const free = p.price === 0;
  const isYearly = billingCycle === "yearly";
  const planAmount = isYearly ? (p.priceYearly ?? p.price * 12) : p.price;
  const cancelled = Boolean(planCancelledAt);
  const endsOn = planEndsAt ? fmtDate(planEndsAt) : null;

  const resume = async () => {
    setResuming(true);
    try {
      await resumeSubscription();
      toast.success(`Resumed. Your ${p.name} plan renews${endsOn ? ` on ${endsOn}` : ""}.`);
    } catch {
      toast.error("Couldn't resume your plan. Check your connection and try again.");
    } finally {
      setResuming(false);
    }
  };
  const active = free || planStatus === "active";
  const totalPaid = payments.filter((x) => x.status === "Paid").reduce((a, b) => a + b.amount, 0);
  const ownPlans = plansFor(plans, isAgency);
  const shownPlans = plansFor(plans, audience === "agency");
  const ownAudience = (audience === "agency") === isAgency;
  const hasAgencyPlans = plans.some((pl) => pl.audience === "agency");
  const upgradeTo = ownPlans.find((pl) => pl.id === (isAgency ? "agency-pro" : "pro"));
  const yearlySave = (() => {
    const paid = shownPlans.filter((pl) => pl.price > 0 && pl.priceYearly);
    if (paid.length === 0) return 0;
    const pl = paid[0];
    return Math.round((1 - (pl.priceYearly ?? 0) / (pl.price * 12)) * 100);
  })();

  return (
    <>
      <div className="gd-r">
        <h1 className="gd-h1">Billing &amp; Plan</h1>
        <p className="gd-sub">Manage your subscription, payments and invoices.</p>
      </div>

      {ret && (
        <div
          role="status"
          className={`gd-r flex items-center gap-3.5 rounded-[18px] px-4 py-3.5 ${RETURN_TONE[RETURN[ret][2]]}`}
        >
          <span className="flex-1">
            <strong className="block">{RETURN[ret][0]}</strong>
            <span className="text-sm">{RETURN[ret][1]}</span>
          </span>
          {ret === "checking" && <span className="gd-spin" />}
          <button
            type="button"
            className="gd-ib"
            style={{ color: "inherit" }}
            onClick={() => setRet(null)}
            aria-label="Dismiss"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="gd-r gd-card gd-banner">
        <div className="gd-bp">
          <span className="gd-eyebrow flex items-center gap-1.5">
            <Crown size={14} aria-hidden="true" /> Current plan
          </span>
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="gd-h text-[34px]">{p.name}</span>
            <span className="text-muted-foreground">
              {free ? "/ free forever" : isYearly ? "/ year" : "/ month"}
            </span>
          </span>
          <span className="font-semibold">
            {free ? "KES 0" : `KES ${planAmount.toLocaleString()}`}
          </span>
          <span className="self-start">
            {!active ? (
              <StatusChip kind="err" label={planStatus ?? "Inactive"} />
            ) : cancelled && endsOn ? (
              <StatusChip kind="warn" label={`Cancels on ${endsOn}`} />
            ) : (
              <StatusChip kind="ok" label="Active" />
            )}
          </span>
        </div>
        <div className="gd-bp">
          <span className="gd-eyebrow">Listings usage</span>
          <span className="gd-h text-[28px]">
            {usedListings} of {unlimited ? "unlimited" : maxListings}
          </span>
          {!unlimited && (
            <div
              className="gd-bar"
              role="progressbar"
              aria-label="Listing slots used"
              aria-valuenow={usedListings}
              aria-valuemin={0}
              aria-valuemax={maxListings}
            >
              <span style={{ width: `${Math.min(100, (usedListings / maxListings) * 100)}%` }} />
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {unlimited
              ? `Unlimited listings on ${p.name}`
              : `${Math.max(0, maxListings - usedListings)} listing slots remaining`}
          </span>
        </div>
        <div className="gd-bp">
          <span className="gd-eyebrow">
            {free ? "Upgrade for more" : cancelled ? "Subscription ends" : "Next billing"}
          </span>
          <span className="gd-h text-[28px]">
            {free ? "—" : `KES ${planAmount.toLocaleString()}`}
          </span>
          <span className="text-sm text-muted-foreground">
            {free
              ? "You are on the free tier"
              : cancelled
                ? `Cancelled. Access until ${endsOn ?? "the period end"}`
                : endsOn
                  ? `Renews on ${endsOn}`
                  : "—"}
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {agencyRole !== "agent" &&
              agencyRole !== "manager" &&
              upgradeTo &&
              p.price < upgradeTo.price && (
                <button
                  type="button"
                  className="gd-btn gd-sm"
                  onClick={() => onSelectPlan(upgradeTo.id, billingCycle ?? undefined)}
                >
                  <Sparkles size={15} aria-hidden="true" /> Upgrade
                </button>
              )}
            {!free && cancelled && (
              <button
                type="button"
                className="gd-btn gd-sm gd-o"
                onClick={resume}
                disabled={resuming}
              >
                <RefreshCw size={15} aria-hidden="true" /> {resuming ? "Resuming…" : "Resume"}
              </button>
            )}
            {!free && !cancelled && (
              <button
                type="button"
                className="gd-btn gd-sm gd-o"
                onClick={() => onSelectPlan(plan, billingCycle ?? undefined)}
              >
                <RefreshCw size={15} aria-hidden="true" /> Renew
              </button>
            )}
            {!free && !cancelled && (
              <button
                type="button"
                className="gd-btn gd-sm gd-o"
                data-tone="muted"
                onClick={() => setCancelOpen(true)}
              >
                Cancel plan
              </button>
            )}
          </div>
        </div>
      </div>

      {manager && (
        <div className="gd-r gd-card flex flex-wrap items-center gap-4">
          <span className="gd-avatar" style={{ width: 48, height: 48 }}>
            {initials(manager.name)}
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="gd-eyebrow">Your dedicated account manager</span>
            <span className="text-base font-bold">{manager.name}</span>
            <span className="text-sm text-muted-foreground">{manager.email}</span>
          </span>
          <a href={`mailto:${manager.email}`} className="gd-btn gd-o gd-sm">
            <Mail size={15} aria-hidden="true" /> Email {manager.name.split(" ")[0]}
          </a>
        </div>
      )}

      {agencyRole === "agent" || agencyRole === "manager" ? (
        <div className="gd-r gd-card">
          <h2 className="gd-h2 text-[22px]">Your agency&apos;s plan</h2>
          <p className="gd-sub mt-1 text-[14.5px]">
            You&apos;re on {p.name} with the rest of your team. Your agency&apos;s owner manages the
            plan and its billing.
          </p>
        </div>
      ) : (
        <>
          <div className="gd-r mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="gd-h2 text-[22px]">Choose a plan</h2>
              <p className="gd-sub text-[14.5px]">
                Switch anytime. Upgrades start now; downgrades apply at your next billing date.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasAgencyPlans && (
                <div className="gd-seg" role="group" aria-label="Account type">
                  <button
                    type="button"
                    aria-pressed={audience === "individual"}
                    onClick={() => setAudience("individual")}
                  >
                    Owners
                  </button>
                  <button
                    type="button"
                    aria-pressed={audience === "agency"}
                    onClick={() => setAudience("agency")}
                  >
                    Agencies
                  </button>
                </div>
              )}
              <div className="gd-seg" role="group" aria-label="Billing cycle">
                <button
                  type="button"
                  aria-pressed={view === "monthly"}
                  onClick={() => setView("monthly")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  aria-pressed={view === "yearly"}
                  onClick={() => setView("yearly")}
                >
                  Yearly
                  {yearlySave > 0 && (
                    <span className="gd-st px-[7px] py-0.5 text-[11px]" data-k="ok">
                      −{yearlySave}%
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {!ownAudience && (
            <p className="gd-r gd-sub text-[14.5px]">
              {isAgency
                ? "These plans are for individual owners. Your agency stays on an agency plan."
                : "Agency plans come with a team, a lead inbox and an agency page. Set up your agency in Settings to choose one."}
            </p>
          )}

          <div className="gd-r gd-plans">
            {shownPlans.map((pl) => {
              const cur = pl.id === plan;
              const down = pl.price < p.price;
              const yr = view === "yearly" && pl.priceYearly != null && pl.price > 0;
              const shown = yr ? (pl.priceYearly ?? 0) : pl.price;
              return (
                <div
                  key={pl.id}
                  className="gd-plan"
                  data-pop={Boolean(pl.badge) && !cur}
                  data-cur={cur}
                >
                  {pl.badge && !cur && <span className="gd-ribbon">{pl.badge.label}</span>}
                  <span className="flex items-center justify-between">
                    <span className="gd-eyebrow">{pl.name}</span>
                    {cur && <StatusChip kind="ok" label="Your plan" />}
                  </span>
                  <span className="flex items-baseline gap-1">
                    <span className="gd-h text-[28px]">
                      {pl.price === 0 ? "Free" : `KES ${shown.toLocaleString()}`}
                    </span>
                    {pl.price > 0 && (
                      <span className="text-sm text-muted-foreground">{yr ? "/ yr" : "/ mo"}</span>
                    )}
                  </span>
                  <span className="min-h-[18px] text-[13px] text-muted-foreground">
                    {pl.price === 0
                      ? "Forever"
                      : pl.priceYearly == null
                        ? ""
                        : yr
                          ? `That is KES ${Math.round(pl.priceYearly / 12).toLocaleString()} a month`
                          : `or KES ${pl.priceYearly.toLocaleString()} a year`}
                  </span>
                  <ul className="flex flex-1 flex-col gap-[7px]">
                    {pl.features.slice(0, 5).map((f) => (
                      <li key={f} className="gd-feat">
                        <Check size={15} strokeWidth={2.6} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!ownAudience ? (
                    isAgency ? (
                      <button type="button" disabled className="gd-btn gd-o">
                        For individual accounts
                      </button>
                    ) : (
                      <Link to="/dashboard" search={{ tab: "settings" }} className="gd-btn gd-o">
                        Set up your agency
                      </Link>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={cur}
                      onClick={() =>
                        pl.price === 0 ? setCancelOpen(true) : onSelectPlan(pl.id, view)
                      }
                      className={`gd-btn ${down ? "gd-o" : ""}`}
                      data-tone={cur ? "current" : undefined}
                    >
                      {cur
                        ? "Current plan"
                        : pl.price === 0
                          ? "Downgrade"
                          : down
                            ? `Switch to ${pl.name}`
                            : `Upgrade to ${pl.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="gd-r gd-g21b">
        <div className="gd-card flex flex-col gap-3.5">
          <div>
            <h2 className="gd-h2 flex items-center gap-2">
              <Zap size={18} aria-hidden="true" /> One-time boosts
            </h2>
            <p className="gd-sub mt-1 text-sm">
              Get more visibility for one listing, without changing your plan.
            </p>
          </div>
          <div className="gd-boosts">
            {addOns.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-2 rounded-[18px] border-[1.5px] border-border bg-background p-4"
              >
                <span className="flex items-start justify-between gap-2.5">
                  <span className="text-[15.5px] font-bold">{a.name}</span>
                  <span className="gd-h whitespace-nowrap text-xl">KES {a.price}</span>
                </span>
                <span className="flex-1 text-[13.5px] leading-snug text-muted-foreground">
                  {BOOST_COPY[a.id] ?? `Active for ${a.period}.`}
                </span>
                <button
                  type="button"
                  className="gd-btn gd-sm gd-o self-start"
                  onClick={() => setBoostAddOn(a)}
                >
                  Buy for a listing
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="gd-card flex flex-col gap-3.5">
          <h2 className="gd-h2 flex items-center gap-2">
            <CreditCard size={18} aria-hidden="true" /> How you pay
          </h2>
          <div className="gd-dash flex flex-col gap-2.5 p-3.5 text-sm leading-normal">
            <span className="flex gap-2.5">
              <Smartphone size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong>M-Pesa:</strong> approve the charge on your phone with your PIN.
              </span>
            </span>
            <span className="flex gap-2.5">
              <CreditCard size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong>Card:</strong> paid on a secure Paystack page. We never store card details.
              </span>
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between rounded-2xl bg-brand-subtle px-4 py-3.5 text-brand-subtle-foreground">
            <span className="font-semibold">Total paid</span>
            <span className="gd-h text-[22px]">KES {totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="gd-r gd-card px-2 pb-3 pt-2">
        <div className="flex items-center justify-between px-3.5 pb-2 pt-3">
          <h2 className="gd-h2 flex items-center gap-2">
            <Receipt size={18} aria-hidden="true" /> Invoice history
          </h2>
          <span className="text-[13.5px] text-muted-foreground">
            {payments.length} {payments.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>
        {payments.length === 0 ? (
          <div className="gd-empty mx-3.5 mb-1 mt-1.5">
            <Receipt size={26} className="text-muted-foreground" aria-hidden="true" />
            <span className="gd-h2">No invoices yet</span>
            <span className="text-[14.5px] text-muted-foreground">
              Your payment receipts will appear here.
            </span>
          </div>
        ) : (
          <>
            <div className="gd-inv gd-invh gd-deskonly">
              <span>Invoice</span>
              <span>Date</span>
              <span>Item</span>
              <span className="text-right">Amount</span>
              <span>Status</span>
              <span />
            </div>
            {payments.map((pay) => {
              const failed = pay.status === "Failed";
              return (
                <div key={pay.number}>
                  <div className="gd-inv gd-deskonly">
                    <span className="gd-mono text-[13.5px]">{pay.number}</span>
                    <span>{pay.date}</span>
                    <span>{pay.plan}</span>
                    <span className="gd-mono text-right font-semibold">
                      KES {pay.amount.toLocaleString()}
                    </span>
                    <span>
                      <StatusChip kind={PAY_KIND[pay.status] ?? "muted"} label={pay.status} />
                    </span>
                    <span className="text-right">
                      {failed ? (
                        <span className="gd-link cursor-not-allowed opacity-45">
                          <Download size={14} aria-hidden="true" /> PDF
                        </span>
                      ) : (
                        <a
                          href={pay.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gd-link"
                          aria-label={`Download ${pay.number}`}
                        >
                          <Download size={14} aria-hidden="true" /> PDF
                        </a>
                      )}
                    </span>
                  </div>
                  <div className="gd-mobonly items-center justify-between gap-2.5 border-t border-border-subtle px-3.5 py-3">
                    <span className="flex flex-col gap-0.5">
                      <span className="gd-mono text-[13px] font-semibold">{pay.number}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {pay.plan} · {pay.date}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="gd-mono whitespace-nowrap font-semibold">
                        KES {pay.amount.toLocaleString()}
                      </span>
                      <StatusChip kind={PAY_KIND[pay.status] ?? "muted"} label={pay.status} />
                    </span>
                    {!failed && (
                      <a
                        href={pay.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gd-ib"
                        aria-label="Download invoice"
                      >
                        <Download size={17} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {boostAddOn && <BoostModal addOn={boostAddOn} onClose={() => setBoostAddOn(null)} />}

      <CancelPlanDialog
        open={cancelOpen}
        planName={p.name}
        endsAt={planEndsAt}
        freePlan={freePlanFor(plans, isAgency)}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}
