import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Cookie,
  CreditCard,
  House,
  LandPlot,
  LayoutGrid,
  LogOut,
  MapPinned,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { openCookieSettings } from "@/lib/consent";
import { useTheme } from "@/hooks/useTheme";
import { NotificationBell } from "@/components/NotificationBell";
import "@/components/dashboard/dashboard.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
    </svg>
  );
}

const PIN_LINKS = [
  { label: "Explore map", to: "/explore", icon: MapPinned, desc: "Land and rentals together" },
  { label: "Land", to: "/land", icon: LandPlot, desc: "Plotted parcels for sale or lease" },
  { label: "Rentals", to: "/rentals", icon: House, desc: "Homes, BnBs and property for sale" },
] as const;

const SITE_LINKS = [
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Help Centre", to: "/help" },
  { label: "Contact", to: "/contact" },
] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function HomeNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const close = () => {
    setOpen(false);
    setPinOpen(false);
  };
  const toggleFrom = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    toggle({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
  };

  return (
    <header className="gp-header">
      <nav aria-label="Main" className="gp-nav">
        <Link to="/" className="gp-logo" onClick={close}>
          <img src="/favicon.svg" alt="" width={34} height={34} />
          <span className="gp-logo-text">Geo Pin Properties</span>
        </Link>

        <div className="gp-desk-links gp-desk-only">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="gp-link gp-dropdown-trigger group">
              Pin Properties
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[1200] w-64 p-1.5">
              {PIN_LINKS.map(({ to, label, icon: Icon, desc }) => (
                <DropdownMenuItem key={to} asChild className="items-start gap-3 px-3 py-2.5">
                  <Link to={to}>
                    {/* As tall as the title's line, so the icon centres on it. */}
                    <span className="flex h-5 shrink-0 items-center">
                      <Icon className="h-4 w-4 text-brand" />
                    </span>
                    <div>
                      <p className="m-0 text-sm font-medium leading-5 text-foreground">{label}</p>
                      <p className="m-0 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {SITE_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="gp-link">
              {label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <>
              <Link
                to="/dashboard"
                search={{ tab: undefined }}
                className="gp-list-pill gp-desk-only"
              >
                Dashboard
              </Link>
              <NotificationBell />
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="gd-avatar-btn" aria-label="Account menu">
                  <span
                    className="gd-avatar"
                    style={user.avatarColor ? { background: user.avatarColor } : undefined}
                  >
                    {initials(user.fullName)}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="gd-pop z-[1200] w-[260px]"
                >
                  <div className="mb-1.5 flex items-center gap-2.5 border-b border-border-subtle px-2.5 pb-3 pt-2">
                    <span
                      className="gd-avatar"
                      style={user.avatarColor ? { background: user.avatarColor } : undefined}
                    >
                      {initials(user.fullName)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[14.5px] font-bold">{user.fullName}</span>
                      <span className="truncate text-[12.5px] text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                  </div>
                  <DropdownMenuItem className="gd-mi" asChild>
                    <Link to="/dashboard" search={{ tab: undefined }}>
                      <LayoutGrid size={17} aria-hidden="true" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gd-mi" asChild>
                    <Link to="/dashboard" search={{ tab: "settings" }}>
                      <Settings size={17} aria-hidden="true" /> Account settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gd-mi" asChild>
                    <Link to="/dashboard" search={{ tab: "billing" }}>
                      <CreditCard size={17} aria-hidden="true" /> Billing &amp; plan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gd-mi"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleFrom(e.currentTarget as HTMLElement);
                    }}
                  >
                    {theme === "dark" ? (
                      <Sun size={17} aria-hidden="true" />
                    ) : (
                      <Moon size={17} aria-hidden="true" />
                    )}
                    {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gd-mi" onSelect={openCookieSettings}>
                    <Cookie size={17} aria-hidden="true" /> Cookie settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gd-mi"
                    data-danger
                    onSelect={() => {
                      logout();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut size={17} aria-hidden="true" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login" className="gp-link gp-desk-only">
                Login
              </Link>
              <Link to="/register" className="gp-outline-pill gp-desk-only">
                Register
              </Link>
              <button
                type="button"
                className="gp-theme"
                onClick={(e) => toggleFrom(e.currentTarget)}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span
                  className={`gp-theme-icon ${theme === "dark" ? "gp-theme-icon-left" : "gp-theme-icon-right"}`}
                  aria-hidden="true"
                >
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                </span>
                <span
                  className={`gp-knob ${theme === "dark" ? "gp-knob-r" : "gp-knob-l"}`}
                  aria-hidden="true"
                >
                  {theme === "dark" ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>
            </>
          )}
          {!user && (
            <Link
              to="/dashboard/upload"
              search={{ edit: undefined, type: undefined }}
              className="gp-list-pill gp-desk-only"
            >
              List a property
            </Link>
          )}
          <button
            type="button"
            className="gp-menu-btn gp-collapse-only"
            aria-expanded={open}
            aria-controls="gp-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="gp-bar" />
            <span className="gp-bar" />
          </button>
        </div>
      </nav>

      {open && (
        <div id="gp-menu" className="gp-mobile-menu gp-collapse-only">
          <button
            type="button"
            className="gp-mobile-link gp-mobile-disclosure"
            aria-expanded={pinOpen}
            onClick={() => setPinOpen((o) => !o)}
          >
            Pin Properties
            <ChevronDown
              className={`h-5 w-5 transition-transform ${pinOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {pinOpen &&
            PIN_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="gp-mobile-sub" onClick={close}>
                {label}
              </Link>
            ))}
          {SITE_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="gp-mobile-link" onClick={close}>
              {label}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gp-olive)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
          {user ? (
            <Link
              to="/dashboard"
              search={{ tab: undefined }}
              className="gp-mobile-cta"
              onClick={close}
            >
              Go to your dashboard
            </Link>
          ) : (
            <>
              <div className="gp-mobile-auth">
                <Link to="/login" className="gp-outline-pill" onClick={close}>
                  Login
                </Link>
                <Link to="/register" className="gp-list-pill" onClick={close}>
                  Register
                </Link>
              </div>
              <Link
                to="/dashboard/upload"
                search={{ edit: undefined, type: undefined }}
                className="gp-mobile-cta"
                onClick={close}
              >
                List a property
              </Link>
            </>
          )}
          <button
            type="button"
            className="gp-mobile-cookie"
            onClick={() => {
              close();
              openCookieSettings();
            }}
          >
            Cookie settings
          </button>
          <span className="gp-mobile-tag">find. connect. own.</span>
        </div>
      )}
    </header>
  );
}
