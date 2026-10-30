import { Link, useNavigate } from "@tanstack/react-router";
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
  Building2,
  Inbox,
  Users,
  LineChart,
  ExternalLink,
  MessagesSquare,
} from "lucide-react";
import { forwardRef, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { LEAD_SOURCE_LABELS, useMarkLeadsSeen, useUnseenLeads } from "@/lib/agency";
import { useUnreadMessages } from "@/lib/chat";
import { usePlans } from "@/lib/plans";
import { useUsedListings } from "@/lib/properties";
import { VerifyAccountModal } from "@/components/VerifyAccountModal";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "@/components/home/home.css";
import "@/components/dashboard/dashboard.css";

export type DashTab =
  | "overview"
  | "listings"
  | "upload"
  | "messages"
  | "analytics"
  | "billing"
  | "settings"
  | "kyc"
  | "agency"
  | "leads"
  | "team"
  | "insights";

type NavItem = { id: DashTab; label: string; short: string; icon: ReactNode };

// `short` is what the bottom nav's expanded pill shows; `label` stays the full
// name for the sidebar and for every button's accessible name.
const ITEM: Record<DashTab, NavItem> = {
  overview: {
    id: "overview",
    label: "Overview",
    short: "Overview",
    icon: <LayoutGrid size={19} />,
  },
  listings: { id: "listings", label: "My Listings", short: "Listings", icon: <List size={19} /> },
  upload: { id: "upload", label: "Upload", short: "Upload", icon: <Upload size={19} /> },
  messages: {
    id: "messages",
    label: "Messages",
    short: "Chats",
    icon: <MessagesSquare size={19} />,
  },
  leads: { id: "leads", label: "Leads", short: "Leads", icon: <Inbox size={19} /> },
  analytics: {
    id: "analytics",
    label: "Analytics",
    short: "Analytics",
    icon: <BarChart3 size={19} />,
  },
  insights: {
    id: "insights",
    label: "Agency Insights",
    short: "Insights",
    icon: <LineChart size={19} />,
  },
  agency: { id: "agency", label: "Agency Profile", short: "Agency", icon: <Building2 size={19} /> },
  team: { id: "team", label: "Team", short: "Team", icon: <Users size={19} /> },
  billing: { id: "billing", label: "Billing & Plan", short: "Billing", icon: <Wallet size={19} /> },
  kyc: { id: "kyc", label: "KYC Status", short: "KYC", icon: <ShieldCheck size={19} /> },
  settings: {
    id: "settings",
    label: "Account Settings",
    short: "Settings",
    icon: <Settings size={19} />,
  },
};

const INDIVIDUAL_NAV: DashTab[] = [
  "overview",
  "listings",
  "upload",
  "analytics",
  "messages",
  "billing",
  "kyc",
  "settings",
];

/** Agency members get the agency's tabs; insights are for owners and managers. */
function navFor(agencyRole: string | undefined): NavItem[] {
  if (!agencyRole) return INDIVIDUAL_NAV.map((id) => ITEM[id]);
  const manages = agencyRole === "owner" || agencyRole === "manager";
  const ids: DashTab[] = [
    "overview",
    "listings",
    "leads",
    "upload",
    "messages",
    "agency",
    "team",
    ...(manages ? (["insights"] as DashTab[]) : []),
    "analytics",
    "billing",
    "kyc",
    "settings",
  ];
  return ids.map((id) => ITEM[id]);
}

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

/**
 * How many leads came in since this member last opened the Leads tab. A new one
 * pops up while they work elsewhere in the dashboard; opening the tab clears it.
 */
function useLeadsBadge(active: DashTab, open: () => void): number {
  const { data } = useUnseenLeads();
  const { mutate: markSeen } = useMarkLeadsSeen();
  const count = data?.count ?? 0;
  const seen = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (active === "leads" && count > 0) markSeen();
  }, [active, count, markSeen]);

  useEffect(() => {
    if (!data) return;
    const before = seen.current;
    seen.current = data.count;
    if (before === undefined || data.count <= before || !data.latest || active === "leads") return;
    const lead = data.latest;
    toast(`New ${LEAD_SOURCE_LABELS[lead.source].toLowerCase()}`, {
      description: [lead.name ?? "A visitor", lead.listingTitle].filter(Boolean).join(" · "),
      action: { label: "Open leads", onClick: open },
    });
  }, [data, active, open]);

  return active === "leads" ? 0 : count;
}

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
  const items = navFor(user?.agency?.role);
  // The mobile bottom nav only has room for a handful of comfortable tap
  // targets — the rest live behind "More" so none of them end up as an
  // unreadable, hard-to-tap sliver.
  const mobilePrimaryItems = items.slice(0, 4);
  const mobileOverflowItems = items.slice(4);
  const overflowActive = mobileOverflowItems.find((it) => it.id === active);

  const handleSelect = (t: DashTab) => {
    if (t === "upload") {
      navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } });
      return;
    }
    onChange?.(t);
    navigate({ to: "/dashboard", search: { tab: t } });
  };
  const unseenLeads = useLeadsBadge(active, () => handleSelect("leads"));
  const { data: unreadMessages = 0 } = useUnreadMessages();
  const badge = (id: DashTab) =>
    id === "leads" ? unseenLeads : id === "messages" && active !== "messages" ? unreadMessages : 0;
  const countLabel = (n: number) => (n > 99 ? "99+" : String(n));

  const planName = plans.find((p) => p.id === user?.plan)?.name ?? user?.plan;
  const used = useUsedListings();
  const unlimited = user?.maxListings === Infinity;
  const usedPct = !user ? 0 : unlimited ? 12 : Math.min(100, (used / user.maxListings) * 100);
  const agency = user?.agency;
  // Agencies upgrade to agency plans, and only the owner pays for the team.
  const topPlans = agency ? ["agency-pro", "agency-enterprise"] : ["pro", "enterprise"];
  const canUpgrade =
    !!user && (!agency || agency.role === "owner") && !topPlans.includes(user.plan);

  return (
    <div className="gd-root">
      {/* The site navbar, so signed-in users keep every link. Its colours come
          from .geo-home; display: contents keeps the header sticky to the page. */}
      <div className="geo-home" style={{ display: "contents" }}>
        <HomeNavbar />
      </div>

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
                {badge(it.id) > 0 && (
                  <span className="gd-nav-count" aria-label={`${badge(it.id)} new`}>
                    {countLabel(badge(it.id))}
                  </span>
                )}
              </button>
            ))}
            {user?.agency && (
              <Link
                to="/agency/$slug"
                params={{ slug: user.agency.slug }}
                target="_blank"
                className="gd-nav"
              >
                <ExternalLink size={19} aria-hidden="true" />
                View agency page
              </Link>
            )}
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
                  {agency ? "Upgrade to Agency Pro" : "Upgrade to Pro"}
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
            icon={
              <>
                {it.icon}
                {badge(it.id) > 0 && <span className="gd-badge">{countLabel(badge(it.id))}</span>}
              </>
            }
            label={badge(it.id) > 0 ? `${it.label}, ${badge(it.id)} new` : it.label}
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
                {badge(it.id) > 0 && (
                  <span className="gd-nav-count" aria-label={`${badge(it.id)} new`}>
                    {countLabel(badge(it.id))}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            {user?.agency && (
              <DropdownMenuItem asChild className="gd-mi">
                <Link to="/agency/$slug" params={{ slug: user.agency.slug }} target="_blank">
                  <ExternalLink size={19} aria-hidden="true" />
                  View agency page
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {user && user.emailVerificationRequired && !user.emailVerified && <VerifyAccountModal />}
    </div>
  );
}
