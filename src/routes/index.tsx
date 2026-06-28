import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { MapPinned, ShieldCheck, Layers, Activity, ArrowRight } from "lucide-react";
import { landParcels, statusMeta } from "@/lib/landData";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const verifiedCount = landParcels.filter((p) => p.verified).length;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3 w-3" /> GIS-powered land intelligence
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Verified land & property intelligence for Kenya.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Explore plotted parcels with accurate boundaries, ownership status, and location insights — all on one professional GIS platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/land"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-secondary"
              >
                Explore Land Map <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/rentals"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Browse Rentals
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
              <Metric label="Parcels mapped" value={landParcels.length.toString()} />
              <Metric label="Verified" value={verifiedCount.toString()} />
              <Metric label="Counties" value="4" />
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <MapPinned className="h-3.5 w-3.5 text-[var(--accent)]" />
                  Live Parcel Index
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sample</span>
              </div>
              <ul className="divide-y divide-border">
                {landParcels.slice(0, 5).map((p) => {
                  const m = statusMeta[p.status];
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{p.parcelNumber} · {p.county}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-foreground">KES {(p.price / 1_000_000).toFixed(1)}M</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Layers className="h-4 w-4" />}
            title="Polygon Parcel Mapping"
            body="Every parcel is plotted with precise GPS boundaries — not generic pins."
          />
          <Feature
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Verified Ownership"
            body="Filter by verified, available, reserved, sold or disputed parcels at a glance."
          />
          <Feature
            icon={<Activity className="h-4 w-4" />}
            title="Location Intelligence"
            body="Schools, hospitals, infrastructure and a development score for every plot."
          />
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-xs text-muted-foreground">
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
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
