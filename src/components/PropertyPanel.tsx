import { useState } from "react";
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
} from "lucide-react";
import { statusMeta, type LandParcel, type Rental } from "@/lib/landData";

// Mobile: bottom sheet (max 70vh, doesn't cover the map). Desktop: right side panel.
const panelClass =
  "fixed inset-x-0 bottom-0 z-[1000] flex max-h-[70vh] w-full flex-col rounded-t-xl border border-border bg-card shadow-2xl " +
  "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-full md:max-w-sm md:rounded-none md:border-0 md:border-l";

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

export function ParcelPanel({ parcel, onClose }: { parcel: LandParcel; onClose: () => void }) {
  const meta = statusMeta[parcel.status];
  const priceLabel = parcel.listingType === "lease" ? "Lease / year" : "Price";
  return (
    <aside className={panelClass}>
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
          </div>
          <h2 className="mt-2 truncate text-lg font-semibold text-foreground">{parcel.title}</h2>
          <p className="text-xs text-muted-foreground">
            {parcel.parcelNumber} · {parcel.county}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Stat label="Size" value={parcel.size} />
          <Stat label={priceLabel} value={`KES ${parcel.price.toLocaleString()}`} />
        </div>

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
              className="h-1.5 rounded-full bg-[var(--accent)]"
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

        <Section title={parcel.postedBy === "owner" ? "Listed by Owner" : "Listed by Broker"}>
          <p className="text-sm text-foreground">{parcel.seller.name}</p>
          <p className="text-xs text-muted-foreground">{parcel.seller.agency}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-foreground">
            <Phone className="h-3 w-3" /> {parcel.seller.phone}
          </p>
        </Section>
      </div>

      <div className="flex items-center gap-2 border-t border-border p-4">
        <button className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary">
          Request Verification Report
        </button>
        <ShareButton
          title={parcel.title}
          text={`${parcel.parcelNumber} · ${parcel.size} · KES ${parcel.price.toLocaleString()}`}
        />
      </div>
    </aside>
  );
}

export function RentalPanel({ rental, onClose }: { rental: Rental; onClose: () => void }) {
  return (
    <aside className={panelClass}>
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-sm bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              {rental.type}
            </span>
            <PostedByBadge postedBy={rental.postedBy} />
          </div>
          <h2 className="mt-2 truncate text-lg font-semibold text-foreground">{rental.title}</h2>
          <p className="text-xs text-muted-foreground">
            {rental.area}, {rental.county}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Stat label="Rent / month" value={`KES ${rental.price.toLocaleString()}`} />
          <Stat label="Bedrooms" value={rental.bedrooms === 0 ? "—" : String(rental.bedrooms)} />
        </div>
        <Section title={rental.postedBy === "owner" ? "Listed by Owner" : "Listed by Broker"}>
          <p className="text-sm text-foreground">{rental.agent.name}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-foreground">
            <Phone className="h-3 w-3" /> {rental.agent.phone}
          </p>
        </Section>
        <p className="text-sm text-muted-foreground">
          Verified rental listing within the LandVerify network. Schedule a viewing or request a
          tenancy report.
        </p>
      </div>
      <div className="flex items-center gap-2 border-t border-border p-4">
        <button className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary">
          Schedule Viewing
        </button>
        <ShareButton
          title={rental.title}
          text={`${rental.type} · ${rental.area} · KES ${rental.price.toLocaleString()}/mo`}
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
