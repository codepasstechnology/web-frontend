import { Progress } from "land-eye-kenya-frontend";

export const Upload = () => (
  <div className="grid w-80 gap-2">
    <div className="flex justify-between text-sm">
      <span className="text-foreground">Uploading title deed…</span>
      <span className="text-muted-foreground">62%</span>
    </div>
    <Progress value={62} />
  </div>
);

export const PlanUsage = () => (
  <div className="grid w-80 gap-2">
    <div className="flex justify-between text-sm">
      <span className="text-foreground">Listings used</span>
      <span className="text-muted-foreground">9 of 10</span>
    </div>
    <Progress value={90} />
  </div>
);
