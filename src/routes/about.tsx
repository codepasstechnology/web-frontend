import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapIcon, MapPin, ShieldCheck } from "lucide-react";
import { KenyaMeshMap } from "@/components/site/KenyaMeshMap";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [{ title: "About — Geo Pin Properties Kenya" }],
    links: MARKETING_FONT_LINKS,
  }),
  component: AboutPage,
});

const values = [
  {
    icon: ShieldCheck,
    title: "Trust comes first",
    body: "Every verified badge means we checked. When we haven't, we say so.",
  },
  {
    icon: MapIcon,
    title: "Show, don't describe",
    body: "Boundaries belong on a map, not in a caption. Seeing beats guessing.",
  },
  {
    icon: MapPin,
    title: "Built for Kenya",
    body: "Made for how land is bought, sold and rented here, county by county.",
  },
];

const verificationSteps = [
  {
    title: "The owner submits documents",
    body: "Ownership documents and the parcel's location are uploaded with the listing.",
  },
  {
    title: "We check the details",
    body: "Our team reviews the documents and matches them to the boundary on the map.",
  },
  {
    title: "The badge goes live",
    body: "Only then does the listing show the green verified badge.",
  },
];

const team = [1, 2, 3, 4].map((n) => ({ id: n, name: "[NAME]", role: "[ROLE]" }));

function AboutPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="About Geo Pin"
        title="Putting Kenya's land"
        highlight="on the map."
        lede="Buying land should not mean guessing where it starts and ends, or who you are really dealing with. We are building the map that makes land clear, verified and easy to act on."
      />

      <section
        aria-labelledby="story-title"
        className="gs-wrap gs-split"
        style={{ paddingBottom: 96, alignItems: "center" }}
      >
        <div className="gs-map-panel gs-reveal">
          <KenyaMeshMap mappedLand />
          <span className="gs-hand gs-map-note">every green dot is mapped land</span>
        </div>
        <div className="gs-reveal" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 id="story-title" className="gs-h gs-h2">
            Why we started
          </h2>
          <p className="gs-text" style={{ fontSize: 18, lineHeight: 1.7 }}>
            [Your founding story: who started Geo Pin, the problem you saw in Kenya&apos;s land
            market, and the moment you decided to fix it. Two or three short paragraphs work best.]
          </p>
          <p className="gs-text" style={{ fontSize: 18, lineHeight: 1.7 }}>
            Today, Geo Pin brings plotted parcels, verified listings and rentals together on one
            GIS-powered map, so people can see the land, check it and connect with the right person.
          </p>
          <span className="gs-hand gs-tilt">find. connect. own.</span>
        </div>
      </section>

      <section aria-labelledby="values-title" className="gs-alt">
        <div
          className="gs-wrap"
          style={{ paddingTop: 96, paddingBottom: 96, display: "grid", gap: 40 }}
        >
          <h2 id="values-title" className="gs-h gs-h2 gs-reveal">
            What we believe
          </h2>
          <div className="gs-grid">
            {values.map(({ icon: Icon, title, body }) => (
              <article key={title} className="gs-val gs-lift gs-reveal">
                <span className="gs-blob">
                  <Icon aria-hidden size={26} strokeWidth={1.8} />
                </span>
                <h3 className="gs-h" style={{ fontSize: 23, letterSpacing: "-0.02em" }}>
                  {title}
                </h3>
                <p className="gs-text" style={{ fontSize: 16 }}>
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="verification-title"
        className="gs-wrap gs-split"
        style={{ paddingTop: 96, paddingBottom: 96 }}
      >
        <div className="gs-stack gs-reveal">
          <h2 id="verification-title" className="gs-h gs-h2">
            How verification works
          </h2>
          <p className="gs-text">[Adjust these steps to match your real process.]</p>
        </div>
        <ol className="gs-steps">
          {verificationSteps.map((step, i) => (
            <li key={step.title} className="gs-step gs-reveal">
              <span className="gs-stepn">{String(i + 1).padStart(2, "0")}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h3 className="gs-h" style={{ fontSize: 21, letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p className="gs-text" style={{ fontSize: 16 }}>
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="team-title" className="gs-alt">
        <div
          className="gs-wrap"
          style={{ paddingTop: 96, paddingBottom: 96, display: "grid", gap: 40 }}
        >
          <div className="gs-reveal" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 id="team-title" className="gs-h gs-h2">
              The team
            </h2>
            <p className="gs-text">[Add your team members with a photo, name and role.]</p>
          </div>
          <div
            className="gs-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
          >
            {team.map((member) => (
              <div
                key={member.id}
                className="gs-card gs-lift gs-reveal"
                style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
              >
                <span className="gs-photo gs-mono">[PHOTO]</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 17 }}>{member.name}</span>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gs-wrap" style={{ paddingTop: 40, paddingBottom: 112 }}>
        <div className="gs-deep gs-reveal">
          <h2 className="gs-h">Come see the map.</h2>
          <p>Explore plotted land and verified properties across Kenya.</p>
          <Link to="/explore" className="gs-btn">
            Explore the map
            <ArrowRight aria-hidden size={18} className="gs-arrow" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
