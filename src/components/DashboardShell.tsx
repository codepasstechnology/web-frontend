import { useNavigate } from "@tanstack/react-router";
import { LayoutGrid, List, Upload, BarChart3, Wallet, Settings, ShieldCheck } from "lucide-react";
import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { VerifyAccountModal } from "@/components/VerifyAccountModal";
import { Navbar } from "@/components/Navbar";

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

interface Props {
  active: DashTab;
  onChange?: (t: DashTab) => void;
  children: ReactNode;
}

export function DashboardShell({ active, onChange, children }: Props) {
  const { user } = useAuth();
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
