import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  highlight,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  /** The closing words of the headline, inked with a hand-drawn underline. */
  highlight: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <section className="gs-wrap gs-hero">
      <span className="gs-mono gs-eyebrow">{eyebrow}</span>
      <h1 className="gs-h gs-h1">
        {title}{" "}
        <span className="gs-underline">
          {highlight}
          <svg viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M4 15 C 60 5, 130 3, 200 9 S 290 18, 316 7" />
          </svg>
        </span>
      </h1>
      <p className="gs-lede">{lede}</p>
      {children}
    </section>
  );
}
