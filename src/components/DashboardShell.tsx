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
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { VerifyAccountModal } from "@/components/VerifyAccountModal";
import { Navbar } from "@/components/Navbar";

export type DashTab =
  "overview" | "listings" | "upload" | "analytics" | "billing" | "settings" | "kyc";

// `short` is what the bottom nav's expanded pill shows; `label` stays the full
// name for the sidebar and for every button's accessible name.
const items: { id: DashTab; label: string; short: string; icon: ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    short: "Overview",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  { id: "listings", label: "My Listings", short: "Listings", icon: <List className="h-4 w-4" /> },
  { id: "upload", label: "Upload", short: "Upload", icon: <Upload className="h-4 w-4" /> },
  {
    id: "analytics",
    label: "Analytics",
    short: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "billing",
    label: "Billing & Plan",
    short: "Billing",
    icon: <Wallet className="h-4 w-4" />,
  },
  { id: "kyc", label: "KYC Status", short: "KYC", icon: <ShieldCheck className="h-4 w-4" /> },
  {
    id: "settings",
    label: "Account Settings",
    short: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

/**
 * One slot of the floating bottom bar. Collapsed it is a 44px icon-only circle;
 * expanded it grows into a pill carrying a filled badge and the label.
 *
 * The label's width is animated through a 0fr -> 1fr grid column rather than a
 * width, so the pill sizes itself to whatever text it holds without anything
 * having to measure it first.
 */
function NavPill({
  icon,
  label,
  short,
  expanded,
  onClick,
  ...rest
}: {
  icon: ReactNode;
  label: string;
  short: string;
  expanded: boolean;
  onClick: () => void;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-11 items-center rounded-full transition-colors duration-300 ease-in-out motion-reduce:transition-none ${
        expanded ? "min-w-0 bg-brand/10 pl-1.5 pr-3" : "w-11 shrink-0 justify-center hover:bg-muted"
      }`}
      {...rest}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          expanded ? "h-8 w-8 bg-brand text-brand-foreground" : "text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <span
        aria-hidden
        className="grid transition-[grid-template-columns] duration-300 ease-in-out motion-reduce:transition-none"
        style={{ gridTemplateColumns: expanded ? "1fr" : "0fr" }}
      >
        <span
          className={`overflow-hidden whitespace-nowrap text-xs font-medium text-foreground transition-opacity duration-200 motion-reduce:transition-none ${
            expanded ? "pl-2 opacity-100" : "opacity-0"
          }`}
        >
          {short}
        </span>
      </span>
    </button>
  );
}

// The mobile bottom nav only has room for a handful of comfortable tap
// targets — the rest live behind "More" so none of them end up as an
// unreadable, hard-to-tap sliver.
const mobilePrimaryItems = items.slice(0, 4);
const mobileOverflowItems = items.slice(4);

interface Props {
  active: DashTab;
  onChange?: (t: DashTab) => void;
  children: ReactNode;
}

export function DashboardShell({ active, onChange, children }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const overflowActive = mobileOverflowItems.find((it) => it.id === active);

  const handleSelect = (t: DashTab) => {
    setMoreOpen(false);
    if (t === "upload") {
      navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } });
      return;
    }
    onChange?.(t);
    navigate({ to: "/dashboard", search: { tab: t } });
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border bg-card sm:top-16 sm:h-[calc(100vh-4rem)] md:block">
          <nav className="p-3">
            {items.map((it) => {
              const isActive = it.id === "upload" ? false : it.id === active;
              return (
                <button
                  key={it.id}
                  onClick={() => handleSelect(it.id)}
                  className={`mb-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#2563EB]/10 text-[#2563EB]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {it.icon}
                  {it.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:py-8 md:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-3 bottom-3 z-30 pb-[env(safe-area-inset-bottom)] md:hidden">
        <nav
          aria-label="Dashboard sections"
          className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg"
        >
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
          <div ref={moreRef} className="relative">
            <NavPill
              icon={<MoreHorizontal className="h-4 w-4" />}
              label="More sections"
              short={overflowActive?.short ?? "More"}
              expanded={!!overflowActive}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            />
            {moreOpen && (
              <div className="absolute bottom-full right-0 z-30 mb-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                {mobileOverflowItems.map((it) => {
                  const isActive = it.id === active;
                  return (
                    <button
                      key={it.id}
                      onClick={() => handleSelect(it.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive
                          ? "bg-[#2563EB]/10 text-[#2563EB]"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {it.icon}
                      {it.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {user && user.emailVerificationRequired && !user.emailVerified && <VerifyAccountModal />}
    </div>
  );
}
