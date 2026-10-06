import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMarkNotificationsRead, useNotifications } from "@/lib/notifications";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function NotificationBell() {
  const { data: notifications = [], isError } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && unread > 0) markRead.mutate();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative h-8 w-8 text-muted-foreground"
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-brand-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold">Notifications</h3>
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
          <ul className="max-h-72 divide-y divide-border overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id} className="px-4 py-3">
                <p className="text-sm font-medium">
                  {n.data.type === "kyc_info_requested"
                    ? "KYC — Additional information requested"
                    : n.data.type}
                </p>
                {n.data.message && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.data.message}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(n.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
