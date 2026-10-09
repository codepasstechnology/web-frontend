import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const TABS = [
  { label: "Land", hint: "County, town or parcel number", to: "/land" },
  { label: "Homes", hint: "Neighbourhood or estate", to: "/rentals" },
  { label: "Rentals", hint: "Where do you want to live?", to: "/rentals" },
] as const;

export function Hero() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section id="top" className="gp-hero">
      <h1 className="gp-display gp-h1 gp-anim" style={{ margin: 0 }}>
        Every plot,
        <br />
        pinned to{" "}
        <span className="gp-accent">
          the ground.
          <svg
            className="gp-underline gp-anim"
            viewBox="0 0 320 24"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M4 15 C 60 5, 130 3, 200 9 S 290 18, 316 7"
              fill="none"
              stroke="var(--gp-doodle)"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h1>

      <p className="gp-sub">Plotted land, verified homes and rentals across Kenya, on one map.</p>

      <form
        className="gp-search gp-anim"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ to: tab.to });
        }}
      >
        <div role="tablist" aria-label="What are you looking for" className="gp-tabs">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={i === active}
              className="gp-tab"
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="gp-search-row">
          <label htmlFor="home-search" className="gp-field">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gp-muted-dark)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="sr-only">Location</span>
            <input id="home-search" type="text" className="gp-input" placeholder={tab.hint} />
          </label>
          <button type="submit" className="gp-search-btn">
            Search
          </button>
        </div>
      </form>

      <a href="#story" className="gp-scroll-note gp-anim">
        <span className="gp-scroll-note-text">scroll down, the map&apos;s waiting</span>
        <svg
          className="gp-anim gp-bob"
          width="70"
          height="78"
          viewBox="0 0 70 78"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M30 4 C 8 14, 10 34, 30 36 C 46 38, 50 22, 38 20 C 24 18, 22 44, 36 70"
            stroke="var(--gp-olive)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 60 L 36 71 L 45 57"
            stroke="var(--gp-olive)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
}
