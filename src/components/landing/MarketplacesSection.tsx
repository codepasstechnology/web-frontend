import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ParcelSummary } from "@/lib/parcels";
import { formatPrice, INTENT_LABELS, type Property } from "@/lib/properties";

type ListingCard = {
  key: string;
  title: string;
  county: string;
  price: string;
  badge: string;
  verified: boolean;
  photo: string | null;
  link:
    { to: "/land"; search: { parcel: string } } | { to: "/rentals"; search: { property: string } };
};

function toCards(parcels: ParcelSummary[], properties: Property[]): ListingCard[] {
  const land = [...parcels]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .map((p): ListingCard => ({
      key: `land-${p.id}`,
      title: p.parcelNumber,
      county: p.county,
      price: `KES ${p.price.toLocaleString("en-US")}${p.listingType === "lease" ? "/yr" : ""}`,
      badge: p.verified ? "Verified" : p.listingType === "lease" ? "For lease" : "For sale",
      verified: p.verified,
      photo: p.coverPhotoUrl,
      link: { to: "/land", search: { parcel: p.id } },
    }));
  const homes = properties.map((p): ListingCard => ({
    key: `property-${p.id}`,
    title: p.title,
    county: p.county,
    price: formatPrice(p.price, p.pricePeriod),
    badge: INTENT_LABELS[p.intent],
    verified: false,
    photo: p.photos[0] ?? null,
    link: { to: "/rentals", search: { property: p.id } },
  }));
  const cards: ListingCard[] = [];
  for (let i = 0; cards.length < 4 && (i < land.length || i < homes.length); i++) {
    if (land[i]) cards.push(land[i]);
    if (homes[i] && cards.length < 4) cards.push(homes[i]);
  }
  return cards;
}

export function MarketplacesSection({
  parcels,
  properties,
}: {
  parcels: ParcelSummary[];
  properties: Property[];
}) {
  const cards = toCards(parcels, properties);

  return (
    <section
      aria-labelledby="marketplaces-title"
      className="mx-auto mt-20 flex max-w-[1100px] flex-col gap-10 px-4 md:mt-[120px] md:px-8"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2
          id="marketplaces-title"
          className="text-balance text-[clamp(1.75rem,3.6vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]"
        >
          Two marketplaces, one map
        </h2>
        <p className="max-w-[56ch] text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
          Buy land or find a place to live. Every listing is pinned to its real location.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            icon: Map,
            eyebrow: "Land",
            title: "Verified parcels, mapped to the metre",
            body: "Every parcel has its GPS boundary outlined and its title checked against the land registry. For sale or lease.",
            cta: (
              <Button
                asChild
                size="lg"
                className="h-11 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90"
              >
                <Link to="/land">Explore the land map</Link>
              </Button>
            ),
          },
          {
            icon: Building2,
            eyebrow: "Rentals & homes",
            title: "From bedsitters to office floors",
            body: "Apartments, houses, bedsitters, studios, BnBs, offices and commercial space. For rent or sale.",
            cta: (
              <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
                <Link to="/rentals">Browse rentals</Link>
              </Button>
            ),
          },
        ].map(({ icon: Icon, eyebrow, title, body, cta }) => (
          <article
            key={eyebrow}
            className="flex flex-col gap-5 rounded-xl border border-border bg-card p-7 text-card-foreground md:p-10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Icon aria-hidden className="h-6 w-6 text-brand" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
                {eyebrow}
              </div>
              <h3 className="text-2xl font-bold leading-tight tracking-[-0.01em]">{title}</h3>
              <p className="text-pretty text-base leading-relaxed text-muted-foreground">{body}</p>
            </div>
            <div className="mt-auto flex pt-2">{cta}</div>
          </article>
        ))}
      </div>

      {cards.length > 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl font-bold tracking-[-0.01em]">Latest listings</h3>
            <Link
              to="/land"
              className="flex items-center gap-1.5 text-[0.9375rem] font-semibold text-brand hover:underline"
            >
              View all <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <ul className="-mx-4 grid snap-x snap-mandatory scroll-px-4 auto-cols-[78%] grid-flow-col gap-5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:auto-cols-fr md:scroll-px-0 md:px-0">
            {cards.map((c) => (
              <li key={c.key} className="snap-start">
                <Link
                  {...c.link}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-brand"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {c.photo && (
                      <img
                        src={c.photo}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <Badge
                      className={`absolute left-3 top-3 border-transparent ${
                        c.verified
                          ? "bg-success text-white hover:bg-success"
                          : "bg-background text-foreground hover:bg-background"
                      }`}
                    >
                      {c.badge}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 px-4 pb-4 pt-3.5">
                    <div className="font-semibold leading-snug">{c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.county} County</div>
                    <div className="mt-2 text-[1.0625rem] font-bold tabular-nums">{c.price}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
