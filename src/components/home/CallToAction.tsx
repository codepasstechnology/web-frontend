import { Link } from "@tanstack/react-router";

const SPARKLE =
  "M17 3 C 18 12, 20 15, 31 17 C 20 19, 18 22, 17 31 C 16 22, 14 19, 3 17 C 14 15, 16 12, 17 3 Z";

export function CallToAction() {
  return (
    <section id="list" className="gp-cta-wrap">
      <div className="gp-cta">
        <svg
          className="gp-doodle gp-doodle-sparkle-a"
          width="64"
          height="64"
          viewBox="0 0 34 34"
          fill="none"
          aria-hidden="true"
        >
          <path d={SPARKLE} stroke="#F1E7D2" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <svg
          className="gp-doodle gp-doodle-sparkle-b"
          width="40"
          height="40"
          viewBox="0 0 34 34"
          fill="none"
          aria-hidden="true"
        >
          <path d={SPARKLE} stroke="#F1E7D2" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
        <div className="gp-doodle gp-start" aria-hidden="true">
          <svg
            width="110"
            height="56"
            viewBox="0 0 110 56"
            fill="none"
            style={{ transform: "scaleX(-1)" }}
          >
            <path
              d="M4 50 C 30 46, 60 30, 84 8"
              stroke="#F1E7D2"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M70 10 L 85 7 L 84 22"
              stroke="#F1E7D2"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="gp-start-text">start here</span>
        </div>

        <h2 className="gp-display gp-reveal gp-h2-cta">
          Own land?
          <br />
          Put it on the map.
        </h2>
        <div className="gp-reveal gp-cta-actions">
          <Link
            to="/dashboard/upload"
            search={{ edit: undefined, type: undefined }}
            className="gp-btn-cream"
          >
            List a property
          </Link>
          <Link to="/contact" className="gp-btn-outline">
            For agents ›
          </Link>
        </div>
      </div>
    </section>
  );
}
