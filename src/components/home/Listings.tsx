import { Link } from "@tanstack/react-router";
import { usePublicParcels } from "@/lib/parcels";
import { INTENT_LABELS, formatPrice, usePublicProperties } from "@/lib/properties";

type Card = {
  key: string;
  to: "/land" | "/rentals";
  tag: string;
  title: string;
  place: string;
  price: string;
  photo: string | null;
  featured: boolean;
};

export function Listings() {
  const { data: parcels = [] } = usePublicParcels();
  const { data: properties = [] } = usePublicProperties();

  const cards: Card[] = [
    ...properties.map((p): Card => ({
      key: `property-${p.id}`,
      to: "/rentals",
      tag: INTENT_LABELS[p.intent],
      title: p.title,
      place: [p.area, p.county].filter(Boolean).join(", "),
      price: formatPrice(p.price, p.pricePeriod),
      photo: p.photos[0] ?? null,
      featured: p.featured,
    })),
    ...parcels.map((p): Card => ({
      key: `parcel-${p.id}`,
      to: "/land",
      tag: p.listingType === "lease" ? "To lease" : "Land",
      title: `Parcel ${p.parcelNumber}`,
      place: p.county,
      price: formatPrice(p.price, "total"),
      photo: p.coverPhotoUrl,
      featured: p.featured,
    })),
  ]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3);

  if (cards.length === 0) return null;

  return (
    <section id="listings" className="gp-listings">
      <div className="gp-listings-inner">
        <div className="gp-listings-head gp-reveal">
          <div className="gp-sparkle-row">
            <h2 className="gp-h2-listings">Fresh on the map.</h2>
            <svg
              width="34"
              height="34"
              viewBox="0 0 34 34"
              fill="none"
              aria-hidden="true"
              style={{ transform: "rotate(12deg)" }}
            >
              <path
                d="M17 3 C 18 12, 20 15, 31 17 C 20 19, 18 22, 17 31 C 16 22, 14 19, 3 17 C 14 15, 16 12, 17 3 Z"
                stroke="#3F5A2A"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Link to="/land" className="gp-view-all">
            View all listings ›
          </Link>
        </div>

        <div className="gp-cards">
          {cards.map((c) => (
            <Link key={c.key} to={c.to} className="gp-listing-card gp-reveal">
              <div className="gp-photo">{c.photo && <img src={c.photo} alt="" />}</div>
              <div className="gp-listing-body">
                <span className="gp-tag">{c.tag}</span>
                <span className="gp-listing-title">{c.title}</span>
                {c.place && <span className="gp-listing-place">{c.place}</span>}
                <span className="gp-listing-price">{c.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
