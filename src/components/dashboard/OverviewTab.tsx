import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Plus,
  BarChart3,
  Eye,
  Inbox,
  ListChecks,
  Crown,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { type DashTab } from "@/components/DashboardShell";
import { type AppUser } from "@/lib/auth";
import { usePlans } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/dashboard/ListingsTab";

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-brand">
          {icon}
        </div>
        <span className="leading-tight">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-[-0.02em] tabular-nums">{value}</div>
    </Card>
  );
}

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
  const plan = plans.find((p) => p.id === user.plan);
  const used = user.listings.length;
  const limitNum = user.maxListings;
  const limitText = limitNum === Infinity ? "Unlimited" : String(limitNum);
  const pct = limitNum === Infinity ? 12 : Math.min(100, Math.round((used / limitNum) * 100));
  const activeCount = user.listings.filter((l) => l.status === "active").length;
  const pendingCount = user.listings.filter((l) => l.status === "pending").length;

  // 14-day mini sparkline
  const spark = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        d: i,
        v: Math.max(2, Math.round(8 + Math.sin(i / 2) * 4 + i * 0.6 + Math.random() * 4)),
      })),
    [],
  );

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
      label: "Add a verification badge",
      done: false,
      action: () => onGoTab("billing"),
    },
    {
      key: "pro",
      label: "Unlock advanced analytics",
      done: user.plan === "pro",
      action: onUpgrade,
    },
  ];
  const completed = checklist.filter((c) => c.done).length;

  const recent = user.listings.slice(0, 4);
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  const newListing = () =>
    navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } });

  return (
    <div className="lv-fade-up flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">
            {greeting}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s a snapshot of your account activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onGoTab("analytics")}
          >
            <BarChart3 /> View analytics
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-brand text-brand-foreground hover:bg-brand-hover sm:flex-none"
            onClick={newListing}
          >
            <Plus /> New listing
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Stat
          icon={<ListChecks className="h-4 w-4" />}
          label="Active listings"
          value={String(activeCount)}
        />
        <Stat
          icon={<Inbox className="h-4 w-4" />}
          label="Pending review"
          value={String(pendingCount)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <Crown aria-hidden className="h-3.5 w-3.5 text-brand" /> Current plan
              </div>
              <div className="mt-1 text-xl font-bold">{plan?.name ?? user.plan}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {used} of {limitText} listings used
              </div>
            </div>
            <div className="h-16 w-32" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--brand)"
                    strokeWidth={2}
                    fill="url(#sparkG)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <Progress
            value={pct}
            aria-label="Listing slots used"
            className="mt-4 bg-muted [&>div]:bg-brand"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {limitNum === Infinity
                ? "Unlimited slots"
                : `${Math.max(0, limitNum - used)} slots remaining`}
            </span>
            {user.plan !== "pro" && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-brand"
                onClick={onUpgrade}
              >
                Upgrade to Pro →
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Getting started</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {completed}/{checklist.length}
            </span>
          </div>
          <Progress
            value={(completed / checklist.length) * 100}
            aria-label="Getting started progress"
            className="mt-3 h-1.5 bg-muted [&>div]:bg-success"
          />
          <ul className="mt-4 flex flex-col gap-1">
            {checklist.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={c.action}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm transition-colors hover:bg-muted hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {c.done ? (
                    <CheckCircle2 aria-hidden className="h-4 w-4 text-success" />
                  ) : (
                    <span aria-hidden className="h-4 w-4 rounded-full border-2 border-border" />
                  )}
                  <span className={c.done ? "text-muted-foreground line-through" : ""}>
                    {c.label}
                  </span>
                  {c.done && <span className="sr-only">(done)</span>}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-bold">Recent listings</h2>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-brand"
            onClick={() => onGoTab("listings")}
          >
            View all →
          </Button>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            className="rounded-none border-0 p-10"
            title="No listings yet"
            description="Upload your first parcel or property to see it here."
            action={
              <Button
                size="sm"
                onClick={newListing}
                className="bg-brand text-brand-foreground hover:bg-brand-hover"
              >
                <Plus /> Upload your first listing
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                {l.coverPhotoUrl ? (
                  <img
                    src={l.coverPhotoUrl}
                    alt=""
                    className="h-10 w-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-10 w-12 shrink-0 rounded-md bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.parcelNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.county} · KES {l.price.toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={l.status} />
                {user.analyticsAccess && (
                  <div className="hidden items-center gap-1 text-xs text-muted-foreground tabular-nums sm:flex">
                    <Eye aria-hidden className="h-3 w-3" /> {l.views}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4">
        <div className="flex items-center gap-2 text-sm">
          <CalendarClock aria-hidden className="h-4 w-4 text-muted-foreground" />
          Next billing:{" "}
          <span className="font-medium">
            {(plan?.price ?? 0) === 0
              ? "—"
              : new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-brand"
          onClick={() => onGoTab("billing")}
        >
          Manage billing →
        </Button>
      </div>
    </div>
  );
}
