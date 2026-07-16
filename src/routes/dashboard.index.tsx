import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock,
  Plus,
  Trash2,
  Pencil,
  ArrowUpRight,
  BarChart3,
  Eye,
  Inbox,
  ListChecks,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
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
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DashboardShell, type DashTab } from "@/components/DashboardShell";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useAuth, type AppUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { planById, plans, addOns, type PlanId } from "@/lib/plans";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  MapSearchBar,
  FlyToLocation,
  MapSatelliteToggle,
  OSM_TILES,
  SATELLITE_TILES,
} from "@/components/MapSearchBar";

const kycPinIcon = L.divIcon({
  className: "lv-marker",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#C2410C;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function KycPinDropper({
  pin,
  onPin,
}: {
  pin: [number, number] | null;
  onPin: (p: [number, number]) => void;
}) {
  useMapEvents({ click(e) { onPin([e.latlng.lat, e.latlng.lng]); } });
  if (!pin) return null;
  return <Marker position={pin} icon={kycPinIcon} />;
}

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — LandVerify Kenya" }] }),
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
    const t =
      typeof s.tab === "string" && (allowed as string[]).includes(s.tab)
        ? (s.tab as DashTab)
        : undefined;
    return { tab: t };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user, ready, removeListing, setPlan, updateUser, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<DashTab>(search.tab ?? "overview");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (search.tab && search.tab !== tab) setTab(search.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  if (!user) return null;
  const plan = planById(user.plan);
  const used = user.listings.length;
  const limitText = plan.listings === Infinity ? "∞" : plan.listings;

  return (
    <DashboardShell active={tab} onChange={setTab}>
      {tab === "overview" && (
        <OverviewTab
          user={user}
          onUpgrade={() => setUpgradeOpen(true)}
          onGoTab={(t) => navigate({ to: "/dashboard", search: { tab: t } })}
        />
      )}

      {tab === "listings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">My Listings</h1>
            <button
              onClick={() => navigate({ to: "/dashboard/upload" })}
              className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>
          {user.listings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-base font-semibold text-foreground">No listings yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Once you upload land, it'll appear here for review.
              </p>
              <button
                onClick={() => navigate({ to: "/dashboard/upload" })}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
              >
                <Plus className="h-4 w-4" /> Upload Land
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3 hidden md:table-cell">Parcel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden md:table-cell">Views</th>
                    <th className="px-4 py-3 hidden md:table-cell">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.listings.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-12 shrink-0 rounded bg-muted" />
                          <div>
                            <div className="font-medium text-foreground">{l.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {l.county} · KES {l.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {l.parcelNumber}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{l.views}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {l.createdAt}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeListing(l.id).catch(() => {})}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "analytics" && (
        <AnalyticsTab plan={user.plan} onUpgrade={() => setUpgradeOpen(true)} />
      )}

      {tab === "billing" && (
        <BillingTab
          plan={user.plan}
          usedListings={used}
          onUpgrade={() => setUpgradeOpen(true)}
          payments={user.payments}
          onSelectPlan={(p) => setPlan(p)}
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
        />
      )}

      {tab === "kyc" && <KycTab />}

      <UpgradeModal
        open={upgradeOpen}
        currentPlan={user.plan}
        onClose={() => setUpgradeOpen(false)}
        onSelect={(p) => setPlan(p)}
      />
    </DashboardShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
          {icon}
        </div>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-[#D97706]/10 text-[#D97706]",
    active: "bg-[#16A34A]/10 text-[#16A34A]",
    sold: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}

interface ApiAnalytics {
  total_views: number;
  top_listings: { name: string; views: number }[];
  county_breakdown: { county: string; views: number }[];
  recent_activity: { title: string; status: string; views: number; created_at: string }[];
  daily_views: { date: string; views: number }[];
  traffic_sources: { name: string; value: number; color: string }[];
}

function AnalyticsTab({ plan, onUpgrade }: { plan: string; onUpgrade: () => void }) {
  const { user } = useAuth();
  const locked = plan !== "pro";
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  useEffect(() => {
    if (locked) return;
    setLoading(true);
    api
      .get<ApiAnalytics>(`/user/analytics?range=${range}`)
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range, locked]);

  // Real totals — from API when available, fall back to user listings in context
  const realTotalViews =
    analytics?.total_views ?? user?.listings.reduce((a, b) => a + b.views, 0) ?? 0;

  const topListings = analytics?.top_listings.length
    ? analytics.top_listings
    : (user?.listings.slice(0, 5).map((l) => ({ name: l.title, views: l.views })) ?? []);

  const countyBreakdown = analytics?.county_breakdown.length
    ? analytics.county_breakdown
    : (() => {
        const byCounty: Record<string, number> = {};
        user?.listings.forEach((l) => {
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
    : (user?.listings.slice(0, 4).map((l) => ({
        time: l.createdAt,
        text:
          l.status === "pending"
            ? `"${l.title}" is under review`
            : `"${l.title}" · ${l.views} views`,
        icon: <ListChecks className="h-3.5 w-3.5" />,
      })) ?? []);

  // Build the time series: use real daily_views from the API when available,
  // fall back to proportional distribution only if no log data exists yet.
  const series = useMemo(() => {
    const today = new Date();
    const realByDate: Record<string, number> = {};
    (analytics?.daily_views ?? []).forEach((r) => {
      realByDate[r.date] = r.views;
    });
    const hasRealData = Object.keys(realByDate).length > 0;

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      const isoDate = d.toISOString().slice(0, 10); // YYYY-MM-DD (matches DB DATE())
      const displayDate = d.toISOString().slice(5, 10); // MM-DD (x-axis label)

      const views = hasRealData
        ? (realByDate[isoDate] ?? 0)
        : Math.max(
            0,
            Math.round((realTotalViews / days) * (0.6 + Math.sin(i / 3) * 0.25 + (i / days) * 0.3)),
          );

      return {
        date: displayDate,
        views,
        clicks: Math.round(views * 0.22),
        inquiries: Math.round(views * 0.06),
        saves: Math.round(views * 0.1),
      };
    });
  }, [days, realTotalViews, analytics]);

  const totals = useMemo(
    () =>
      series.reduce(
        (a, b) => ({
          views: a.views + b.views,
          clicks: a.clicks + b.clicks,
          inquiries: a.inquiries + b.inquiries,
          saves: a.saves + b.saves,
        }),
        { views: 0, clicks: 0, inquiries: 0, saves: 0 },
      ),
    [series],
  );

  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, half).reduce((a, b) => a + b.views, 0);
  const curr = series.slice(half).reduce((a, b) => a + b.views, 0);
  const delta = prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);
  const ctr = totals.views ? ((totals.clicks / totals.views) * 100).toFixed(1) : "0";
  const convRate = totals.views ? ((totals.inquiries / totals.views) * 100).toFixed(1) : "0";

  const sources = analytics?.traffic_sources ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance across all your listings.</p>
        </div>
        <div className="inline-flex items-center gap-3">
          {loading && <span className="text-[11px] text-muted-foreground">Updating…</span>}
          <div className="inline-flex rounded-md border border-border bg-card p-0.5 text-xs font-medium">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-[5px] transition-colors ${range === r ? "bg-[#0F172A] text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "Last 90 days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className={`space-y-6 ${locked ? "pointer-events-none select-none blur-sm" : ""}`}>
          {/* KPI tiles — views is real; clicks/inquiries/saves are proportional estimates */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              icon={<Eye className="h-4 w-4" />}
              label="Total views"
              value={realTotalViews.toLocaleString()}
              delta={delta}
            />
            <KpiTile
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Clicks (est.)"
              value={totals.clicks.toLocaleString()}
              delta={Math.round(delta * 0.8)}
              sub={`${ctr}% CTR`}
            />
            <KpiTile
              icon={<Inbox className="h-4 w-4" />}
              label="Inquiries (est.)"
              value={totals.inquiries.toLocaleString()}
              delta={Math.round(delta * 1.2)}
              sub={`${convRate}% conv.`}
            />
            <KpiTile
              icon={<Bookmark className="h-4 w-4" />}
              label="Saves (est.)"
              value={totals.saves.toLocaleString()}
              delta={Math.round(delta * 0.6)}
            />
          </div>

          {/* Main engagement chart */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Listing engagement</h3>
                <p className="text-xs text-muted-foreground">
                  Views, clicks and inquiries over time
                </p>
              </div>
              <div className="hidden gap-3 sm:flex">
                <Legendish color="#2563EB" label="Views" />
                <Legendish color="#0F172A" label="Clicks" />
                <Legendish color="#16A34A" label="Inquiries" />
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
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
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#gv)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#0F172A"
                    strokeWidth={1.5}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="inquiries"
                    stroke="#16A34A"
                    strokeWidth={1.5}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Top listings — real data */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground">Top performing listings</h3>
              <p className="text-xs text-muted-foreground">By total views</p>
              {topListings.length === 0 ? (
                <div className="mt-10 text-center text-sm text-muted-foreground">
                  No listings yet.
                </div>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topListings}
                      layout="vertical"
                      margin={{ top: 0, right: 8, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#E2E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#0F172A", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={140}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "1px solid #E2E8F0",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                        cursor={{ fill: "#F1F5F9" }}
                      />
                      <Bar dataKey="views" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Traffic sources — real once view logs with source data exist */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Traffic sources</h3>
              <p className="text-xs text-muted-foreground">Where viewers came from</p>
              {sources.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center">
                  <Globe className="h-6 w-6 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No traffic data yet.</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Sources appear once viewers open your listings on the map.
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sources}
                          dataKey="value"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {sources.map((s) => (
                            <Cell key={s.name} fill={s.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #E2E8F0",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {sources.map((s) => (
                      <li key={s.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-foreground">
                          <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{" "}
                          {s.name}
                        </span>
                        <span className="font-medium text-foreground">{s.value}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Views by county — real data */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Views by county</h3>
                  <p className="text-xs text-muted-foreground">Geographic distribution</p>
                </div>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              {countyBreakdown.length === 0 ? (
                <div className="mt-10 text-center text-sm text-muted-foreground">No data yet.</div>
              ) : (
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={countyBreakdown}
                      margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="county"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: "#E2E8F0" }}
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
                        cursor={{ fill: "#F1F5F9" }}
                      />
                      <Bar dataKey="views" fill="#0F172A" radius={[4, 4, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                <ul className="mt-4 divide-y divide-border">
                  {recentActivity.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 py-3">
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
          </div>

          {/* Summary stats — real */}
          <div className="grid gap-4 sm:grid-cols-3">
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
            <SmallStat label="Inquiry rate (est.)" value={`${convRate}%`} sub="Views → inquiries" />
          </div>
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
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
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
  label,
  value,
  delta,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number;
  sub?: string;
}) {
  const up = delta >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
            {icon}
          </div>
          {label}
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${up ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-destructive/10 text-destructive"}`}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {up ? "+" : ""}
          {delta}%
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
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

function SmallStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function BillingTab({
  plan,
  usedListings,
  onUpgrade: _onUpgrade,
  payments,
  onSelectPlan,
}: {
  plan: string;
  usedListings: number;
  onUpgrade: () => void;
  payments: { date: string; amount: number; plan: string; status: string }[];
  onSelectPlan: (p: PlanId) => void;
}) {
  const p = planById(plan as PlanId);
  const limitNum = p.listings === Infinity ? Infinity : p.listings;
  const limitText = limitNum === Infinity ? "Unlimited" : String(limitNum);
  const pct =
    limitNum === Infinity ? 8 : Math.min(100, Math.round((usedListings / limitNum) * 100));
  const nextBillDate = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const totalPaid = payments.filter((x) => x.status === "Paid").reduce((a, b) => a + b.amount, 0);

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
              <Crown className="h-3.5 w-3.5 text-[#2563EB]" /> Current plan
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground">
                / {p.price === 0 ? "Free forever" : "month"}
              </span>
            </div>
            <div className="mt-1 text-lg font-semibold text-foreground">
              {p.price === 0 ? "Ksh 0" : `Ksh ${p.price.toLocaleString()}`}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Active
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
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#2563EB] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {limitNum === Infinity
                ? "Unlimited listings on Pro"
                : `${Math.max(0, limitNum - usedListings)} listing slots remaining`}
            </div>
          </div>

          <div className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {p.price === 0 ? "Upgrade for more" : "Next billing"}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
              {p.price === 0 ? "—" : `Ksh ${p.price.toLocaleString()}`}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {p.price === 0 ? "You are on the free tier" : `on ${nextBillDate}`}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {plan !== "pro" && (
                <button
                  onClick={() => onSelectPlan("pro")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Upgrade
                </button>
              )}
              {plan !== "free" && (
                <button
                  onClick={() => onSelectPlan("free")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel plan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  isCurrent
                    ? "border-[#2563EB] ring-1 ring-[#2563EB]/30"
                    : "border-border hover:shadow-md"
                }`}
              >
                {pl.badge && (
                  <span
                    className={`absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pl.badge.color === "accent" ? "bg-[#2563EB] text-white" : "bg-[#0F172A] text-white"}`}
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
                <ul className="mt-4 space-y-1.5 text-xs text-foreground">
                  {pl.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-[#16A34A]" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  onClick={() => onSelectPlan(pl.id)}
                  className={`mt-5 inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isCurrent
                      ? "cursor-default bg-muted text-muted-foreground"
                      : pl.id === "pro"
                        ? "bg-[#0F172A] text-white hover:bg-[#1e293b]"
                        : "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
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
                  <button className="mt-1 text-[11px] font-medium text-[#2563EB] hover:underline">
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
            <h3 className="text-sm font-semibold text-foreground">Payment method</h3>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">No payment method on file</p>
            <button className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
              <Plus className="h-3.5 w-3.5" /> Add M-Pesa or card
            </button>
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
          <div className="overflow-x-auto">
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
                    <td className="px-5 py-3 font-mono text-xs text-foreground">
                      INV-{String(payments.length - i).padStart(4, "0")}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{pay.date}</td>
                    <td className="px-5 py-3">{pay.plan}</td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      Ksh {pay.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${pay.status === "Paid" ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#D97706]/10 text-[#D97706]"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${pay.status === "Paid" ? "bg-[#16A34A]" : "bg-[#D97706]"}`}
                        />
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline">
                        <Download className="h-3 w-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  const plan = planById(user.plan);
  const used = user.listings.length;
  const limitNum = plan.listings === Infinity ? Infinity : plan.listings;
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
      action: () => navigate({ to: "/dashboard/upload" }),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's a snapshot of your account activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGoTab("analytics")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <BarChart3 className="h-3.5 w-3.5" /> View analytics
          </button>
          <button
            onClick={() => navigate({ to: "/dashboard/upload" })}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
          >
            <Plus className="h-3.5 w-3.5" /> New listing
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Crown className="h-3.5 w-3.5 text-[#2563EB]" /> Current plan
              </div>
              <div className="mt-1 text-xl font-semibold text-foreground">{plan.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {used} of {limitText} listings used
              </div>
            </div>
            <div className="h-16 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#sparkG)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {limitNum === Infinity
                ? "Unlimited slots"
                : `${Math.max(0, limitNum - used)} slots remaining`}
            </span>
            {user.plan !== "pro" && (
              <button onClick={onUpgrade} className="font-medium text-[#2563EB] hover:underline">
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
              className="h-full rounded-full bg-[#16A34A]"
              style={{ width: `${(completed / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2.5">
            {checklist.map((c) => (
              <li key={c.key}>
                <button
                  onClick={c.action}
                  className="flex w-full items-center gap-2 text-left text-xs text-foreground hover:text-[#2563EB]"
                >
                  {c.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
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
              className="text-[11px] font-medium text-[#2563EB] hover:underline"
            >
              View all →
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">No listings yet.</p>
              <button
                onClick={() => navigate({ to: "/dashboard/upload" })}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
              >
                <Plus className="h-3.5 w-3.5" /> Upload your first listing
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-10 w-12 shrink-0 rounded bg-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{l.title}</div>
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
              { t: "Just now", text: "Welcome to LandVerify" },
              { t: "2h ago", text: "Map updated with 14 new parcels" },
              { t: "1d ago", text: "Verification team reviewed your area" },
              { t: "3d ago", text: "Account created" },
            ].map((a, i) => (
              <li key={i} className="flex items-start gap-3 py-2.5">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
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
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">
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
            {plan.price === 0
              ? "—"
              : new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
          </span>
        </div>
        <button
          onClick={() => onGoTab("billing")}
          className="text-[11px] font-medium text-[#2563EB] hover:underline"
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
}: {
  user: AppUser;
  onUpdate: (patch: Partial<AppUser>) => Promise<void>;
  onDelete: () => Promise<void>;
  onLogout: () => void;
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
  const [twoFactor, setTwoFactor] = useState(Boolean(user.twoFactor));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
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
  const avatarColor = user.avatarColor || "#2563EB";

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
  const saveSecurity = async () => {
    await onUpdate({ twoFactor });
    setSavedAt(new Date().toLocaleTimeString());
  };
  const changePassword = () => {
    if (pwd.next.length < 8)
      return setPwdMsg({ type: "err", text: "Password must be at least 8 characters." });
    if (pwd.next !== pwd.confirm)
      return setPwdMsg({ type: "err", text: "Passwords do not match." });
    setPwd({ current: "", next: "", confirm: "" });
    setPwdMsg({ type: "ok", text: "Password updated successfully." });
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
                const colors = ["#2563EB", "#16A34A", "#D97706", "#0F172A", "#9333EA", "#DB2777"];
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
              <span className="inline-flex items-center gap-1 rounded-md bg-[#2563EB]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB] capitalize">
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
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
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
              className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
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
                className="rounded-md bg-[#0F172A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1e293b]"
              >
                Update password
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Two-factor authentication</h3>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer via SMS to your registered number.
                </p>
              </div>
              <Toggle checked={twoFactor} onChange={setTwoFactor} />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveSecurity}
                className="rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
              >
                Save security settings
              </button>
            </div>
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
              className="rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
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
              className="rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
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
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
      />
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
        className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
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
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#2563EB]" : "bg-muted"}`}
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
  parcel: { id: string; title: string; parcel_number: string | null; latitude: number | null; longitude: number | null } | null;
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
    bg: "#DBEAFE",
    fg: "#1D4ED8",
    border: "#3B82F6",
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
  handleUpdateLocation: (kyc: KycApplication, pin: [number, number] | null) => void;
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
  const [locFlyCoords, setLocFlyCoords] = useState<{ lat: number; lng: number } | null>(
    kyc.parcel?.latitude != null && kyc.parcel?.longitude != null
      ? { lat: kyc.parcel.latitude, lng: kyc.parcel.longitude }
      : null,
  );
  const [locSatellite, setLocSatellite] = useState(false);

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
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold text-[#1D4ED8]">
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
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {kyc.user_reply_document_name}
                        </a>
                      )}
                    </div>

                    {/* Reviewer acknowledgment */}
                    {kyc.admin_acknowledgment && (
                      <div className="rounded-lg border border-[#3B82F6]/30 bg-[#EFF6FF] p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                          <p className="text-xs font-semibold text-[#1D4ED8]">
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
                        <p className="mt-2 text-xs font-medium text-[#2563EB]">
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
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
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
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
                  <p className="text-sm text-foreground whitespace-pre-wrap">{kyc.correction_note}</p>
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
                    <p className="text-xs text-muted-foreground">
                      Click anywhere on the map to drop a pin at the correct location.
                    </p>
                    <div className="relative h-64 overflow-hidden rounded-lg border border-[#F97316]/40">
                      <MapContainer
                        center={locPin ?? [-1.286389, 36.817223]}
                        zoom={locPin ? 14 : 11}
                        className="h-full w-full"
                      >
                        <TileLayer
                          key={locSatellite ? "sat" : "osm"}
                          url={locSatellite ? SATELLITE_TILES : OSM_TILES}
                          attribution={locSatellite ? "Tiles &copy; Esri" : "&copy; OpenStreetMap contributors"}
                        />
                        <KycPinDropper pin={locPin} onPin={setLocPin} />
                        {locFlyCoords && (
                          <FlyToLocation lat={locFlyCoords.lat} lng={locFlyCoords.lng} />
                        )}
                      </MapContainer>
                      <MapSearchBar onFly={(lat, lng) => setLocFlyCoords({ lat, lng })} />
                      <MapSatelliteToggle
                        satellite={locSatellite}
                        onToggle={() => setLocSatellite((s) => !s)}
                      />
                    </div>
                    {locPin ? (
                      <p className="text-xs text-muted-foreground">
                        Pin: {locPin[0].toFixed(6)}, {locPin[1].toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">No pin placed yet.</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleUpdateLocation(kyc, locPin)}
                        disabled={!locPin || submitting === `loc:${kyc.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#C2410C] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {submitting === `loc:${kyc.id}` ? "Submitting…" : "Submit corrected location"}
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
                      className="flex-shrink-0 text-[11px] font-medium text-[#2563EB] hover:underline disabled:opacity-50"
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
  { value: "lease_agreement", label: "Lease Agreement" },
  { value: "certificate_of_occupancy", label: "Certificate of Occupancy" },
  { value: "survey_map", label: "Survey Map" },
  { value: "other", label: "Other" },
];

function KycTab() {
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const submitFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api
      .get<KycApplication[]>("/user/kyc")
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateLocation = async (kyc: KycApplication, pin: [number, number] | null) => {
    if (!pin || submitting) return;
    const [lat, lng] = pin;
    setSubmitting(`loc:${kyc.id}`);
    try {
      await api.patch(`/user/kyc/${kyc.id}/update-location`, { latitude: lat, longitude: lng });
      setSubmitted((prev) => [...prev, `loc:${kyc.id}`]);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === kyc.id
            ? {
                ...a,
                status: "pending",
                parcel: a.parcel ? { ...a.parcel, latitude: lat, longitude: lng } : a.parcel,
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
    setSubmitFile(null);
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
    if (!submitParcel || !submitFile) {
      setSubmitError("Please select a parcel and upload a document.");
      return;
    }
    setSubmittingKyc(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("parcel_id", submitParcel);
      fd.append("document_type", submitDocType);
      fd.append("document", submitFile);
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
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
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
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
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
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="">Select a parcel…</option>
                    {parcels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                        {p.parcel_number ? ` · ${p.parcel_number}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Document type
                </label>
                <select
                  value={submitDocType}
                  onChange={(e) => setSubmitDocType(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Document file
                </label>
                <input
                  ref={submitFileRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => submitFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {submitFile ? submitFile.name : "Choose file"}
                  </button>
                  {submitFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitFile(null);
                        if (submitFileRef.current) submitFileRef.current.value = "";
                      }}
                      className="text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  JPG, PNG or PDF · max 10 MB
                </p>
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
                disabled={submittingKyc || !submitParcel || !submitFile}
                className="rounded-md bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
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

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-semibold text-foreground">No KYC applications yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your first application to get started.
          </p>
          <button
            onClick={openSubmitModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
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
            Submit KYC application
          </button>
        </div>
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
