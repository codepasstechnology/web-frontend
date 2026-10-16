import { useNavigate } from "@tanstack/react-router";
import {
  LayoutGrid,
  List,
  Upload,
  BarChart3,
  Wallet,
  Settings,
  ShieldCheck,
  MoreHorizontal,
  Crown,
} from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { usePlans } from "@/lib/plans";
import { VerifyAccountModal } from "@/components/VerifyAccountModal";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "@/components/dashboard/dashboard.css";

export type DashTab =
  "overview" | "listings" | "upload" | "analytics" | "billing" | "settings" | "kyc";

// `short` is what the bottom nav's expanded pill shows; `label` stays the full
// name for the sidebar and for every button's accessible name.
const items: { id: DashTab; label: string; short: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", short: "Overview", icon: <LayoutGrid size={19} /> },
  { id: "listings", label: "My Listings", short: "Listings", icon: <List size={19} /> },
  { id: "upload", label: "Upload", short: "Upload", icon: <Upload size={19} /> },
  { id: "analytics", label: "Analytics", short: "Analytics", icon: <BarChart3 size={19} /> },
  { id: "billing", label: "Billing & Plan", short: "Billing", icon: <Wallet size={19} /> },
  { id: "kyc", label: "KYC Status", short: "KYC", icon: <ShieldCheck size={19} /> },
  { id: "settings", label: "Account Settings", short: "Settings", icon: <Settings size={19} /> },
];

/**
 * One slot of the floating bottom bar. Collapsed it is an icon-only tile;
 * expanded it carries a filled icon tile and the label.
 *
 * The label's width is animated through a 0fr -> 1fr grid column rather than a
 * width, so the pill sizes itself to whatever text it holds without anything
 * having to measure it first.
 */
const NavPill = forwardRef<
  HTMLButtonElement,
  {
    icon: ReactNode;
    label: string;
    short: string;
    expanded: boolean;
  } & React.ComponentPropsWithoutRef<"button">
>(function NavPill({ icon, label, short, expanded, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      data-expanded={expanded}
      className={`gd-mb transition-[padding,background-color] duration-300 ease-in-out motion-reduce:transition-none ${className ?? ""}`}
      {...rest}
    >
      <span className="gd-mbi">{icon}</span>
      <span
        aria-hidden
        className="grid transition-[grid-template-columns] duration-300 ease-in-out motion-reduce:transition-none"
        style={{ gridTemplateColumns: expanded ? "1fr" : "0fr" }}
      >
        <span
          className={`overflow-hidden whitespace-nowrap transition-opacity duration-200 motion-reduce:transition-none ${
            expanded ? "opacity-100" : "opacity-0"
          }`}
        >
          {short}
        </span>
      </span>
    </button>
  );
});

// The mobile bottom nav only has room for a handful of comfortable tap
// targets — the rest live behind "More" so none of them end up as an
// unreadable, hard-to-tap sliver.
const mobilePrimaryItems = items.slice(0, 4);
const mobileOverflowItems = items.slice(4);

interface Props {
  active: DashTab;
  onChange?: (t: DashTab) => void;
  /** Opens the upgrade flow; without it the plan card goes to Billing. */
  onUpgrade?: () => void;
  children: ReactNode;
}

export function DashboardShell({ active, onChange, onUpgrade, children }: Props) {
  const { user } = useAuth();
  const { data: plans = [] } = usePlans();
  const navigate = useNavigate();
  const overflowActive = mobileOverflowItems.find((it) => it.id === active);

  const handleSelect = (t: DashTab) => {
    if (t === "upload") {
      navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } });
      return;
    }
    onChange?.(t);
    navigate({ to: "/dashboard", search: { tab: t } });
  };

  const planName = plans.find((p) => p.id === user?.plan)?.name ?? user?.plan;
  const used = user?.listings.length ?? 0;
  const unlimited = user?.maxListings === Infinity;
  const usedPct = !user ? 0 : unlimited ? 12 : Math.min(100, (used / user.maxListings) * 100);
  const canUpgrade = !!user && user.plan !== "pro" && user.plan !== "enterprise";

  return (
    <div className="gd-root">
      <DashboardTopBar onSelect={handleSelect} />

      <div className="gd-app">
        <aside className="gd-side" aria-label="Dashboard">
          <nav className="flex flex-col gap-0.5">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => handleSelect(it.id)}
                aria-current={it.id === active ? "page" : undefined}
                className="gd-nav"
              >
                {it.icon}
                {it.label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {user && (
            <div className="gd-plancard">
              <svg
                className="gd-plancard-art"
                viewBox="0 0 220 120"
                width="220"
                height="120"
                aria-hidden="true"
              >
                <path
                  d="M10 100 60 20 120 70 190 10 210 90 120 110Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <circle cx="60" cy="20" r="3" fill="currentColor" />
                <circle cx="120" cy="70" r="3" fill="currentColor" />
                <circle cx="190" cy="10" r="3" fill="currentColor" />
                <circle cx="210" cy="90" r="3" fill="currentColor" />
              </svg>
              <span className="gd-plancard-label">
                <Crown size={15} aria-hidden="true" /> {planName} plan
              </span>
              <span className="relative text-sm">
                {unlimited
                  ? `${used} listings · unlimited`
                  : `${used} of ${user.maxListings} listings used`}
              </span>
              <span className="gd-plancard-bar">
                <span style={{ width: `${usedPct}%` }} />
              </span>
              {canUpgrade && (
                <button
                  type="button"
                  className="gd-plancard-upgrade"
                  onClick={() => (onUpgrade ? onUpgrade() : handleSelect("billing"))}
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          )}
        </aside>

        <main className="gd-main">
          <div className="gd-in">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Dashboard sections" className="gd-mbar">
        {mobilePrimaryItems.map((it) => (
          <NavPill
            key={it.id}
            icon={it.icon}
            label={it.label}
            short={it.short}
            expanded={it.id === active}
            aria-current={it.id === active ? "page" : undefined}
            onClick={() => handleSelect(it.id)}
          />
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <NavPill
              icon={<MoreHorizontal size={20} strokeWidth={2.6} />}
              label="More sections"
              short={overflowActive?.short ?? "More"}
              expanded={!!overflowActive}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={12} className="gd-pop w-[220px]">
            {mobileOverflowItems.map((it) => (
              <DropdownMenuItem
                key={it.id}
                onSelect={() => handleSelect(it.id)}
                aria-current={it.id === active ? "page" : undefined}
                className="gd-mi"
              >
                {it.icon}
                {it.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {user && user.emailVerificationRequired && !user.emailVerified && <VerifyAccountModal />}
    </div>
  );
}
