import { Separator } from "land-eye-kenya-frontend";

export const Horizontal = () => (
  <div className="w-72">
    <p className="text-sm font-medium text-foreground">Kitengela Prime Plot</p>
    <p className="text-sm text-muted-foreground">KAJ/KTG/4521</p>
    <Separator className="my-3" />
    <p className="text-sm text-muted-foreground">Listed 3 days ago</p>
  </div>
);

export const Vertical = () => (
  <div className="flex h-5 items-center gap-3 text-sm text-foreground">
    <span>Land</span>
    <Separator orientation="vertical" />
    <span>Rentals</span>
    <Separator orientation="vertical" />
    <span>Pricing</span>
  </div>
);
