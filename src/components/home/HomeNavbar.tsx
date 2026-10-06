import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, House, LandPlot, MapPinned } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function HomeNavbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const close = () => {
    setOpen(false);
    setPinOpen(false);
  };

  return (
    <header className="gp-header">
      <nav aria-label="Main" className="gp-nav">
        <Link to="/" className="gp-logo" onClick={close}>
          <span className="gp-logo-tile">
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
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
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
            <Link
              to="/dashboard"
              search={{ tab: undefined }}
              className="gp-outline-pill gp-desk-only"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="gp-link gp-desk-only">
                Login
              </Link>
              <Link to="/register" className="gp-outline-pill gp-desk-only">
                Register
              </Link>
            </>
          )}
          <Link
            to="/dashboard/upload"
            search={{ edit: undefined, type: undefined }}
            className="gp-list-pill gp-desk-only"
          >
            List a property
          </Link>
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
                stroke="#A9C97A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
          <div className="gp-mobile-auth">
            {user ? (
              <Link
                to="/dashboard"
                search={{ tab: undefined }}
                className="gp-outline-pill"
                onClick={close}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="gp-outline-pill" onClick={close}>
                  Login
                </Link>
                <Link to="/register" className="gp-list-pill" onClick={close}>
                  Register
                </Link>
              </>
            )}
          </div>
          <Link
            to="/dashboard/upload"
            search={{ edit: undefined, type: undefined }}
            className="gp-mobile-cta"
            onClick={close}
          >
            List a property
          </Link>
          <span className="gp-mobile-tag">find. connect. own.</span>
        </div>
      )}
    </header>
  );
}
