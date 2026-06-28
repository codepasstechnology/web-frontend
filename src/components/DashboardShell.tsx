import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, List, Upload, BarChart3, Wallet, Settings, LogOut, MapPinned } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export type DashTab = "overview" | "listings" | "upload" | "analytics" | "billing" | "settings";

const items: { id: DashTab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "listings", label: "My Listings", icon: <List className="h-4 w-4" /> },
  { id: "upload", label: "Upload Land", icon: <Upload className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "billing", label: "Billing & Plan", icon: <Wallet className="h-4 w-4" /> },
  { id: "settings", label: "Account Settings", icon: <Settings className="h-4 w-4" /> },
];

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
    // Always navigate to dashboard with the tab in the URL so this works
    // from any sub-page (e.g. /dashboard/upload) where onChange is a no-op.
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
              <div className="text-sm font-semibold text-foreground">LandVerify</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Dashboard</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-xs font-medium text-foreground">{user?.fullName ?? "Guest"}</div>
              <div className="text-[11px] capitalize text-muted-foreground">{user?.plan ?? "free"} plan</div>
            </div>
            <button
              onClick={() => { logout(); navigate({ to: "/" }); }}
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
              const isActive = (it.id === "upload" ? false : it.id === active);
              return (
                <button
                  key={it.id}
                  onClick={() => handleSelect(it.id)}
                  className={`mb-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-[#2563EB]/10 text-[#2563EB]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-border bg-card md:hidden">
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
    </div>
  );
}