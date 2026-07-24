import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutGrid,
  List,
  Upload,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  MapPinned,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { VerifyAccountModal } from "@/components/VerifyAccountModal";

export type DashTab =
  "overview" | "listings" | "upload" | "analytics" | "billing" | "settings" | "kyc";

const items: { id: DashTab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "listings", label: "My Listings", icon: <List className="h-4 w-4" /> },
  { id: "upload", label: "Upload Land", icon: <Upload className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "billing", label: "Billing & Plan", icon: <Wallet className="h-4 w-4" /> },
  { id: "kyc", label: "KYC Status", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "settings", label: "Account Settings", icon: <Settings className="h-4 w-4" /> },
];

interface Notification {
  id: string;
  data: { type: string; message?: string; reference?: string };
  read_at: string | null;
  created_at: string;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<Notification[]>("/user/notifications")
      .then((data) => {
        setNotifications(data);
        setFetchError(false);
      })
      .catch(() => setFetchError(true));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.read_at).length;

  const handleOpen = () => {
    setOpen((v) => !v);
    if (unread > 0) {
      api.post("/user/notifications/read-all").catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
    }
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-2.5">
            <h3 className="text-xs font-semibold text-foreground">Notifications</h3>
          </div>
          {fetchError ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Unable to load notifications. Please try again later.
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-xs font-medium text-foreground">
                    {n.data.type === "kyc_info_requested"
                      ? "KYC — Additional information requested"
                      : n.data.type}
                  </p>
                  {n.data.message && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {n.data.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">{fmtDate(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  active: DashTab;
  onChange?: (t: DashTab) => void;
  children: ReactNode;
}

export function DashboardShell({ active, onChange, children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (t: DashTab) => {
    if (t === "upload") {
      navigate({ to: "/dashboard/upload" });
      return;
    }
    onChange?.(t);
    navigate({ to: "/dashboard", search: { tab: t } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MapPinned className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Geo Properties</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Dashboard
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden text-right md:block">
              <div className="text-xs font-medium text-foreground">{user?.fullName ?? "Guest"}</div>
              <div className="text-[11px] capitalize text-muted-foreground">
                {user?.plan ?? "free"} plan
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border bg-card md:block">
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
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-7 border-t border-border bg-card md:hidden">
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <button
              key={it.id}
              onClick={() => handleSelect(it.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? "text-[#2563EB]" : "text-muted-foreground"
              }`}
            >
              {it.icon}
              <span className="truncate px-1">{it.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {user && !user.emailVerified && <VerifyAccountModal />}
    </div>
  );
}
