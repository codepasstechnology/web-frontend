import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Phone, QrCode, Share2, X } from "lucide-react";
import {
  useRequestViewing,
  type AgencyListingItem,
  type AgencyProfile,
  type ViewingSlot,
} from "@/lib/agency";
import {
  digits,
  displayUrl,
  coverStyle,
  initials,
  listingTitle,
  logoStyle,
} from "@/components/agency/page/helpers";
import { WhatsAppIcon } from "@/components/agency/page/icons";
import { Honeypot } from "@/components/agency/Honeypot";
import { useAuth } from "@/lib/auth";

function Modal({
  label,
  onClose,
  maxWidth,
  children,
}: {
  label: string;
  onClose: () => void;
  maxWidth: number;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="ag-modal"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ag-mcard" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="ag-x" onClick={onClose} aria-label="Close">
      <X size={18} aria-hidden />
    </button>
  );
}

// ── Share ─────────────────────────────────────────────────────────────────────

export function ShareSheet({
  agency,
  shortName,
  url,
  onClose,
  onToast,
}: {
  agency: AgencyProfile;
  shortName: string;
  url: string;
  onClose: () => void;
  onToast: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!showQr || qr) return;
    QRCode.toDataURL(url, {
      width: 600,
      margin: 1,
      color: { dark: "#1E2418", light: "#FFFAF2" },
    })
      .then(setQr)
      .catch(() => onToast("Couldn't make the QR code."));
  }, [showQr, qr, url, onToast]);

  const copy = async () => {
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    onToast("Link copied");
  };
  const more = async () => {
    if (navigator.share) {
      await navigator.share({ title: agency.name, url }).catch(() => {});
    } else {
      await copy();
    }
  };
  const meta = [
    `${agency.stats.listings} live ${agency.stats.listings === 1 ? "listing" : "listings"}`,
    agency.rating != null ? `${agency.rating.toFixed(1)} ★ (${agency.reviews})` : null,
    `${agency.stats.counties} ${agency.stats.counties === 1 ? "county" : "counties"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal label="Share this agency" onClose={onClose} maxWidth={460}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="gs-h" style={{ fontSize: 22 }}>
          Share {shortName}
        </h2>
        <CloseButton onClose={onClose} />
      </div>
      {!showQr ? (
        <>
          <div className="ag-og" aria-label="Link preview">
            <div className="ag-ogtop" style={coverStyle(agency)} />
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px" }}>
              <span className="ag-logo" style={logoStyle(agency)}>
                {!agency.logoUrl && <span>{initials(agency.name)}</span>}
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {agency.name}
                </span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{meta}</span>
                <span className="gs-mono" style={{ fontSize: 11.5, color: "var(--faint)" }}>
                  {displayUrl(url).split("/")[0]}
                </span>
              </span>
            </div>
          </div>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            This is the preview people see when you share the link on WhatsApp.
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${agency.name} on Geo Pin: ${url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gs-btn"
              style={{ minHeight: 48, fontSize: 15 }}
            >
              <WhatsAppIcon /> WhatsApp
            </a>
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={copy}
              style={{ minHeight: 48, fontSize: 15 }}
            >
              {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={() => setShowQr(true)}
              style={{ minHeight: 48, fontSize: 15 }}
            >
              <QrCode size={18} aria-hidden /> QR code
            </button>
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={more}
              style={{ minHeight: 48, fontSize: 15 }}
            >
              <Share2 size={18} aria-hidden /> More apps
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "6px 0",
          }}
        >
          <div className="ag-qr">
            {qr ? (
              <img src={qr} width={200} height={200} alt={`QR code for ${displayUrl(url)}`} />
            ) : (
              <span style={{ display: "block", width: 200, height: 200 }} />
            )}
          </div>
          <span style={{ fontWeight: 700 }}>{agency.name}</span>
          <span className="gs-mono" style={{ fontSize: 13, color: "var(--muted)" }}>
            {displayUrl(url)}
          </span>
          <span style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Print it on business cards, flyers and your office door. Scanning opens this page.
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={() => setShowQr(false)}
              style={{ minHeight: 46, fontSize: 14.5 }}
            >
              Back
            </button>
            <a
              href={qr ?? undefined}
              download={`${agency.slug}-qr.png`}
              className="gs-btn"
              aria-disabled={!qr}
              style={{ minHeight: 46, fontSize: 14.5 }}
            >
              Download PNG
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Book a viewing ────────────────────────────────────────────────────────────

const SLOTS: { v: ViewingSlot; t: string; s: string }[] = [
  { v: "morning", t: "Morning", s: "9–12" },
  { v: "afternoon", t: "Afternoon", s: "12–4" },
  { v: "evening", t: "Evening", s: "4–6" },
];

const PHONE_RE = /^(?:\+?254|0)(?:7|1)\d{8}$/;

/** Today and the next six days, as Nairobi calendar dates. */
function nextDays(): { iso: string; date: Date }[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
  const start = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getTime() + i * 86_400_000);
    return { iso: date.toISOString().slice(0, 10), date };
  });
}

export function BookViewing({
  agency,
  shortName,
  listings,
  waHref,
  onClose,
}: {
  agency: AgencyProfile;
  shortName: string;
  listings: AgencyListingItem[];
  waHref: string | null;
  onClose: () => void;
}) {
  const request = useRequestViewing(agency.slug);
  const days = nextDays();
  const open = (d: Date) =>
    !agency.hours || agency.hours.some((h) => h.days.includes(d.getUTCDay()));
  const [listing, setListing] = useState("");
  const [day, setDay] = useState(() => days.find((d) => open(d.date))?.iso ?? days[0].iso);
  const [slot, setSlot] = useState<ViewingSlot>("morning");
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName.split(" ")[0] ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [trap, setTrap] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<{ field: "name" | "phone" | null; text: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const send = async () => {
    if (!name.trim()) {
      setError({ field: "name", text: "Add your name so they know who to expect." });
      return;
    }
    if (!PHONE_RE.test(phone.replace(/\s/g, ""))) {
      setError({ field: "phone", text: "Enter a Kenyan mobile number, like 0712 345 678." });
      return;
    }
    setError(null);
    const [type, id] = listing ? (listing.split(":") as ["parcel" | "property", string]) : [];
    try {
      await request.mutateAsync({
        listing: type && id ? { type, id } : undefined,
        date: day,
        slot,
        name,
        phone,
        note,
        trap,
      });
      const when = days
        .find((d) => d.iso === day)!
        .date.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        });
      setDone(
        `We sent your request for ${when} (${slot}) to ${agency.name}. They will call or WhatsApp you to confirm. After the viewing you can review them here.`,
      );
    } catch (err) {
      setError({
        field: null,
        text: err instanceof Error ? err.message : "Couldn't send your request. Try again.",
      });
    }
  };

  return (
    <Modal label="Book a viewing" onClose={onClose} maxWidth={520}>
      {done ? (
        <div
          role="status"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 12,
            padding: "14px 0",
          }}
        >
          <span
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "agPop .5s cubic-bezier(.2,.7,.2,1) backwards",
            }}
          >
            <Check size={30} strokeWidth={2.6} aria-hidden />
          </span>
          <h2 className="gs-h" style={{ fontSize: 26 }}>
            Request sent
          </h2>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: 360, lineHeight: 1.55 }}>
            {done}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="gs-btn gs-ghost"
                style={{ minHeight: 46, fontSize: 14.5 }}
              >
                <WhatsAppIcon /> Message them too
              </a>
            )}
            <button
              type="button"
              className="gs-btn"
              onClick={onClose}
              style={{ minHeight: 46, fontSize: 14.5 }}
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div>
              <h2 className="gs-h" style={{ fontSize: 24 }}>
                Book a viewing
              </h2>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14.5 }}>
                {shortName} will call or WhatsApp you to confirm the time.
              </p>
            </div>
            <CloseButton onClose={onClose} />
          </div>
          <Honeypot value={trap} onChange={setTrap} />
          <label className="ag-fsel ag-fselm">
            <span>Listing</span>
            <select value={listing} onChange={(e) => setListing(e.target.value)}>
              <option value="">Any listing (general viewing)</option>
              {listings.map((l) => (
                <option key={`${l.kind}:${l.item.id}`} value={`${l.kind}:${l.item.id}`}>
                  {listingTitle(l)}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="ag-flab">Day</span>
            <div className="ag-days">
              {days.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  aria-pressed={day === d.iso}
                  onClick={() => setDay(d.iso)}
                  disabled={!open(d.date)}
                  aria-label={d.date.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "UTC",
                  })}
                >
                  <span>
                    {d.date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}
                  </span>
                  <strong>{d.date.getUTCDate()}</strong>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="ag-flab">Time</span>
            <div
              className="ag-seg"
              role="group"
              aria-label="Time of day"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}
            >
              {SLOTS.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  aria-pressed={slot === t.v}
                  onClick={() => setSlot(t.v)}
                  style={{
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 0,
                    minHeight: 50,
                  }}
                >
                  <span>{t.t}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.75 }}>{t.s}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              <span className="ag-flab">Your name</span>
              <input
                className="gs-input"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={error?.field === "name"}
                style={{ minHeight: 48, fontSize: 15 }}
              />
            </label>
            <label>
              <span className="ag-flab">Phone</span>
              <input
                className="gs-input"
                type="tel"
                autoComplete="tel"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={error?.field === "phone"}
                style={{ minHeight: 48, fontSize: 15 }}
              />
            </label>
          </div>
          {error && (
            <div role="alert" className="ag-err">
              {error.text}
            </div>
          )}
          <label>
            <span className="ag-flab">
              Anything they should know?{" "}
              <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
            </span>
            <textarea
              className="gs-input"
              rows={2}
              maxLength={1000}
              placeholder="e.g. I'm moving in December, coming with my wife"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ minHeight: 72, fontSize: 15 }}
            />
          </label>
          <button
            type="button"
            className="gs-btn"
            onClick={send}
            disabled={request.isPending}
            style={{ minHeight: 52 }}
          >
            {request.isPending ? "Sending…" : "Send viewing request"}
          </button>
          <span style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center" }}>
            Free. Your number goes only to {shortName}.
          </span>
        </>
      )}
    </Modal>
  );
}

// ── Phone sticky contact bar ──────────────────────────────────────────────────

export function StickyContact({
  shortName,
  reply,
  phone,
  waHref,
}: {
  shortName: string;
  reply: string | null;
  phone: string | null;
  waHref: string | null;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const tel = digits(phone);

  return (
    <div className="ag-sticky" data-show={show} aria-hidden={!show}>
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {shortName}
        </span>
        {reply && (
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {reply}
          </span>
        )}
      </span>
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="gs-btn gs-ghost"
          style={{ minHeight: 46, padding: "0 16px", fontSize: 14.5 }}
          tabIndex={show ? 0 : -1}
        >
          <WhatsAppIcon size={17} /> WhatsApp
        </a>
      )}
      {tel.length >= 9 && (
        <a
          href={`tel:${tel}`}
          className="gs-btn"
          style={{ minHeight: 46, padding: "0 18px", fontSize: 14.5 }}
          tabIndex={show ? 0 : -1}
        >
          <Phone size={17} aria-hidden /> Call
        </a>
      )}
    </div>
  );
}
