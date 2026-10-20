import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CalendarCheck,
  ChevronRight,
  DoorClosed,
  Download,
  Pencil,
  Plus,
  Search,
  SearchX,
  Share2,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useMyProperties,
  useDeleteProperty,
  useMarkPropertyTaken,
  useSetPropertyAvailability,
  formatPrice,
  INTENT_LABELS,
  TYPE_LABELS,
  type BnbAvailability,
  type PropertyIntent,
} from "@/lib/properties";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { listingUrl } from "@/lib/mapLinks";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ListingPreviewDialog } from "@/components/dashboard/ListingPreviewDialog";
import { Beacon, ListingStatus, ListingThumb } from "@/components/dashboard/parts";

export type ListingRow = {
  kind: "land" | "property";
  intent?: PropertyIntent;
  id: string;
  name: string;
  sub: string;
  /** Lower-cased text the search box matches: title number or reference, place, county. */
  search: string;
  status: string;
  views: number;
  createdAt: string;
  coverPhotoUrl: string | null;
};

type StatusAction = { label: string; to: "sold" | "taken" | BnbAvailability };

const BNB_ACTIONS: StatusAction[] = [
  { label: "Mark as available", to: "available" },
  { label: "Mark as occupied", to: "occupied" },
  { label: "Mark as closed", to: "closed" },
];

const ACTION_ICONS: Record<StatusAction["to"], typeof Tag> = {
  sold: Tag,
  taken: Tag,
  available: CalendarCheck,
  occupied: BedDouble,
  closed: DoorClosed,
};

/** Only listings buyers can open on the map have a link worth sharing. */
const SHAREABLE = new Set(["active", "available", "occupied"]);

const PERMANENT_CLOSE =
  "It will be removed from the marketplace and buyers can no longer see it. This can't be undone.";

const ACTION_DESCRIPTIONS: Record<StatusAction["to"], string> = {
  sold: PERMANENT_CLOSE,
  taken: PERMANENT_CLOSE,
  available: "It will show on the map as open for bookings.",
  occupied: "It stays on the map with an Occupied badge so guests know it's booked.",
  closed: "It will be hidden from the map until you mark it available again.",
};

/**
 * BnBs come and go from availability, so they toggle between states rather
 * than closing for good like land (sold) and other rentals (taken).
 */
function statusActions(r: ListingRow): StatusAction[] {
  if (r.kind === "land")
    return r.status === "active" ? [{ label: "Mark as sold", to: "sold" }] : [];
  if (r.intent !== "bnb") {
    return r.status === "available" ? [{ label: "Mark as taken", to: "taken" }] : [];
  }
  return BNB_ACTIONS.some((a) => a.to === r.status)
    ? BNB_ACTIONS.filter((a) => a.to !== r.status)
    : [];
}

export function KindChip({ kind }: { kind: ListingRow["kind"] }) {
  return <span className="gd-type">{kind === "land" ? "LAND" : "RENTAL"}</span>;
}

/** Title numbers read as references, so land names use the mono face. */
function RowName({ row, large = false }: { row: ListingRow; large?: boolean }) {
  return row.kind === "land" ? (
    <span className={`gd-mono font-semibold ${large ? "text-xl" : "text-[14.5px]"}`}>
      {row.name}
    </span>
  ) : (
    <span className={`font-semibold ${large ? "gd-h text-[22px]" : "text-[15px]"}`}>
      {row.name}
    </span>
  );
}

function ConfirmDialog({
  open,
  danger,
  title,
  description,
  busy,
  confirmLabel,
  busyLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  danger: boolean;
  title: string;
  description: string;
  busy: boolean;
  confirmLabel: string;
  busyLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <AlertDialogContent className="gd-dialog" style={{ maxWidth: 420 }}>
        <span
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${
            danger
              ? "bg-destructive-subtle text-destructive"
              : "bg-brand-subtle text-brand-subtle-foreground"
          }`}
        >
          {danger ? <Trash2 size={22} aria-hidden="true" /> : <Tag size={22} aria-hidden="true" />}
        </span>
        <div>
          <AlertDialogTitle className="gd-h1 text-2xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="gd-sub">{description}</AlertDialogDescription>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="gd-btn gd-o" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`gd-btn ${danger ? "gd-danger" : ""}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ListingsTab() {
  const navigate = useNavigate();
  const { user, removeListing, markListingSold } = useAuth();
  const { data: properties = [], isLoading, isError, refetch } = useMyProperties();
  const removeProperty = useDeleteProperty();
  const markTaken = useMarkPropertyTaken();
  const setAvailability = useSetPropertyAvailability();

  const [filter, setFilter] = useState<"all" | "land" | "property">("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ListingRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    row: ListingRow;
    action: StatusAction;
  } | null>(null);
  const [taking, setTaking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<ListingRow | null>(null);
  const showViews = Boolean(user?.analyticsAccess);

  const userListings = user?.listings;

  const rows = useMemo<ListingRow[]>(() => {
    const land: ListingRow[] = (userListings ?? []).map((l) => ({
      kind: "land",
      id: l.id,
      name: l.parcelNumber,
      sub: `${l.county} · KES ${l.price.toLocaleString()}`,
      search: `${l.parcelNumber} ${l.title} ${l.county}`.toLowerCase(),
      status: l.status,
      views: l.views,
      createdAt: l.createdAt,
      coverPhotoUrl: l.coverPhotoUrl,
    }));
    const rentals: ListingRow[] = properties.map((p) => ({
      kind: "property",
      intent: p.intent,
      id: p.id,
      name: p.title,
      sub: `${p.reference} · ${INTENT_LABELS[p.intent]} · ${TYPE_LABELS[p.type]} · ${formatPrice(p.price, p.pricePeriod)}`,
      search: `${p.title} ${p.reference} ${p.area} ${p.county}`.toLowerCase(),
      status: p.status,
      views: p.views,
      createdAt: p.createdAt,
      coverPhotoUrl: p.coverPhotoUrl,
    }));
    // Both APIs emit created_at as a YYYY-MM-DD date string, so this sorts
    // without parsing.
    return [...land, ...rentals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [userListings, properties]);

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) => (filter === "all" || r.kind === filter) && (!q || r.search.includes(q)),
  );
  const counts = {
    all: rows.length,
    land: rows.filter((r) => r.kind === "land").length,
    property: rows.filter((r) => r.kind === "property").length,
  };

  const exportListings = async () => {
    setExporting(true);
    try {
      const blob = await api.getBlob("/user/listings/export");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `listings_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported your listings as CSV.");
    } catch {
      toast.error("Couldn't export your listings. Try again.");
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "land") await removeListing(deleteTarget.id);
      else await removeProperty.mutateAsync(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.name}.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Couldn't delete this listing. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const confirmStatus = async () => {
    if (!statusTarget) return;
    const { row, action } = statusTarget;
    setTaking(true);
    try {
      if (action.to === "sold") await markListingSold(row.id);
      else if (action.to === "taken") await markTaken.mutateAsync(row.id);
      else await setAvailability.mutateAsync({ id: row.id, status: action.to });
      toast.success(`${row.name} marked as ${action.to}.`);
      setStatusTarget(null);
    } catch {
      toast.error(`Couldn't mark this listing as ${action.to}. Try again.`);
    } finally {
      setTaking(false);
    }
  };

  const newListing = () =>
    navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } });
  const editListing = (r: ListingRow) =>
    r.kind === "land"
      ? navigate({ to: "/dashboard/upload", search: { edit: r.id, type: undefined } })
      : navigate({ to: "/dashboard/properties", search: { edit: r.id } });

  const shareListing = async (r: ListingRow) => {
    const url =
      r.kind === "land"
        ? listingUrl("land", "parcel", r.id)
        : listingUrl("rentals", "property", r.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: r.name, url });
      } catch {
        /* the user closed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const rowActions = (r: ListingRow) => (
    <span
      role="cell"
      className="flex justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {statusActions(r).map((action) => {
        const Icon = ACTION_ICONS[action.to];
        return (
          <button
            key={action.to}
            type="button"
            className="gd-ib"
            data-tip={action.label}
            aria-label={`${action.label}: ${r.name}`}
            onClick={() => setStatusTarget({ row: r, action })}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        );
      })}
      {SHAREABLE.has(r.status) && (
        <button
          type="button"
          className="gd-ib"
          data-tip="Share"
          aria-label={`Share ${r.name}`}
          onClick={() => shareListing(r)}
        >
          <Share2 size={18} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className="gd-ib"
        data-tip="Edit"
        aria-label={`Edit ${r.name}`}
        onClick={() => editListing(r)}
      >
        <Pencil size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="gd-ib gd-del"
        data-tip="Delete"
        aria-label={`Delete ${r.name}`}
        onClick={() => setDeleteTarget(r)}
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </span>
  );

  const previewAction = previewTarget ? statusActions(previewTarget)[0] : undefined;
  const cols = `minmax(0, 2.6fr) 90px 150px ${showViews ? "80px " : ""}110px 210px`;

  return (
    <>
      <div className="gd-r flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="gd-h1">My Listings</h1>
          <p className="gd-sub">Land, rentals, BnBs and homes for sale, newest first.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {user?.customReports && (
            <button
              type="button"
              className="gd-btn gd-o"
              onClick={exportListings}
              disabled={exporting}
            >
              <Download size={17} aria-hidden="true" /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          )}
          <button type="button" className="gd-btn" onClick={newListing}>
            <Plus size={17} strokeWidth={2.4} aria-hidden="true" /> New listing
          </button>
        </div>
      </div>

      <div className="gd-r flex flex-wrap items-center justify-between gap-3">
        <div className="gd-seg" role="group" aria-label="Filter listings">
          {(
            [
              ["all", "All"],
              ["land", "Land"],
              ["property", "Rentals"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label} <span className="gd-mono text-xs opacity-70">{counts[id]}</span>
            </button>
          ))}
        </div>
        <label className="relative flex w-full max-w-[320px]">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Search your listings</span>
          <input
            className="gd-input min-h-11 rounded-[14px] pl-10 text-[14.5px]"
            type="search"
            placeholder="Title number, reference or place"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {isError && (
        <div
          role="alert"
          className="gd-r flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-destructive-subtle px-4 py-3 text-[14.5px] font-semibold text-destructive"
        >
          <span className="flex items-center gap-2.5">
            <AlertTriangle size={18} aria-hidden="true" /> Could not load your rentals. Your land
            listings are shown below.
          </span>
          <button
            type="button"
            className="gd-btn gd-sm gd-o border-current"
            data-tone="danger"
            onClick={() => refetch()}
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && rows.length === 0 ? (
        <div
          className="gd-card flex flex-col gap-3"
          aria-busy="true"
          aria-label="Loading listings…"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <span className="gd-skel h-11 w-14" />
              <span className="flex flex-1 flex-col gap-2">
                <span className="gd-skel h-3 w-2/5" />
                <span className="gd-skel h-2.5 w-3/5" />
              </span>
              <span className="gd-skel h-6 w-[90px]" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="gd-empty">
          <Beacon width={26} height={36} />
          <span className="gd-h2">No listings yet</span>
          <span className="max-w-[420px] text-[14.5px] text-muted-foreground">
            Post a land parcel, rental, BnB or home for sale and it&apos;ll appear here for review.
          </span>
          <button type="button" className="gd-btn mt-1.5" onClick={newListing}>
            <Plus size={17} strokeWidth={2.4} aria-hidden="true" /> New listing
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="gd-empty">
          <SearchX size={26} className="text-muted-foreground" aria-hidden="true" />
          <span className="gd-h2">Nothing here under this filter</span>
          <button
            type="button"
            className="gd-link"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
          >
            Show all listings
          </button>
        </div>
      ) : (
        <>
          <div className="gd-r gd-card gd-deskonly overflow-hidden p-0">
            <div className="gd-tbl" role="table" aria-label="Your listings">
              <div className="gd-tr gd-th" role="row" style={{ gridTemplateColumns: cols }}>
                <span role="columnheader">Listing</span>
                <span role="columnheader">Type</span>
                <span role="columnheader">Status</span>
                {showViews && (
                  <span role="columnheader" className="text-right">
                    Views
                  </span>
                )}
                <span role="columnheader">Listed</span>
                <span role="columnheader" className="text-right">
                  Actions
                </span>
              </div>
              {visible.map((r) => (
                <div
                  key={`${r.kind}-${r.id}`}
                  className="gd-tr"
                  role="row"
                  tabIndex={0}
                  aria-label={`${r.name}. Open details`}
                  style={{ gridTemplateColumns: cols }}
                  onClick={() => setPreviewTarget(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPreviewTarget(r);
                    }
                  }}
                >
                  <span role="cell" className="flex min-w-0 items-center gap-3.5">
                    <ListingThumb kind={r.kind} coverPhotoUrl={r.coverPhotoUrl} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <RowName row={r} />
                      <span className="truncate text-[13px] text-muted-foreground">{r.sub}</span>
                    </span>
                  </span>
                  <span role="cell">
                    <KindChip kind={r.kind} />
                  </span>
                  <span role="cell">
                    <ListingStatus status={r.status} />
                  </span>
                  {showViews && (
                    <span role="cell" className="gd-mono text-right text-sm">
                      {r.views.toLocaleString()}
                    </span>
                  )}
                  <span role="cell" className="gd-mono text-[13.5px] text-muted-foreground">
                    {r.createdAt}
                  </span>
                  {rowActions(r)}
                </div>
              ))}
            </div>
          </div>

          <ul className="gd-mobonly flex-col gap-2.5" aria-label="Your listings">
            {visible.map((r) => (
              <li key={`${r.kind}-${r.id}`}>
                <button
                  type="button"
                  className="gd-card flex w-full cursor-pointer flex-col gap-2.5 p-3 text-left"
                  onClick={() => setPreviewTarget(r)}
                >
                  <span className="flex w-full items-center gap-3">
                    <ListingThumb
                      kind={r.kind}
                      coverPhotoUrl={r.coverPhotoUrl}
                      width={64}
                      height={50}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <RowName row={r} />
                      <span className="text-[13px] text-muted-foreground">{r.sub}</span>
                    </span>
                  </span>
                  <span className="flex w-full flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                    <KindChip kind={r.kind} />
                    <ListingStatus status={r.status} />
                    <span className="flex-1" />
                    {showViews && <span>{r.views.toLocaleString()} views ·</span>}
                    <span className="gd-mono">{r.createdAt}</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <ListingPreviewDialog
        row={previewTarget}
        name={previewTarget && <RowName row={previewTarget} large />}
        badges={
          previewTarget && (
            <>
              <KindChip kind={previewTarget.kind} />
              <ListingStatus status={previewTarget.status} />
            </>
          )
        }
        showViews={showViews}
        closeLabel={previewAction?.label ?? ""}
        onClose={() => setPreviewTarget(null)}
        onEdit={previewTarget ? () => editListing(previewTarget) : undefined}
        onShare={
          previewTarget && SHAREABLE.has(previewTarget.status)
            ? () => shareListing(previewTarget)
            : undefined
        }
        onMarkClosed={
          previewTarget && previewAction
            ? () => {
                setStatusTarget({ row: previewTarget, action: previewAction });
                setPreviewTarget(null);
              }
            : undefined
        }
        onDelete={() => {
          setDeleteTarget(previewTarget);
          setPreviewTarget(null);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        danger
        title={`Delete ${deleteTarget?.kind === "land" ? "this listing" : "this property"}?`}
        description="This can't be undone. The listing and its photos will be removed."
        busy={deleting}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        danger={false}
        title={`Mark this listing as ${statusTarget?.action.to ?? ""}?`}
        description={statusTarget ? ACTION_DESCRIPTIONS[statusTarget.action.to] : ""}
        busy={taking}
        confirmLabel={statusTarget?.action.label ?? ""}
        busyLabel="Marking…"
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatus}
      />
    </>
  );
}
