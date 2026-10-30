import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useUnreadMessages } from "@/lib/chat";
import "@/components/dashboard/dashboard.css";

export function MessagesButton() {
  const { user } = useAuth();
  const { data: unread = 0 } = useUnreadMessages();

  if (user?.role === "account_manager") return null;

  return (
    <Link
      to="/dashboard"
      search={{ tab: "messages" }}
      className="gd-ib"
      aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
    >
      <MessagesSquare size={20} aria-hidden="true" />
      {unread > 0 && <span className="gd-badge">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
