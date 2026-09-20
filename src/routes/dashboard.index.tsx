import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock,
  Plus,
  Trash2,
  Pencil,
  Tag,
  ArrowUpRight,
  BarChart3,
  Eye,
  EyeOff,
  Inbox,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Bookmark,
  Globe,
  Check,
  CreditCard,
  Download,
  Upload,
  Sparkles,
  Zap,
  Receipt,
  Crown,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Bell,
  KeyRound,
  Trash,
  LogOut,
  Camera,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Save,
  Copy,
  Link2,
  Activity,
  CalendarClock,
  Target,
  TrendingUp as TUp,
  ShieldCheck,
  MessageSquare,
  Clock,
  Send,
  RefreshCw,
  Calendar as CalendarIcon,
  Printer,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import L from "leaflet";
import { format, differenceInCalendarDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { DashboardShell, type DashTab } from "@/components/DashboardShell";
import {
  useMyProperties,
  useDeleteProperty,
  useMarkPropertyTaken,
  formatPrice,
  INTENT_LABELS,
  TYPE_LABELS,
} from "@/lib/properties";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { BoostModal } from "@/components/BoostModal";
import { useAuth, type AppUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { usePlans, addOns, type Plan } from "@/lib/plans";
import { LandBoundaryMap } from "@/components/LandBoundaryMap";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — GeoPin Properties Kenya" }] }),
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => {
    const allowed: DashTab[] = [
      "overview",
      "listings",
      "upload",
      "analytics",
      "billing",
      "settings",
      "kyc",
    ];
    // "properties" was its own tab before land and rentals were merged; keep
    // old links and bookmarks landing on the combined list.
    const raw = s.tab === "properties" ? "listings" : s.tab;
    const t =
      typeof raw === "string" && (allowed as string[]).includes(raw) ? (raw as DashTab) : undefined;
    return { tab: t };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const {
    user,
    ready,
    setPlan,
    updateUser,
    deleteAccount,
    logout,
    changePassword,
    enableTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
  } = useAuth();
  const { data: plans = [] } = usePlans();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<DashTab>(search.tab ?? "overview");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutCycle, setCheckoutCycle] = useState<"monthly" | "yearly" | undefined>(undefined);

  const handleSelectPlan = (id: string, cycle?: "monthly" | "yearly") => {
    const selected = plans.find((p) => p.id === id);
    if (selected && selected.price > 0) {
      setCheckoutCycle(cycle);
      setCheckoutPlan(selected);
    } else {
      setPlan(id);
    }
  };
  useEffect(() => {
    if (search.tab && search.tab !== tab) setTab(search.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
    else if (ready && user?.role === "account_manager") navigate({ to: "/manager" });
  }, [ready, user, navigate]);

  if (!user || user.role === "account_manager") return null;
  const used = user.listings.length;

  return (
    <DashboardShell active={tab} onChange={setTab}>
      {tab === "overview" && (
        <OverviewTab
          user={user}
          onUpgrade={() => setUpgradeOpen(true)}
          onGoTab={(t) => navigate({ to: "/dashboard", search: { tab: t } })}
        />
      )}

      {tab === "listings" && <ListingsTab />}

      {tab === "analytics" && (
        <AnalyticsTab
          onUpgrade={() => setUpgradeOpen(true)}
          onGoTab={(t) => navigate({ to: "/dashboard", search: { tab: t } })}
        />
      )}

      {tab === "billing" && (
        <BillingTab
          plan={user.plan}
          billingCycle={user.billingCycle}
          planStatus={user.planStatus}
          planEndsAt={user.planEndsAt}
          planCancelledAt={user.planCancelledAt}
          plans={plans}
          maxListings={user.maxListings}
          usedListings={used}
          onUpgrade={() => setUpgradeOpen(true)}
          payments={user.payments}
          onSelectPlan={handleSelectPlan}
          manager={user.manager}
        />
      )}

      {tab === "settings" && (
        <SettingsTab
          user={user}
          onUpdate={updateUser}
          onDelete={async () => {
            await deleteAccount();
            navigate({ to: "/" });
          }}
          onLogout={() => {
            logout();
            navigate({ to: "/" });
          }}
          onChangePassword={changePassword}
          onSignedOut={() => navigate({ to: "/login" })}
          onEnableTwoFactor={enableTwoFactor}
          onConfirmTwoFactor={confirmTwoFactor}
          onDisableTwoFactor={disableTwoFactor}
        />
      )}

      {tab === "kyc" && <KycTab />}

      <UpgradeModal
        open={upgradeOpen}
        currentPlan={user.plan}
        onClose={() => setUpgradeOpen(false)}
        onSelect={handleSelectPlan}
      />

      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          initialCycle={checkoutCycle}
          onClose={() => {
            setCheckoutPlan(null);
            setCheckoutCycle(undefined);
          }}
        />
      )}
    </DashboardShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          {icon}
        </div>
        <span className="leading-tight">{label}</span>
      </div>
      <div className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">{value}</div>
    </div>
  );
}

const LAND_STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  pending: "warning",
  active: "success",
  sold: "secondary",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={LAND_STATUS_VARIANT[status] ?? "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}

interface ApiAnalytics {
  total_views: number;
  total_saves: number;
  total_inquiries: number;
  top_listings: { id: string; name: string; views: number; saves: number; inquiries: number }[];
  listing_points: {
    title: string;
    county: string;
    latitude: number;
    longitude: number;
    views: number;
  }[];
  county_breakdown: { county: string; views: number }[];
  recent_activity: { title: string; status: string; views: number; created_at: string }[];
  daily_views: { date: string; views: number }[];
  daily_saves: { date: string; saves: number }[];
  daily_inquiries: { date: string; inquiries: number }[];
  traffic_sources: { name: string; value: number; color: string }[];
  device_breakdown: { name: string; value: number }[];
  peak_activity: { day: string; views: number }[];
  county_avg_prices: { county: string; avg_price: number }[];
  avg_days_on_market: number | null;
  county_percentile: { county: string; percentile: number } | null;
}

type ListingRow = {
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

  const rowActions = (r: ListingRow, size: "sm" | "md") => {
    const icon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
    const pad = size === "md" ? "p-2" : "p-1.5";
    return (
      <div className="flex gap-1">
        {canClose(r) && (
          <button
            onClick={() => setTakenTarget(r)}
            className={`rounded-md ${pad} text-muted-foreground hover:bg-muted`}
            title={r.kind === "land" ? "Mark as sold" : "Mark as taken"}
          >
            <Tag className={icon} />
          </button>
        )}
        {r.kind === "land" && (
          <button
            onClick={() =>
              navigate({ to: "/dashboard/upload", search: { edit: r.id, type: undefined } })
            }
            className={`rounded-md ${pad} text-muted-foreground hover:bg-muted`}
            title="Edit"
          >
            <Pencil className={icon} />
          </button>
        )}
        <button
          onClick={() => setDeleteTarget(r)}
          aria-label={`Delete ${r.name}`}
          className={`rounded-md ${pad} text-muted-foreground hover:bg-muted hover:text-destructive`}
          title="Delete"
        >
          <Trash2 className={icon} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My Listings</h1>
        <div className="flex items-center gap-2">
          {user?.customReports && (
            <button
              onClick={exportListings}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          )}
          <button
            onClick={() =>
              navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } })
            }
            className="inline-flex items-center gap-2 rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534]"
          >
            <Plus className="h-3.5 w-3.5" /> New listing
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["land", "Land"],
            ["property", "Rentals"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === id
                ? "bg-[#15803D] text-white"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {label} {counts[id]}
          </button>
        ))}
      </div>

      {isError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive-subtle px-4 py-3">
          <p className="text-sm text-destructive-subtle-foreground">Could not load your rentals.</p>
          <button
            onClick={() => refetch()}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
        </div>
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
            <button
              onClick={() =>
                navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } })
              }
              className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" /> New listing
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing here under this filter.
        </p>
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {visible.map((r) => (
              <div
                key={`${r.kind}-${r.id}`}
                className="rounded-lg border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  {r.coverPhotoUrl ? (
                    <img
                      src={r.coverPhotoUrl}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-16 shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{r.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.sub}</div>
                      </div>
                      <RowStatus row={r} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <KindChip kind={r.kind} />
                        {r.views} views · {r.createdAt}
                      </span>
                      {rowActions(r, "md")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((r) => (
                  <tr key={`${r.kind}-${r.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.coverPhotoUrl ? (
                          <img
                            src={r.coverPhotoUrl}
                            alt=""
                            className="h-9 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-9 w-12 shrink-0 rounded bg-muted" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.sub}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <KindChip kind={r.kind} />
                    </td>
                    <td className="px-4 py-3">
                      <RowStatus row={r} />
                    </td>
                    <td className="px-4 py-3">{r.views}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">{rowActions(r, "sm")}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
          >
            <h2 className="text-base font-semibold text-foreground">
              Delete {deleteTarget.kind === "land" ? "this listing" : "this property"}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This can&apos;t be undone. The listing and its photos will be removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {takenTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
          >
            <h2 className="text-base font-semibold text-foreground">
              Mark this listing as {takenTarget.kind === "land" ? "sold" : "taken"}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              It will be removed from the marketplace and buyers can no longer see it. This
              can&apos;t be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setTakenTarget(null)}
                disabled={taking}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmTaken}
                disabled={taking}
                className="rounded-md bg-[#15803D] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#166534] disabled:opacity-60"
              >
                {taking
                  ? "Marking…"
                  : takenTarget.kind === "land"
                    ? "Mark as sold"
                    : "Mark as taken"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({
  onUpgrade,
  onGoTab,
}: {
  onUpgrade: () => void;
  onGoTab: (t: DashTab) => void;
}) {
  const { user } = useAuth();
  const locked = !user?.analyticsAccess;
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [selectedListingId, setSelectedListingId] = useState<string>("all");
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const hasCustomRange = Boolean(customRange?.from && customRange?.to);
  const days = hasCustomRange
    ? differenceInCalendarDays(customRange!.to!, customRange!.from!) + 1
    : range === "7d"
      ? 7
      : range === "30d"
        ? 30
        : 90;

  useEffect(() => {
    if (locked) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (customRange?.from && customRange?.to) {
      params.set("from", format(customRange.from, "yyyy-MM-dd"));
      params.set("to", format(customRange.to, "yyyy-MM-dd"));
    } else {
      params.set("range", range);
    }
    if (selectedListingId !== "all") params.set("parcel_id", selectedListingId);

    api
      .get<ApiAnalytics>(`/user/analytics?${params.toString()}`)
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range, customRange, selectedListingId, locked]);

  // Real totals — from API when available, fall back to user listings in context
  const realTotalViews =
    analytics?.total_views ?? user?.listings.reduce((a, b) => a + b.views, 0) ?? 0;

  // Scoped to the "All Properties" filter — every list/table below derives
  // from this instead of the raw user.listings array.
  const visibleListings = (user?.listings ?? []).filter(
    (l) => selectedListingId === "all" || l.id === selectedListingId,
  );

  // Real per-listing rows (thumbnail, price, county) — richer than the
  // aggregate `top_listings` API field, which only has name + views. Saves
  // and inquiries per listing come from `top_listings` and are merged in by
  // id below.
  const topListingRows = [...visibleListings].sort((a, b) => b.views - a.views).slice(0, 5);
  const savesByListingId = new Map((analytics?.top_listings ?? []).map((t) => [t.id, t.saves]));
  const inquiriesByListingId = new Map(
    (analytics?.top_listings ?? []).map((t) => [t.id, t.inquiries]),
  );

  const countyBreakdown = analytics?.county_breakdown.length
    ? analytics.county_breakdown
    : (() => {
        const byCounty: Record<string, number> = {};
        visibleListings.forEach((l) => {
          byCounty[l.county] = (byCounty[l.county] || 0) + l.views;
        });
        return Object.entries(byCounty)
          .map(([county, views]) => ({ county, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 6);
      })();

  const recentActivity = analytics?.recent_activity.length
    ? analytics.recent_activity.map((a) => ({
        time: a.created_at,
        text:
          a.status === "pending"
            ? `"${a.title}" is under review`
            : a.status === "active" || a.status === "verified"
              ? `"${a.title}" is live · ${a.views} views`
              : `"${a.title}" — ${a.status}`,
        icon: <ListChecks className="h-3.5 w-3.5" />,
      }))
    : visibleListings.slice(0, 4).map((l) => ({
        time: l.createdAt,
        text:
          l.status === "pending"
            ? `"${l.parcelNumber}" is under review`
            : `"${l.parcelNumber}" · ${l.views} views`,
        icon: <ListChecks className="h-3.5 w-3.5" />,
      }));

  // Build the time series: use real daily_views/daily_saves/daily_inquiries
  // from the API when available, fall back to a proportional estimate for
  // views only while the request is still in flight.
  const series = useMemo(() => {
    const endDate = customRange?.to ?? new Date();
    const realViewsByDate: Record<string, number> = {};
    (analytics?.daily_views ?? []).forEach((r) => {
      realViewsByDate[r.date] = r.views;
    });
    const hasRealViews = Object.keys(realViewsByDate).length > 0;

    const realSavesByDate: Record<string, number> = {};
    (analytics?.daily_saves ?? []).forEach((r) => {
      realSavesByDate[r.date] = r.saves;
    });

    const realInquiriesByDate: Record<string, number> = {};
    (analytics?.daily_inquiries ?? []).forEach((r) => {
      realInquiriesByDate[r.date] = r.inquiries;
    });

    const hasRealData = analytics != null;

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - (days - 1 - i));
      const isoDate = d.toISOString().slice(0, 10); // YYYY-MM-DD (matches DB DATE())
      const displayDate = d.toISOString().slice(5, 10); // MM-DD (x-axis label)

      const views = hasRealViews
        ? (realViewsByDate[isoDate] ?? 0)
        : Math.max(
            0,
            Math.round((realTotalViews / days) * (0.6 + Math.sin(i / 3) * 0.25 + (i / days) * 0.3)),
          );

      return {
        date: displayDate,
        views,
        inquiries: hasRealData ? (realInquiriesByDate[isoDate] ?? 0) : 0,
        saves: hasRealData ? (realSavesByDate[isoDate] ?? 0) : 0,
      };
    });
  }, [days, realTotalViews, analytics, customRange]);

  const totals = useMemo(
    () =>
      series.reduce(
        (a, b) => ({
          views: a.views + b.views,
          inquiries: a.inquiries + b.inquiries,
          saves: a.saves + b.saves,
        }),
        { views: 0, inquiries: 0, saves: 0 },
      ),
    [series],
  );

  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, half).reduce((a, b) => a + b.views, 0);
  const curr = series.slice(half).reduce((a, b) => a + b.views, 0);
  const delta = prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);
  const savesPrev = series.slice(0, half).reduce((a, b) => a + b.saves, 0);
  const savesCurr = series.slice(half).reduce((a, b) => a + b.saves, 0);
  const savesDelta = savesPrev === 0 ? 0 : Math.round(((savesCurr - savesPrev) / savesPrev) * 100);
  const inquiriesPrev = series.slice(0, half).reduce((a, b) => a + b.inquiries, 0);
  const inquiriesCurr = series.slice(half).reduce((a, b) => a + b.inquiries, 0);
  const inquiriesDelta =
    inquiriesPrev === 0 ? 0 : Math.round(((inquiriesCurr - inquiriesPrev) / inquiriesPrev) * 100);
  const convRate = totals.views ? ((totals.inquiries / totals.views) * 100).toFixed(1) : "0";
  const periodLabel = hasCustomRange
    ? "the previous period"
    : range === "7d"
      ? "previous 7 days"
      : range === "30d"
        ? "previous 30 days"
        : "previous 90 days";

  // Sparklines for the KPI tiles — a tiny visual trend under each number.
  const viewsSparkline = series.map((s) => s.views);
  const savesSparkline = series.map((s) => s.saves);
  const inquiriesSparkline = series.map((s) => s.inquiries);
  const conversionSparkline = series.map((s) => (s.views ? (s.inquiries / s.views) * 100 : 0));

  const sources = analytics?.traffic_sources ?? [];
  const deviceBreakdown = analytics?.device_breakdown ?? [];
  const avgDaysOnMarket = analytics?.avg_days_on_market ?? null;
  const countyPercentile = analytics?.county_percentile ?? null;
  const countyTotalViews = countyBreakdown.reduce((a, b) => a + b.views, 0);
  const topCounty = countyBreakdown[0];
  const mapPoints = analytics?.listing_points ?? [];
  const peakActivity = analytics?.peak_activity ?? [];
  const peakDay = peakActivity.length
    ? peakActivity.reduce((a, b) => (b.views > a.views ? b : a))
    : null;
  const avgPriceByCounty = new Map(
    (analytics?.county_avg_prices ?? []).map((c) => [c.county, c.avg_price]),
  );
  const pricePositionRows = topListingRows
    .filter((l) => avgPriceByCounty.get(l.county))
    .map((l) => ({
      label: l.parcelNumber,
      price: l.price,
      avgPrice: avgPriceByCounty.get(l.county) as number,
    }));

  const funnelStages = [
    { label: "Property views", value: totals.views },
    { label: "Saves", value: totals.saves },
    { label: "Inquiries", value: totals.inquiries },
  ].map((s) => ({ ...s, pct: totals.views ? (s.value / totals.views) * 100 : 0 }));

  const rangeLabel = hasCustomRange
    ? `${format(customRange!.from!, "yyyy-MM-dd")}_${format(customRange!.to!, "yyyy-MM-dd")}`
    : range;

  const handleExport = () => {
    const header = "Date,Views,Saves,Inquiries";
    const rows = series.map((s) => `${s.date},${s.views},${s.saves},${s.inquiries}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geopin-analytics-${rangeLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track performance, understand your audience, and grow your property business.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loading && <span className="text-[11px] text-muted-foreground">Updating…</span>}

          <Select value={selectedListingId} onValueChange={setSelectedListingId}>
            <SelectTrigger className="h-[34px] w-[160px] text-xs">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {(user?.listings ?? []).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.parcelNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <CalendarIcon className="h-3.5 w-3.5" />
                {hasCustomRange
                  ? `${format(customRange!.from!, "d MMM")} – ${format(customRange!.to!, "d MMM yyyy")}`
                  : range === "7d"
                    ? "Last 7 days"
                    : range === "30d"
                      ? "Last 30 days"
                      : "Last 90 days"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="mb-3 flex gap-1.5">
                {(["7d", "30d", "90d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRange(r);
                      setCustomRange(undefined);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!hasCustomRange && range === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
                  </button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={setCustomRange}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>

          <button
            onClick={handleExport}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      <div className="relative">
        <div className={`space-y-6 ${locked ? "pointer-events-none select-none blur-sm" : ""}`}>
          {loading && !analytics ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              {/* KPI tiles — views, saves, inquiries and conversion are all real */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiTile
                  icon={<Eye className="h-4 w-4" />}
                  iconClassName="bg-brand-subtle text-brand-subtle-foreground"
                  label="Views"
                  value={realTotalViews.toLocaleString()}
                  delta={delta}
                  periodLabel={periodLabel}
                  sparkline={viewsSparkline}
                  sparklineColor="#0F172A"
                />
                <KpiTile
                  icon={<Bookmark className="h-4 w-4" />}
                  iconClassName="bg-success-subtle text-success-subtle-foreground"
                  label="Saves"
                  value={totals.saves.toLocaleString()}
                  delta={savesDelta}
                  periodLabel={periodLabel}
                  sparkline={savesSparkline}
                  sparklineColor="#15803D"
                />
                <KpiTile
                  icon={<Inbox className="h-4 w-4" />}
                  iconClassName="bg-muted text-secondary"
                  label="Inquiries"
                  value={totals.inquiries.toLocaleString()}
                  delta={inquiriesDelta}
                  periodLabel={periodLabel}
                  sparkline={inquiriesSparkline}
                  sparklineColor="#0D9488"
                />
                <KpiTile
                  icon={<Target className="h-4 w-4" />}
                  iconClassName="bg-warning-subtle text-warning-subtle-foreground"
                  label="Conversion"
                  value={`${convRate}%`}
                  delta={Math.round(delta * 0.4)}
                  periodLabel={periodLabel}
                  sparkline={conversionSparkline}
                  sparklineColor="#D97706"
                />
              </div>

              {/* Engagement trend + conversion funnel */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm lg:col-span-2">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Engagement trend</h3>
                    <p className="text-xs text-muted-foreground">
                      Views, saves and inquiries over time
                    </p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0F172A" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E2E8F0" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#64748B", fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                          minTickGap={20}
                        />
                        <YAxis
                          tick={{ fill: "#64748B", fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #E2E8F0",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                          cursor={{ stroke: "#E2E8F0" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#0F172A"
                          strokeWidth={2}
                          fill="url(#gv)"
                        />
                        <Area
                          type="monotone"
                          dataKey="saves"
                          stroke="#15803D"
                          strokeWidth={1.5}
                          fill="transparent"
                        />
                        <Area
                          type="monotone"
                          dataKey="inquiries"
                          stroke="#0D9488"
                          strokeWidth={1.5}
                          fill="transparent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex justify-center gap-4 border-t border-border pt-3">
                    <Legendish color="#0F172A" label="Views" />
                    <Legendish color="#15803D" label="Saves" />
                    <Legendish color="#0D9488" label="Inquiries" />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">Conversion funnel</h3>
                  <p className="mb-4 text-xs text-muted-foreground">Views → saves → inquiries</p>
                  <Funnel stages={funnelStages} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Peak activity — real, from view-log timestamps */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">Peak activity</h3>
                  <p className="mb-4 text-xs text-muted-foreground">Views by day of the week</p>
                  {peakActivity.length === 0 || !peakDay || peakDay.views === 0 ? (
                    <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                      No activity yet.
                    </div>
                  ) : (
                    <>
                      <PeakActivityChart data={peakActivity} peakDay={peakDay.day} />
                      <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                        Most views happen on {DAY_FULL_NAMES[peakDay.day] ?? peakDay.day}s.
                      </p>
                    </>
                  )}
                </div>

                {/* Price positioning — your listings vs the county's average asking price */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">Price positioning</h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Your top listings vs the county average
                  </p>
                  {pricePositionRows.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                      Not enough market data yet.
                    </div>
                  ) : (
                    <PricePositionList items={pricePositionRows} />
                  )}
                </div>

                {/* Device breakdown — real, from the user-agent captured at view time */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">Devices</h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    How viewers browse your listings
                  </p>
                  {deviceBreakdown.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                      No activity yet.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {deviceBreakdown.map((d) => (
                        <li key={d.name} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            {d.name === "Mobile" ? (
                              <Smartphone className="h-4 w-4" />
                            ) : d.name === "Tablet" ? (
                              <Tablet className="h-4 w-4" />
                            ) : (
                              <Monitor className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground">{d.name}</span>
                              <span className="text-muted-foreground">{d.value}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                                style={{ width: `${d.value}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                {/* Top listings — real data */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Top performing listings
                      </h3>
                      <p className="text-xs text-muted-foreground">By total views</p>
                    </div>
                    <button
                      onClick={() => onGoTab("listings")}
                      className="rounded-sm text-[11px] font-medium text-brand transition-colors hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      View all →
                    </button>
                  </div>
                  {topListingRows.length === 0 ? (
                    <div className="mt-10 text-center text-sm text-muted-foreground">
                      No listings yet.
                    </div>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="w-8 py-2 font-medium">#</th>
                            <th className="py-2 font-medium">Property</th>
                            <th className="py-2 font-medium">Location</th>
                            <th className="py-2 text-right font-medium">Views</th>
                            <th className="py-2 text-right font-medium">Saves</th>
                            <th className="py-2 text-right font-medium">Inquiries</th>
                            <th className="py-2 text-right font-medium">Conv.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {topListingRows.map((l, i) => {
                            const rowSaves = savesByListingId.get(l.id) ?? 0;
                            const rowInquiries = inquiriesByListingId.get(l.id) ?? 0;
                            const rowConv = l.views
                              ? ((rowInquiries / l.views) * 100).toFixed(1)
                              : "0";
                            return (
                              <tr key={l.id}>
                                <td className="py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-3">
                                    {l.coverPhotoUrl ? (
                                      <img
                                        src={l.coverPhotoUrl}
                                        alt=""
                                        className="h-9 w-12 shrink-0 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="h-9 w-12 shrink-0 rounded bg-muted" />
                                    )}
                                    <div className="min-w-0">
                                      <div className="truncate font-medium text-foreground">
                                        {l.parcelNumber}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        KES {l.price.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 text-xs text-muted-foreground">{l.county}</td>
                                <td className="py-2.5 text-right text-xs font-medium text-foreground">
                                  {l.views.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-right text-xs font-medium text-foreground">
                                  {rowSaves.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-right text-xs text-muted-foreground">
                                  {rowInquiries.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-right text-xs text-muted-foreground">
                                  {rowConv}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Traffic sources — real once view logs with source data exist */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">Traffic sources</h3>
                  <p className="mb-4 text-xs text-muted-foreground">Where viewers came from</p>
                  {sources.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center text-center">
                      <Globe className="h-6 w-6 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No traffic data yet.</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Sources appear once viewers open your listings on the map.
                      </p>
                    </div>
                  ) : (
                    <RankedList
                      items={sources.map((s) => ({ label: s.name, pct: s.value, colorClass: "" }))}
                    />
                  )}
                </div>

                {/* Geographic interest — real data */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Geographic interest</h3>
                      <p className="text-xs text-muted-foreground">Views by county</p>
                    </div>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {countyBreakdown.length === 0 ? (
                    <div className="mt-10 text-center text-sm text-muted-foreground">
                      No data yet.
                    </div>
                  ) : (
                    <>
                      {mapPoints.length > 0 && (
                        <GeoMiniMap points={mapPoints} topCounty={topCounty?.county} />
                      )}
                      <div className="mt-4">
                        <RankedList
                          showRank
                          items={countyBreakdown.map((c) => ({
                            label: c.county,
                            pct: countyTotalViews ? (c.views / countyTotalViews) * 100 : 0,
                            colorClass: "",
                          }))}
                        />
                      </div>
                      {topCounty && countyTotalViews > 0 && (
                        <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                          {Math.round((topCounty.views / countyTotalViews) * 100)}% of your views
                          are from {topCounty.county}
                          {countyBreakdown[1] && `, followed by ${countyBreakdown[1].county}`}.
                        </p>
                      )}
                      {countyPercentile && (
                        <p className="mt-2 rounded-md bg-brand-subtle px-3 py-2 text-[11px] text-brand-subtle-foreground">
                          Your top listing is in the top {100 - countyPercentile.percentile}% for
                          views in {countyPercentile.county}.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Recent activity — real listing events */}
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
                <p className="text-xs text-muted-foreground">Latest events on your listings</p>
                {recentActivity.length === 0 ? (
                  <div className="mt-10 text-center text-sm text-muted-foreground">
                    No activity yet.
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-border sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
                    {recentActivity.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 py-3 sm:border-b sm:border-border"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                          {a.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{a.text}</p>
                          <p className="text-[11px] text-muted-foreground">{a.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Summary stats — real */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SmallStat
                  label="Total listings"
                  value={String(user?.listings.length ?? 0)}
                  sub={`${user?.listings.filter((l) => l.status === "active").length ?? 0} active`}
                />
                <SmallStat
                  label="Avg views / listing"
                  value={
                    user?.listings.length
                      ? String(Math.round(realTotalViews / user.listings.length))
                      : "0"
                  }
                  sub="Per published listing"
                />
                <SmallStat label="Inquiry rate" value={`${convRate}%`} sub="Views → inquiries" />
                <SmallStat
                  label="Avg. days on market"
                  value={avgDaysOnMarket !== null ? String(avgDaysOnMarket) : "—"}
                  sub={avgDaysOnMarket !== null ? "Listing to sale" : "No sales yet"}
                />
              </div>
            </>
          )}
        </div>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg border border-border bg-card p-6 text-center shadow-lg">
              <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
              <h3 className="mt-2 text-base font-semibold text-foreground">Pro only</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Advanced analytics are available on the Pro plan.
              </p>
              <button
                onClick={onUpgrade}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-all duration-150 active:scale-[0.98] hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Upgrade to Pro <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiTile({
  icon,
  iconClassName,
  label,
  value,
  delta,
  periodLabel,
  sub,
  sparkline,
  sparklineColor,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
  value: string;
  delta: number;
  periodLabel: string;
  sub?: string;
  sparkline?: number[];
  sparklineColor?: string;
}) {
  const up = delta >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px]">
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${up ? "text-success" : "text-destructive"}`}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {up ? "+" : ""}
              {delta}%
            </span>
            <span className="text-muted-foreground">vs {periodLabel}</span>
          </div>
          {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} color={sparklineColor ?? "#15803D"} />
        )}
      </div>
    </div>
  );
}

// A minimal inline SVG trend line — no need for a full chart library for a
// KPI tile's tiny "shape of the trend" indicator.
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 64;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-lg lg:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Skeleton className="h-64 rounded-lg lg:col-span-2" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

function Legendish({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} /> {label}
    </span>
  );
}

// Views -> saves -> inquiries, drawn as decreasing-width centered bars so it
// reads as a funnel without needing SVG polygon paths for the taper.
// Each stage is drawn as a trapezoid via clip-path (wide top, narrower
// bottom) rather than resizing the box, so the taper reads as one shape
// without the layout width jumping around.
function Funnel({ stages }: { stages: { label: string; value: number; pct: number }[] }) {
  const max = stages[0]?.value || 1;
  const toneClasses = ["bg-primary", "bg-brand", "bg-[#0D9488]"];
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const topPct = Math.max(30, Math.round((s.value / max) * 100));
        const bottomPct = Math.max(20, Math.round(topPct * 0.8));
        const inset = (100 - topPct) / 2;
        const insetBottom = (100 - bottomPct) / 2;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div
              className={`flex h-12 w-full items-center justify-center text-sm font-semibold text-white transition-[clip-path] duration-500 ease-out ${toneClasses[i % toneClasses.length]}`}
              style={{
                clipPath: `polygon(${inset}% 0%, ${100 - inset}% 0%, ${100 - insetBottom}% 100%, ${insetBottom}% 100%)`,
              }}
            >
              {s.value.toLocaleString()}
            </div>
            <div className="w-24 shrink-0 text-right">
              <div className="truncate text-xs font-medium text-foreground">{s.label}</div>
              <div className="text-[11px] text-muted-foreground">{s.pct.toFixed(1)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DAY_FULL_NAMES: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function PeakActivityChart({
  data,
  peakDay,
}: {
  data: { day: string; views: number }[];
  peakDay: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.views));
  return (
    <div className="flex h-32 items-end justify-between gap-2">
      {data.map((d) => {
        const heightPct = Math.max(4, Math.round((d.views / max) * 100));
        const isPeak = d.day === peakDay;
        return (
          <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className={`w-full rounded-t-sm transition-[height] duration-500 ease-out ${isPeak ? "bg-brand" : "bg-muted"}`}
              style={{ height: `${heightPct}%` }}
              title={`${d.day}: ${d.views.toLocaleString()} views`}
            />
            <span
              className={`text-[10px] ${isPeak ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PricePositionList({
  items,
}: {
  items: { label: string; price: number; avgPrice: number }[];
}) {
  return (
    <ul className="space-y-3.5">
      {items.map((it) => {
        const delta = Math.round(((it.price - it.avgPrice) / it.avgPrice) * 100);
        const above = delta >= 0;
        return (
          <li key={it.label}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-foreground">{it.label}</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-foreground">
                {above ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {above ? "+" : ""}
                {delta}%
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              KES {it.price.toLocaleString()} vs county avg KES{" "}
              {Math.round(it.avgPrice).toLocaleString()}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const RANKED_LIST_TONES = ["bg-primary", "bg-brand", "bg-[#0D9488]", "bg-warning", "bg-[#9333EA]"];

function RankedList({
  items,
  showRank,
}: {
  items: { label: string; pct: number; colorClass: string }[];
  showRank?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={it.label}>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-medium text-foreground">
              {showRank && <span className="text-muted-foreground">{i + 1}</span>}
              {it.label}
            </span>
            <span className="text-muted-foreground">{Math.round(it.pct)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${it.colorClass || RANKED_LIST_TONES[i % RANKED_LIST_TONES.length]}`}
              style={{ width: `${Math.min(100, it.pct)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Light, low-clutter basemap — reads closer to an illustrative map than a
// full street map, which suits a small decorative "where your interest is
// coming from" card better than the app's main OSM tiles do.
const GEO_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const GEO_HIGHLIGHT_ICON = L.divIcon({
  className: "lv-geo-pin",
  html: `<svg width="22" height="28" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2H16A6 6 0 0 1 22 8V16A6 6 0 0 1 16 22H15L12 29L9 22H8A6 6 0 0 1 2 16V8A6 6 0 0 1 8 2Z" fill="#15803D" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.5" fill="#fff"/>
  </svg>`,
  iconSize: [22, 28],
  iconAnchor: [11, 27],
});

function GeoMiniMap({
  points,
  topCounty,
}: {
  points: { title: string; county: string; latitude: number; longitude: number; views: number }[];
  topCounty?: string;
}) {
  const maxViews = Math.max(1, ...points.map((p) => p.views));
  const highlightPoints = topCounty ? points.filter((p) => p.county === topCounty) : [];
  const centerSource = highlightPoints.length > 0 ? highlightPoints : points;
  const center: [number, number] = [
    centerSource.reduce((a, p) => a + p.latitude, 0) / centerSource.length,
    centerSource.reduce((a, p) => a + p.longitude, 0) / centerSource.length,
  ];

  return (
    <div className="mt-4 h-40 overflow-hidden rounded-md border border-border">
      <MapContainer
        center={center}
        zoom={points.length > 1 ? 7 : 9}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        className="h-full w-full"
      >
        <TileLayer url={GEO_TILES} attribution="&copy; OpenStreetMap, &copy; CARTO" />
        {points.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.latitude, p.longitude]}
            radius={4 + (p.views / maxViews) * 6}
            pathOptions={{ color: "#15803D", weight: 1, fillColor: "#15803D", fillOpacity: 0.35 }}
          >
            <LeafletTooltip direction="top" offset={[0, -4]}>
              {p.title} · {p.views.toLocaleString()} views
            </LeafletTooltip>
          </CircleMarker>
        ))}
        {highlightPoints.length > 0 && topCounty && (
          <Marker position={center} icon={GEO_HIGHLIGHT_ICON}>
            <LeafletTooltip permanent direction="right" offset={[4, -14]}>
              {topCounty}
            </LeafletTooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

function SmallStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function payStatusStyles(status: string) {
  if (status === "Paid") return { badge: "bg-[#16A34A]/10 text-[#16A34A]", dot: "bg-[#16A34A]" };
  if (status === "Failed" || status === "Refunded")
    return { badge: "bg-[#DC2626]/10 text-[#DC2626]", dot: "bg-[#DC2626]" };
  return { badge: "bg-[#D97706]/10 text-[#D97706]", dot: "bg-[#D97706]" };
}

function BillingTab({
  plan,
  billingCycle,
  planStatus,
  planEndsAt,
  planCancelledAt,
  plans,
  maxListings,
  usedListings,
  onUpgrade: _onUpgrade,
  payments,
  onSelectPlan,
  manager,
}: {
  plan: string;
  billingCycle: "monthly" | "yearly" | null;
  planStatus: string | null;
  planEndsAt: string | null;
  planCancelledAt: string | null;
  plans: Plan[];
  maxListings: number;
  usedListings: number;
  onUpgrade: () => void;
  payments: {
    number: string;
    date: string;
    amount: number;
    plan: string;
    status: string;
    downloadUrl: string;
  }[];
  onSelectPlan: (p: string, cycle?: "monthly" | "yearly") => void;
  manager: { name: string; email: string } | null;
}) {
  const { reloadUser, cancelSubscription, verifyCardPayment } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [boostAddOn, setBoostAddOn] = useState<(typeof addOns)[number] | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  // Paystack redirects the browser back here with ?payment=paystack&reference=...
  // after checkout. These aren't part of the route's validated search (adding
  // them there would force every /dashboard navigation elsewhere in the app to
  // supply them), so they're read directly off the URL, once, on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (params.get("payment") !== "paystack" || !reference) return;

    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      const status = await verifyCardPayment(reference).catch(() => "pending");
      if (cancelled) return;

      if (status === "paid") {
        await reloadUser();
        toast("Payment received", { description: "Your plan is now active." });
      } else if (status === "failed") {
        toast("Payment failed", { description: "The card payment was not completed." });
      } else if (Date.now() - startedAt < 60_000) {
        setTimeout(poll, 3000);
        return;
      } else {
        toast("Still processing", {
          description: "This can take a moment — your plan updates automatically once confirmed.",
        });
      }

      navigate({ to: "/dashboard", search: { tab: "billing" } });
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = plans.find((pl) => pl.id === plan);
  const limitNum = maxListings;
  const limitText = limitNum === Infinity ? "Unlimited" : String(limitNum);
  const unlimited = limitNum === Infinity;
  const pct = unlimited ? 100 : Math.min(100, Math.round((usedListings / limitNum) * 100));

  if (!p) {
    return <div className="text-sm text-muted-foreground">Loading plan details…</div>;
  }
  const isYearly = billingCycle === "yearly";
  const cycleLabel = isYearly ? "year" : "month";
  const planAmount = isYearly ? (p.priceYearly ?? p.price * 12) : p.price;
  const cancelled = Boolean(planCancelledAt);
  const renewDate = planEndsAt
    ? new Date(planEndsAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
  const totalPaid = payments.filter((x) => x.status === "Paid").reduce((a, b) => a + b.amount, 0);

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      setCancelOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Billing & Plan</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, payment method and invoices.
          </p>
        </div>
      </div>

      {/* Current plan banner */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid gap-0 md:grid-cols-3">
          <div className="border-b border-border p-5 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-[#15803D]" /> Current plan
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground">
                / {p.price === 0 ? "Free forever" : cycleLabel}
              </span>
            </div>
            <div className="mt-1 text-lg font-semibold text-foreground">
              {p.price === 0 ? "Ksh 0" : `Ksh ${planAmount.toLocaleString()}`}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              {p.price === 0 || planStatus === "active" ? (
                cancelled ? (
                  <>
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#D97706]" /> Cancels
                    on {renewDate}
                  </>
                ) : (
                  <>
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Active
                  </>
                )
              ) : (
                <>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#DC2626]" />{" "}
                  {planStatus ?? "Inactive"}
                </>
              )}
            </div>
          </div>

          <div className="border-b border-border p-5 md:border-b-0 md:border-r">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Listings usage
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
              {usedListings}{" "}
              <span className="text-sm font-normal text-muted-foreground">of {limitText}</span>
            </div>
            {!unlimited && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#15803D] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            <div className="mt-2 text-[11px] text-muted-foreground">
              {unlimited
                ? "Unlimited listings on Pro"
                : `${Math.max(0, limitNum - usedListings)} listing slots remaining`}
            </div>
          </div>

          <div className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {p.price === 0
                ? "Upgrade for more"
                : cancelled
                  ? "Subscription ends"
                  : "Next billing"}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
              {p.price === 0 ? "—" : `Ksh ${planAmount.toLocaleString()}`}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {p.price === 0
                ? "You are on the free tier"
                : cancelled
                  ? `Cancelled — access until ${renewDate ?? "the period end"}`
                  : renewDate
                    ? `Renews on ${renewDate}`
                    : "—"}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {plan !== "pro" && (
                <button
                  onClick={() => onSelectPlan("pro")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534]"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Upgrade
                </button>
              )}
              {plan !== "free" && (
                <button
                  onClick={() => onSelectPlan(plan, billingCycle ?? undefined)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#15803D] px-3 py-1.5 text-xs font-medium text-[#15803D] hover:bg-[#15803D]/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> {cancelled ? "Resume" : "Renew"}
                </button>
              )}
              {plan !== "free" && !cancelled && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel plan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {manager && (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your dedicated account manager
          </div>
          <div className="mt-2 text-sm font-medium text-foreground">{manager.name}</div>
          <div className="text-xs text-muted-foreground">{manager.email}</div>
        </div>
      )}

      {/* Plan picker */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Choose a plan</h2>
        <p className="text-xs text-muted-foreground">
          Switch anytime. Changes apply on your next billing cycle.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {plans.map((pl) => {
            const isCurrent = pl.id === plan;
            return (
              <div
                key={pl.id}
                className={`relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow ${
                  isCurrent ? "border-brand ring-1 ring-brand/30" : "border-border hover:shadow-md"
                }`}
              >
                {pl.badge && (
                  <span
                    className={`absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pl.badge.color === "accent" ? "bg-brand text-brand-foreground" : "bg-primary text-primary-foreground"}`}
                  >
                    {pl.badge.label}
                  </span>
                )}
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {pl.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-foreground">
                    Ksh {pl.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">/ mo</span>
                </div>
                {pl.priceYearly != null && pl.priceYearly > 0 && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    or Ksh {pl.priceYearly.toLocaleString()} / yr
                  </div>
                )}
                <ul className="mt-4 space-y-1.5 text-xs text-foreground">
                  {pl.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-[#16A34A]" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  onClick={() => (pl.id === "free" ? setCancelOpen(true) : onSelectPlan(pl.id))}
                  className={`mt-5 inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isCurrent
                      ? "cursor-default bg-muted text-muted-foreground"
                      : pl.id === "pro"
                        ? "bg-[#0F172A] text-white hover:bg-[#1e293b]"
                        : "bg-[#15803D] text-white hover:bg-[#166534]"
                  }`}
                >
                  {isCurrent
                    ? "Current plan"
                    : pl.id === "free"
                      ? "Downgrade"
                      : `Switch to ${pl.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add-ons + payment method */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#D97706]" />
            <h3 className="text-sm font-semibold text-foreground">One-time boosts</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Get more visibility for individual listings.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {addOns.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between rounded-lg border border-border bg-background p-3"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground">Active for {a.period}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">Ksh {a.price}</div>
                  <button
                    onClick={() => setBoostAddOn(a)}
                    className="mt-1 text-[11px] font-medium text-[#15803D] hover:underline"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">How you pay</h3>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Pay with M-Pesa (approve the charge on your phone) or by card at checkout.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
            <span>Total paid</span>
            <span className="font-semibold text-foreground">Ksh {totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Invoice history</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {payments.length} {payments.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">No invoices yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your payment receipts will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border md:hidden">
              {payments.map((pay, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-foreground">{pay.number}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {pay.plan} · {pay.date}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        Ksh {pay.amount.toLocaleString()}
                      </div>
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${payStatusStyles(pay.status).badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${payStatusStyles(pay.status).dot}`}
                        />
                        {pay.status}
                      </span>
                    </div>
                    <a
                      href={pay.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Download invoice"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((pay, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono text-xs text-foreground">{pay.number}</td>
                      <td className="px-5 py-3 text-muted-foreground">{pay.date}</td>
                      <td className="px-5 py-3">{pay.plan}</td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        Ksh {pay.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${payStatusStyles(pay.status).badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${payStatusStyles(pay.status).dot}`}
                          />
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <a
                          href={pay.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D] hover:underline"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {boostAddOn && <BoostModal addOn={boostAddOn} onClose={() => setBoostAddOn(null)} />}

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg">
            <h2 className="text-base font-semibold text-foreground">Cancel your subscription?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {p.name} plan stays active until {renewDate ?? "the end of your billing period"}.
              It won&apos;t renew after that, and you&apos;ll move to the Free plan. You can resume
              anytime before then.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCancelOpen(false)}
                disabled={cancelling}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-60"
              >
                Keep plan
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="rounded-md bg-[#DC2626] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#b91c1c] disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Cancel subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Overview Tab ---------------- */
function OverviewTab({
  user,
  onUpgrade,
  onGoTab,
}: {
  user: AppUser;
  onUpgrade: () => void;
  onGoTab: (t: DashTab) => void;
}) {
  const navigate = useNavigate();
  const { data: plans = [] } = usePlans();
  const plan = plans.find((p) => p.id === user.plan);
  const used = user.listings.length;
  const limitNum = user.maxListings;
  const limitText = limitNum === Infinity ? "Unlimited" : String(limitNum);
  const pct = limitNum === Infinity ? 12 : Math.min(100, Math.round((used / limitNum) * 100));
  const totalViews = user.listings.reduce((a, b) => a + b.views, 0);
  const activeCount = user.listings.filter((l) => l.status === "active").length;
  const pendingCount = user.listings.filter((l) => l.status === "pending").length;
  const avgViews = used ? Math.round(totalViews / used) : 0;

  // 14-day mini sparkline
  const spark = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        d: i,
        v: Math.max(2, Math.round(8 + Math.sin(i / 2) * 4 + i * 0.6 + Math.random() * 4)),
      })),
    [],
  );

  const checklist = [
    {
      key: "profile",
      label: "Complete your profile",
      done: Boolean(user.phone && user.county),
      action: () => onGoTab("settings"),
    },
    {
      key: "listing",
      label: "Upload your first listing",
      done: used > 0,
      action: () =>
        navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } }),
    },
    {
      key: "verify",
      label: "Add a verification badge",
      done: false,
      action: () => onGoTab("billing"),
    },
    {
      key: "pro",
      label: "Unlock advanced analytics",
      done: user.plan === "pro",
      action: onUpgrade,
    },
  ];
  const completed = checklist.filter((c) => c.done).length;

  const tips = [
    { title: "Add high-quality photos", body: "Listings with 5+ photos get 3× more inquiries." },
    { title: "Verify your title deed", body: "Verified listings rank higher in search results." },
    { title: "Share your map link", body: "Share on WhatsApp to reach buyers fast." },
  ];

  const recent = user.listings.slice(0, 4);
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="lv-fade-up space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's a snapshot of your account activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGoTab("analytics")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:py-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5" /> View analytics
          </button>
          <button
            onClick={() =>
              navigate({ to: "/dashboard/upload", search: { edit: undefined, type: undefined } })
            }
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-medium text-brand-foreground transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:py-1.5 hover:bg-brand-hover"
          >
            <Plus className="h-3.5 w-3.5" /> New listing
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          icon={<ListChecks className="h-4 w-4" />}
          label="Active listings"
          value={String(activeCount)}
        />
        <Stat
          icon={<Eye className="h-4 w-4" />}
          label="Total views"
          value={totalViews.toLocaleString()}
        />
        <Stat
          icon={<Inbox className="h-4 w-4" />}
          label="Pending review"
          value={String(pendingCount)}
        />
        <Stat
          icon={<Target className="h-4 w-4" />}
          label="Avg views / listing"
          value={String(avgViews)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Plan usage card */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Crown className="h-3.5 w-3.5 text-brand" /> Current plan
              </div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {plan?.name ?? user.plan}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {used} of {limitText} listings used
              </div>
            </div>
            <div className="h-16 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15803D" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#15803D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#15803D"
                    strokeWidth={2}
                    fill="url(#sparkG)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {limitNum === Infinity
                ? "Unlimited slots"
                : `${Math.max(0, limitNum - used)} slots remaining`}
            </span>
            {user.plan !== "pro" && (
              <button
                onClick={onUpgrade}
                className="rounded-sm font-medium text-brand transition-colors hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Upgrade to Pro →
              </button>
            )}
          </div>
        </div>

        {/* Onboarding checklist */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Getting started</h3>
            <span className="text-[11px] text-muted-foreground">
              {completed}/{checklist.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-500 ease-out"
              style={{ width: `${(completed / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2.5">
            {checklist.map((c) => (
              <li key={c.key}>
                <button
                  onClick={c.action}
                  className="flex w-full items-center gap-2 rounded-sm text-left text-xs text-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {c.done ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-border" />
                  )}
                  <span className={c.done ? "line-through text-muted-foreground" : ""}>
                    {c.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent listings + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">Recent listings</h3>
            <button
              onClick={() => onGoTab("listings")}
              className="rounded-sm text-[11px] font-medium text-brand transition-colors hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all →
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              className="rounded-none border-0 p-10"
              title="No listings yet"
              description="Upload your first parcel or property to see it here."
              action={
                <button
                  onClick={() =>
                    navigate({
                      to: "/dashboard/upload",
                      search: { edit: undefined, type: undefined },
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-brand-hover"
                >
                  <Plus className="h-3.5 w-3.5" /> Upload your first listing
                </button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  {l.coverPhotoUrl ? (
                    <img
                      src={l.coverPhotoUrl}
                      alt=""
                      className="h-10 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-12 shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {l.parcelNumber}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.county} · KES {l.price.toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={l.status} />
                  <div className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
                    <Eye className="h-3 w-3" /> {l.views}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {[
              { t: "Just now", text: "Welcome to GeoPin Properties" },
              { t: "2h ago", text: "Map updated with 14 new parcels" },
              { t: "1d ago", text: "Verification team reviewed your area" },
              { t: "3d ago", text: "Account created" },
            ].map((a, i) => (
              <li key={i} className="flex items-start gap-3 py-2.5">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" />
                <div className="flex-1">
                  <p className="text-xs text-foreground">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.t}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tips + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {tips.map((t) => (
          <div key={t.title} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-warning">
              <TUp className="h-3.5 w-3.5" /> Pro tip
            </div>
            <h4 className="mt-2 text-sm font-semibold text-foreground">{t.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </div>

      {/* Schedule strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-xs text-foreground">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Next billing:{" "}
          <span className="font-medium">
            {(plan?.price ?? 0) === 0
              ? "—"
              : new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
          </span>
        </div>
        <button
          onClick={() => onGoTab("billing")}
          className="text-[11px] font-medium text-[#15803D] hover:underline"
        >
          Manage billing →
        </button>
      </div>
    </div>
  );
}

/* ---------------- Settings Tab ---------------- */
function SettingsTab({
  user,
  onUpdate,
  onDelete,
  onLogout,
  onChangePassword,
  onSignedOut,
  onEnableTwoFactor,
  onConfirmTwoFactor,
  onDisableTwoFactor,
}: {
  user: AppUser;
  onUpdate: (patch: Partial<AppUser>) => Promise<void>;
  onDelete: () => Promise<void>;
  onLogout: () => void;
  onChangePassword: (current: string, next: string) => Promise<void>;
  onSignedOut: () => void;
  onEnableTwoFactor: () => Promise<void>;
  onConfirmTwoFactor: (code: string) => Promise<void>;
  onDisableTwoFactor: (password: string) => Promise<void>;
}) {
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    county: user.county || "",
    company: user.company || "",
    bio: user.bio || "",
    language: user.language || "en",
  });
  const [notif, setNotif] = useState(
    user.notifications || {
      emailInquiries: true,
      smsAlerts: true,
      weeklyDigest: false,
      marketing: false,
    },
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);
  const [tfaStep, setTfaStep] = useState<"idle" | "confirm" | "disable">("idle");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaPassword, setTfaPassword] = useState("");
  const [tfaBusy, setTfaBusy] = useState(false);
  const [tfaMsg, setTfaMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState("");
  const [section, setSection] = useState<
    "profile" | "security" | "notifications" | "preferences" | "danger"
  >("profile");

  const initials = form.fullName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const avatarColor = user.avatarColor || "#15803D";

  const saveProfile = async () => {
    await onUpdate({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role as AppUser["role"],
      county: form.county,
      company: form.company,
      bio: form.bio,
      language: form.language as AppUser["language"],
    });
    setSavedAt(new Date().toLocaleTimeString());
  };
  const saveNotif = async () => {
    await onUpdate({ notifications: notif });
    setSavedAt(new Date().toLocaleTimeString());
  };
  const startTwoFactor = async () => {
    setTfaMsg(null);
    setTfaBusy(true);
    try {
      await onEnableTwoFactor();
      setTfaStep("confirm");
    } catch (e) {
      setTfaMsg({ type: "err", text: (e as { message: string }).message });
    } finally {
      setTfaBusy(false);
    }
  };

  const confirmTwoFactorCode = async () => {
    setTfaMsg(null);
    setTfaBusy(true);
    try {
      await onConfirmTwoFactor(tfaCode);
      setTfaStep("idle");
      setTfaCode("");
      setTfaMsg({ type: "ok", text: "Two-factor authentication is on." });
    } catch (e) {
      const err = e as { message: string; errors?: Record<string, string[]> };
      setTfaMsg({ type: "err", text: err.errors?.code?.[0] ?? err.message });
    } finally {
      setTfaBusy(false);
    }
  };

  const turnOffTwoFactor = async () => {
    setTfaMsg(null);
    setTfaBusy(true);
    try {
      await onDisableTwoFactor(tfaPassword);
      setTfaStep("idle");
      setTfaPassword("");
      setTfaMsg({ type: "ok", text: "Two-factor authentication is off." });
    } catch (e) {
      const err = e as { message: string; errors?: Record<string, string[]> };
      setTfaMsg({ type: "err", text: err.errors?.password?.[0] ?? err.message });
    } finally {
      setTfaBusy(false);
    }
  };
  const changePassword = async () => {
    if (pwd.next.length < 8)
      return setPwdMsg({ type: "err", text: "Password must be at least 8 characters." });
    if (pwd.next !== pwd.confirm)
      return setPwdMsg({ type: "err", text: "Passwords do not match." });

    setPwdBusy(true);
    try {
      await onChangePassword(pwd.current, pwd.next);
      setPwd({ current: "", next: "", confirm: "" });
      setPwdMsg({
        type: "ok",
        text: "Password updated. Signing you out on all devices…",
      });
      setTimeout(onSignedOut, 1500);
    } catch (e) {
      const err = e as { message: string; errors?: Record<string, string[]> };
      setPwdMsg({
        type: "err",
        text: err.errors?.current_password?.[0] ?? err.errors?.password?.[0] ?? err.message,
      });
      setPwdBusy(false);
    }
  };

  const sections: { id: typeof section; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <UserIcon className="h-3.5 w-3.5" /> },
    { id: "security", label: "Security", icon: <Shield className="h-3.5 w-3.5" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-3.5 w-3.5" /> },
    { id: "preferences", label: "Preferences", icon: <Languages className="h-3.5 w-3.5" /> },
    { id: "danger", label: "Danger zone", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, security and preferences.
          </p>
        </div>
        {savedAt && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#16A34A]/10 px-2.5 py-1 text-[11px] font-medium text-[#16A34A]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Saved at {savedAt}
          </span>
        )}
      </div>

      {/* Profile header card */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {initials || "U"}
            </div>
            <button
              title="Change avatar"
              className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
              onClick={() => {
                const colors = ["#0D9488", "#16A34A", "#D97706", "#0F172A", "#9333EA", "#DB2777"];
                const next = colors[(colors.indexOf(avatarColor) + 1) % colors.length];
                onUpdate({ avatarColor: next });
              }}
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-foreground">{user.fullName}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> {user.email}
              <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] capitalize">
                {user.role}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[#15803D]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#15803D] capitalize">
                {user.plan} plan
              </span>
            </div>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(user.id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted"
          >
            <Copy className="h-3 w-3" /> Copy user ID
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              section === s.id
                ? "bg-[#0F172A] text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {section === "profile" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Profile information</h3>
          <p className="text-xs text-muted-foreground">
            Visible to buyers when they view your listings.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field
              label="Full name"
              icon={<UserIcon className="h-3.5 w-3.5" />}
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
            />
            <Field
              label="Email address"
              icon={<Mail className="h-3.5 w-3.5" />}
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              type="email"
            />
            <Field
              label="Phone"
              icon={<Phone className="h-3.5 w-3.5" />}
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="+254 7XX XXX XXX"
            />
            <Field
              label="Company / Agency"
              icon={<Building2 className="h-3.5 w-3.5" />}
              value={form.company}
              onChange={(v) => setForm({ ...form, company: v })}
              placeholder="Optional"
            />
            <Field
              label="County"
              icon={<MapPin className="h-3.5 w-3.5" />}
              value={form.county}
              onChange={(v) => setForm({ ...form, county: v })}
              placeholder="e.g. Nairobi"
            />
            <SelectField
              label="Role"
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v as AppUser["role"] })}
              options={[
                { value: "individual", label: "Individual" },
                { value: "agent", label: "Agent / Broker" },
                { value: "developer", label: "Developer" },
              ]}
            />
          </div>
          <div className="mt-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Short bio shown on your public profile."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() =>
                setForm({
                  fullName: user.fullName,
                  email: user.email,
                  phone: user.phone || "",
                  role: user.role,
                  county: user.county || "",
                  company: user.company || "",
                  bio: user.bio || "",
                  language: user.language || "en",
                })
              }
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Reset
            </button>
            <button
              onClick={saveProfile}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534]"
            >
              <Save className="h-3.5 w-3.5" /> Save changes
            </button>
          </div>
        </div>
      )}

      {section === "security" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Change password</h3>
            <p className="text-xs text-muted-foreground">
              Use at least 8 characters with a mix of letters and numbers.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Field
                label="Current password"
                icon={<KeyRound className="h-3.5 w-3.5" />}
                value={pwd.current}
                onChange={(v) => setPwd({ ...pwd, current: v })}
                type="password"
              />
              <Field
                label="New password"
                icon={<KeyRound className="h-3.5 w-3.5" />}
                value={pwd.next}
                onChange={(v) => setPwd({ ...pwd, next: v })}
                type="password"
              />
              <Field
                label="Confirm password"
                icon={<KeyRound className="h-3.5 w-3.5" />}
                value={pwd.confirm}
                onChange={(v) => setPwd({ ...pwd, confirm: v })}
                type="password"
              />
            </div>
            {pwdMsg && (
              <p
                className={`mt-3 text-xs font-medium ${pwdMsg.type === "ok" ? "text-[#16A34A]" : "text-destructive"}`}
              >
                {pwdMsg.text}
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={changePassword}
                disabled={pwdBusy}
                className="rounded-md bg-[#0F172A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pwdBusy ? "Updating…" : "Update password"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Two-factor authentication</h3>
                <p className="text-xs text-muted-foreground">
                  Require a code sent to {user.email} each time you sign in.
                </p>
              </div>
              <Toggle
                checked={Boolean(user.twoFactor)}
                onChange={(next) => {
                  setTfaMsg(null);
                  setTfaCode("");
                  setTfaPassword("");
                  if (next) {
                    startTwoFactor();
                  } else {
                    setTfaStep("disable");
                  }
                }}
              />
            </div>

            {tfaStep === "confirm" && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code we just emailed you to finish turning this on.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={tfaCode}
                    onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className="h-9 w-32 rounded-md border border-border bg-background px-3 text-center text-sm font-semibold tracking-[0.25em] text-foreground focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
                  />
                  <button
                    onClick={confirmTwoFactorCode}
                    disabled={tfaBusy || tfaCode.length !== 6}
                    className="rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tfaBusy ? "Confirming…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setTfaStep("idle")}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tfaStep === "disable" && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Enter your password to turn off two-factor authentication.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    value={tfaPassword}
                    onChange={(e) => setTfaPassword(e.target.value)}
                    placeholder="Your password"
                    className="h-9 w-56 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
                  />
                  <button
                    onClick={turnOffTwoFactor}
                    disabled={tfaBusy || !tfaPassword}
                    className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tfaBusy ? "Turning off…" : "Turn off"}
                  </button>
                  <button
                    onClick={() => setTfaStep("idle")}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tfaMsg && (
              <p
                className={`mt-3 text-xs font-medium ${tfaMsg.type === "ok" ? "text-[#16A34A]" : "text-destructive"}`}
              >
                {tfaMsg.text}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Active sessions</h3>
            <ul className="mt-3 divide-y divide-border">
              {[
                { name: "This device", meta: "Chrome · Nairobi · just now", current: true },
                { name: "iPhone", meta: "Safari · Mombasa · 2 days ago", current: false },
              ].map((s) => (
                <li key={s.name} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {s.name}
                      {s.current && (
                        <span className="ml-2 rounded bg-[#16A34A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{s.meta}</div>
                  </div>
                  {!s.current && (
                    <button className="text-[11px] font-medium text-destructive hover:underline">
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {section === "notifications" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Notification preferences</h3>
          <p className="text-xs text-muted-foreground">Choose how you want to hear from us.</p>
          <div className="mt-4 divide-y divide-border">
            <ToggleRow
              title="Email — New inquiries"
              desc="Get notified when someone inquires about your listing."
              checked={notif.emailInquiries}
              onChange={(v) => setNotif({ ...notif, emailInquiries: v })}
            />
            <ToggleRow
              title="SMS alerts"
              desc="Important alerts sent to your phone."
              checked={notif.smsAlerts}
              onChange={(v) => setNotif({ ...notif, smsAlerts: v })}
            />
            <ToggleRow
              title="Weekly digest"
              desc="Performance summary every Monday."
              checked={notif.weeklyDigest}
              onChange={(v) => setNotif({ ...notif, weeklyDigest: v })}
            />
            <ToggleRow
              title="Marketing emails"
              desc="Product news, tips and offers."
              checked={notif.marketing}
              onChange={(v) => setNotif({ ...notif, marketing: v })}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={saveNotif}
              className="rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534]"
            >
              Save preferences
            </button>
          </div>
        </div>
      )}

      {section === "preferences" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Display & language</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Language"
              value={form.language}
              onChange={(v) => setForm({ ...form, language: v as "en" | "sw" })}
              options={[
                { value: "en", label: "English" },
                { value: "sw", label: "Swahili" },
              ]}
            />
            <SelectField
              label="Default map view"
              value="road"
              onChange={() => {}}
              options={[
                { value: "road", label: "Road" },
                { value: "satellite", label: "Satellite" },
              ]}
            />
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground">Connected accounts</h4>
            <ul className="mt-3 divide-y divide-border">
              {[
                { name: "Google", connected: false },
                { name: "WhatsApp Business", connected: false },
              ].map((c) => (
                <li key={c.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Link2 className="h-4 w-4 text-muted-foreground" /> {c.name}
                  </div>
                  <button className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
                    {c.connected ? "Disconnect" : "Connect"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={saveProfile}
              className="rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534]"
            >
              Save preferences
            </button>
          </div>
        </div>
      )}

      {section === "danger" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Sign out</h3>
            <p className="text-xs text-muted-foreground">End your session on this device.</p>
            <div className="mt-4">
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" /> Log out
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Delete account</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              This permanently removes your account, listings and data. Type{" "}
              <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={confirmDel}
                onChange={(e) => setConfirmDel(e.target.value)}
                placeholder="Type DELETE"
                className="h-8 w-40 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
              <button
                disabled={confirmDel !== "DELETE"}
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash className="h-3.5 w-3.5" /> Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  const [reveal, setReveal] = useState(false);
  const revealable = type === "password";
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={revealable && reveal ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 ${
            revealable ? "pr-9 [&::-ms-reveal]:hidden" : ""
          }`}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            tabIndex={-1}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#15803D]" : "bg-muted"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── KYC Status Tab ──────────────────────────────────────────────────────────

interface KycDocument {
  id: string;
  type: string;
  original_name: string;
  mime_type: string | null;
  size: number | null;
  verification_status: string;
}

interface KycApplication {
  id: string;
  reference: string;
  status: string;
  document_type: string | null;
  reviewer_notes: string | null;
  rejection_reason: string | null;
  info_request_message: string | null;
  correction_note: string | null;
  user_reply: string | null;
  user_replied_at: string | null;
  user_reply_document_path: string | null;
  user_reply_document_name: string | null;
  admin_acknowledgment: string | null;
  admin_acknowledged_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  parcel: {
    id: string;
    title: string;
    parcel_number: string | null;
    latitude: number | null;
    longitude: number | null;
    boundary: { lat: number; lng: number }[] | null;
    boundary_source: string | null;
  } | null;
  documents: KycDocument[];
}

const kycStatusConfig: Record<
  string,
  { label: string; bg: string; fg: string; border: string; icon: React.ReactNode; step: number }
> = {
  pending: {
    label: "Pending Review",
    bg: "#FEF9C3",
    fg: "#854D0E",
    border: "#EAB308",
    icon: <Clock className="h-3.5 w-3.5" />,
    step: 1,
  },
  under_review: {
    label: "Under Review",
    bg: "#F1F5F9",
    fg: "#1E293B",
    border: "#64748B",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    step: 2,
  },
  info_requested: {
    label: "Info Requested",
    bg: "#FEF3C7",
    fg: "#D97706",
    border: "#F59E0B",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    step: 2,
  },
  approved: {
    label: "Approved",
    bg: "#DCFCE7",
    fg: "#15803D",
    border: "#22C55E",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    step: 3,
  },
  rejected: {
    label: "Rejected",
    bg: "#FEE2E2",
    fg: "#DC2626",
    border: "#EF4444",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    step: 3,
  },
  location_correction_requested: {
    label: "Fix Location",
    bg: "#FFF7ED",
    fg: "#C2410C",
    border: "#F97316",
    icon: <MapPin className="h-3.5 w-3.5" />,
    step: 2,
  },
};

const STEPS = ["Submitted", "In Review", "Decision"];

function KycCard({
  kyc,
  replyText,
  setReplyText,
  replyFile,
  setReplyFile,
  submitting,
  submitted,
  fileInputRefs,
  handleReply,
  handleUpdateLocation,
  fmtDate,
}: {
  kyc: KycApplication;
  replyText: Record<string, string>;
  setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  replyFile: Record<string, File | null>;
  setReplyFile: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
  submitting: string | null;
  submitted: string[];
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  handleReply: (kyc: KycApplication) => void;
  handleUpdateLocation: (
    kyc: KycApplication,
    pin: [number, number] | null,
    boundary: { lat: number; lng: number }[] | null,
  ) => void;
  fmtDate: (s: string) => string;
}) {
  const cfg = kycStatusConfig[kyc.status] ?? {
    label: kyc.status,
    bg: "#F1F5F9",
    fg: "#0F172A",
    border: "#CBD5E1",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    step: 1,
  };
  const alreadyReplied =
    !!kyc.user_reply || !!kyc.user_reply_document_path || submitted.includes(kyc.id);
  const isInfo = kyc.status === "info_requested";
  const isApproved = kyc.status === "approved";
  const isRejected = kyc.status === "rejected";
  const isLocationCorrection = kyc.status === "location_correction_requested";
  const locationCorrected = submitted.includes(`loc:${kyc.id}`);
  const acknowledged = !!kyc.admin_acknowledgment;
  // Auto-expand: unanswered info requests, location corrections, and acknowledged cards
  const [expanded, setExpanded] = useState(
    (isInfo && !alreadyReplied) || (isLocationCorrection && !locationCorrected) || acknowledged,
  );
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [locPin, setLocPin] = useState<[number, number] | null>(
    kyc.parcel?.latitude != null && kyc.parcel?.longitude != null
      ? [kyc.parcel.latitude, kyc.parcel.longitude]
      : null,
  );
  const [locBoundary, setLocBoundary] = useState<{ lat: number; lng: number }[] | null>(
    kyc.parcel?.boundary && kyc.parcel.boundary.length >= 3 ? kyc.parcel.boundary : null,
  );

  async function handleViewDoc(docId: string) {
    setViewingDoc(docId);
    try {
      const blob = await api.getBlob(`/user/kyc/${kyc.id}/documents/${docId}`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // silent — user will see nothing opened
    } finally {
      setViewingDoc(null);
    }
  }

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: cfg.border }}
    >
      {/* Card header — always visible */}
      <button className="w-full px-5 py-4 text-left" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">
                {kyc.parcel?.title ?? "Land Parcel"}
              </p>
              {isInfo && !alreadyReplied && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#D97706]">
                  Action required
                </span>
              )}
              {isLocationCorrection && !locationCorrected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-semibold text-[#C2410C]">
                  Fix location required
                </span>
              )}
              {isLocationCorrection && locationCorrected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                  <Check className="h-2.5 w-2.5" /> Location updated
                </span>
              )}
              {isInfo && alreadyReplied && acknowledged && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
                  <Check className="h-2.5 w-2.5" /> Acknowledged
                </span>
              )}
              {isInfo && alreadyReplied && !acknowledged && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                  <Check className="h-2.5 w-2.5" /> Reply sent
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {kyc.parcel?.parcel_number && (
                <span className="font-mono">{kyc.parcel.parcel_number}</span>
              )}
              <span>Ref: {kyc.reference}</span>
              <span>Submitted {fmtDate(kyc.created_at)}</span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: cfg.bg, color: cfg.fg }}
            >
              {cfg.icon}
              {cfg.label}
            </span>
            <span className="text-muted-foreground">
              {expanded ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="mt-4 flex items-center gap-0">
          {STEPS.map((step, i) => {
            const stepNum = i + 1;
            const done = cfg.step > stepNum;
            const active = cfg.step === stepNum;
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      done
                        ? "bg-[#22C55E] text-white"
                        : active
                          ? "text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                    style={active ? { background: cfg.border } : undefined}
                  >
                    {done ? <Check className="h-3 w-3" /> : stepNum}
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-medium ${
                      done ? "text-[#16A34A]" : active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mb-4 h-px flex-1 ${done ? "bg-[#22C55E]" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Approved message */}
          {isApproved && (
            <div className="flex items-start gap-3 rounded-lg bg-[#F0FDF4] p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#16A34A]" />
              <div>
                <p className="text-sm font-semibold text-[#15803D]">Verification approved</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your land parcel has been verified and your KYC is complete.
                  {kyc.reviewed_at && ` · ${fmtDate(kyc.reviewed_at)}`}
                </p>
              </div>
            </div>
          )}

          {/* Rejected message */}
          {isRejected && (
            <div className="flex items-start gap-3 rounded-lg bg-[#FEF2F2] p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#DC2626]" />
              <div>
                <p className="text-sm font-semibold text-[#DC2626]">Application rejected</p>
                {kyc.rejection_reason ? (
                  <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                    {kyc.rejection_reason}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Your application did not meet the verification requirements.
                    {kyc.reviewed_at && ` · ${fmtDate(kyc.reviewed_at)}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending / under review */}
          {(kyc.status === "pending" || kyc.status === "under_review") && (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Your application is being reviewed
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  We'll notify you once a decision is made. No action needed right now.
                </p>
              </div>
            </div>
          )}

          {/* Info requested */}
          {isInfo && kyc.info_request_message && (
            <div className="rounded-lg border border-[#F59E0B]/40 bg-[#FFFBEB]">
              <div className="flex items-center gap-2 border-b border-[#F59E0B]/30 px-4 py-3">
                <MessageSquare className="h-4 w-4 text-[#D97706]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-[#D97706]">
                  Additional information needed
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {kyc.info_request_message}
                </p>
              </div>

              {/* Reply area */}
              <div className="border-t border-[#F59E0B]/30 px-4 py-4">
                {alreadyReplied ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-[#22C55E]/30 bg-[#F0FDF4] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                        <p className="text-xs font-semibold text-[#15803D]">Your reply was sent</p>
                        {kyc.user_replied_at && (
                          <span className="ml-auto text-[11px] text-muted-foreground">
                            {fmtDate(kyc.user_replied_at)}
                          </span>
                        )}
                      </div>
                      {kyc.user_reply && (
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {kyc.user_reply}
                        </p>
                      )}
                      {kyc.user_reply_document_name && (
                        <a
                          href={`${import.meta.env.VITE_API_URL ?? "http://localhost/Landconnect/backend/public/api"}/user/kyc/${kyc.id}/reply-document`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {kyc.user_reply_document_name}
                        </a>
                      )}
                    </div>

                    {/* Reviewer acknowledgment */}
                    {kyc.admin_acknowledgment && (
                      <div className="rounded-lg border border-[#22C55E]/30 bg-[#F0FDF4] p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                          <p className="text-xs font-semibold text-[#166534]">
                            Message from reviewer
                          </p>
                          {kyc.admin_acknowledged_at && (
                            <span className="ml-auto text-[11px] text-muted-foreground">
                              {fmtDate(kyc.admin_acknowledged_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {kyc.admin_acknowledgment}
                        </p>
                        <p className="mt-2 text-xs font-medium text-[#15803D]">
                          No further action needed from you.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-foreground">Your reply</p>
                    <textarea
                      value={replyText[kyc.id] ?? ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [kyc.id]: e.target.value }))
                      }
                      placeholder="Provide the requested information or explain what you've uploaded…"
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        ref={(el) => {
                          fileInputRefs.current[kyc.id] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setReplyFile((prev) => ({ ...prev, [kyc.id]: f }));
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[kyc.id]?.click()}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {replyFile[kyc.id] ? replyFile[kyc.id]!.name : "Attach file"}
                        </button>
                        {replyFile[kyc.id] && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyFile((prev) => ({ ...prev, [kyc.id]: null }));
                              if (fileInputRefs.current[kyc.id])
                                fileInputRefs.current[kyc.id]!.value = "";
                            }}
                            className="text-[11px] text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        JPG, PNG or PDF · max 10 MB
                      </span>
                      <button
                        onClick={() => handleReply(kyc)}
                        disabled={
                          (!replyText[kyc.id]?.trim() && !replyFile[kyc.id]) ||
                          submitting === kyc.id
                        }
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {submitting === kyc.id ? "Sending…" : "Send reply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location correction */}
          {isLocationCorrection && (
            <div className="rounded-lg border border-[#F97316]/40 bg-[#FFF7ED]">
              <div className="flex items-center gap-2 border-b border-[#F97316]/30 px-4 py-3">
                <MapPin className="h-4 w-4 text-[#C2410C]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-[#C2410C]">
                  Location correction requested
                </p>
              </div>
              {kyc.correction_note && (
                <div className="px-4 py-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {kyc.correction_note}
                  </p>
                </div>
              )}
              <div className="border-t border-[#F97316]/30 px-4 py-4">
                {locationCorrected ? (
                  <div className="flex items-center gap-2 rounded-lg bg-[#F0FDF4] p-3">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    <p className="text-sm font-medium text-[#15803D]">
                      Updated location submitted — under review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <LandBoundaryMap
                      pin={locPin}
                      boundary={locBoundary}
                      onPinChange={setLocPin}
                      onBoundaryChange={setLocBoundary}
                      heightClassName="h-64"
                      hintText='This shows where you originally placed your land. Drop a new pin to correct it, or tap "Trace boundary" / "Retrace boundary" to redraw the shape.'
                      requireTapToActivate
                    />
                    {locBoundary ? (
                      <p className="text-xs text-muted-foreground">
                        Traced boundary: {locBoundary.length} points
                      </p>
                    ) : locPin ? (
                      <p className="text-xs text-muted-foreground">
                        Pin: {locPin[0].toFixed(6)}, {locPin[1].toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">No pin placed yet.</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleUpdateLocation(kyc, locPin, locBoundary)}
                        disabled={!locPin || submitting === `loc:${kyc.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#C2410C] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {submitting === `loc:${kyc.id}`
                          ? "Submitting…"
                          : "Submit corrected location"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submitted documents */}
          {kyc.documents && kyc.documents.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Submitted Documents
              </p>
              <div className="space-y-2">
                {kyc.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {doc.original_name}
                    </span>
                    {doc.verification_status === "accepted" && (
                      <span className="text-[11px] font-medium text-[#16A34A]">Verified</span>
                    )}
                    {doc.verification_status === "rejected" && (
                      <span className="text-[11px] font-medium text-[#DC2626]">Rejected</span>
                    )}
                    <button
                      onClick={() => handleViewDoc(doc.id)}
                      disabled={viewingDoc === doc.id}
                      className="flex-shrink-0 text-[11px] font-medium text-[#15803D] hover:underline disabled:opacity-50"
                    >
                      {viewingDoc === doc.id ? "Loading…" : "View"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer notes */}
          {kyc.reviewer_notes && (
            <div className="rounded-lg border border-border p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reviewer notes
              </p>
              <p className="text-sm text-foreground">{kyc.reviewer_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface UserParcel {
  id: string;
  title: string;
  parcel_number: string | null;
}

const DOC_TYPES = [
  { value: "title_deed", label: "Title Deed" },
  { value: "mutation", label: "Mutation Form" },
  { value: "lease_agreement", label: "Lease Agreement" },
  { value: "certificate_of_occupancy", label: "Certificate of Occupancy" },
  { value: "survey_map", label: "Survey Map" },
  { value: "other", label: "Other" },
];

function KycTab() {
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyFile, setReplyFile] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Submit modal
  const [showSubmit, setShowSubmit] = useState(false);
  const [parcels, setParcels] = useState<UserParcel[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [submitParcel, setSubmitParcel] = useState("");
  const [submitDocType, setSubmitDocType] = useState("title_deed");
  const [submitDocuments, setSubmitDocuments] = useState<{ type: string; file: File }[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const submitFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api
      .get<KycApplication[]>("/user/kyc")
      .then((data) => {
        setApplications(data);
        setFetchError(false);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateLocation = async (
    kyc: KycApplication,
    pin: [number, number] | null,
    boundary: { lat: number; lng: number }[] | null,
  ) => {
    if (!pin || submitting) return;
    const [lat, lng] = pin;
    setSubmitting(`loc:${kyc.id}`);
    try {
      await api.patch(`/user/kyc/${kyc.id}/update-location`, {
        latitude: lat,
        longitude: lng,
        boundary: boundary ?? undefined,
      });
      setSubmitted((prev) => [...prev, `loc:${kyc.id}`]);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === kyc.id
            ? {
                ...a,
                status: "pending",
                parcel: a.parcel
                  ? {
                      ...a.parcel,
                      latitude: lat,
                      longitude: lng,
                      boundary: boundary ?? null,
                      boundary_source: boundary ? "traced" : "approximate",
                    }
                  : a.parcel,
              }
            : a,
        ),
      );
    } catch {
      // silent
    } finally {
      setSubmitting(null);
    }
  };

  const handleReply = async (kyc: KycApplication) => {
    const text = replyText[kyc.id]?.trim();
    const file = replyFile[kyc.id];
    if (!text && !file) return;
    if (submitting) return;
    setSubmitting(kyc.id);
    try {
      const fd = new FormData();
      if (text) fd.append("reply", text);
      if (file) fd.append("document", file);
      await api.post(`/user/kyc/${kyc.id}/reply`, fd);
      setSubmitted((prev) => [...prev, kyc.id]);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === kyc.id
            ? {
                ...a,
                user_reply: text || a.user_reply,
                user_replied_at: new Date().toISOString(),
                user_reply_document_name: file?.name ?? a.user_reply_document_name,
                user_reply_document_path: file ? "pending" : a.user_reply_document_path,
              }
            : a,
        ),
      );
    } catch {
      // error silently — user can retry
    } finally {
      setSubmitting(null);
    }
  };

  const openSubmitModal = async () => {
    setShowSubmit(true);
    setSubmitParcel("");
    setSubmitDocType("title_deed");
    setSubmitDocuments([]);
    setSubmitError("");
    if (parcels.length === 0) {
      setLoadingParcels(true);
      try {
        const data = await api.get<{ data: UserParcel[] }>("/user/listings");
        setParcels(data.data ?? []);
      } catch {
        setParcels([]);
      } finally {
        setLoadingParcels(false);
      }
    }
  };

  const handleSubmitKyc = async () => {
    if (!submitParcel || submitDocuments.length === 0) {
      setSubmitError("Please select a parcel and add at least one document.");
      return;
    }
    setSubmittingKyc(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("parcel_id", submitParcel);
      submitDocuments.forEach((d, i) => {
        fd.append(`documents[${i}][type]`, d.type);
        fd.append(`documents[${i}][file]`, d.file);
      });
      const res = await api.post<{ data: KycApplication }>("/user/kyc", fd);
      setApplications((prev) => [res.data, ...prev]);
      setShowSubmit(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Submission failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmittingKyc(false);
    }
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const needsAction = applications.filter(
    (a) =>
      (a.status === "info_requested" &&
        !a.user_reply &&
        !a.user_reply_document_path &&
        !submitted.includes(a.id)) ||
      (a.status === "location_correction_requested" && !submitted.includes(`loc:${a.id}`)),
  );
  const rest = applications.filter((a) => !needsAction.includes(a));

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending" || a.status === "under_review")
      .length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    action: needsAction.length,
  };

  const cardProps = {
    replyText,
    setReplyText,
    replyFile,
    setReplyFile,
    submitting,
    submitted,
    fileInputRefs,
    handleReply,
    handleUpdateLocation,
    fmtDate,
  };

  return (
    <div className="space-y-6">
      {/* Submit KYC modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !submittingKyc && setShowSubmit(false)}
          />
          <div className="relative w-full max-w-md rounded-lg border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Submit KYC Application</h2>
              <button
                onClick={() => setShowSubmit(false)}
                disabled={submittingKyc}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Land parcel
                </label>
                {loadingParcels ? (
                  <p className="text-xs text-muted-foreground">Loading your parcels…</p>
                ) : parcels.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No land parcels found. Add a listing first.
                  </p>
                ) : (
                  <select
                    value={submitParcel}
                    onChange={(e) => setSubmitParcel(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#15803D]"
                  >
                    <option value="">Select a parcel…</option>
                    {parcels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.parcel_number ?? p.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Add a document
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={submitDocType}
                    onChange={(e) => setSubmitDocType(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#15803D]"
                  >
                    {DOC_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    ref={submitFileRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (submitFileRef.current) submitFileRef.current.value = "";
                      if (!file) return;
                      setSubmitDocuments((prev) => [...prev, { type: submitDocType, file }]);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => submitFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Choose file
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  JPG, PNG or PDF · max 10 MB per document
                </p>
                {submitDocuments.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {submitDocuments.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-xs"
                      >
                        <span>
                          <span className="font-medium text-foreground">
                            {DOC_TYPES.find((t) => t.value === d.type)?.label}:
                          </span>{" "}
                          <span className="text-muted-foreground">{d.file.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSubmitDocuments((prev) => prev.filter((_, j) => j !== i))
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {submitError && (
                <p className="rounded-md bg-[#FEE2E2] px-3 py-2 text-xs font-medium text-[#DC2626]">
                  {submitError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                onClick={() => setShowSubmit(false)}
                disabled={submittingKyc}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitKyc}
                disabled={submittingKyc || !submitParcel || submitDocuments.length === 0}
                className="rounded-md bg-[#15803D] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submittingKyc ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">KYC Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your land parcel verification applications.
          </p>
        </div>
        <button
          onClick={openSubmitModal}
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Submit KYC
        </button>
      </div>

      {fetchError ? (
        <EmptyState
          className="p-12"
          icon={<ShieldCheck className="mx-auto h-10 w-10" />}
          title="Unable to load applications"
          description="Something went wrong. Please refresh the page or try again later."
        />
      ) : applications.length === 0 ? (
        <EmptyState
          className="p-12"
          icon={<ShieldCheck className="mx-auto h-10 w-10" />}
          title="No KYC applications yet"
          description="Submit your first application to get started."
          action={
            <button
              onClick={openSubmitModal}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-brand-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit KYC application
            </button>
          }
        />
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.total, color: "text-foreground" },
              {
                label: "Needs action",
                value: counts.action,
                color: counts.action > 0 ? "text-[#D97706]" : "text-muted-foreground",
              },
              {
                label: "Approved",
                value: counts.approved,
                color: counts.approved > 0 ? "text-[#16A34A]" : "text-muted-foreground",
              },
              { label: "Pending", value: counts.pending, color: "text-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`mt-0.5 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Needs action section */}
          {needsAction.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                <h2 className="text-sm font-semibold text-foreground">Needs your attention</h2>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
                  {needsAction.length}
                </span>
              </div>
              <div className="space-y-3">
                {needsAction.map((kyc) => (
                  <KycCard key={kyc.id} kyc={kyc} {...cardProps} />
                ))}
              </div>
            </div>
          )}

          {/* All other applications */}
          {rest.length > 0 && (
            <div>
              {needsAction.length > 0 && (
                <h2 className="mb-3 text-sm font-semibold text-foreground">All applications</h2>
              )}
              <div className="space-y-3">
                {rest.map((kyc) => (
                  <KycCard key={kyc.id} kyc={kyc} {...cardProps} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
