import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-muted/40">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-3 px-4 py-14 md:px-8 md:py-20">
        {eyebrow && (
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand">{eyebrow}</div>
        )}
        <h1 className="max-w-[24ch] text-balance text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">
          {title}
        </h1>
        {children}
      </div>
    </header>
  );
}
