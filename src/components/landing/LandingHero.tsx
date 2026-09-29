import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BarChart3, ChevronDown, Home, Map as MapIcon, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { kenyaCounties } from "@/lib/plans";

// Simplified Kenya border (lon, lat) used to lay out the dotted map.
const KENYA: [number, number][] = [
  [33.9037, -0.95],
  [34.0726, -1.0598],
  [37.6987, -3.097],
  [37.7669, -3.6771],
  [39.2022, -4.6768],
  [39.6049, -4.3465],
  [39.8009, -3.6812],
  [40.1212, -3.2777],
  [40.2632, -2.5731],
  [40.6378, -2.4999],
  [40.8871, -2.0826],
  [40.9952, -1.6554],
  [41.5851, -1.6833],
  [40.9934, -0.8583],
  [40.9983, 2.7845],
  [41.8551, 3.9189],
  [41.1718, 3.9191],
  [40.7685, 4.257],
  [39.8553, 3.8388],
  [39.5594, 3.4221],
  [38.8936, 3.5007],
  [38.671, 3.6161],
  [38.437, 3.5886],
  [38.1209, 3.5991],
  [36.8554, 4.4479],
  [36.1591, 4.4479],
  [35.8174, 4.777],
  [35.8174, 5.3382],
  [35.298, 5.5061],
  [34.6202, 4.8471],
  [34.0054, 4.2499],
  [34.4794, 3.5556],
  [34.596, 3.0537],
  [35.036, 1.9058],
  [34.6711, 1.217],
  [34.1799, 0.5154],
  [33.8936, 0.1098],
];
const BOUNDS = { x0: 33.5, x1: 42.2, y0: -5.0, y1: 5.8 };
const MAP_W = BOUNDS.x1 - BOUNDS.x0;
const MAP_H = BOUNDS.y1 - BOUNDS.y0;

function insideKenya(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = KENYA.length - 1; i < KENYA.length; j = i++) {
    const [xi, yi] = KENYA[i];
    const [xj, yj] = KENYA[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const DOTS: [number, number][] = [];
for (let y = BOUNDS.y1 - 0.095; y > BOUNDS.y0; y -= 0.19) {
  for (let x = BOUNDS.x0 + 0.095; x < BOUNDS.x1; x += 0.19) {
    if (insideKenya(x, y)) DOTS.push([x - BOUNDS.x0, BOUNDS.y1 - y]);
  }
}

const CITIES = [
  { town: "Nairobi", county: "Nairobi", lon: 36.82, lat: -1.29 },
  { town: "Mombasa", county: "Mombasa", lon: 39.67, lat: -4.04 },
  { town: "Kisumu", county: "Kisumu", lon: 34.76, lat: -0.09 },
  { town: "Nakuru", county: "Nakuru", lon: 36.07, lat: -0.3 },
  { town: "Eldoret", county: "Uasin Gishu", lon: 35.27, lat: 0.51 },
  { town: "Thika", county: "Kiambu", lon: 37.07, lat: -1.03 },
  { town: "Malindi", county: "Kilifi", lon: 40.12, lat: -3.22 },
  { town: "Nyeri", county: "Nyeri", lon: 36.95, lat: -0.42 },
  { town: "Machakos", county: "Machakos", lon: 37.26, lat: -1.52 },
  { town: "Garissa", county: "Garissa", lon: 39.65, lat: -0.45 },
];

function listingLabel(n: number) {
  if (n === 0) return "No listings yet";
  return `${n} ${n === 1 ? "listing" : "listings"}`;
}

function useCountUp(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (t: number) => {
          const k = Math.min(1, (t - start) / 1600);
          setProgress(1 - Math.pow(1 - k, 3));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ref]);
  return progress;
}

export function LandingHero({ parcels }: { parcels: { county: string; verified: boolean }[] }) {
  const navigate = useNavigate();
  const [county, setCounty] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const progress = useCountUp(statsRef);

  const byCounty = new Map<string, number>();
  for (const p of parcels) byCounty.set(p.county, (byCounty.get(p.county) ?? 0) + 1);

  const active = CITIES.find((c) => c.county === county)?.town ?? null;
  const open = hover ?? active;

  const stats = [
    { icon: Home, value: parcels.length, label: "Properties listed" },
    {
      icon: ShieldCheck,
      value: parcels.filter((p) => p.verified).length,
      label: "Verified titles",
    },
    { icon: MapIcon, value: byCounty.size, label: "Counties covered" },
    { icon: BarChart3, value: 12, suffix: "+", label: "Intelligence factors" },
  ];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/land", search: { county: county || undefined } });
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="bg-background px-5 pb-16 pt-12 text-foreground md:px-8 md:pb-24 md:pt-[88px]"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
        <h1
          id="hero-title"
          className="max-w-[780px] text-balance text-[clamp(2rem,5.2vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.025em]"
        >
          Find verified properties across Kenya
        </h1>
        <p className="mt-[18px] max-w-[60ch] text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Land, homes and rentals checked against official records — browse them county by county.
        </p>

        <form
          onSubmit={onSubmit}
          role="search"
          aria-label="Find properties by county"
          className="mt-9 flex w-full max-w-[560px] flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-[0_10px_30px_-12px_rgb(15_23_42/0.18),0_2px_6px_-2px_rgb(15_23_42/0.06)] md:flex-row"
        >
          <label className="relative flex min-h-11 flex-1 items-center">
            <span className="sr-only">County</span>
            <MapPin
              aria-hidden
              className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-brand"
            />
            <select
              value={county}
              onChange={(e) => {
                setCounty(e.target.value);
                setHover(null);
              }}
              className="h-11 w-full cursor-pointer appearance-none rounded-md border-0 bg-transparent pl-[42px] pr-10 text-base font-medium text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All counties</option>
              {kenyaCounties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted-foreground"
            />
          </label>
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90 md:w-auto"
          >
            View Properties
          </Button>
        </form>

        <div className="mt-12 flex w-full justify-center rounded-xl bg-muted px-3 pb-5 pt-10 md:px-8 md:pb-8 md:pt-14">
          <div className="relative aspect-[0.8056] w-full max-w-[460px]">
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              aria-hidden
              className="absolute inset-0 block h-full w-full"
            >
              <g className="fill-muted-foreground" fillOpacity={0.32}>
                {DOTS.map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r={0.058} />
                ))}
              </g>
            </svg>

            {CITIES.map((c) => {
              const count = byCounty.get(c.county) ?? 0;
              const selected = active === c.town;
              const isOpen = open === c.town;
              const tipId = `hero-tip-${c.town.toLowerCase()}`;
              return (
                <div
                  key={c.town}
                  className={`absolute h-0 w-0 ${isOpen ? "z-20" : "z-[1]"}`}
                  style={{
                    left: `${((c.lon - BOUNDS.x0) / MAP_W) * 100}%`,
                    top: `${((BOUNDS.y1 - c.lat) / MAP_H) * 100}%`,
                  }}
                >
                  <button
                    type="button"
                    aria-label={`${c.town}, ${c.county} County – ${listingLabel(count)}`}
                    aria-expanded={isOpen}
                    aria-describedby={isOpen ? tipId : undefined}
                    onClick={() => setCounty(c.county)}
                    onMouseEnter={() => setHover(c.town)}
                    onMouseLeave={() => setHover((h) => (h === c.town ? null : h))}
                    onFocus={() => setHover(c.town)}
                    onBlur={() => setHover((h) => (h === c.town ? null : h))}
                    className="absolute -left-[22px] -top-[22px] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 hover:scale-125 focus-visible:outline-2 focus-visible:-outline-offset-[6px] focus-visible:outline-ring motion-reduce:transition-none"
                  >
                    <span
                      className="absolute h-3 w-3 animate-pin-pulse rounded-full bg-brand motion-reduce:animate-none"
                      style={{ animationDelay: `${(c.lon % 1).toFixed(2)}s` }}
                    />
                    <span
                      className={`relative rounded-full bg-brand transition-all duration-200 ${
                        selected
                          ? "h-3.5 w-3.5 shadow-[0_0_0_3px_var(--muted),0_0_0_5px_var(--brand)]"
                          : "h-2.5 w-2.5 shadow-[0_0_0_2px_var(--muted),0_0_0_2px_var(--brand)]"
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={tipId}
                      role="tooltip"
                      className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-[calc(100%+16px)] whitespace-nowrap rounded-lg border border-border bg-popover px-3.5 py-2.5 text-left text-popover-foreground shadow-[0_12px_28px_-10px_rgb(15_23_42/0.25),0_2px_6px_-2px_rgb(15_23_42/0.08)] animate-in fade-in-0 motion-reduce:animate-none"
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
                        {c.county}
                      </div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {c.town} · {listingLabel(count)}
                      </div>
                      <span className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border bg-popover" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          ref={statsRef}
          className="mt-14 grid w-full grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6"
        >
          {stats.map(({ icon: Icon, value, suffix, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon aria-hidden className="h-6 w-6 text-brand" strokeWidth={1.75} />
              <div className="text-[clamp(1.75rem,3.4vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em] tabular-nums">
                {Math.round(value * progress).toLocaleString("en-US")}
                {suffix}
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
