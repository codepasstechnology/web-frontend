import { AspectRatio } from "land-eye-kenya-frontend";

export const PhotoFrame = () => (
  <div className="w-80">
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        16 : 9 — cover photo
      </div>
    </AspectRatio>
  </div>
);

export const Square = () => (
  <div className="w-40">
    <AspectRatio ratio={1} className="rounded-lg border border-dashed border-border bg-card">
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">1 : 1</div>
    </AspectRatio>
  </div>
);
