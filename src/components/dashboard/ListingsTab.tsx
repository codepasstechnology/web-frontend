import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, Download, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import {
  useMyProperties,
  useDeleteProperty,
  useMarkPropertyTaken,
  formatPrice,
  INTENT_LABELS,
  TYPE_LABELS,
} from "@/lib/properties";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ListingPreviewDialog } from "@/components/dashboard/ListingPreviewDialog";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LAND_STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  pending: "warning",
  active: "success",
  sold: "secondary",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={LAND_STATUS_VARIANT[status] ?? "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}

export type ListingRow = {
  kind: "land" | "property";
  id: string;
  name: string;
  sub: string;
  status: string;
  views: number;
  createdAt: string;
  coverPhotoUrl: string | null;
};

const PROPERTY_STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "destructive"> =
  {
    available: "success",
    pending: "warning",
    taken: "secondary",
    suspended: "destructive",
  };

function RowStatus({ row }: { row: ListingRow }) {
  if (row.kind === "land") return <StatusBadge status={row.status} />;
  return (
    <Badge variant={PROPERTY_STATUS_VARIANT[row.status] ?? "secondary"} className="capitalize">
      {row.status}
    </Badge>
  );
}

function KindChip({ kind }: { kind: ListingRow["kind"] }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {kind === "land" ? "Land" : "Rental"}
    </span>
  );
}

export function ListingsTab() {
  const navigate = useNavigate();
  const { user, removeListing, markListingSold } = useAuth();
  const { data: properties = [], isLoading, isError, refetch } = useMyProperties();
  const removeProperty = useDeleteProperty();
  const markTaken = useMarkPropertyTaken();

  const [filter, setFilter] = useState<"all" | "land" | "property">("all");
  const [deleteTarget, setDeleteTarget] = useState<ListingRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [takenTarget, setTakenTarget] = useState<ListingRow | null>(null);
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
      status: l.status,
      views: l.views,
      createdAt: l.createdAt,
      coverPhotoUrl: l.coverPhotoUrl,
    }));
    const rentals: ListingRow[] = properties.map((p) => ({
      kind: "property",
      id: p.id,
      name: p.title,
      sub: `${p.reference} · ${INTENT_LABELS[p.intent]} · ${TYPE_LABELS[p.type]} · ${formatPrice(p.price, p.pricePeriod)}`,
      status: p.status,
      views: p.views,
      createdAt: p.createdAt,
      coverPhotoUrl: p.coverPhotoUrl,
    }));
    // Both APIs emit created_at as a YYYY-MM-DD date string, so this sorts
    // without parsing.
    return [...land, ...rentals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [userListings, properties]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.kind === filter);
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
    } catch {
      // silent — export button stays available to retry
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
      setDeleteTarget(null);
    } catch {
      // leave the dialog open so the seller can retry
    } finally {
      setDeleting(false);
    }
  };

  const confirmTaken = async () => {
    if (!takenTarget) return;
    setTaking(true);
    try {
      if (takenTarget.kind === "land") await markListingSold(takenTarget.id);
      else await markTaken.mutateAsync(takenTarget.id);
      setTakenTarget(null);
    } catch {
      // leave the dialog open so the seller can retry
    } finally {
      setTaking(false);
    }
  };

  const canClose = (r: ListingRow) =>
    r.kind === "land" ? r.status === "active" : r.status === "available";

  const newListing = () =>
    navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } });
  const editListing = (r: ListingRow) =>
    navigate({ to: "/dashboard/upload", search: { edit: r.id, type: undefined } });
  const closeLabel = (r: ListingRow) => (r.kind === "land" ? "Mark as sold" : "Mark as taken");

  const rowActions = (r: ListingRow) => (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {canClose(r) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setTakenTarget(r)}
          title={closeLabel(r)}
          aria-label={`${closeLabel(r)}: ${r.name}`}
        >
          <Tag />
        </Button>
      )}
      {r.kind === "land" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => editListing(r)}
          title="Edit"
          aria-label={`Edit ${r.name}`}
        >
          <Pencil />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => setDeleteTarget(r)}
        title="Delete"
        aria-label={`Delete ${r.name}`}
      >
        <Trash2 />
      </Button>
    </div>
  );

  const thumb = (r: ListingRow, size: string) =>
    r.coverPhotoUrl ? (
      <img src={r.coverPhotoUrl} alt="" className={`${size} shrink-0 rounded-md object-cover`} />
    ) : (
      <div className={`${size} shrink-0 rounded-md bg-muted`} />
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-[-0.01em]">My Listings</h1>
        <div className="flex items-center gap-2">
          {user?.customReports && (
            <Button variant="outline" size="sm" onClick={exportListings} disabled={exporting}>
              <Download /> {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={newListing}
            className="bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            <Plus /> New listing
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter listings">
        {(
          [
            ["all", "All"],
            ["land", "Land"],
            ["property", "Rentals"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? "default" : "outline"}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`h-8 rounded-full ${
              filter === id ? "bg-brand text-brand-foreground hover:bg-brand-hover" : ""
            }`}
          >
            {label} {counts[id]}
          </Button>
        ))}
      </div>

      {isError && (
        <Alert variant="destructive" className="flex items-center justify-between gap-3">
          <AlertDescription>Could not load your rentals.</AlertDescription>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </Alert>
      )}

      {isLoading && rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading listings…</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Post a land parcel, rental, BnB or home for sale and it'll appear here for review."
          action={
            <Button
              onClick={newListing}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              <Plus /> New listing
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing here under this filter.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Desktop */}
          <div className="hidden max-h-[70vh] overflow-auto md:block">
            <table className="w-full text-sm">
              <TableHeader className="sticky top-0 z-10 bg-muted text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Listing</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  {showViews && <TableHead className="text-right">Views</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow
                    key={`${r.kind}-${r.id}`}
                    onClick={() => setPreviewTarget(r)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {thumb(r, "h-9 w-12")}
                        <div className="min-w-0">
                          <button
                            type="button"
                            aria-label={`View ${r.name}`}
                            className="text-left font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                          >
                            {r.name}
                          </button>
                          <div className="text-xs text-muted-foreground">{r.sub}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <KindChip kind={r.kind} />
                    </TableCell>
                    <TableCell>
                      <RowStatus row={r} />
                    </TableCell>
                    {showViews && (
                      <TableCell className="text-right tabular-nums">{r.views}</TableCell>
                    )}
                    <TableCell className="text-muted-foreground">{r.createdAt}</TableCell>
                    <TableCell>{rowActions(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="divide-y divide-border md:hidden">
            {visible.map((r) => (
              <li key={`${r.kind}-${r.id}`}>
                <button
                  type="button"
                  onClick={() => setPreviewTarget(r)}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <div className="flex items-center gap-3">
                    {thumb(r, "h-12 w-16")}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{r.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.sub}</div>
                    </div>
                    <RowStatus row={r} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <KindChip kind={r.kind} />
                      {showViews && `${r.views} views · `}
                      {r.createdAt}
                    </span>
                    <ChevronRight aria-hidden className="h-4 w-4" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ListingPreviewDialog
        row={previewTarget}
        badges={
          previewTarget && (
            <>
              <KindChip kind={previewTarget.kind} />
              <RowStatus row={previewTarget} />
            </>
          )
        }
        showViews={showViews}
        closeLabel={previewTarget ? closeLabel(previewTarget) : ""}
        onClose={() => setPreviewTarget(null)}
        onEdit={previewTarget?.kind === "land" ? () => editListing(previewTarget) : undefined}
        onMarkClosed={
          previewTarget && canClose(previewTarget)
            ? () => {
                setTakenTarget(previewTarget);
                setPreviewTarget(null);
              }
            : undefined
        }
        onDelete={() => {
          setDeleteTarget(previewTarget);
          setPreviewTarget(null);
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.kind === "land" ? "this listing" : "this property"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. The listing and its photos will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={takenTarget !== null}
        onOpenChange={(open) => !open && !taking && setTakenTarget(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark this listing as {takenTarget?.kind === "land" ? "sold" : "taken"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the marketplace and buyers can no longer see it. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={taking}>Cancel</AlertDialogCancel>
            <Button
              onClick={confirmTaken}
              disabled={taking}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {taking ? "Marking…" : takenTarget ? closeLabel(takenTarget) : ""}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
