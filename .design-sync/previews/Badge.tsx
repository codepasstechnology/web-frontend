import { Badge } from "land-eye-kenya-frontend";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge>Featured</Badge>
    <Badge variant="secondary">Lease</Badge>
    <Badge variant="outline">Kajiado</Badge>
    <Badge variant="destructive">Disputed</Badge>
  </div>
);

export const ListingStatus = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge className="border-transparent bg-success/10 text-success">Verified</Badge>
    <Badge className="border-transparent bg-warning/10 text-warning">Pending review</Badge>
    <Badge className="border-transparent bg-muted text-muted-foreground">Sold</Badge>
    <Badge className="border-transparent bg-brand text-brand-foreground">New</Badge>
  </div>
);
