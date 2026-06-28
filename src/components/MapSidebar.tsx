import { useEffect, useState } from "react";
import { Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { counties, statusMeta, type LandStatus, type ListingType, type PostedBy } from "@/lib/landData";

export interface Filters {
  county: string;
  status: LandStatus | "all";
  listingType: ListingType | "all";
  postedBy: PostedBy | "all";
  minPrice: number;
  maxPrice: number;
}

export function MapSidebar({
  filters,
  setFilters,
  count,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  count: number;
}) {
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const FloatingToggle = (
    <button
      onClick={() => setOpen(true)}
      className="absolute left-3 top-3 z-[1100] flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-md md:hidden"
    >
      <Filter className="h-3.5 w-3.5" /> Filters
    </button>
  );

  if (isMobile && !open) return FloatingToggle;

  return (
    <>
      {isMobile && open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-[1050] bg-black/40 md:hidden" />
      )}

      <aside
        className={`${
          isMobile
            ? "fixed left-0 top-0 z-[1060] h-full w-[85%] max-w-xs"
            : `relative z-20 h-full ${open ? "w-72" : "w-12"}`
        } flex flex-col border-r border-border bg-card transition-all`}
      >
        {!isMobile && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="absolute -right-3 top-4 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
          >
            {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}

        {(open || !isMobile) && (open ? (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Filters</h3>
              <span className="ml-auto text-[11px] text-muted-foreground">{count} parcels</span>
              {isMobile && (
                <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <Group title="Listing Type">
                <Segmented
                  options={[
                    { v: "all", label: "All" },
                    { v: "sale", label: "Sale" },
                    { v: "lease", label: "Lease" },
                  ]}
                  value={filters.listingType}
                  onChange={(v) => setFilters({ ...filters, listingType: v as Filters["listingType"] })}
                />
              </Group>

              <Group title="Posted By">
                <Segmented
                  options={[
                    { v: "all", label: "Any" },
                    { v: "owner", label: "Owner" },
                    { v: "broker", label: "Broker" },
                  ]}
                  value={filters.postedBy}
                  onChange={(v) => setFilters({ ...filters, postedBy: v as Filters["postedBy"] })}
                />
              </Group>

              <Group title="County">
                <div className="flex flex-wrap gap-1.5">
                  {counties.map((c) => {
                    const active = filters.county === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setFilters({ ...filters, county: c })}
                        className={`rounded-sm border px-2 py-1 text-[11px] font-medium transition-colors ${
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </Group>

              <Group title="Status">
                <div className="space-y-1">
                  <StatusOption label="All Statuses" active={filters.status === "all"} onClick={() => setFilters({ ...filters, status: "all" })} />
                  {(Object.keys(statusMeta) as LandStatus[]).map((s) => (
                    <StatusOption
                      key={s}
                      label={statusMeta[s].label}
                      color={statusMeta[s].color}
                      active={filters.status === s}
                      onClick={() => setFilters({ ...filters, status: s })}
                    />
                  ))}
                </div>
              </Group>

              <Group title="Price Range (KES)">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Min</span>
                      <span className="text-foreground">{filters.minPrice.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30000000}
                      step={250000}
                      value={filters.minPrice}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setFilters({ ...filters, minPrice: v, maxPrice: Math.max(v, filters.maxPrice) });
                      }}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Max</span>
                      <span className="text-foreground">{filters.maxPrice.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30000000}
                      step={250000}
                      value={filters.maxPrice}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setFilters({ ...filters, maxPrice: v, minPrice: Math.min(v, filters.minPrice) });
                      }}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                </div>
              </Group>

              <button
                onClick={() => setFilters({ county: "All", status: "all", listingType: "all", postedBy: "all", minPrice: 0, maxPrice: 30000000 })}
                className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : null)}
      </aside>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr overflow-hidden rounded-sm border border-border">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-2 py-1.5 text-[11px] font-medium transition-colors ${
            value === o.v ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatusOption({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-sm border px-2.5 py-1.5 text-left text-xs transition-colors ${
        active ? "border-primary bg-muted text-foreground" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {color && <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}
