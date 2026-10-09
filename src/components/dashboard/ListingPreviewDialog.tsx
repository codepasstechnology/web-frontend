import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMyProperty, formatPrice, INTENT_LABELS, TYPE_LABELS } from "@/lib/properties";
import type { ListingRow } from "@/components/dashboard/ListingsTab";
import { PhotoViewer } from "@/components/PhotoViewer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

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

function Photos({ photos, title }: { photos: string[]; title: string }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (photos.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setViewerIndex(0)}
        aria-label={`View photo 1 of ${photos.length}`}
        className="h-48 cursor-zoom-in overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-64"
      >
        <img src={photos[0]} alt="" className="h-full w-full object-cover" />
      </button>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.slice(1).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setViewerIndex(i + 1)}
              aria-label={`View photo ${i + 2} of ${photos.length}`}
              className="h-14 w-20 shrink-0 cursor-zoom-in overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FactRows({ facts }: { facts: Fact[] }) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      {facts.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PreviewContent({
  title,
  preview,
  isError,
  refetch,
}: {
  title: string;
  preview: Preview | undefined;
  isError: boolean;
  refetch: () => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive" className="flex items-center justify-between gap-3">
        <AlertDescription>Could not load this listing.</AlertDescription>
        <Button variant="outline" size="sm" onClick={refetch}>
          Try again
        </Button>
      </Alert>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading details…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Photos photos={preview.photos} title={title} />

      <p className="text-2xl font-semibold tabular-nums">{preview.price}</p>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {preview.facts.map(([label, value]) => (
          <div key={label} className="rounded-md border border-border p-3">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {preview.description && (
        <Section title="Description">
          <p className="whitespace-pre-line text-sm text-muted-foreground">{preview.description}</p>
        </Section>
      )}

      {preview.tags.length > 0 && (
        <Section title={preview.tagsLabel}>
          <div className="flex flex-wrap gap-1.5">
            {preview.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {preview.location.length > 0 && (
        <Section title="Location">
          <FactRows facts={preview.location} />
        </Section>
      )}

      {preview.contact.length > 0 && (
        <Section title="Contact">
          <FactRows facts={preview.contact} />
        </Section>
      )}
    </div>
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

  return (
    <PreviewContent
      title={row.name}
      preview={preview}
      isError={isError}
      refetch={() => refetch()}
    />
  );
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

  return (
    <PreviewContent
      title={row.name}
      preview={preview}
      isError={isError}
      refetch={() => refetch()}
    />
  );
}

export function ListingPreviewDialog({
  row,
  badges,
  showViews,
  closeLabel,
  onClose,
  onEdit,
  onMarkClosed,
  onDelete,
}: {
  row: ListingRow | null;
  badges: ReactNode;
  showViews: boolean;
  closeLabel: string;
  onClose: () => void;
  onEdit?: () => void;
  onMarkClosed?: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto focus:outline-none sm:max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {row && (
          <>
            <DialogHeader className="pr-6 text-left">
              <DialogTitle className="leading-snug">{row.name}</DialogTitle>
              <DialogDescription>{row.sub}</DialogDescription>
              <div className="flex items-center gap-2 pt-1">{badges}</div>
            </DialogHeader>

            {row.kind === "land" ? (
              <LandPreview row={row} showViews={showViews} />
            ) : (
              <RentalPreview row={row} showViews={showViews} />
            )}

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                variant="ghost"
                onClick={onDelete}
                className="text-destructive hover:text-destructive sm:mr-auto"
              >
                <Trash2 /> Delete
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Pencil /> Edit
                </Button>
              )}
              {onMarkClosed && (
                <Button
                  onClick={onMarkClosed}
                  className="bg-brand text-brand-foreground hover:bg-brand-hover"
                >
                  <Tag /> {closeLabel}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
