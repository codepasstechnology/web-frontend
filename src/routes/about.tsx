import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Target, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Geo Pin Properties Kenya" }] }),
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
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader eyebrow="About us" title="Making land ownership safe and transparent">
        <p className="max-w-[60ch] text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
          Geo Pin Properties was founded in Nairobi in 2023 with a single mission: eliminate land
          fraud in Kenya by putting verified, government-sourced data in the hands of every buyer,
          seller, and professional.
        </p>
      </PageHeader>

      <section className="mx-auto max-w-[1100px] px-4 pt-14 md:px-8 md:pt-20">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { value: "40 000+", label: "Parcels verified" },
            { value: "12 000+", label: "Registered users" },
            { value: "47", label: "Counties covered" },
            { value: "< 2 min", label: "Avg. verification time" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col-reverse rounded-xl border border-border bg-card px-5 py-6"
            >
              <dt className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {s.label}
              </dt>
              <dd className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="story-title"
        className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pt-16 md:px-8 md:pt-24"
      >
        <h2
          id="story-title"
          className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.15] tracking-[-0.02em]"
        >
          Our story
        </h2>
        <div className="flex flex-col gap-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
          <p>
            The idea for Geo Pin Properties came from a painful experience. Our co-founder Brian
            watched his family lose a plot in Kiambu to a double-allocation — a fraud that went
            undiscovered until after the title deed was transferred. The process to rectify it took
            four years and cost more than the land itself.
          </p>
          <p>
            We asked a simple question: why does verifying a parcel still require weeks of manual
            searches, physical visits, and chasing clerks? The data exists in government systems.
            The problem is access, speed, and presentation.
          </p>
          <p>
            We spent 18 months aggregating data from public land records, the Kenya National Bureau
            of Statistics, and county authorities to build a platform that surfaces all critical
            verification signals in one place — in minutes, not weeks.
          </p>
          <p>
            Today Geo Pin Properties serves individual buyers, real estate agents, lawyers, and
            SACCO mortgage departments. We are proud to be a Nairobi-built product solving a
            uniquely Kenyan problem.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="values-title"
        className="mx-auto flex max-w-[1100px] flex-col gap-10 px-4 pt-16 md:px-8 md:pt-24"
      >
        <h2
          id="values-title"
          className="text-center text-[clamp(1.75rem,3.6vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]"
        >
          What we stand for
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-7 text-card-foreground"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Icon aria-hidden className="h-6 w-6 text-brand" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="team-title"
        className="mx-auto flex max-w-[1100px] flex-col gap-10 px-4 pt-16 md:px-8 md:pt-24"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <h2
            id="team-title"
            className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          >
            The team
          </h2>
          <p className="text-[1.0625rem] text-muted-foreground">
            A small, focused team based in Nairobi.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-brand/10 text-lg font-bold text-brand">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
