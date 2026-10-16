import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  Crown,
  Eye,
  Inbox,
  ListChecks,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { type DashTab } from "@/components/DashboardShell";
import { type AppUser } from "@/lib/auth";
import { usePlans } from "@/lib/plans";
import { needsUserAction, useKycApplications } from "@/lib/kyc";
import { Beacon, ListingStatus, ListingThumb } from "@/components/dashboard/parts";

// Plans with more slots than this show the first ones and a "+N" count.
const MAX_SLOT_ICONS = 20;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function OverviewTab({
  user,
  onUpgrade,
  onGoTab,
}: {
  user: AppUser;
  onUpgrade: () => void;
  onGoTab: (t: DashTab) => void;
}) {
  const navigate = useNavigate();
  const { data: plans = [] } = usePlans();
  const { data: kyc = [] } = useKycApplications();
  const plan = plans.find((p) => p.id === user.plan);
  const used = user.listings.length;
  const limit = user.maxListings;
  const unlimited = limit === Infinity;
  const activeCount = user.listings.filter((l) => l.status === "active").length;
  const pendingCount = user.listings.filter((l) => l.status === "pending").length;
  const attention = kyc.filter(needsUserAction);
  const canUpgrade = user.plan !== "pro" && user.plan !== "enterprise";

  const checklist = [
    {
      key: "profile",
      label: "Complete your profile",
      done: Boolean(user.phone && user.county),
      action: () => onGoTab("settings"),
    },
    {
      key: "listing",
      label: "Upload your first listing",
      done: used > 0,
      action: () =>
        navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } }),
    },
    {
      key: "verify",
      label: "Get your listing documents reviewed",
      done: kyc.some((a) => a.status === "approved"),
      action: () => onGoTab("kyc"),
    },
    {
      key: "analytics",
      label: "Unlock advanced analytics",
      done: user.analyticsAccess,
      action: onUpgrade,
    },
  ];
  const completed = checklist.filter((c) => c.done).length;

  const recent = user.listings.slice(0, 4);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const slotCount = unlimited ? used : Math.min(limit, MAX_SLOT_ICONS);
  const slots = Array.from({ length: slotCount }, (_, i) => user.listings[i]);
  const hiddenSlots = unlimited ? 0 : limit - slotCount;

  const price = user.billingCycle === "yearly" ? plan?.priceYearly : plan?.price;
  const billingLine =
    user.plan === "free" || !plan || plan.price === 0
      ? "You are on the Free plan. No payments due."
      : !user.planEndsAt
        ? `${plan.name} plan`
        : user.planCancelledAt
          ? `Your ${plan.name} plan ends on ${fmtDate(user.planEndsAt)}.`
          : `Next billing: KES ${(price ?? 0).toLocaleString()} on ${fmtDate(user.planEndsAt)}`;

  const newListing = () =>
    navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } });

  return (
    <>
      <div className="gd-r flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="gd-h1">
            {greeting}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="gd-sub">Here&apos;s a snapshot of your account activity.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="gd-btn gd-o" onClick={() => onGoTab("analytics")}>
            <BarChart3 size={17} aria-hidden="true" /> View analytics
          </button>
          <button type="button" className="gd-btn" onClick={newListing}>
            <Plus size={17} strokeWidth={2.4} aria-hidden="true" /> New listing
          </button>
        </div>
      </div>

      <div className="gd-r gd-stats">
        <button
          type="button"
          className="gd-card gd-stat text-left"
          onClick={() => onGoTab("listings")}
        >
          <span className="gd-sico">
            <ListChecks size={19} aria-hidden="true" />
          </span>
          <span className="gd-eyebrow">Active listings</span>
          <span className="gd-big">{activeCount}</span>
          <span className="gd-hint m-0">On the public map now</span>
        </button>
        <button
          type="button"
          className="gd-card gd-stat text-left"
          onClick={() => onGoTab("listings")}
        >
          <span className="gd-sico">
            <Inbox size={19} aria-hidden="true" />
          </span>
          <span className="gd-eyebrow">Pending review</span>
          <span className="gd-big">{pendingCount}</span>
          <span className="gd-hint m-0">Usually approved within 24 hours</span>
        </button>
        <button
          type="button"
          className="gd-card gd-stat text-left"
          data-attn={attention.length > 0}
          onClick={() => onGoTab("kyc")}
        >
          <span className="gd-sico">
            <ShieldCheck size={19} aria-hidden="true" />
          </span>
          <span className="gd-eyebrow">Needs your attention</span>
          <span className="gd-big">{attention.length}</span>
          <span className="gd-hint m-0">
            {attention.length === 0
              ? "Nothing needs you right now"
              : attention[0].status === "location_correction_requested"
                ? "KYC: a reviewer asked you to fix a parcel's location"
                : "KYC: a reviewer asked for more information"}
          </span>
        </button>
      </div>

      <div className="gd-r gd-row2">
        <div className="gd-card flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="gd-eyebrow flex items-center gap-1.5">
                <Crown size={14} aria-hidden="true" /> Current plan
              </span>
              <span className="gd-h text-[30px]">{plan?.name ?? user.plan}</span>
              <span className="text-[14.5px] text-muted-foreground">
                {unlimited ? `${used} listings · unlimited` : `${used} of ${limit} listings used`}
              </span>
            </div>
            <button type="button" className="gd-link" onClick={() => onGoTab("billing")}>
              Manage plan <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
          <div
            className="flex flex-wrap items-end gap-2"
            role="img"
            aria-label={
              unlimited
                ? `${used} listing slots used, unlimited`
                : `${used} of ${limit} listing slots used`
            }
          >
            {slots.map((l, i) => (
              <span key={l?.id ?? `free-${i}`} title={l?.parcelNumber}>
                <Beacon used={Boolean(l)} />
              </span>
            ))}
            {unlimited && <span className="gd-h pl-1 text-[26px] text-muted-foreground">+ ∞</span>}
            {hiddenSlots > 0 && (
              <span className="gd-mono pl-1 text-sm text-muted-foreground">+{hiddenSlots}</span>
            )}
          </div>
          <div className="gd-facts3">
            <div>
              <span className="gd-eyebrow">Photos / listing</span>
              <span className="text-[15px] font-semibold">{plan?.photos ?? "—"}</span>
            </div>
            <div>
              <span className="gd-eyebrow">Documents</span>
              <span className="text-[15px] font-semibold">{plan?.documents ?? "—"}</span>
            </div>
            <div>
              <span className="gd-eyebrow">Analytics</span>
              <span className="text-[15px] font-semibold">
                {user.analyticsAccess ? "Included" : "Pro only"}
              </span>
            </div>
          </div>
          <div className="mt-auto flex flex-wrap justify-between gap-3 border-t border-dashed border-border pt-3.5 text-sm">
            <span className="text-muted-foreground">
              {unlimited ? "Unlimited slots" : `${Math.max(0, limit - used)} slots remaining`}
            </span>
            {canUpgrade && (
              <button type="button" className="gd-link" onClick={onUpgrade}>
                Upgrade to Pro <ChevronRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="gd-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="gd-h2">Getting started</h2>
            <span className="gd-mono text-[13px] text-muted-foreground">
              {completed}/{checklist.length}
            </span>
          </div>
          <div
            className="gd-bar h-1.5"
            role="progressbar"
            aria-label="Getting started progress"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={checklist.length}
          >
            <span style={{ width: `${(completed / checklist.length) * 100}%` }} />
          </div>
          <ul className="flex flex-col gap-0.5">
            {checklist.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  className="gd-mi gd-todo"
                  data-done={c.done}
                  onClick={c.action}
                >
                  <span className="gd-tick">
                    <Check size={13} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="flex-1">{c.label}</span>
                  {c.done && <span className="sr-only">(done)</span>}
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gd-r gd-card px-2 pb-3 pt-2">
        <div className="flex items-center justify-between px-3.5 pb-2 pt-3">
          <h2 className="gd-h2">Recent listings</h2>
          <button type="button" className="gd-link" onClick={() => onGoTab("listings")}>
            View all <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="gd-empty mx-3.5 mb-1 mt-1.5">
            <Beacon width={26} height={36} />
            <span className="gd-h2">No listings yet</span>
            <span className="text-[14.5px] text-muted-foreground">
              Upload your first parcel or property to see it here.
            </span>
            <button type="button" className="gd-btn mt-1.5" onClick={newListing}>
              Upload your first listing
            </button>
          </div>
        ) : (
          <ul>
            {recent.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="gd-mi"
                  style={{ minHeight: 64, gap: 14, padding: "8px 14px" }}
                  onClick={() => onGoTab("listings")}
                >
                  <ListingThumb kind="land" coverPhotoUrl={l.coverPhotoUrl} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="gd-mono truncate text-[14.5px] font-semibold">
                      {l.parcelNumber}
                    </span>
                    <span className="text-[13.5px] text-muted-foreground">
                      {l.county} · KES {l.price.toLocaleString()}
                    </span>
                  </span>
                  {user.analyticsAccess && (
                    <span className="gd-deskonly flex w-[90px] items-center justify-end gap-1.5 text-[13.5px] text-muted-foreground">
                      <Eye size={16} aria-hidden="true" />
                      {l.views}
                    </span>
                  )}
                  <span className="gd-stw">
                    <ListingStatus status={l.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="gd-r gd-dash flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <span className="flex items-center gap-2.5 text-[14.5px]">
          <CalendarClock size={18} aria-hidden="true" /> {billingLine}
        </span>
        <button type="button" className="gd-link" onClick={() => onGoTab("billing")}>
          Manage billing <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
