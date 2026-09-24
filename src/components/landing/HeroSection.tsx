import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParcelSummary } from "@/lib/parcels";

function compactKes(price: number) {
  return price >= 1_000_000
    ? `KES ${(price / 1_000_000).toFixed(1)}M`
    : `KES ${price.toLocaleString("en-US")}`;
}

export function HeroSection({ parcels }: { parcels: ParcelSummary[] }) {
  const verified = parcels.filter((p) => p.verified).length;
  const counties = new Set(parcels.map((p) => p.county)).size;
  const index = [...parcels].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 5);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[90vh] items-center overflow-hidden bg-black"
    >
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
          <h1
            id="hero-title"
            className="text-balance text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-white drop-shadow-sm"
          >
            Verified land &amp; property intelligence for Kenya.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70">
            Explore plotted parcels with accurate boundaries, ownership status, and location
            insights — all on one professional GIS platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-brand px-5 font-semibold text-brand-foreground shadow-lg shadow-black/30 hover:bg-brand/90"
            >
              <Link to="/land">
                Explore Land Map <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-white/25 bg-white/10 px-5 font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link to="/rentals">
                Browse Rentals <ArrowRight />
              </Link>
            </Button>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[
              ["Parcels mapped", parcels.length],
              ["Verified", verified],
              ["Counties", counties],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                  {label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                  {value.toLocaleString("en-US")}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {index.length > 0 && (
          <div className="flex items-center">
            <div className="w-full rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/50 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <MapPinned aria-hidden className="h-3.5 w-3.5 text-emerald-400" />
                  Live Parcel Index
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
                  Live
                </span>
              </div>
              <ul>
                {index.map((p) => (
                  <li key={p.id} className="border-t border-white/10 first:border-t-0">
                    <Link
                      to="/land"
                      search={{ parcel: p.id }}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
                    >
                      <span
                        aria-hidden
                        className={`h-2.5 w-2.5 shrink-0 rounded-sm ${p.verified ? "bg-success" : "bg-brand"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{p.parcelNumber}</p>
                        <p className="text-[11px] text-white/50">{p.county}</p>
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-emerald-300">
                        {compactKes(p.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
