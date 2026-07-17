import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Search, User, MapPinned, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Navbar({
  compact = false,
  transparent = false,
}: {
  compact?: boolean;
  transparent?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  return (
    <header
      className={`sticky top-0 z-40 w-full ${transparent ? "border-b border-white/10 bg-black/30 backdrop-blur-md" : "border-b border-border bg-card"}`}
    >
      <div
        className={`mx-auto flex h-14 items-center gap-3 px-3 sm:h-16 sm:gap-4 sm:px-4 ${compact ? "max-w-none" : "max-w-7xl"}`}
      >
        <Link to="/" className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md ${transparent ? "bg-blue-600 text-white" : "bg-primary text-primary-foreground"}`}
          >
            <MapPinned className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span
              className={`text-sm font-semibold tracking-tight ${transparent ? "text-white" : "text-foreground"}`}
            >
              LandVerify
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-widest ${transparent ? "text-white/50" : "text-muted-foreground"}`}
            >
              Kenya
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
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

        <div className="ml-auto hidden flex-1 max-w-md lg:block">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${transparent ? "text-white/40" : "text-muted-foreground"}`}
            />
            <input
              placeholder="Search county, parcel number, area…"
              className={`h-9 w-full rounded-md border pl-9 pr-3 text-sm outline-none ${
                transparent
                  ? "border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-blue-400 focus:bg-white/15"
                  : "border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-accent"
              }`}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:ml-0">
          <button
            className={`relative rounded-md p-2 ${transparent ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </button>
          {user ? (
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
          <button
            className={`hidden rounded-md p-2 md:inline-flex lg:hidden ${transparent ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <User className="h-4 w-4" />
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
                <Link
                  to="/dashboard"
                  search={{ tab: undefined }}
                  onClick={() => setMenuOpen(false)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium ${transparent ? "bg-white/15 text-white hover:bg-white/25" : "bg-primary text-primary-foreground hover:bg-secondary"}`}
                >
                  Dashboard
                </Link>
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
