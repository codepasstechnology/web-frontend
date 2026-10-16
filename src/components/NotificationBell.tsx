import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, CreditCard, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMarkNotificationsRead, useNotifications } from "@/lib/notifications";
import type { DashTab } from "@/components/DashboardShell";
import "@/components/dashboard/dashboard.css";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const kycIcon = <ShieldCheck size={16} aria-hidden="true" />;

const TYPES: Record<string, { title: string; icon: ReactNode; tab: DashTab }> = {
  kyc_info_requested: {
    title: "KYC — Additional information requested",
    icon: kycIcon,
    tab: "kyc",
  },
  kyc_location_correction_requested: {
    title: "KYC — Location correction requested",
    icon: <MapPin size={16} aria-hidden="true" />,
    tab: "kyc",
  },
  kyc_location_updated: { title: "KYC — Corrected location received", icon: kycIcon, tab: "kyc" },
  kyc_acknowledged: { title: "KYC — Reviewer replied", icon: kycIcon, tab: "kyc" },
  listing_approved: {
    title: "Listing approved",
    icon: <Check size={16} strokeWidth={2.6} aria-hidden="true" />,
    tab: "listings",
  },
  payment_received: {
    title: "Payment received",
    icon: <CreditCard size={16} aria-hidden="true" />,
    tab: "billing",
  },
  new_inquiry: {
    title: "New inquiry",
    icon: <MessageCircle size={16} aria-hidden="true" />,
    tab: "listings",
  },
};

const FALLBACK = {
  title: "Update on your account",
  icon: <Bell size={16} aria-hidden="true" />,
  tab: "overview" as DashTab,
};

export function NotificationBell() {
  const { data: notifications = [], isError } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && unread > 0) markRead.mutate();
      }}
    >
      <PopoverTrigger
        className="gd-ib"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className="gd-badge">{unread > 9 ? "9+" : unread}</span>}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="gd-pop w-[340px] max-w-[calc(100vw-24px)]"
      >
        <div className="flex items-center justify-between px-2.5 pb-2.5 pt-2">
          <h3 className="gd-display text-[17px] font-bold tracking-tight">Notifications</h3>
          {notifications.length > 0 && (
            <span className="text-[12.5px] text-muted-foreground">All caught up</span>
          )}
        </div>
        {isError ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Unable to load notifications. Please try again later.
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto">
            {notifications.map((n) => {
              const meta = TYPES[n.data.type] ?? FALLBACK;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className="gd-mi gd-notif"
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: "/dashboard", search: { tab: meta.tab } });
                    }}
                  >
                    <span className="gd-notif-icon">{meta.icon}</span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold leading-snug">{meta.title}</span>
                      {n.data.message && (
                        <span className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                          {n.data.message}
                        </span>
                      )}
                      <span className="text-xs text-faint">{fmtDate(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
