import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Info,
  HelpCircle,
  Mail,
  LogOut,
  MapPinned,
  LandPlot,
  House,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";
import { NotificationBell } from "@/components/NotificationBell";
import { LogoMark } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pinLinks = [
  { to: "/explore", label: "Explore map", icon: MapPinned, desc: "Land and rentals together" },
  { to: "/land", label: "Land", icon: LandPlot, desc: "Plotted parcels for sale or lease" },
  { to: "/rentals", label: "Rentals", icon: House, desc: "Homes, BnBs and property for sale" },
] as const;

const moreLinks = [
  { to: "/blog", label: "Blog", icon: BookOpen, desc: "Guides & industry news" },
  { to: "/about", label: "About", icon: Info, desc: "Our story and team" },
  { to: "/help", label: "Help Centre", icon: HelpCircle, desc: "FAQs and support" },
  { to: "/contact", label: "Contact", icon: Mail, desc: "Get in touch" },
] as const;

export function Navbar({
  compact = false,
  transparent = false,
  translucent = false,
  scrollAware = false,
  overlay = false,
}: {
  compact?: boolean;
  transparent?: boolean;
  translucent?: boolean;
  scrollAware?: boolean;
  /** Float over a full-bleed hero marked `data-nav-overlay`, transparent until it scrolls past. */
  overlay?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overHero, setOverHero] = useState(overlay);
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onPinPage = pinLinks.some(({ to }) => pathname.startsWith(to));

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  useEffect(() => {
    if (!scrollAware) return;
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollAware]);

  useEffect(() => {
    if (!overlay) {
      setOverHero(false);
      return;
    }
    // Negative top margin = the bar's height, so it turns solid as the hero's
    // bottom edge slides under it rather than after it has fully left the viewport.
    const io = new IntersectionObserver(([entry]) => setOverHero(entry.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    const attach = () => {
      const hero = document.querySelector("[data-nav-overlay]");
      if (hero) io.observe(hero);
      return Boolean(hero);
    };
    // On client-side navigation the page (and its hero) can mount after the
    // navbar re-renders, so wait for it to appear.
    const mo = new MutationObserver(() => {
      if (attach()) mo.disconnect();
    });
    if (!attach()) mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [overlay]);

  const dark = transparent || (overlay && overHero);
  return (
    // The open mobile menu must sit above the map pages' listing panels (z-[1150]).
    <header
      className={`${overlay ? "fixed inset-x-0" : "sticky"} top-0 ${menuOpen ? "z-[1200]" : "z-40"} w-full transition-colors duration-300 ease-out ${
        overlay && overHero
          ? "border-b border-transparent bg-gradient-to-b from-black/50 to-transparent"
          : transparent
            ? "border-b border-white/10 bg-black/30 backdrop-blur-md"
            : scrollAware
              ? scrolled
                ? "border-b border-border/40 bg-white/80 backdrop-blur-md dark:bg-card/80"
                : "border-b border-transparent bg-white"
              : translucent
                ? "border-b border-border/40 bg-white/70 backdrop-blur-md dark:bg-card/70"
                : "border-b border-border bg-card"
      }`}
    >
      <div
        className={`mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 ${compact ? "max-w-none" : "max-w-7xl"}`}
      >
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark aria-hidden className="h-8" />
          <div className="flex flex-col leading-tight">
            <span
              className={`text-sm font-semibold tracking-tight ${dark ? "text-white" : "text-foreground"}`}
            >
              Geo Pin Properties
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-widest ${dark ? "text-white/50" : "text-muted-foreground"}`}
            >
              Kenya
            </span>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 md:flex lg:justify-start lg:pl-10">
          {/* Always-visible links */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={`group flex items-center gap-1 rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                dark
                  ? onPinPage
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                  : onPinPage
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pin Properties
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[1200] w-64 p-1.5">
              {pinLinks.map(({ to, label, icon: Icon, desc }) => (
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
          <Link
            to="/pricing"
            className={`rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            activeProps={{
              className: `rounded-sm text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white" : "text-foreground"}`,
            }}
          >
            Pricing
          </Link>

          {/* Expanded links — only when there's room (xl+) */}
          {moreLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`hidden rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:inline ${dark ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
              activeProps={{
                className: `hidden rounded-sm text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:inline ${dark ? "text-white" : "text-foreground"}`,
              }}
            >
              {label}
            </Link>
          ))}

          {/* More dropdown — hidden at xl+ since all links are visible */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={`group flex items-center gap-1 rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden ${dark ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              More
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[1200] w-52 p-1.5">
              {moreLinks.map(({ to, label, icon: Icon, desc }) => (
                <DropdownMenuItem key={to} asChild className="items-start gap-3 px-3 py-2.5">
                  <Link to={to}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <Link
              to="/dashboard"
              search={{ tab: undefined }}
              className={`rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
              activeProps={{
                className: `rounded-sm text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white" : "text-foreground"}`,
              }}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Search — only at lg+ */}
          <div className="relative hidden lg:block">
            <Search
              className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? "text-white/40" : "text-muted-foreground"}`}
            />
            <input
              placeholder="Search parcel, county…"
              className={`h-9 w-44 rounded-md border pl-9 pr-3 text-sm outline-none transition-colors xl:w-56 ${
                dark
                  ? "border-white/15 bg-white/10 text-white placeholder:text-white/40 hover:border-white/25 focus:border-brand focus:bg-white/15"
                  : "border-border bg-background text-foreground placeholder:text-muted-foreground hover:border-muted-foreground/40 focus:border-brand"
              }`}
            />
          </div>
          {user && <NotificationBell />}
          <button
            type="button"
            onClick={(e) => toggleTheme({ clientX: e.clientX, clientY: e.clientY })}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={`hidden rounded-md border p-2 transition-colors sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              dark
                ? "border-white/20 text-white/80 hover:bg-white/10"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <>
              <Link
                to="/dashboard"
                search={{ tab: undefined }}
                className={`hidden rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  dark
                    ? "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
                    : "bg-primary text-primary-foreground hover:bg-secondary"
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className={`hidden rounded-md border p-2 transition-colors sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  dark
                    ? "border-white/20 text-white/80 hover:bg-white/10"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`hidden rounded-md border px-3 py-1.5 text-xs font-medium transition-colors sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  dark
                    ? "border-white/20 text-white/80 hover:bg-white/10 backdrop-blur-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`hidden rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  dark
                    ? "bg-white text-slate-800 hover:bg-white/90"
                    : "bg-primary text-primary-foreground hover:bg-secondary"
                }`}
              >
                Register
              </Link>
            </>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`rounded-md p-2 transition-colors md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out md:hidden"
        style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t ${dark ? "border-white/10 bg-black/90" : "border-border bg-card"}`}
          >
            <nav className="flex flex-col px-3 py-2">
              <div className="flex items-center">
                <Link
                  to="/explore"
                  onClick={() => setMenuOpen(false)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
                >
                  Explore map
                </Link>
                <button
                  type="button"
                  onClick={() => setPinOpen((v) => !v)}
                  aria-expanded={pinOpen}
                  aria-label="Show land and rentals"
                  className={`rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/70 hover:bg-white/10" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${pinOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {pinOpen &&
                pinLinks.slice(1).map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-md py-2 pl-6 pr-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
                  >
                    {label}
                  </Link>
                ))}
              <Link
                to="/pricing"
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
              >
                Pricing
              </Link>
              {moreLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
                >
                  {label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/dashboard"
                  search={{ tab: undefined }}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
                >
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={(e) => {
                  toggleTheme({ clientX: e.clientX, clientY: e.clientY });
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </button>
              <div
                className={`mt-2 flex gap-2 border-t pt-2 ${dark ? "border-white/10" : "border-border"}`}
              >
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      search={{ tab: undefined }}
                      onClick={() => setMenuOpen(false)}
                      className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "bg-white/15 text-white hover:bg-white/25" : "bg-primary text-primary-foreground hover:bg-secondary"}`}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "border-white/20 text-white/80 hover:bg-white/10" : "border-border text-foreground hover:bg-muted"}`}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "border-white/20 text-white/80 hover:bg-white/10" : "border-border text-foreground hover:bg-muted"}`}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? "bg-white text-slate-800 hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-secondary"}`}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
