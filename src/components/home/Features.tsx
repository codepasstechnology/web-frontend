const ITEMS: { title: string; body: string; paths: string[] }[] = [
  {
    title: "Plotted parcel maps",
    body: "Boundaries on the map, not in a caption.",
    paths: ["M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z", "M9 3v15M15 6v15"],
  },
  {
    title: "Verified properties",
    body: "A clear badge on every checked listing.",
    paths: ["M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z", "m8.5 12 2.5 2.5 4.5-5"],
  },
  {
    title: "Rentals near you",
    body: "By neighbourhood, commute and budget.",
    paths: ["M3 11l9-7 9 7", "M5 10v10h14V10", "M10 20v-6h4v6"],
  },
  {
    title: "Area insights",
    body: "Roads, water, power and zoning around any pin.",
    paths: ["M4 20V10M10 20V4M16 20v-7M22 20H2"],
  },
];

export function Features() {
  return (
    <section className="gp-features">
      <div className="gp-features-inner">
        <h2 className="gp-display gp-reveal gp-h2-features">
          More than listings.
          <br />
          <span style={{ color: "var(--gp-sage)" }}>Land intelligence.</span>
        </h2>
        <div className="gp-feature-grid">
          {ITEMS.map((item) => (
            <div key={item.title} className="gp-reveal gp-feature">
              <span className="gp-blob">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2F4520"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {item.paths.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </svg>
              </span>
              <h3 className="gp-feature-title">{item.title}</h3>
              <p className="gp-feature-body">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
