import { LogoMark } from "land-eye-kenya-frontend";

export const Sizes = () => (
  <div className="flex items-end gap-4">
    <LogoMark className="h-6" />
    <LogoMark className="h-10" />
    <LogoMark className="h-16" />
  </div>
);

export const OnNavy = () => (
  <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary">
    <LogoMark className="h-14" />
  </div>
);
