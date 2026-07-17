import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { MapPinned, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import { landParcels, statusMeta } from "@/lib/landData";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const verifiedCount = landParcels.filter((p) => p.verified).length;
  return (
    <div className="min-h-screen bg-black">
      <Navbar transparent />

      {/* ── Hero ── */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=90&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-sm">
              <Activity className="h-3 w-3 text-emerald-400" /> GIS-powered land intelligence
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow md:text-5xl lg:text-6xl">
              Verified land & property intelligence for Kenya.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70">
              Explore plotted parcels with accurate boundaries, ownership status, and location
              insights — all on one professional GIS platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/land"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-[#1d4ed8] active:scale-[0.98]"
              >
                Explore Land Map <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/rentals"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                Browse Rentals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <Metric label="Parcels mapped" value={landParcels.length.toString()} />
              <Metric label="Verified" value={verifiedCount.toString()} />
              <Metric label="Counties" value="4" />
            </dl>
          </div>

          <div className="relative flex items-center">
            <div className="w-full rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/50 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <MapPinned className="h-3.5 w-3.5 text-emerald-400" />
                  Live Parcel Index
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50 backdrop-blur-sm">
                  Sample
                </span>
              </div>
              <ul className="divide-y divide-white/10">
                {landParcels.slice(0, 5).map((p) => {
                  const m = statusMeta[p.status];
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: m.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{p.title}</p>
                        <p className="truncate text-[11px] text-white/50">
                          {p.parcelNumber} · {p.county}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-300">
                        KES {(p.price / 1_000_000).toFixed(1)}M
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <p className="absolute bottom-4 left-6 z-20 text-[10px] text-white/20">
          USGS / Unsplash — Agricultural landscape, USA
        </p>
      </section>

      {/* ── Features ── */}
      <section className="relative bg-card">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="mb-16 text-center md:mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Why LandVerify Kenya
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Built for buyers, sellers, and investors who need accurate land intelligence.
            </p>
          </div>

          <FeatureRow
            index={0}
            icon={<MapPinned className="h-8 w-8 md:h-10 md:w-10" />}
            title="Polygon Parcel Mapping"
            body="Every parcel is plotted with precise GPS boundaries — not generic pins. View exact dimensions, area calculations, and neighboring parcels on an interactive map."
          />

          <div className="mx-auto hidden h-px max-w-5xl bg-border md:block" />

          <FeatureRow
            index={1}
            icon={<ShieldCheck className="h-8 w-8 md:h-10 md:w-10" />}
            title="Verified Ownership"
            body="Filter by verified, available, reserved, sold or disputed parcels at a glance. Every listing includes ownership documentation and status tracking."
          />

          <div className="mx-auto hidden h-px max-w-5xl bg-border md:block" />

          <FeatureRow
            index={2}
            icon={<Activity className="h-8 w-8 md:h-10 md:w-10" />}
            title="Location Intelligence"
            body="Schools, hospitals, infrastructure and a development score for every plot. Make informed decisions with data-driven location insights."
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-xs text-white/40">
          <span>© {new Date().getFullYear()} LandVerify Kenya</span>
          <span>Land intelligence platform · Nairobi</span>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-white drop-shadow">{value}</dd>
    </div>
  );
}

function FeatureRow({
  index,
  icon,
  title,
  body,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const { ref, isVisible } = useScrollReveal(0.2);
  const isEven = index % 2 === 0;

  const iconBox = (
    <div
      className={`transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/10 md:h-24 md:w-24">
        {icon}
      </div>
    </div>
  );

  const textBox = (
    <div
      className={`transition-all duration-700 delay-200 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <h3 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base md:leading-relaxed">
        {body}
      </p>
    </div>
  );

  return (
    <div
      ref={ref}
      className={`py-12 md:py-16 ${isEven ? "" : "bg-muted/30 -mx-4 px-4 md:-mx-8 md:px-8 rounded-xl"}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center md:flex-row md:gap-16 md:text-left">
        {isEven ? (
          <>
            <div className="shrink-0">{iconBox}</div>
            <div className="flex-1">{textBox}</div>
          </>
        ) : (
          <>
            <div className="flex-1 md:order-1">{textBox}</div>
            <div className="shrink-0 md:order-2">{iconBox}</div>
          </>
        )}
      </div>
    </div>
  );
}
