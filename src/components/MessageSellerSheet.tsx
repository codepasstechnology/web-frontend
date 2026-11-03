import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useStartConversation } from "@/lib/chat";

/**
 * A signed-in buyer's first message about a listing, over the map like the
 * share sheet. Writing again about the same listing continues that conversation.
 */
export function MessageSellerSheet({
  anchor,
  kind,
  listingId,
  listingTitle,
  recipient,
  onClose,
}: {
  anchor: HTMLElement | null;
  kind: "parcel" | "property";
  listingId: string;
  listingTitle: string;
  recipient: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState(`Hi, is ${listingTitle} still available?`);
  const start = useStartConversation();

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    start.mutate({ type: kind, listingId, body: message.trim() });
  };

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const target = anchor?.closest(".gm-mapwrap");
  if (!target) return null;

  const title = `Message ${recipient}`;

  return createPortal(
    <div
      className="gm-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onBackdrop}
    >
      <div className="gm-mcard" style={{ maxWidth: 440 }}>
        <div className="gm-mhead">
          <h2 className="gm-h" style={{ fontSize: 22 }}>
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="gm-mbtn"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "none" }}
          >
            <X width={16} height={16} aria-hidden />
          </button>
        </div>

        {start.data ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="gm-note" role="status" style={{ borderStyle: "solid" }}>
              <Check width={18} height={18} aria-hidden />
              Message sent. Their reply will show up in your messages.
            </div>
            <Link
              to="/dashboard"
              search={{ tab: "messages", c: start.data.id }}
              className="gm-btn"
              style={{ textAlign: "center" }}
            >
              Open conversation
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              About <strong style={{ color: "var(--ink)" }}>{listingTitle}</strong>
            </span>
            <label className="gm-field">
              <span className="gm-flab">Message</span>
              <textarea
                className="gm-input"
                rows={3}
                style={{ paddingTop: 10, paddingBottom: 10, resize: "vertical" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
              />
            </label>
            {start.error && (
              <span role="alert" style={{ color: "var(--err)", fontSize: 14, fontWeight: 600 }}>
                {start.error.message}
              </span>
            )}
            <button type="submit" className="gm-btn" disabled={start.isPending || !message.trim()}>
              {start.isPending ? "Sending…" : "Send message"}
            </button>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Replies arrive in your messages on Geo Pin Properties.
            </span>
          </form>
        )}
      </div>
    </div>,
    target,
  );
}
