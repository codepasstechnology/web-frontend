import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  Calendar as CalendarIcon,
  ChevronRight,
  Download,
  Eye,
  Inbox,
  Lock,
  Monitor,
  Printer,
  Smartphone,
  Sparkles,
  Tablet,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";
import type { DashTab } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { usePlans } from "@/lib/plans";
import { ListingThumb, StatusChip, type ChipKind } from "@/components/dashboard/parts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

type Metric = "views" | "saves" | "inquiries";
type Point = { iso: string; date: string; views: number; saves: number; inquiries: number };

const DAY_FULL_NAMES: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const RANGES = [
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
] as const;

const pctChange = (prev: number, curr: number) =>
  prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

/** Kenya's outline in the same projection as `project` below (viewBox 0 30 860 990). */
const KENYA_OUTLINE =
  "M25 630L35 510L90 410L130 330L120 230L70 160L30 110L160 30L220 70L310 90L440 170L580 190L710 130L820 130L730 250L730 620L790 700L730 730L650 810L590 890L550 1000L400 835Z";
const project = (lat: number, lng: number) => ({ x: (lng - 33.7) * 100, y: (5.3 - lat) * 100 });

function Delta({ value, label }: { value: number; label?: string }) {
  const up = value >= 0;
  return (
    <span className="gd-delta" data-up={up}>
      <span className="gd-dar">
        {up ? (
          <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <ArrowDownRight size={13} strokeWidth={2.4} aria-hidden="true" />
        )}
      </span>
      {up ? "+" : "−"}
      {Math.abs(value)}%
      {label && <span className="font-normal text-muted-foreground">vs {label}</span>}
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map(
    (v, i) =>
      `${((i / (data.length - 1)) * 80 + 2).toFixed(1)} ${(32 - (v / max) * 26).toFixed(1)}`,
  );
  const line = `M${pts.join("L")}`;
  return (
    <svg width="84" height="36" viewBox="0 0 84 36" className="shrink-0" aria-hidden="true">
      <path d={`${line}L82 34L2 34Z`} fill="var(--chart-fill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KpiTile({
  icon,
  label,
  value,
  delta,
  periodLabel,
  spark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number;
  periodLabel: string;
  spark: number[];
}) {
  return (
    <div className="gd-card gd-kpi">
      <div className="flex items-start justify-between gap-2">
        <span className="flex flex-col gap-1.5">
          <span className="gd-eyebrow flex items-center gap-1.5">
            <span className="gd-kico">{icon}</span>
            {label}
          </span>
          <span className="gd-big2">{value}</span>
        </span>
        <Sparkline data={spark} />
      </div>
      <Delta value={delta} label={periodLabel} />
    </div>
  );
}

function Section({
  title,
  sub,
  className = "",
  children,
}: {
  title: string;
  sub: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`gd-card gd-chart ${className}`}>
      <div className="gd-ch">
        <h2 className="gd-h2">{title}</h2>
        <span className="gd-cs">{sub}</span>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Bar({ pct, height = 8 }: { pct: number; height?: number }) {
  return (
    <div className="gd-bar" style={{ height }}>
      <span style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  metric: Metric;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="flex flex-col gap-0.5 whitespace-nowrap rounded-[10px] border border-border bg-surface-2 px-[11px] py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,.14)]">
      <span className="text-xs text-muted-foreground">{p.iso}</span>
      <span className="font-bold">
        {p[metric].toLocaleString()} {metric}
      </span>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <>
      <div className="gd-kpis">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="gd-skel h-[132px] rounded-[22px]" />
        ))}
      </div>
      <div className="gd-g21">
        <div className="gd-skel h-[360px] rounded-[22px]" />
        <div className="gd-skel h-[360px] rounded-[22px]" />
      </div>
    </>
  );
}

export function AnalyticsTab({
  onUpgrade,
  onGoTab,
}: {
  onUpgrade: () => void;
  onGoTab: (t: DashTab) => void;
}) {
  const { user } = useAuth();
  const { data: plans = [] } = usePlans();
  const locked = !user?.analyticsAccess;
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const [draft, setDraft] = useState({ from: "", to: "" });
  const [calOpen, setCalOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string>("all");
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState<Metric>("views");
  const [asTable, setAsTable] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const days = custom
    ? differenceInCalendarDays(new Date(custom.to), new Date(custom.from)) + 1
    : range === "7d"
      ? 7
      : range === "30d"
        ? 30
        : 90;

  useEffect(() => {
    if (locked) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (custom) {
      params.set("from", custom.from);
      params.set("to", custom.to);
    } else {
      params.set("range", range);
    }
    if (selectedListingId !== "all") params.set("parcel_id", selectedListingId);

    api
      .get<ApiAnalytics>(`/user/analytics?${params.toString()}`)
      .then(setAnalytics)
      .catch(() => toast.error("Couldn't load your analytics. Try again."))
      .finally(() => setLoading(false));
  }, [range, custom, selectedListingId, locked]);

  const visibleListings = (user?.listings ?? []).filter(
    (l) => selectedListingId === "all" || l.id === selectedListingId,
  );
  const topListingRows = [...visibleListings].sort((a, b) => b.views - a.views).slice(0, 5);
  const statsById = new Map((analytics?.top_listings ?? []).map((t) => [t.id, t]));

  const series = useMemo<Point[]>(() => {
    if (!analytics) return [];
    const endDate = custom ? new Date(custom.to) : new Date();
    const byDate = <K extends string>(rows: ({ date: string } & Record<K, number>)[], key: K) =>
      new Map(rows.map((r) => [r.date, r[key]]));
    const v = byDate(analytics.daily_views, "views");
    const s = byDate(analytics.daily_saves, "saves");
    const q = byDate(analytics.daily_inquiries, "inquiries");
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - (days - 1 - i));
      const iso = d.toISOString().slice(0, 10);
      return {
        iso,
        date: iso.slice(5),
        views: v.get(iso) ?? 0,
        saves: s.get(iso) ?? 0,
        inquiries: q.get(iso) ?? 0,
      };
    });
  }, [days, analytics, custom]);

  const sum = (rows: Point[], k: Metric) => rows.reduce((a, b) => a + b[k], 0);
  const totals = {
    views: sum(series, "views"),
    saves: sum(series, "saves"),
    inquiries: sum(series, "inquiries"),
  };
  const half = Math.floor(series.length / 2);
  const first = series.slice(0, half);
  const second = series.slice(half);
  const deltaOf = (k: Metric) => pctChange(sum(first, k), sum(second, k));
  const rate = (rows: Point[]) => {
    const v = sum(rows, "views");
    return v ? sum(rows, "inquiries") / v : 0;
  };
  const convDelta = pctChange(rate(first), rate(second));
  const convRate = totals.views ? ((totals.inquiries / totals.views) * 100).toFixed(1) : "0";
  const periodLabel = custom ? "the previous period" : `previous ${days} days`;

  const countyBreakdown = analytics?.county_breakdown ?? [];
  const countyTotalViews = countyBreakdown.reduce((a, b) => a + b.views, 0);
  const topCounty = countyBreakdown[0];
  const peakActivity = analytics?.peak_activity ?? [];
  const peakMax = Math.max(1, ...peakActivity.map((d) => d.views));
  const peakDay = peakActivity.length
    ? peakActivity.reduce((a, b) => (b.views > a.views ? b : a))
    : null;
  const avgPriceByCounty = new Map(
    (analytics?.county_avg_prices ?? []).map((c) => [c.county, c.avg_price]),
  );
  const pricePositionRows = topListingRows.filter((l) => avgPriceByCounty.get(l.county));
  const devices = analytics?.device_breakdown ?? [];
  const sources = analytics?.traffic_sources ?? [];
  const mapPoints = analytics?.listing_points ?? [];
  const maxPoint = Math.max(1, ...mapPoints.map((p) => p.views));
  const proPrice = plans.find((p) => p.id === "pro")?.price;

  const chartMax = Math.max(1, ...series.map((p) => p[metric]));

  const activity = (analytics?.recent_activity ?? []).map((a) => {
    const [kind, label]: [ChipKind, string] =
      a.status === "pending"
        ? ["warn", "In review"]
        : a.status === "active" || a.status === "verified"
          ? ["ok", "Live"]
          : a.status === "sold"
            ? ["muted", "Sold"]
            : ["muted", a.status];
    const text =
      a.status === "pending"
        ? `"${a.title}" is under review`
        : a.status === "active" || a.status === "verified"
          ? `"${a.title}" is live · ${a.views.toLocaleString()} views`
          : a.status === "sold"
            ? `"${a.title}" was marked sold`
            : `"${a.title}"`;
    return { kind, label, text, time: a.created_at };
  });

  const handleExport = () => {
    const header = "Date,Views,Saves,Inquiries";
    const rows = series.map((s) => `${s.iso},${s.views},${s.saves},${s.inquiries}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geopin-analytics-${custom ? `${custom.from}_${custom.to}` : range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported your analytics as CSV.");
  };

  const applyCustom = () => {
    if (!draft.from || !draft.to || draft.from > draft.to) return;
    setCustom(draft);
    setCalOpen(false);
  };

  return (
    <>
      <div className="gd-r">
        <h1 className="gd-h1">Analytics</h1>
        <p className="gd-sub">
          Track performance, understand your audience, and grow your property business.
        </p>
      </div>

      <div className="gd-r gd-ctrls" role="toolbar" aria-label="Analytics filters">
        <select
          className="gd-input"
          style={{ width: 220, minHeight: 42 }}
          value={selectedListingId}
          onChange={(e) => setSelectedListingId(e.target.value)}
          aria-label="Listing"
          disabled={locked}
        >
          <option value="all">All properties</option>
          {(user?.listings ?? []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.parcelNumber}
            </option>
          ))}
        </select>
        <div className="gd-seg" role="group" aria-label="Date range">
          {RANGES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={!custom && range === id}
              onClick={() => {
                setRange(id);
                setCustom(null);
              }}
            >
              {label}
            </button>
          ))}
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <button type="button" aria-pressed={Boolean(custom)}>
                <CalendarIcon size={15} aria-hidden="true" />
                {custom
                  ? `${format(new Date(custom.from), "d MMM")} – ${format(new Date(custom.to), "d MMM")}`
                  : "Custom"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="gd-pop flex w-[290px] flex-col gap-2.5"
              style={{ padding: 16 }}
            >
              <span className="gd-eyebrow">Custom range</span>
              <label className="flex flex-col gap-1 text-[13.5px] font-semibold">
                From
                <input
                  className="gd-input"
                  style={{ minHeight: 42 }}
                  type="date"
                  max={draft.to || today}
                  value={draft.from}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-[13.5px] font-semibold">
                To
                <input
                  className="gd-input"
                  style={{ minHeight: 42 }}
                  type="date"
                  min={draft.from || undefined}
                  max={today}
                  value={draft.to}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                />
              </label>
              <button
                type="button"
                className="gd-btn gd-sm"
                onClick={applyCustom}
                disabled={!draft.from || !draft.to || draft.from > draft.to}
              >
                Apply
              </button>
            </PopoverContent>
          </Popover>
        </div>
        <span className="flex-1" />
        {loading && (
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="gd-spin" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Updating…
          </span>
        )}
        <button
          type="button"
          className="gd-btn gd-o gd-sm"
          onClick={handleExport}
          disabled={locked || series.length === 0}
        >
          <Download size={15} aria-hidden="true" /> Export
        </button>
        <button
          type="button"
          className="gd-btn gd-o gd-sm"
          onClick={() => window.print()}
          disabled={locked}
        >
          <Printer size={15} aria-hidden="true" /> Print / PDF
        </button>
      </div>

      <div className="relative">
        <div className="gd-lockwrap" data-locked={locked} aria-hidden={locked}>
          {locked || (loading && !analytics) || !analytics ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              <div className="gd-kpis gd-r">
                <KpiTile
                  icon={<Eye size={14} aria-hidden="true" />}
                  label="Views"
                  value={totals.views.toLocaleString()}
                  delta={deltaOf("views")}
                  periodLabel={periodLabel}
                  spark={series.map((s) => s.views)}
                />
                <KpiTile
                  icon={<Bookmark size={14} aria-hidden="true" />}
                  label="Saves"
                  value={totals.saves.toLocaleString()}
                  delta={deltaOf("saves")}
                  periodLabel={periodLabel}
                  spark={series.map((s) => s.saves)}
                />
                <KpiTile
                  icon={<Inbox size={14} aria-hidden="true" />}
                  label="Inquiries"
                  value={totals.inquiries.toLocaleString()}
                  delta={deltaOf("inquiries")}
                  periodLabel={periodLabel}
                  spark={series.map((s) => s.inquiries)}
                />
                <KpiTile
                  icon={<Target size={14} aria-hidden="true" />}
                  label="Conversion"
                  value={`${convRate}%`}
                  delta={convDelta}
                  periodLabel={periodLabel}
                  spark={series.map((s) => (s.views ? (s.inquiries / s.views) * 100 : 0))}
                />
              </div>

              <div className="gd-g21 gd-r">
                <Section title="Engagement trend" sub={`Daily ${metric} over the selected range`}>
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="gd-seg" role="group" aria-label="Metric">
                      {(["views", "saves", "inquiries"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={metric === m}
                          onClick={() => setMetric(m)}
                          className="capitalize"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="gd-link text-[13px]"
                      onClick={() => setAsTable((v) => !v)}
                    >
                      {asTable ? "Show as chart" : "Show as table"}
                    </button>
                  </div>
                  {asTable ? (
                    <div className="max-h-[290px] overflow-auto rounded-[14px] border border-border-subtle">
                      <table className="gd-mt">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Views</th>
                            <th>Saves</th>
                            <th>Inquiries</th>
                          </tr>
                        </thead>
                        <tbody>
                          {series.map((p) => (
                            <tr key={p.iso}>
                              <td className="gd-mono">{p.iso}</td>
                              <td>{p.views}</td>
                              <td>{p.saves}</td>
                              <td>{p.inquiries}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{
                              fill: "var(--muted-foreground)",
                              fontSize: 11.5,
                              fontFamily: "IBM Plex Mono",
                            }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={28}
                          />
                          <YAxis
                            width={40}
                            ticks={[0, Math.round(chartMax / 2), chartMax]}
                            domain={[0, chartMax]}
                            tick={{
                              fill: "var(--muted-foreground)",
                              fontSize: 11.5,
                              fontFamily: "IBM Plex Mono",
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={<TrendTooltip metric={metric} />}
                            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                          />
                          <Area
                            type="monotone"
                            dataKey={metric}
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            fill="var(--chart-fill)"
                            fillOpacity={1}
                            activeDot={{
                              r: 5,
                              fill: "var(--chart-1)",
                              stroke: "var(--card)",
                              strokeWidth: 2,
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Section>
                <Section title="Conversion funnel" sub="Views → saves → inquiries">
                  <div className="flex flex-col gap-3.5 pt-1.5">
                    {(
                      [
                        ["Property views", totals.views, 1],
                        ["Saves", totals.saves, 0.72],
                        ["Inquiries", totals.inquiries, 0.5],
                      ] as const
                    ).map(([label, value, opacity], i) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">{label}</span>
                          <span className="gd-mono">{value.toLocaleString()}</span>
                        </div>
                        <div className="h-[30px] overflow-hidden rounded-lg bg-track">
                          <span
                            className="block h-full rounded-lg bg-brand"
                            style={{
                              opacity,
                              width: `${Math.max(3, totals.views ? (value / totals.views) * 100 : 0)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[12.5px] text-muted-foreground">
                          {i === 0
                            ? "Everyone who opened a listing"
                            : `${totals.views ? ((value / totals.views) * 100).toFixed(1) : "0"}% of views`}
                        </span>
                      </div>
                    ))}
                    {totals.inquiries > 0 && (
                      <div className="rounded-[14px] bg-brand-subtle px-3.5 py-3 text-[13.5px] leading-snug text-brand-subtle-foreground">
                        About 1 in {Math.round(totals.views / totals.inquiries)} viewers sends an
                        inquiry.
                      </div>
                    )}
                  </div>
                </Section>
              </div>

              <div className="gd-g3 gd-r">
                <Section title="Peak activity" sub="Views by day of the week">
                  {!peakDay || peakDay.views === 0 ? (
                    <Empty>No activity yet.</Empty>
                  ) : (
                    <>
                      <div
                        className="gd-bars"
                        role="img"
                        aria-label={`Views by weekday; busiest is ${DAY_FULL_NAMES[peakDay.day] ?? peakDay.day}`}
                      >
                        {peakActivity.map((d) => (
                          <div
                            key={d.day}
                            className="gd-barc"
                            title={`${DAY_FULL_NAMES[d.day] ?? d.day}: ${d.views.toLocaleString()} views`}
                          >
                            <span className="gd-bv">{d.views.toLocaleString()}</span>
                            <span
                              className={`block w-full max-w-[30px] rounded-[6px_6px_3px_3px] ${
                                d.day === peakDay.day ? "bg-brand" : "bg-border"
                              }`}
                              style={{ height: `${Math.round((d.views / peakMax) * 110)}px` }}
                            />
                            <span className="gd-bl">{d.day}</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-sm">
                        Most views happen on{" "}
                        <strong>{DAY_FULL_NAMES[peakDay.day] ?? peakDay.day}s</strong>.
                      </span>
                    </>
                  )}
                </Section>
                <Section
                  title="Price positioning"
                  sub="Your listings vs the county average asking price"
                >
                  {pricePositionRows.length === 0 ? (
                    <Empty>Not enough market data yet.</Empty>
                  ) : (
                    <div className="flex flex-col">
                      {pricePositionRows.map((l) => {
                        const avg = avgPriceByCounty.get(l.county) as number;
                        return (
                          <div
                            key={l.id}
                            className="flex justify-between gap-2.5 border-b border-border-subtle py-[11px]"
                          >
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="gd-mono text-[13.5px] font-semibold">
                                {l.parcelNumber}
                              </span>
                              <span className="text-[12.5px] text-muted-foreground">
                                KES {l.price.toLocaleString()} vs county avg KES{" "}
                                {Math.round(avg).toLocaleString()}
                              </span>
                            </span>
                            <span className="self-center">
                              <Delta value={Math.round(((l.price - avg) / avg) * 100)} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Section>
                <Section title="Devices" sub="How viewers browse your listings">
                  {devices.length === 0 ? (
                    <Empty>No activity yet.</Empty>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {devices.map((d) => (
                        <div key={d.name} className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2 font-semibold">
                              <span className="flex text-muted-foreground">
                                {d.name === "Mobile" ? (
                                  <Smartphone size={16} aria-hidden="true" />
                                ) : d.name === "Tablet" ? (
                                  <Tablet size={16} aria-hidden="true" />
                                ) : (
                                  <Monitor size={16} aria-hidden="true" />
                                )}
                              </span>
                              {d.name}
                            </span>
                            <span className="gd-mono">{d.value}%</span>
                          </div>
                          <Bar pct={d.value} height={10} />
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>

              <div className="gd-g211 gd-r">
                <Section title="Top performing listings" sub="By total views">
                  {topListingRows.length === 0 ? (
                    <Empty>No listings yet.</Empty>
                  ) : (
                    <div className="overflow-x-auto">
                      <div
                        className="gd-gt min-w-[600px]"
                        role="table"
                        aria-label="Top performing listings"
                      >
                        <div className="gd-gtr gd-gth" role="row">
                          <span role="columnheader">#</span>
                          <span role="columnheader">Property</span>
                          <span role="columnheader">Location</span>
                          <span role="columnheader" className="text-right">
                            Views
                          </span>
                          <span role="columnheader" className="text-right">
                            Saves
                          </span>
                          <span role="columnheader" className="text-right">
                            Inquiries
                          </span>
                          <span role="columnheader" className="text-right">
                            Conv.
                          </span>
                        </div>
                        {topListingRows.map((l, i) => {
                          const s = statsById.get(l.id);
                          const inq = s?.inquiries ?? 0;
                          return (
                            <div key={l.id} className="gd-gtr" role="row">
                              <span role="cell" className="gd-mono text-muted-foreground">
                                {i + 1}
                              </span>
                              <span role="cell" className="flex items-center gap-2.5">
                                <ListingThumb
                                  kind="land"
                                  coverPhotoUrl={l.coverPhotoUrl}
                                  width={44}
                                  height={34}
                                />
                                <span className="flex flex-col">
                                  <span className="gd-mono text-[13px] font-semibold">
                                    {l.parcelNumber}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    KES {l.price.toLocaleString()}
                                  </span>
                                </span>
                              </span>
                              <span role="cell">{l.county}</span>
                              <span role="cell" className="gd-mono text-right">
                                {l.views.toLocaleString()}
                              </span>
                              <span role="cell" className="gd-mono text-right">
                                {(s?.saves ?? 0).toLocaleString()}
                              </span>
                              <span role="cell" className="gd-mono text-right">
                                {inq.toLocaleString()}
                              </span>
                              <span role="cell" className="gd-mono text-right">
                                {l.views ? ((inq / l.views) * 100).toFixed(1) : "0"}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button type="button" className="gd-link" onClick={() => onGoTab("listings")}>
                    View all listings <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </Section>
                <Section title="Traffic sources" sub="Where viewers came from">
                  {sources.length === 0 ? (
                    <Empty>
                      No traffic data yet. Sources appear once viewers open your listings on the
                      map.
                    </Empty>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {sources.map((s) => (
                        <div key={s.name} className="flex flex-col gap-1">
                          <div className="flex justify-between text-sm">
                            <span>{s.name}</span>
                            <span className="gd-mono font-semibold">{Math.round(s.value)}%</span>
                          </div>
                          <Bar pct={s.value} />
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
                <Section title="Geographic interest" sub="Views by county">
                  {countyBreakdown.length === 0 ? (
                    <Empty>No data yet.</Empty>
                  ) : (
                    <>
                      <div className="relative h-[150px] overflow-hidden rounded-[14px] bg-track">
                        <svg viewBox="0 30 860 990" width="100%" height="150" aria-hidden="true">
                          <path
                            d={KENYA_OUTLINE}
                            fill="var(--brand-subtle)"
                            stroke="var(--brand)"
                            strokeWidth="3"
                            strokeLinejoin="round"
                          />
                          {mapPoints.map((p) => {
                            const { x, y } = project(p.latitude, p.longitude);
                            return (
                              <circle
                                key={`${p.title}-${p.latitude}`}
                                cx={x}
                                cy={y}
                                r={Math.max(26, Math.sqrt(p.views / maxPoint) * 60)}
                                fill="var(--brand)"
                                fillOpacity=".85"
                                stroke="var(--card)"
                                strokeWidth="8"
                              />
                            );
                          })}
                        </svg>
                      </div>
                      <div className="flex flex-col gap-[9px]">
                        {countyBreakdown.map((c) => {
                          const pct = countyTotalViews ? (c.views / countyTotalViews) * 100 : 0;
                          return (
                            <div key={c.county} className="flex flex-col gap-1">
                              <div className="flex justify-between text-[13.5px]">
                                <span>{c.county}</span>
                                <span className="gd-mono">{Math.round(pct)}%</span>
                              </div>
                              <Bar pct={pct} height={6} />
                            </div>
                          );
                        })}
                      </div>
                      {topCounty && countyTotalViews > 0 && (
                        <span className="text-[13px] leading-snug text-muted-foreground">
                          {Math.round((topCounty.views / countyTotalViews) * 100)}% of your views
                          are from {topCounty.county}
                          {countyBreakdown[1] && `, followed by ${countyBreakdown[1].county}`}.
                        </span>
                      )}
                      {analytics.county_percentile && (
                        <span className="text-[13px] font-semibold text-brand-subtle-foreground">
                          Your top listing is in the top{" "}
                          {100 - analytics.county_percentile.percentile}% for views in{" "}
                          {analytics.county_percentile.county}.
                        </span>
                      )}
                    </>
                  )}
                </Section>
              </div>

              <div className="gd-g21 gd-r">
                <Section title="Recent activity" sub="Latest events on your listings">
                  {activity.length === 0 ? (
                    <Empty>No activity yet.</Empty>
                  ) : (
                    <div className="gd-acts">
                      {activity.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 border-b border-border-subtle py-2.5"
                        >
                          <span className="mt-px flex-none">
                            <StatusChip kind={a.kind} label={a.label} />
                          </span>
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-sm">{a.text}</span>
                            <span className="text-[12.5px] text-muted-foreground">{a.time}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
                <div className="gd-sum">
                  {(
                    [
                      [
                        "Total listings",
                        String(user?.listings.length ?? 0),
                        `${user?.listings.filter((l) => l.status === "active").length ?? 0} active`,
                      ],
                      [
                        "Avg views / listing",
                        user?.listings.length
                          ? Math.round(
                              analytics.total_views / user.listings.length,
                            ).toLocaleString()
                          : "0",
                        "Per published listing",
                      ],
                      ["Inquiry rate", `${convRate}%`, "Views → inquiries"],
                      [
                        "Avg. days on market",
                        analytics.avg_days_on_market !== null
                          ? String(analytics.avg_days_on_market)
                          : "—",
                        analytics.avg_days_on_market !== null ? "Listing to sale" : "No sales yet",
                      ],
                    ] as const
                  ).map(([label, value, note]) => (
                    <div key={label} className="gd-card flex flex-col gap-1 p-4">
                      <span className="gd-eyebrow">{label}</span>
                      <span className="gd-h text-[26px]">{value}</span>
                      <span className="text-[12.5px] text-muted-foreground">{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {locked && (
          <div className="gd-lockcard" role="region" aria-label="Analytics locked">
            <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-subtle text-brand-subtle-foreground">
              <Lock size={24} aria-hidden="true" />
            </span>
            <span className="gd-eyebrow">Pro feature</span>
            <h2 className="gd-h1 text-center text-[28px]">See who&apos;s looking at your land</h2>
            <p className="gd-sub m-0 text-center">
              Daily views, saves and inquiries, where buyers come from, and how your price compares
              with the county average.
            </p>
            <button type="button" className="gd-btn min-h-[50px]" onClick={onUpgrade}>
              <Sparkles size={17} aria-hidden="true" /> Upgrade to Pro
            </button>
            {proPrice != null && (
              <span className="text-[13px] text-muted-foreground">
                KES {proPrice.toLocaleString()} / month · cancel anytime
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
