import * as React from "react";

import { cn } from "@/lib/utils";

/** The Geo Pin map-pin mark. Colors follow `--brand`, so it retints with the theme. */
function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 48 58"
      role="img"
      aria-label="Geo Pin Properties"
      className={cn("h-8 w-auto", className)}
      {...props}
    >
      <path d="M24 57.94 7.03 40.97A24 24 0 1 1 40.97 40.97Z" fill="var(--brand)" />
      <circle cx="24" cy="24" r="14.6" fill="var(--card)" />
      <g fill="var(--brand)">
        <rect x="17.6" y="17.6" width="5.8" height="5.8" rx="1.2" />
        <rect x="24.6" y="17.6" width="5.8" height="5.8" rx="1.2" />
        <rect x="17.6" y="24.6" width="5.8" height="5.8" rx="1.2" />
        <rect x="24.6" y="24.6" width="5.8" height="5.8" rx="1.2" />
      </g>
    </svg>
  );
}

/** Mark + "Geo Pin / Properties" wordmark lockup for headers and footers. */
function Logo({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <LogoMark aria-hidden className="h-8" />
      <div className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight">
          <span className="text-primary">GEO</span> <span className="text-brand">PIN</span>
        </span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.3em] text-primary">
          Properties
        </span>
      </div>
    </div>
  );
}

export { Logo, LogoMark };
