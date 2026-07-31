import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  MapPinned,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Info,
  HelpCircle,
  Mail,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";

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
}: {
  compact?: boolean;
  transparent?: boolean;
  translucent?: boolean;
  scrollAware?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!scrollAware) return;
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollAware]);
  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        transparent
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
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md ${transparent ? "bg-blue-600 text-white" : "bg-primary text-primary-foreground"}`}
          >
            <MapPinned className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span
              className={`text-sm font-semibold tracking-tight ${transparent ? "text-white" : "text-foreground"}`}
            >
              Geo Properties
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-widest ${transparent ? "text-white/50" : "text-muted-foreground"}`}
            >
              Kenya
            </span>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center gap-5 md:flex lg:justify-start lg:pl-8">
          {/* Always-visible links */}
          <Link
            to="/land"
            className={`text-sm font-medium ${transparent ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            activeProps={{
              className: `text-sm font-medium ${transparent ? "text-white" : "text-foreground"}`,
            }}
          >
            Land
          </Link>
          <Link
            to="/rentals"
            className={`text-sm font-medium ${transparent ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            activeProps={{
              className: `text-sm font-medium ${transparent ? "text-white" : "text-foreground"}`,
            }}
          >
            Rentals
          </Link>
          <Link
            to="/pricing"
            className={`text-sm font-medium ${transparent ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            activeProps={{
              className: `text-sm font-medium ${transparent ? "text-white" : "text-foreground"}`,
            }}
          >
            Pricing
          </Link>

          {/* Expanded links — only when there's room (xl+) */}
          {moreLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`hidden text-sm font-medium xl:inline ${transparent ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
              activeProps={{
                className: `hidden text-sm font-medium xl:inline ${transparent ? "text-white" : "text-foreground"}`,
              }}
            >
              {label}
            </Link>
          ))}

          {/* More dropdown — hidden at xl+ since all links are visible */}
          <div ref={moreRef} className="relative xl:hidden">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex items-center gap-1 text-sm font-medium ${transparent ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              More
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                {moreLinks.map(({ to, label, icon: Icon, desc }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {user && (
            <Link
              to="/dashboard"
              search={{ tab: undefined }}
              className={`text-sm font-medium ${transparent ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
              activeProps={{
                className: `text-sm font-medium ${transparent ? "text-white" : "text-foreground"}`,
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
              className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${transparent ? "text-white/40" : "text-muted-foreground"}`}
            />
            <input
              placeholder="Search parcel, county…"
              className={`h-9 w-44 rounded-md border pl-9 pr-3 text-sm outline-none xl:w-56 ${
                transparent
                  ? "border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-blue-400 focus:bg-white/15"
                  : "border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-accent"
              }`}
            />
          </div>
          {user && <NotificationBell />}
          {user ? (
            <>
              <Link
                to="/dashboard"
                search={{ tab: undefined }}
                className={`hidden rounded-md px-3 py-1.5 text-xs font-medium sm:inline-flex ${
                  transparent
                    ? "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
                    : "bg-primary text-primary-foreground hover:bg-secondary"
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className={`hidden rounded-md border p-2 sm:inline-flex ${
                  transparent
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
                className={`hidden rounded-md border px-3 py-1.5 text-xs font-medium sm:inline-flex ${
                  transparent
                    ? "border-white/20 text-white/80 hover:bg-white/10 backdrop-blur-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`hidden rounded-md px-3 py-1.5 text-xs font-medium sm:inline-flex ${
                  transparent
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
            className={`rounded-md p-2 md:hidden ${transparent ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className={`border-t md:hidden ${transparent ? "border-white/10 bg-black/80 backdrop-blur-xl" : "border-border bg-card"}`}
        >
          <nav className="flex flex-col px-3 py-2">
            <Link
              to="/land"
              onClick={() => setMenuOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${transparent ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
            >
              Land
            </Link>
            <Link
              to="/rentals"
              onClick={() => setMenuOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${transparent ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
            >
              Rentals
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMenuOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${transparent ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
            >
              Pricing
            </Link>
            {moreLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${transparent ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
              >
                {label}
              </Link>
            ))}
            {user && (
              <Link
                to="/dashboard"
                search={{ tab: undefined }}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${transparent ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
              >
                Dashboard
              </Link>
            )}
            <div
              className={`mt-2 flex gap-2 border-t pt-2 ${transparent ? "border-white/10" : "border-border"}`}
            >
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    search={{ tab: undefined }}
                    onClick={() => setMenuOpen(false)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium ${transparent ? "bg-white/15 text-white hover:bg-white/25" : "bg-primary text-primary-foreground hover:bg-secondary"}`}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className={`flex-1 rounded-md border px-3 py-1.5 text-center text-xs font-medium ${transparent ? "border-white/20 text-white/80 hover:bg-white/10" : "border-border text-foreground hover:bg-muted"}`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className={`flex-1 rounded-md border px-3 py-1.5 text-center text-xs font-medium ${transparent ? "border-white/20 text-white/80 hover:bg-white/10" : "border-border text-foreground hover:bg-muted"}`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium ${transparent ? "bg-white text-slate-800 hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-secondary"}`}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
