import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  GraduationCap,
  Heart,
  Hospital,
  MapPin,
  MessageCircle,
  Navigation,
  PersonStanding,
  Phone,
  Route as RouteIcon,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import type { LandParcel } from "@/lib/landData";
import { INTENT_LABELS, TYPE_LABELS, type Property } from "@/lib/properties";
import { useAuth } from "@/lib/auth";
import { api, API_BASE } from "@/lib/api";
import { centroid, formatCoords } from "@/lib/mapGeo";
import { directionsUrl, listingUrl, streetViewUrl } from "@/lib/mapLinks";
import { PhotoViewer } from "@/components/PhotoViewer";
import { DEAL_COLOR, DEAL_TAG, INTENT_COLOR } from "@/components/map/markers";
import { ShareSheet, type ShareShape } from "@/components/map/ShareSheet";
import { useMapToast } from "@/components/map/mapToastContext";

const SHEET_HALF = 46;
const SHEET_FULL = 88;
const SHEET_CLOSE = 28;

/** Mobile bottom sheet height: snaps to half or nearly full, and closes when dragged low. */
function useSheet(onClose: () => void) {
  const [height, setHeight] = useState(SHEET_HALF);
  const drag = useRef<{ y: number; start: number; current: number } | null>(null);
  const panel = useRef<HTMLElement>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, start: height, current: height };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const area = panel.current?.parentElement?.clientHeight;
    if (!d || !area) return;
    d.current = Math.max(15, Math.min(92, d.start - ((e.clientY - d.y) / area) * 100));
    panel.current?.style.setProperty("--sh", `${d.current}%`);
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (d.current < SHEET_CLOSE) {
      onClose();
      return;
    }
    const next = d.current < 66 ? SHEET_HALF : SHEET_FULL;
    panel.current?.style.setProperty("--sh", `${next}%`);
    setHeight(next);
  };

  return {
    panel,
    style: { ["--sh" as string]: `${height}%` },
    handle: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}

function rememberReturn() {
  try {
    sessionStorage.setItem("lv_return_to", window.location.pathname + window.location.search);
  } catch {
    /* storage unavailable: the viewer lands on the dashboard instead */
  }
}

function SignInLink({ className, children }: { className: string; children: ReactNode }) {
  return (
    <Link to="/login" onClick={rememberReturn} className={className}>
      {children}
    </Link>
  );
}

function whatsappUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const withCountryCode = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

function PanelHead({ tags, onClose }: { tags: ReactNode; onClose: () => void }) {
  return (
    <div className="gm-phead">
      <div className="gm-tags" style={{ gap: 6 }}>
        {tags}
      </div>
      <button
        type="button"
        className="gm-mbtn"
        onClick={onClose}
        aria-label="Close"
        style={{ width: 38, height: 38, borderRadius: "50%", boxShadow: "none" }}
      >
        <X width={16} height={16} aria-hidden />
      </button>
    </div>
  );
}

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (photos.length === 0) return <div className="gm-gal" aria-hidden />;
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);
  return (
    <div className="gm-gal">
      <button
        type="button"
        onClick={() => setViewerIndex(index)}
        aria-label={`View photo ${index + 1} of ${photos.length}`}
      >
        <img src={photos[index]} alt="" />
      </button>
      <PhotoViewer
        photos={photos}
        title={title}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="gm-gbtn"
            onClick={prev}
            aria-label="Previous photo"
            style={{ left: 10 }}
          >
            <ChevronLeft width={18} height={18} aria-hidden />
          </button>
          <button
            type="button"
            className="gm-gbtn"
            onClick={next}
            aria-label="Next photo"
            style={{ right: 10 }}
          >
            <ChevronRight width={18} height={18} aria-hidden />
          </button>
          <div className="gm-gdots" aria-hidden>
            {photos.map((_, i) => (
              <span key={i} data-on={i === index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PriceRow({
  priceLabel,
  price,
  sizeLabel,
  size,
}: {
  priceLabel: string;
  price: string;
  sizeLabel: string;
  size: string;
}) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{priceLabel}</span>
        <span className="gm-h" style={{ fontSize: 26, letterSpacing: "-0.02em" }}>
          {price}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "right" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{sizeLabel}</span>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{size}</span>
      </div>
    </div>
  );
}

function ContactActions({
  save,
  onShare,
  phone,
  message,
  onWhatsApp,
}: {
  save?: ReactNode;
  onShare: () => void;
  phone: string;
  message: string;
  onWhatsApp?: () => void;
}) {
  const wa = whatsappUrl(phone, message);
  const tel = phone.replace(/[^\d+]/g, "");
  return (
    <div className="gm-acts">
      {save}
      <button type="button" className="gm-act" onClick={onShare}>
        <Share2 width={18} height={18} aria-hidden />
        Share
      </button>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="gm-act"
          onClick={onWhatsApp}
        >
          <MessageCircle width={18} height={18} aria-hidden />
          WhatsApp
        </a>
      )}
      {tel.length >= 9 && (
        <a href={`tel:${tel}`} className="gm-act">
          <Phone width={18} height={18} aria-hidden />
          Call
        </a>
      )}
    </div>
  );
}

function PlaceActions({
  lat,
  lng,
  streetView,
  compare,
}: {
  lat: number;
  lng: number;
  streetView: boolean;
  compare?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <a
        href={directionsUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="gm-act2"
      >
        <Navigation width={16} height={16} aria-hidden /> Get directions
      </a>
      {streetView ? (
        <a
          href={streetViewUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="gm-act2"
        >
          <PersonStanding width={16} height={16} aria-hidden /> Street View
        </a>
      ) : (
        <span className="gm-act2 gm-nosv" title="Google Street View doesn't cover this spot yet">
          <PersonStanding width={16} height={16} aria-hidden /> No Street View here
        </span>
      )}
      {compare}
    </div>
  );
}

function CopyCoordinates({ lat, lng }: { lat: number; lng: number }) {
  const toast = useMapToast();
  const [copied, setCopied] = useState(false);
  const plain = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast(`Coordinates copied · ${plain}`);
    } catch {
      toast("Couldn't copy the coordinates");
    }
  };
  return (
    <button
      type="button"
      className="gm-copy"
      onClick={onCopy}
      aria-label={`Copy coordinates ${plain}`}
    >
      <span>
        <small>Coordinates</small>
        <span className="gm-mono" style={{ fontSize: 13 }}>
          {formatCoords(lat, lng)}
        </span>
      </span>
      <span>
        {copied ? (
          <>
            <Check width={15} height={15} strokeWidth={2.6} aria-hidden /> Copied
          </>
        ) : (
          <>
            <Copy width={15} height={15} aria-hidden /> Copy
          </>
        )}
      </span>
    </button>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className="gm-flab">{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((u) => (
          <span key={u} className="gm-uchip">
            <Check width={13} height={13} strokeWidth={2.6} aria-hidden />
            {u}
          </span>
        ))}
      </div>
    </div>
  );
}

function About({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  if (!text && !children) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="gm-flab">{title}</span>
      {text && (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>{text}</p>
      )}
      {children}
    </div>
  );
}

function VerificationCard({ parcel }: { parcel: LandParcel }) {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  if (parcel.status === "verified") {
    return (
      <div className="gm-vcard">
        <ShieldCheck width={22} height={22} aria-hidden style={{ flex: "none" }} />
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <strong>Verified by Geo Pin</strong>
          <p style={{ opacity: 0.85 }}>Ownership documents and boundary checked by our team.</p>
        </span>
      </div>
    );
  }

  const request = async () => {
    setState("loading");
    try {
      await api.post(`/parcels/${parcel.id}/verification-request`);
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="gm-vcard gm-plain">
      <strong>Not verified yet</strong>
      <p>Ask us to check this parcel&apos;s documents and boundary before you commit.</p>
      {state === "sent" ? (
        <span
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            color: "var(--accent)",
          }}
        >
          <Check width={18} height={18} strokeWidth={2.6} aria-hidden /> Request sent. We&apos;ll
          update you.
        </span>
      ) : user ? (
        <button type="button" className="gm-btn" onClick={request} disabled={state === "loading"}>
          <ShieldCheck width={18} height={18} aria-hidden />
          {state === "loading"
            ? "Requesting…"
            : state === "error"
              ? "Couldn't send. Try again"
              : "Request verification"}
        </button>
      ) : (
        <SignInLink className="gm-btn">
          <ShieldCheck width={18} height={18} aria-hidden /> Sign in to request verification
        </SignInLink>
      )}
    </div>
  );
}

const INTEL: { key: keyof LandParcel["amenities"]; label: string; icon: ReactNode }[] = [
  {
    key: "school",
    label: "Nearest school",
    icon: <GraduationCap width={17} height={17} aria-hidden />,
  },
  {
    key: "hospital",
    label: "Nearest hospital",
    icon: <Hospital width={17} height={17} aria-hidden />,
  },
  { key: "shopping", label: "Shopping", icon: <ShoppingBag width={17} height={17} aria-hidden /> },
  { key: "mainRoad", label: "Main road", icon: <RouteIcon width={17} height={17} aria-hidden /> },
  {
    key: "distanceToTarmac",
    label: "Distance to tarmac",
    icon: <Ruler width={17} height={17} aria-hidden />,
  },
];

export function ParcelPanel({
  parcel,
  onClose,
  saved,
  onToggleSaved,
  page = "land",
  inCompare,
  onToggleCompare,
}: {
  parcel: LandParcel;
  onClose: () => void;
  saved: boolean;
  onToggleSaved: () => void;
  page?: "land" | "explore";
  inCompare?: boolean;
  onToggleCompare?: () => void;
}) {
  const { user } = useAuth();
  const sheet = useSheet(onClose);
  const [sharing, setSharing] = useState(false);
  const color = DEAL_COLOR[parcel.listingType];
  const verified = parcel.status === "verified";
  const [lat, lng] = parcel.polygon
    ? centroid(parcel.polygon)
    : [parcel.latitude ?? 0, parcel.longitude ?? 0];
  const place = parcel.area ? `${parcel.area}, ${parcel.county}` : parcel.county;
  const price = `KES ${parcel.price.toLocaleString("en-US")}`;
  const url = listingUrl(page, "parcel", parcel.id);

  return (
    <aside ref={sheet.panel} className="gm-panel" aria-label="Listing details" style={sheet.style}>
      <div className="gm-handle" {...sheet.handle}>
        <span />
      </div>
      <PanelHead
        onClose={onClose}
        tags={
          <>
            <span className="gm-stag" style={{ ["--pc" as string]: color }}>
              {DEAL_TAG[parcel.listingType]}
            </span>
            {verified ? (
              <span className="gm-vtag">
                <ShieldCheck width={12} height={12} aria-hidden /> Verified
              </span>
            ) : (
              <span className="gm-atag" style={{ borderStyle: "solid" }}>
                Available
              </span>
            )}
            <span className="gm-atag" style={{ borderStyle: "solid" }}>
              {parcel.postedBy === "owner" ? "Posted by owner" : "Posted by broker"}
            </span>
          </>
        }
      />
      <div className="gm-pscroll">
        <PhotoGallery photos={parcel.photos ?? []} title={parcel.parcelNumber} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 className="gm-ptitle gm-mono">{parcel.parcelNumber}</h2>
          <span style={{ fontSize: 15, color: "var(--muted)" }}>
            {[parcel.landUse && `${parcel.landUse} land`, `${place} County`]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        {!parcel.polygon && (
          <div className="gm-note">
            <MapPin width={18} height={18} aria-hidden />
            Approximate location. The seller dropped a pin but hasn&apos;t traced the boundary yet.
          </div>
        )}
        <PriceRow
          priceLabel={parcel.listingType === "lease" ? "Lease per year" : "Asking price"}
          price={price}
          sizeLabel="Size"
          size={parcel.size}
        />
        <ContactActions
          save={
            user ? (
              <button type="button" className="gm-act" aria-pressed={saved} onClick={onToggleSaved}>
                <Heart width={18} height={18} aria-hidden />
                {saved ? "Saved" : "Save"}
              </button>
            ) : (
              <SignInLink className="gm-act">
                <Heart width={18} height={18} aria-hidden />
                Save
              </SignInLink>
            )
          }
          onShare={() => setSharing(true)}
          phone={parcel.seller.phone}
          message={`Hi, I'm interested in ${parcel.parcelNumber} listed on Geo Pin Properties.`}
          onWhatsApp={() => api.post(`/parcels/${parcel.id}/inquiry`).catch(() => {})}
        />
        <PlaceActions
          lat={lat}
          lng={lng}
          streetView={parcel.svAvailable === true}
          compare={
            onToggleCompare && (
              <button
                type="button"
                className="gm-act2"
                aria-pressed={!!inCompare}
                onClick={onToggleCompare}
              >
                <Columns2 width={16} height={16} aria-hidden />
                {inCompare ? "In compare" : "Compare"}
              </button>
            )
          }
        />
        <CopyCoordinates lat={parcel.latitude ?? lat} lng={parcel.longitude ?? lng} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="gm-flab" style={{ marginBottom: 4 }}>
            Location intelligence
          </span>
          {INTEL.map((row) => (
            <div key={row.key} className="gm-irow">
              <span className="gm-iic">{row.icon}</span>
              <span style={{ flex: 1 }}>{row.label}</span>
              <span style={{ fontWeight: 600, textAlign: "right" }}>
                {String(parcel.amenities[row.key])}
              </span>
            </div>
          ))}
          <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            From OpenStreetMap, measured from the pin.
          </span>
        </div>
        <Chips label="Utilities" items={parcel.amenities.utilities} />
        <About title="About this plot" text={parcel.description}>
          <span style={{ fontSize: 14 }}>
            {parcel.postedBy === "owner" ? "Listed by owner" : "Listed by broker"}:{" "}
            {parcel.seller.name}
            {parcel.seller.agency ? ` · ${parcel.seller.agency}` : ""}
          </span>
        </About>
        <VerificationCard parcel={parcel} />
      </div>
      {sharing && (
        <ShareSheet
          anchor={sheet.panel.current}
          noun="plot"
          title={parcel.parcelNumber}
          mono
          meta={`${parcel.size} · ${DEAL_TAG[parcel.listingType]} · ${place}${verified ? " · Verified" : ""}`}
          price={price + (parcel.listingType === "lease" ? " / yr" : "")}
          url={url}
          waText={`${parcel.size} plot, ${parcel.area || parcel.county} (${parcel.parcelNumber}) ${price} ${url}`}
          shape={
            (parcel.polygon
              ? { kind: "polygon", points: parcel.polygon, verified }
              : { kind: "approx" }) satisfies ShareShape
          }
          color={color}
          imageUrl={`${API_BASE}/og/parcel/${parcel.id}.png`}
          onClose={() => setSharing(false)}
        />
      )}
    </aside>
  );
}

export function RentalPanel({
  property,
  onClose,
  page = "rentals",
}: {
  property: Property;
  onClose: () => void;
  page?: "rentals" | "explore";
}) {
  const sheet = useSheet(onClose);
  const [sharing, setSharing] = useState(false);
  const color = INTENT_COLOR[property.intent];
  const [lat, lng] = property.position;
  const place = property.area ? `${property.area}, ${property.county}` : property.county;
  const price = `KES ${property.price.toLocaleString("en-US")}`;
  const per =
    property.pricePeriod === "month" ? " / mo" : property.pricePeriod === "night" ? " / night" : "";
  const facts =
    property.bedrooms > 0
      ? `${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"}`
      : TYPE_LABELS[property.type];
  const url = listingUrl(page, "property", property.id);

  return (
    <aside ref={sheet.panel} className="gm-panel" aria-label="Listing details" style={sheet.style}>
      <div className="gm-handle" {...sheet.handle}>
        <span />
      </div>
      <PanelHead
        onClose={onClose}
        tags={
          <>
            <span className="gm-stag" style={{ ["--pc" as string]: color }}>
              {INTENT_LABELS[property.intent]}
            </span>
            <span className="gm-atag" style={{ borderStyle: "solid" }}>
              {TYPE_LABELS[property.type]}
            </span>
            <span className="gm-atag" style={{ borderStyle: "solid" }}>
              {property.postedBy === "owner" ? "Posted by owner" : "Posted by broker"}
            </span>
            {property.status === "occupied" && <span className="gm-seen">Occupied</span>}
          </>
        }
      />
      <div className="gm-pscroll">
        <PhotoGallery photos={property.photos} title={property.title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 className="gm-ptitle">{property.title}</h2>
          <span style={{ fontSize: 15, color: "var(--muted)" }}>
            {facts} · {place} County
          </span>
        </div>
        <PriceRow
          priceLabel={
            property.intent === "rent"
              ? "Rent per month"
              : property.intent === "bnb"
                ? "Per night"
                : "Asking price"
          }
          price={price}
          sizeLabel="Bedrooms"
          size={property.bedrooms > 0 ? String(property.bedrooms) : TYPE_LABELS[property.type]}
        />
        <ContactActions
          onShare={() => setSharing(true)}
          phone={property.agent.phone}
          message={`Hi, I'm interested in ${property.title} (${property.reference}) listed on Geo Pin Properties.`}
        />
        <PlaceActions lat={lat} lng={lng} streetView={property.svAvailable === true} />
        <CopyCoordinates lat={lat} lng={lng} />
        {property.intent === "bnb" && (property.minNights || property.cleaningFee != null) && (
          <About title="BnB terms" text="">
            {property.minNights && (
              <span style={{ fontSize: 14 }}>Minimum stay: {property.minNights} nights</span>
            )}
            {property.cleaningFee != null && (
              <span style={{ fontSize: 14 }}>
                Cleaning fee: KES {property.cleaningFee.toLocaleString("en-US")}
              </span>
            )}
          </About>
        )}
        <Chips label="Amenities" items={property.amenities} />
        <About title="About this property" text={property.description}>
          <span style={{ fontSize: 14 }}>
            {property.postedBy === "owner" ? "Listed by owner" : "Listed by broker"}:{" "}
            {property.agent.name}
            {property.agent.agency ? ` · ${property.agent.agency}` : ""}
          </span>
        </About>
      </div>
      {sharing && (
        <ShareSheet
          anchor={sheet.panel.current}
          noun="home"
          title={property.title}
          mono={false}
          meta={`${INTENT_LABELS[property.intent]} · ${place}`}
          price={price + per}
          url={url}
          waText={`${property.title}, ${property.area || property.county} ${price}${per} ${url}`}
          shape={{ kind: "home" }}
          color={color}
          onClose={() => setSharing(false)}
        />
      )}
    </aside>
  );
}
