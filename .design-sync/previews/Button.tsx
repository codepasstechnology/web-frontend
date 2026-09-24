import { Button } from "land-eye-kenya-frontend";
import { Plus, Trash2, Download, MapPin } from "lucide-react";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button>List a property</Button>
    <Button variant="secondary">Save search</Button>
    <Button variant="outline">View on map</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">Delete listing</Button>
    <Button variant="link">Read the guide</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button size="sm">Small</Button>
    <Button>Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Show on map">
      <MapPin />
    </Button>
  </div>
);

export const WithIcons = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button>
      <Plus /> New listing
    </Button>
    <Button variant="outline">
      <Download /> Export CSV
    </Button>
    <Button variant="destructive" size="sm">
      <Trash2 /> Remove
    </Button>
  </div>
);

export const BrandCta = () => (
  <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Find verified land</Button>
);

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button disabled>Publishing…</Button>
    <Button variant="outline" disabled>
      Export CSV
    </Button>
  </div>
);
