import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  MapPin,
  Building2,
  ShieldCheck,
  Phone,
  Gauge,
  Share2,
  User,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Heart,
  Star,
  MessageCircle,
  Copy,
} from "lucide-react";
import { statusMeta, type LandParcel } from "@/lib/landData";
import { formatPrice, INTENT_LABELS, TYPE_LABELS, type Property } from "@/lib/properties";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

// Mobile: draggable bottom sheet (peek/default/full snap points, leaves the map visible
// underneath). Desktop: right side panel, unaffected by the drag state.
const panelClass =
  "fixed inset-x-0 bottom-0 z-[1150] flex w-full flex-col rounded-t-lg border border-border bg-card shadow-lg " +
  "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-full md:max-w-sm md:rounded-none md:border-0 md:border-l";

const SHEET_PEEK_VH = 24;
const SHEET_DEFAULT_VH = 55;
const SHEET_FULL_VH = 88;

function useDraggableSheetHeight() {
  const [heightVh, setHeightVh] = useState(SHEET_DEFAULT_VH);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startHeight: heightVh };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const deltaVh = ((dragRef.current.startY - e.clientY) / window.innerHeight) * 100;
    setHeightVh(
      Math.min(SHEET_FULL_VH, Math.max(SHEET_PEEK_VH, dragRef.current.startHeight + deltaVh)),
    );
  };
  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setHeightVh((h) => (h > (SHEET_PEEK_VH + SHEET_FULL_VH) / 2 ? SHEET_FULL_VH : SHEET_PEEK_VH));
  };

  return { heightVh, onPointerDown, onPointerMove, onPointerUp };
}

function DragHandle({
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="flex shrink-0 touch-none justify-center py-2.5 md:hidden"
    >
      <div className="h-1 w-10 rounded-full bg-border" />
    </div>
  );
}

function PostedByBadge({ postedBy }: { postedBy: "owner" | "broker" }) {
  const isOwner = postedBy === "owner";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        isOwner
          ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {isOwner ? <User className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
      {isOwner ? "Owner" : "Broker"}
    </span>
  );
}

function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title, text, url };
    try {
      const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
      if (typeof navigator !== "undefined" && nav.share) {
        await nav.share(data);
        return;
      }
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled or unsupported */
    }
  };
  return (
    <button
      onClick={onShare}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

function whatsappUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const withCountryCode = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

function WhatsAppButton({
  phone,
  message,
  parcelId,
}: {
  phone: string;
  message: string;
  parcelId?: string;
}) {
  const url = whatsappUrl(phone, message);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (parcelId) api.post(`/parcels/${parcelId}/inquiry`).catch(() => {});
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
    >
      <MessageCircle className="h-3.5 w-3.5 text-[var(--success)]" />
      WhatsApp
    </a>
  );
}

function VerificationRequestButton({ parcelId }: { parcelId: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary"
      >
        Sign in to request a report
      </Link>
    );
  }

  const onClick = async () => {
    setState("loading");
    try {
      await api.post(`/parcels/${parcelId}/verification-request`);
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={state === "loading" || state === "sent"}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary disabled:opacity-70"
    >
      {state === "sent" ? (
        <>
          <FileCheck className="h-3.5 w-3.5" /> Request sent
        </>
      ) : state === "loading" ? (
        "Requesting…"
      ) : state === "error" ? (
        "Failed — try again"
      ) : (
        "Request Verification Report"
      )}
    </button>
  );
}

function SaveButton({ saved, onToggle }: { saved: boolean; onToggle: () => void }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Link
        to="/login"
        title="Sign in to save this listing"
        className="rounded-md border border-border bg-background p-2 text-muted-foreground hover:bg-muted"
      >
        <Heart className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      onClick={onToggle}
      title={saved ? "Remove from saved" : "Save this listing"}
      className={`rounded-md border p-2 ${
        saved
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

function CoordinatesRow({ lat, lng }: { lat: number; lng: number }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      onClick={onCopy}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy coordinates"}
    </button>
  );
}

function PhotoGallery({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);
  return (
    <div className="relative -mx-4 -mt-4 mb-4 h-48 overflow-hidden bg-muted md:h-56">
      <img src={photos[index]} alt="" className="h-full w-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
            {index + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}

export function ParcelPanel({
  parcel,
  onClose,
  saved,
  onToggleSaved,
}: {
  parcel: LandParcel;
  onClose: () => void;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const meta = statusMeta[parcel.status];
  const priceLabel = parcel.listingType === "lease" ? "Lease / year" : "Price";
  const isMobile = useIsMobile();
  const { heightVh, onPointerDown, onPointerMove, onPointerUp } = useDraggableSheetHeight();
  return (
    <aside className={panelClass} style={isMobile ? { maxHeight: `${heightVh}vh` } : undefined}>
      <DragHandle
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: meta.color }}
            >
              {meta.label}
            </span>
            <span className="inline-flex items-center rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
              {parcel.listingType === "lease" ? "For Lease" : "For Sale"}
            </span>
            <PostedByBadge postedBy={parcel.postedBy} />
            {parcel.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--success)]">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
            {parcel.featured && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning-subtle-foreground">
                <Star className="h-3 w-3" /> Featured
              </span>
            )}
          </div>
          <h2 className="mt-2 truncate text-lg font-semibold text-foreground">{parcel.title}</h2>
          <p className="text-xs text-muted-foreground">{parcel.county}</p>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          <SaveButton saved={saved} onToggle={onToggleSaved} />
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {parcel.photos && <PhotoGallery photos={parcel.photos} />}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <Stat label="Size" value={parcel.size} />
          <Stat label={priceLabel} value={`KES ${parcel.price.toLocaleString()}`} />
        </div>

        {parcel.latitude != null && parcel.longitude != null && (
          <CoordinatesRow lat={parcel.latitude} lng={parcel.longitude} />
        )}

        <div className="mb-4 rounded-md border border-border bg-background p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Development Score
            </span>
            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {parcel.amenities.developmentScore}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-brand"
              style={{ width: `${parcel.amenities.developmentScore}%` }}
            />
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-foreground">{parcel.description}</p>

        <Section title="Location Intelligence">
          <Row
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="School"
            value={parcel.amenities.school}
          />
          <Row
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Hospital"
            value={parcel.amenities.hospital}
          />
          <Row
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Shopping"
            value={parcel.amenities.shopping}
          />
          <Row
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Main Road"
            value={parcel.amenities.mainRoad}
          />
          <Row
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="To Tarmac"
            value={parcel.amenities.distanceToTarmac}
          />
        </Section>

        {parcel.amenities.utilities.length > 0 && (
          <Section title="Utilities">
            <div className="flex flex-wrap gap-1.5">
              {parcel.amenities.utilities.map((u) => (
                <span
                  key={u}
                  className="rounded-sm border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
                >
                  {u}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title={parcel.postedBy === "owner" ? "Listed by Owner" : "Listed by Broker"}>
          <p className="text-sm text-foreground">{parcel.seller.name}</p>
          <p className="text-xs text-muted-foreground">{parcel.seller.agency}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-foreground">
            <Phone className="h-3 w-3" /> {parcel.seller.phone}
          </p>
        </Section>
      </div>

      <div className="flex items-center gap-2 border-t border-border p-4">
        <VerificationRequestButton parcelId={parcel.id} />
        <WhatsAppButton
          phone={parcel.seller.phone}
          message={`Hi, I'm interested in ${parcel.title} listed on GeoPin Properties.`}
          parcelId={parcel.id}
        />
        <ShareButton
          title={parcel.title}
          text={`${parcel.parcelNumber} · ${parcel.size} · KES ${parcel.price.toLocaleString()}`}
        />
      </div>
    </aside>
  );
}

export function RentalPanel({ property, onClose }: { property: Property; onClose: () => void }) {
  const isMobile = useIsMobile();
  const { heightVh, onPointerDown, onPointerMove, onPointerUp } = useDraggableSheetHeight();
  const priceLabel =
    property.pricePeriod === "month"
      ? "Rent / month"
      : property.pricePeriod === "night"
        ? "Rate / night"
        : "Asking price";

  return (
    <aside className={panelClass} style={isMobile ? { maxHeight: `${heightVh}vh` } : undefined}>
      <DragHandle
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-sm bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-foreground">
              {TYPE_LABELS[property.type]}
            </span>
            <span className="inline-flex items-center rounded-sm border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
              {INTENT_LABELS[property.intent]}
            </span>
            <PostedByBadge postedBy={property.postedBy} />
            {property.featured && (
              <span className="inline-flex items-center rounded-sm bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning-subtle-foreground">
                Featured
              </span>
            )}
          </div>
          <h2 className="mt-2 truncate text-lg font-semibold text-foreground">{property.title}</h2>
          <p className="text-xs text-muted-foreground">
            {property.area ? `${property.area}, ` : ""}
            {property.county}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {property.photos.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {property.photos.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="h-28 w-40 flex-shrink-0 rounded-md object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <Stat label={priceLabel} value={formatPrice(property.price, property.pricePeriod)} />
          <Stat
            label="Bedrooms"
            value={property.bedrooms === 0 ? "—" : String(property.bedrooms)}
          />
          <Stat
            label="Bathrooms"
            value={property.bathrooms === 0 ? "—" : String(property.bathrooms)}
          />
          <Stat label="Furnished" value={property.furnished ? "Yes" : "No"} />
        </div>

        <CoordinatesRow lat={property.position[0]} lng={property.position[1]} />

        {property.intent === "bnb" && (property.minNights || property.cleaningFee) && (
          <Section title="BnB terms">
            {property.minNights && (
              <p className="text-sm text-foreground">Minimum stay: {property.minNights} nights</p>
            )}
            {property.cleaningFee != null && (
              <p className="text-sm text-foreground">
                Cleaning fee: KES {property.cleaningFee.toLocaleString()}
              </p>
            )}
          </Section>
        )}

        {property.description && (
          <Section title="About this property">
            <p className="text-sm text-muted-foreground">{property.description}</p>
          </Section>
        )}

        {property.amenities.length > 0 && (
          <Section title="Amenities">
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-sm border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
                >
                  {a}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title={property.postedBy === "owner" ? "Listed by Owner" : "Listed by Broker"}>
          <p className="text-sm text-foreground">{property.agent.name}</p>
          {property.agent.agency && (
            <p className="text-xs text-muted-foreground">{property.agent.agency}</p>
          )}
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-foreground">
            <Phone className="h-3 w-3" /> {property.agent.phone}
          </p>
        </Section>
      </div>

      <div className="flex items-center gap-2 border-t border-border p-4">
        <WhatsAppButton
          phone={property.agent.phone}
          message={`Hi, I'm interested in ${property.title} (${property.reference}) listed on GeoPin Properties.`}
        />
        <ShareButton
          title={property.title}
          text={`${TYPE_LABELS[property.type]} · ${property.county} · ${formatPrice(property.price, property.pricePeriod)}`}
        />
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}
