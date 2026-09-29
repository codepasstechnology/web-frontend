import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const steps = [
  { title: "Upload documents", body: "The seller uploads the title deed and photos." },
  { title: "Draw the boundary", body: "The seller traces the parcel outline on the map." },
  { title: "Identity check", body: "KYC confirms the seller is who they say they are." },
  {
    title: "Registry search",
    body: "We check the title against the land registry. It passes, and the Verified badge goes on.",
  },
];

export function VerificationSection() {
  return (
    <section
      aria-labelledby="verification-title"
      className="mx-auto mt-20 grid max-w-[1100px] items-center gap-10 px-4 md:mt-[120px] md:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16"
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
            Verification
          </div>
          <h2
            id="verification-title"
            className="text-balance text-[clamp(1.75rem,3.6vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          >
            How we verify every listing
          </h2>
          <p className="max-w-[52ch] text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
            Four checks before a listing goes live. Only listings that pass all four get the
            Verified badge.
          </p>
        </div>

        <ol className="relative grid gap-6 md:grid-cols-4 md:gap-5">
          <li
            aria-hidden
            className="absolute bottom-5 left-[19px] top-5 w-0.5 bg-border md:hidden"
          />
          <li
            aria-hidden
            className="absolute left-5 right-5 top-[19px] hidden h-0.5 bg-border md:block"
          />
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={s.title} className="relative flex gap-3.5 md:flex-col">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    last
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {last ? (
                    <Check aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[0.9375rem] font-bold leading-snug">{s.title}</h3>
                  <p className="text-sm leading-normal text-muted-foreground">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <article
        aria-label="Sample parcel report"
        className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-[0_10px_30px_-12px_rgb(15_23_42/0.18)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Parcel report · sample
          </div>
          <Badge className="border-transparent bg-success/10 text-success shadow-none hover:bg-success/10">
            Verified
          </Badge>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <svg
            viewBox="0 0 400 170"
            role="img"
            aria-label="Parcel boundary on map"
            className="block h-auto w-full"
          >
            <path
              d="M0 42h400M0 85h400M0 128h400M57 0v170M114 0v170M171 0v170M228 0v170M285 0v170M342 0v170"
              stroke="var(--border)"
            />
            <path
              d="M0 150 C80 138 160 150 260 130 S360 120 400 112"
              fill="none"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.45}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <polygon
              points="300,30 372,36 366,104 296,108"
              fill="var(--warning)"
              fillOpacity={0.14}
              stroke="var(--warning)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <polygon
              points="112,34 268,28 286,112 240,128 104,120"
              fill="var(--success)"
              fillOpacity={0.18}
              stroke="var(--success)"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <circle cx="192" cy="78" r="5" fill="var(--success)" />
          </svg>
        </div>

        <dl className="grid grid-cols-2 gap-2">
          {[
            ["Parcel no.", "KJA/KAJ/0149"],
            ["Size", "0.25 ha · ⅝ acre"],
            ["Status", null],
            ["To tarmac", "350 m"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-border px-3 py-2">
              <dt className="text-[0.6875rem] text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-[0.8125rem] font-semibold tabular-nums">
                {value ?? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 text-xs text-success">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                    Available
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2">
          <div className="text-[0.6875rem] text-muted-foreground">Nearby</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              ["School", "1.2 km"],
              ["Hospital", "4.5 km"],
              ["Shopping", "2.8 km"],
            ].map(([place, distance]) => (
              <div key={place} className="flex flex-col gap-0.5">
                <span className="font-semibold">{place}</span>
                <span className="text-muted-foreground">{distance}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">Electricity</Badge>
          <Badge variant="secondary">Water</Badge>
          <Badge variant="outline">No sewer</Badge>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Development score</span>
            <span className="text-sm font-bold tabular-nums">
              78<span className="font-medium text-muted-foreground"> / 100</span>
            </span>
          </div>
          <Progress value={78} aria-label="Development score 78 out of 100" />
        </div>

        <div
          role="note"
          className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2.5 text-[0.8125rem] font-medium text-warning"
        >
          <AlertTriangle aria-hidden className="mt-px h-4 w-4 shrink-0" />
          Adjacent parcel has an active caveat
        </div>
      </article>
    </section>
  );
}
