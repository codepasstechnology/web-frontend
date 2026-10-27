import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Pencil, Share2, Tag, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMyProperty, formatPrice, INTENT_LABELS, TYPE_LABELS } from "@/lib/properties";
import type { ListingRow } from "@/components/dashboard/ListingsTab";
import { ListingThumb } from "@/components/dashboard/parts";
import { PhotoViewer } from "@/components/PhotoViewer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Fact = [label: string, value: string];

interface Preview {
  photos: string[];
  price: string;
  facts: Fact[];
  description: string;
  tagsLabel: string;
  tags: string[];
  location: Fact[];
  contact: Fact[];
}

const POSTING_FEE_LABELS = { pending: "Pending", paid: "Paid" };

const titleCase = (value: string) => value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const present = (facts: (Fact | false)[]) =>
  facts.filter((f): f is Fact => f !== false && f[1] !== "");

function Photos({
  photos,
  title,
  kind,
}: {
  photos: string[];
  title: string;
  kind: ListingRow["kind"];
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (photos.length === 0) {
    return (
      <div className="gd-thumb flex h-[240px] w-full items-center justify-center rounded-[18px]">
        <ListingThumb kind={kind} coverPhotoUrl={null} width={120} height={90} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setViewerIndex(0)}
        aria-label={`View photo 1 of ${photos.length}`}
        className="gd-thumb relative h-[240px] w-full cursor-zoom-in rounded-[18px]"
      >
        <img src={photos[0]} alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1 text-[12.5px] font-semibold text-[#fffaf2]">
          <Camera size={14} aria-hidden="true" /> {photos.length}{" "}
          {photos.length === 1 ? "photo" : "photos"}
        </span>
      </button>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.slice(1).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setViewerIndex(i + 1)}
              aria-label={`View photo ${i + 2} of ${photos.length}`}
              className="gd-thumb h-14 w-20 shrink-0 cursor-zoom-in"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <PhotoViewer
        photos={photos}
        title={title}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="gd-eyebrow">{title}</h3>
      {children}
    </section>
  );
}

function FactRows({ facts, mono = [] }: { facts: Fact[]; mono?: string[] }) {
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-x-3.5 gap-y-1.5 text-[14.5px]">
      {facts.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={mono.includes(label) ? "gd-mono" : ""}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PreviewContent({
  row,
  preview,
  isError,
  refetch,
}: {
  row: ListingRow;
  preview: Preview | undefined;
  isError: boolean;
  refetch: () => void;
}) {
  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-destructive-subtle px-4 py-3 text-sm font-semibold text-destructive"
      >
        Could not load this listing.
        <button type="button" className="gd-btn gd-sm gd-o" data-tone="danger" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading details…">
        <div className="gd-skel h-[240px] rounded-[18px]" />
        <div className="gd-skel h-8 w-40" />
        <div className="gd-facts">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="gd-skel h-14" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Photos photos={preview.photos} title={row.name} kind={row.kind} />

      <p className="gd-h text-[30px]">{preview.price}</p>

      <dl className="gd-facts">
        {preview.facts.map(([label, value]) => (
          <div key={label}>
            <dt className="gd-eyebrow">{label}</dt>
            <dd className="text-[15px] font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {preview.description && (
        <Section title="Description">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{preview.description}</p>
        </Section>
      )}

      {preview.tags.length > 0 && (
        <Section title={preview.tagsLabel}>
          <div className="flex flex-wrap gap-1.5">
            {preview.tags.map((tag) => (
              <span key={tag} className="gd-type px-2.5 py-1 text-[12.5px] tracking-normal">
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {preview.location.length > 0 && (
        <Section title="Location">
          <FactRows facts={preview.location} mono={["Coordinates"]} />
        </Section>
      )}

      {preview.contact.length > 0 && (
        <Section title="Contact">
          <FactRows facts={preview.contact} />
        </Section>
      )}
    </>
  );
}

function rowFacts(row: ListingRow, showViews: boolean): Fact[] {
  return present([["Listed", row.createdAt], showViews && ["Views", row.views.toLocaleString()]]);
}

function LandPreview({ row, showViews }: { row: ListingRow; showViews: boolean }) {
  const { fetchListing } = useAuth();
  const {
    data: d,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-listing", row.id],
    queryFn: () => fetchListing(row.id),
  });

  const preview: Preview | undefined = d && {
    photos: [...d.photos].sort((a, b) => Number(b.isCover) - Number(a.isCover)).map((p) => p.url),
    price: `KES ${d.price.toLocaleString()}`,
    facts: [
      ...present([
        ["Title", d.title],
        ["Listing type", d.listingType === "lease" ? "For lease" : "For sale"],
        ["Land type", titleCase(d.landType)],
        ["Size", d.size ?? ""],
        d.areaAcres != null && ["Acres", String(d.areaAcres)],
      ]),
      ...rowFacts(row, showViews),
    ],
    description: d.description ?? "",
    tagsLabel: "Utilities",
    tags: d.utilities,
    location: present([
      ["County", d.county],
      ["Area", d.area ?? ""],
      d.latitude != null &&
        d.longitude != null && [
          "Coordinates",
          `${d.latitude.toFixed(5)}, ${d.longitude.toFixed(5)}`,
        ],
      ["Boundary", d.boundarySource ? titleCase(d.boundarySource) : ""],
    ]),
    contact: present([["Phone", d.phone ?? ""]]),
  };

  return <PreviewContent row={row} preview={preview} isError={isError} refetch={() => refetch()} />;
}

function RentalPreview({ row, showViews }: { row: ListingRow; showViews: boolean }) {
  const { data: p, isError, refetch } = useMyProperty(row.id);

  const preview: Preview | undefined = p && {
    photos: p.photos,
    price: formatPrice(p.price, p.pricePeriod),
    facts: [
      ...present([
        ["Reference", p.reference],
        ["Listing type", INTENT_LABELS[p.intent]],
        ["Property type", TYPE_LABELS[p.type]],
        ["Bedrooms", String(p.bedrooms)],
        ["Bathrooms", String(p.bathrooms)],
        ["Furnished", p.furnished ? "Yes" : "No"],
        p.minNights != null && ["Minimum nights", String(p.minNights)],
        p.cleaningFee != null && ["Cleaning fee", `KES ${p.cleaningFee.toLocaleString()}`],
        p.postingPaymentStatus !== "not_required" && [
          "Posting fee",
          `KES ${p.postingFeeAmount.toLocaleString()} · ${POSTING_FEE_LABELS[p.postingPaymentStatus]}`,
        ],
      ]),
      ...rowFacts(row, showViews),
    ],
    description: p.description,
    tagsLabel: "Amenities",
    tags: p.amenities,
    location: present([
      ["County", p.county],
      ["Area", p.area],
      ["Coordinates", `${p.position[0].toFixed(5)}, ${p.position[1].toFixed(5)}`],
    ]),
    contact: present([
      ["Posted by", titleCase(p.postedBy)],
      ["Name", p.agent.name],
      ["Phone", p.agent.phone],
      ["Agency", p.agent.agency],
    ]),
  };

  return <PreviewContent row={row} preview={preview} isError={isError} refetch={() => refetch()} />;
}

export function ListingPreviewDialog({
  row,
  name,
  badges,
  showViews,
  closeLabel,
  onClose,
  onEdit,
  onShare,
  onMarkClosed,
  onDelete,
}: {
  row: ListingRow | null;
  name: ReactNode;
  badges: ReactNode;
  showViews: boolean;
  closeLabel: string;
  onClose: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onMarkClosed?: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="gd-dialog focus:outline-none [&>button:last-child]:hidden"
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {row && (
          <>
            <div className="sticky top-0 z-[2] flex justify-between gap-3 border-b border-border-subtle bg-background px-6 pb-3.5 pt-[22px]">
              <div className="flex min-w-0 flex-col gap-1.5">
                <DialogTitle className="leading-snug">{name}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {row.sub}
                </DialogDescription>
                <div className="flex items-center gap-2">{badges}</div>
              </div>
              <DialogClose className="gd-ib" aria-label="Close">
                <X size={18} aria-hidden="true" />
              </DialogClose>
            </div>

            <div className="flex flex-col gap-[18px] px-6 py-[18px]">
              {row.kind === "land" ? (
                <LandPreview row={row} showViews={showViews} />
              ) : (
                <RentalPreview row={row} showViews={showViews} />
              )}
            </div>

            <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border-subtle bg-background px-6 pb-[22px] pt-3.5">
              <button type="button" className="gd-btn gd-o" data-tone="danger" onClick={onDelete}>
                <Trash2 size={16} aria-hidden="true" /> Delete
              </button>
              <span className="flex-1" />
              <DialogClose className="gd-btn gd-o">Close</DialogClose>
              {onEdit && (
                <button type="button" className="gd-btn gd-o" onClick={onEdit}>
                  <Pencil size={16} aria-hidden="true" /> Edit
                </button>
              )}
              {onShare && (
                <button type="button" className="gd-btn gd-o" onClick={onShare}>
                  <Share2 size={16} aria-hidden="true" /> Share
                </button>
              )}
              {onMarkClosed && (
                <button type="button" className="gd-btn" onClick={onMarkClosed}>
                  <Tag size={16} aria-hidden="true" /> {closeLabel}
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
