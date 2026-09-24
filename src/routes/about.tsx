import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPinned, ShieldCheck, Users, Target, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — GeoPin Properties Kenya" }] }),
  component: AboutPage,
});

const values = [
  {
    icon: ShieldCheck,
    title: "Transparency first",
    body: "Every data point we surface is traceable to a government source. We never fabricate, interpolate, or hide uncertainty.",
  },
  {
    icon: Users,
    title: "Built for Kenyans",
    body: "Our team lives and works in Nairobi. We understand the local market, the bureaucracy, and what's at stake when a deal goes wrong.",
  },
  {
    icon: Target,
    title: "Speed without shortcuts",
    body: "We automate the tedious parts — searches, cross-checks, report generation — so professionals can focus on judgment, not paperwork.",
  },
];

const team = [
  { name: "Amina Ochieng", role: "Co-founder & CEO", initials: "AO" },
  { name: "Brian Kamau", role: "Co-founder & CTO", initials: "BK" },
  { name: "Christine Mwangi", role: "Head of Data", initials: "CM" },
  { name: "David Njoroge", role: "Head of Product", initials: "DN" },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <MapPinned className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Making land ownership
            <br />
            <span className="text-primary">safe and transparent</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
            GeoPin Properties was founded in Nairobi in 2023 with a single mission: eliminate land
            fraud in Kenya by putting verified, government-sourced data in the hands of every buyer,
            seller, and professional.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-px bg-border md:grid-cols-4">
          {[
            { value: "40 000+", label: "Parcels verified" },
            { value: "12 000+", label: "Registered users" },
            { value: "47", label: "Counties covered" },
            { value: "< 2 min", label: "Avg. verification time" },
          ].map((s) => (
            <div key={s.label} className="bg-background py-8 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold text-foreground">Our story</h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The idea for GeoPin Properties came from a painful experience. Our co-founder Brian
              watched his family lose a plot in Kiambu to a double-allocation — a fraud that went
              undiscovered until after the title deed was transferred. The process to rectify it
              took four years and cost more than the land itself.
            </p>
            <p>
              We asked a simple question: why does verifying a parcel still require weeks of manual
              searches, physical visits, and chasing clerks? The data exists in government systems.
              The problem is access, speed, and presentation.
            </p>
            <p>
              We spent 18 months aggregating data from public land records, the Kenya National
              Bureau of Statistics, and county authorities to build a platform that surfaces all
              critical verification signals in one place — in minutes, not weeks.
            </p>
            <p>
              Today GeoPin Properties serves individual buyers, real estate agents, lawyers, and
              SACCO mortgage departments. We are proud to be a Nairobi-built product solving a
              uniquely Kenyan problem.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold text-foreground">What we stand for</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold text-foreground">The team</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            A small, focused team based in Nairobi.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {member.initials}
                </div>
                <p className="mt-3 font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary py-14 text-center">
        <h2 className="text-2xl font-bold text-primary-foreground">Ready to verify?</h2>
        <p className="mt-2 text-sm text-primary-foreground/70">
          Join 12 000+ Kenyans who transact with confidence.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-white/90"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/land"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Browse parcels
          </Link>
        </div>
      </section>
    </div>
  );
}
