import { Logo } from "land-eye-kenya-frontend";

export const Default = () => <Logo />;

export const Large = () => <Logo className="scale-150 origin-left" />;

export const InHeader = () => (
  <div className="flex w-[32rem] items-center justify-between border-b border-border bg-card px-4 py-3">
    <Logo />
    <div className="flex gap-4 text-sm font-medium text-muted-foreground">
      <span>Land</span>
      <span>Rentals</span>
      <span>Pricing</span>
    </div>
  </div>
);
