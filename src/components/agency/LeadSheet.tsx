import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { sendLead } from "@/lib/agency";
import { Honeypot } from "@/components/agency/Honeypot";
import { AgencyLogo } from "@/components/agency/AgencyLogo";
import type { ListingAgency } from "@/lib/listingAgency";

/** The earliest viewing slot offered: tomorrow at 9am, local time. */
function minViewing(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
}

/**
 * A message or viewing request to the agency behind a listing, over the map
 * like the share sheet. Signed-in visitors only add what the account lacks.
 */
export function LeadSheet({
  anchor,
  agency,
  kind,
  listingId,
  listingTitle,
  mode,
  onClose,
}: {
  anchor: HTMLElement | null;
  agency: ListingAgency;
  kind: "parcel" | "property";
  listingId: string;
  listingTitle: string;
  mode: "message" | "viewing";
  onClose: () => void;
}) {
  const { user } = useAuth();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState(
    mode === "viewing" ? "" : `Hi, is ${listingTitle} still available?`,
  );
  const [viewingAt, setViewingAt] = useState("");
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user && (!name.trim() || phone.replace(/\D/g, "").length < 9)) {
      setError("Add your name and a phone number so the agency can reach you.");
      return;
    }
    if (mode === "viewing" && !viewingAt) {
      setError("Pick a day and time for the viewing.");
      return;
    }
    setBusy(true);
    try {
      const res = await sendLead(kind, listingId, {
        source: mode,
        name,
        phone,
        email,
        message,
        viewingAt: viewingAt ? new Date(viewingAt).toISOString() : undefined,
        trap,
      });
      setSent(res.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't send that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const target = anchor?.closest(".gm-mapwrap");
  if (!target) return null;

  const title = mode === "viewing" ? "Request a viewing" : `Message ${agency.name}`;

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
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AgencyLogo
              name={agency.name}
              logoUrl={agency.logoUrl}
              brandColor={agency.brandColor}
              size={40}
            />
            <h2 className="gm-h" style={{ fontSize: 22 }}>
              {title}
            </h2>
          </span>
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

        {sent ? (
          <div className="gm-note" role="status" style={{ borderStyle: "solid" }}>
            <Check width={18} height={18} aria-hidden />
            {sent}
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}
          >
            <Honeypot value={trap} onChange={setTrap} />
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              About <strong style={{ color: "var(--ink)" }}>{listingTitle}</strong>
              {agency.viewingHours && mode === "viewing"
                ? ` · Viewings: ${agency.viewingHours}`
                : ""}
            </span>
            {!user && (
              <>
                <label className="gm-field">
                  <span className="gm-flab">Your name</span>
                  <input
                    className="gm-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label className="gm-field">
                  <span className="gm-flab">Phone</span>
                  <input
                    className="gm-input"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="07XX XXX XXX"
                  />
                </label>
                <label className="gm-field">
                  <span className="gm-flab">Email (optional)</span>
                  <input
                    className="gm-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
              </>
            )}
            {mode === "viewing" && (
              <label className="gm-field">
                <span className="gm-flab">Preferred day and time</span>
                <input
                  className="gm-input"
                  type="datetime-local"
                  min={minViewing()}
                  value={viewingAt}
                  onChange={(e) => setViewingAt(e.target.value)}
                />
              </label>
            )}
            <label className="gm-field">
              <span className="gm-flab">
                {mode === "viewing" ? "Anything they should know (optional)" : "Message"}
              </span>
              <textarea
                className="gm-input"
                rows={3}
                style={{ paddingTop: 10, paddingBottom: 10, resize: "vertical" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
              />
            </label>
            {error && (
              <span role="alert" style={{ color: "var(--err)", fontSize: 14, fontWeight: 600 }}>
                {error}
              </span>
            )}
            <button type="submit" className="gm-btn" disabled={busy}>
              {busy ? "Sending…" : mode === "viewing" ? "Send viewing request" : "Send message"}
            </button>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Your details go only to {agency.name}, so they can get back to you.
            </span>
          </form>
        )}
      </div>
    </div>,
    target,
  );
}
