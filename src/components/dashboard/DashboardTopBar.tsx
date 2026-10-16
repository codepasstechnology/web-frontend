import { Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, LogOut, Moon, Search, Settings, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";
import { NotificationBell } from "@/components/NotificationBell";
import type { DashTab } from "@/components/DashboardShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SITE_LINKS = [
  { to: "/explore", label: "Explore map" },
  { to: "/land", label: "Land" },
  { to: "/rentals", label: "Rentals" },
  { to: "/help", label: "Help" },
] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function DashboardTopBar({ onSelect }: { onSelect: (t: DashTab) => void }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const toggleFrom = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    toggle({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="gd-top">
      <Link to="/" className="gd-logo">
        <span className="gd-logo-tile">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <span className="gd-logo-text">Geo Pin</span>
      </Link>

      <nav aria-label="Site" className="gd-site gd-deskonly">
        {SITE_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className="gd-navlink">
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <label className="gd-search">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input type="search" placeholder="Search parcel, county…" />
      </label>

      {user && <NotificationBell />}

      {user && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="gd-avatar-btn" aria-label="Account menu">
            <span
              className="gd-avatar"
              style={user.avatarColor ? { background: user.avatarColor } : undefined}
            >
              {initials(user.fullName)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="gd-pop w-[260px]">
            <div className="mb-1.5 flex items-center gap-2.5 border-b border-border-subtle px-2.5 pb-3 pt-2">
              <span
                className="gd-avatar"
                style={user.avatarColor ? { background: user.avatarColor } : undefined}
              >
                {initials(user.fullName)}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[14.5px] font-bold">{user.fullName}</span>
                <span className="truncate text-[12.5px] text-muted-foreground">{user.email}</span>
              </span>
            </div>
            <DropdownMenuItem className="gd-mi" onSelect={() => onSelect("settings")}>
              <Settings size={17} aria-hidden="true" /> Account settings
            </DropdownMenuItem>
            <DropdownMenuItem className="gd-mi" onSelect={() => onSelect("billing")}>
              <CreditCard size={17} aria-hidden="true" /> Billing &amp; plan
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gd-mi"
              onSelect={(e) => {
                e.preventDefault();
                toggleFrom(e.currentTarget as HTMLElement);
              }}
            >
              {dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
              {dark ? "Switch to light mode" : "Switch to dark mode"}
            </DropdownMenuItem>
            <DropdownMenuItem className="gd-mi" data-danger onSelect={handleLogout}>
              <LogOut size={17} aria-hidden="true" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
