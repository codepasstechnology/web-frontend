import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Eye, Inbox, MousePointerClick, Store } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Segmented } from "@/components/dashboard/wizard";
import {
  LEAD_SOURCE_LABELS,
  useAgencyInsights,
  type AgencyInsights,
  type InsightRow,
  type LeadSource,
} from "@/lib/agency";
import {
  TYPE_LABELS,
  INTENT_LABELS,
  type PropertyIntent,
  type PropertyType,
} from "@/lib/properties";

const RANGES = [
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
] as const;

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct or typed in",
  search: "Search engines",
  social: "Social media",
  whatsapp: "WhatsApp",
  referral: "Other websites",
};

function minutes(m: number | null): string {
  if (m == null) return "—";
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.round(m / 60)} h`;
  return `${Math.round(m / 1440)} d`;
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="gd-card gd-kpi">
      <span className="gd-eyebrow flex items-center gap-1.5">
        <span className="gd-kico">{icon}</span>
        {label}
      </span>
      <span className="gd-big2">{value.toLocaleString()}</span>
    </div>
  );
}

function Rows({ title, sub, rows }: { title: string; sub: string; rows: InsightRow[] }) {
  return (
    <section className="gd-card flex flex-col gap-3">
      <div>
        <h2 className="gd-h2">{title}</h2>
        <span className="text-sm text-muted-foreground">{sub}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{r.title}</span>
              <span className="shrink-0 text-muted-foreground">
                {r.views.toLocaleString()} views · {r.leads} {r.leads === 1 ? "lead" : "leads"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** How the agency's listings and page perform, per staff member and against the market. */
export function InsightsTab() {
  const [range, setRange] = useState<AgencyInsights["range"]>("30d");
  const { data, isLoading, error } = useAgencyInsights(range, true);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="gd-h1">Agency insights</h1>
        <div className="gd-card flex flex-col items-start gap-3">
          <p>{(error as Error).message}</p>
          <Link to="/pricing" search={{ audience: "agency" }} className="gd-btn">
            See agency plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="gd-r flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="gd-h1">Agency insights</h1>
          <p className="gd-sub">Views, leads and page visits across your whole agency.</p>
        </div>
        <Segmented label="Range" value={range} options={RANGES} onChange={setRange} />
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-16">
          <span className="gd-spin" />
        </div>
      ) : (
        <>
          <div className="gd-kpis">
            <Tile
              icon={<Store size={14} aria-hidden="true" />}
              label="Live listings"
              value={data.totals.liveListings}
            />
            <Tile
              icon={<Eye size={14} aria-hidden="true" />}
              label="Listing views (all time)"
              value={data.totals.views}
            />
            <Tile
              icon={<Inbox size={14} aria-hidden="true" />}
              label="Leads"
              value={data.totals.leads}
            />
            <Tile
              icon={<MousePointerClick size={14} aria-hidden="true" />}
              label="Agency page visits"
              value={data.totals.pageVisits}
            />
          </div>

          <section className="gd-card gd-chart">
            <div className="gd-ch">
              <h2 className="gd-h2">Leads and page visits</h2>
              <span className="gd-cs">Per day</span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
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
                    width={32}
                    allowDecimals={false}
                    tick={{
                      fill: "var(--muted-foreground)",
                      fontSize: 11.5,
                      fontFamily: "IBM Plex Mono",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Page visits"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="var(--chart-fill)"
                    fillOpacity={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="gd-g21">
            <section className="gd-card flex flex-col gap-3">
              <h2 className="gd-h2">Where leads came from</h2>
              {(Object.entries(data.leadsBySource) as [LeadSource, number][]).length === 0 ? (
                <p className="text-sm text-muted-foreground">No leads in this period.</p>
              ) : (
                (Object.entries(data.leadsBySource) as [LeadSource, number][]).map(
                  ([source, n]) => (
                    <div key={source} className="flex flex-col gap-1">
                      <span className="flex justify-between text-sm">
                        {LEAD_SOURCE_LABELS[source]} <strong>{n}</strong>
                      </span>
                      <div className="gd-bar" style={{ height: 8 }}>
                        <span style={{ width: `${(n / Math.max(1, data.totals.leads)) * 100}%` }} />
                      </div>
                    </div>
                  ),
                )
              )}
            </section>
            <section className="gd-card flex flex-col gap-3">
              <h2 className="gd-h2">Who visits your page</h2>
              {Object.keys(data.pageSources).length === 0 ? (
                <p className="text-sm text-muted-foreground">No visits in this period.</p>
              ) : (
                Object.entries(data.pageSources).map(([source, n]) => (
                  <div key={source} className="flex flex-col gap-1">
                    <span className="flex justify-between text-sm">
                      {SOURCE_LABELS[source] ?? source} <strong>{n}</strong>
                    </span>
                    <div className="gd-bar" style={{ height: 8 }}>
                      <span
                        style={{ width: `${(n / Math.max(1, data.totals.pageVisits)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          {data.needsAttention.length > 0 && (
            <section className="gd-card flex flex-col gap-2">
              <h2 className="gd-h2 flex items-center gap-2">
                <AlertTriangle size={18} aria-hidden="true" /> Needs attention
              </h2>
              <p className="text-sm text-muted-foreground">
                Plenty of views but nobody has got in touch. Check the price and photos.
              </p>
              <ul className="flex flex-col gap-1.5">
                {data.needsAttention.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3 text-sm">
                    <span className="truncate">{r.title}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {r.views} views · 0 leads
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="gd-g21">
            <Rows title="Best listings" sub="Most leads, then most views" rows={data.best} />
            <Rows
              title="Quietest listings"
              sub="Live listings getting the least interest"
              rows={data.worst}
            />
          </div>

          <section className="gd-card flex flex-col gap-3">
            <h2 className="gd-h2">Team</h2>
            <div className="overflow-x-auto">
              <table className="gd-tbl w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Name</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">Replied</th>
                    <th className="text-right">Typical reply time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staff.map((s) => (
                    <tr key={s.userId}>
                      <td>{s.name}</td>
                      <td className="text-right">{s.leads}</td>
                      <td className="text-right">{s.responded}</td>
                      <td className="text-right">{minutes(s.responseMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="gd-card flex flex-col gap-3">
            <div>
              <h2 className="gd-h2">Market prices</h2>
              <span className="text-sm text-muted-foreground">
                What similar live listings on Geo Pin ask: the middle half of prices.
              </span>
            </div>
            {data.market.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not enough similar listings yet to compare. This fills in as more listings go live.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.market.map((m) => (
                  <li
                    key={`${m.county}${m.type}${m.bedrooms}${m.intent}`}
                    className="flex flex-wrap justify-between gap-2 rounded-[14px] border border-border px-3.5 py-2.5 text-sm"
                  >
                    <span>
                      {m.bedrooms > 0 ? `${m.bedrooms}BR ` : ""}
                      {(TYPE_LABELS[m.type as PropertyType] ?? m.type).toLowerCase()}s in {m.county}{" "}
                      {(INTENT_LABELS[m.intent as PropertyIntent] ?? m.intent).toLowerCase()}:{" "}
                      <strong>
                        KES {m.low.toLocaleString()}–{m.high.toLocaleString()}
                      </strong>
                    </span>
                    <span className={m.yours > m.high ? "text-warning" : "text-muted-foreground"}>
                      Yours: KES {m.yours.toLocaleString()} · {m.comparables} compared
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
