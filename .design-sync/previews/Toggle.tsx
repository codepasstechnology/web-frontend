import { Toggle } from "land-eye-kenya-frontend";
import { Bookmark, Layers, Satellite } from "lucide-react";

export const States = () => (
  <div className="flex items-center gap-2">
    <Toggle aria-label="Save parcel" defaultPressed>
      <Bookmark /> Saved
    </Toggle>
    <Toggle aria-label="Satellite view">
      <Satellite /> Satellite
    </Toggle>
    <Toggle variant="outline" aria-label="Show boundaries" defaultPressed>
      <Layers /> Boundaries
    </Toggle>
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-2">
    <Toggle size="sm" variant="outline">Small</Toggle>
    <Toggle variant="outline">Default</Toggle>
    <Toggle size="lg" variant="outline">Large</Toggle>
  </div>
);
