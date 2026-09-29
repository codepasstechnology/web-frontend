import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  data: { type: string; message?: string; reference?: string };
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
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
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">
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
