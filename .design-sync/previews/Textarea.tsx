import { Label, Textarea } from "land-eye-kenya-frontend";

export const WithLabel = () => (
  <div className="grid w-80 gap-1.5">
    <Label htmlFor="desc">Description</Label>
    <Textarea
      id="desc"
      rows={4}
      defaultValue="Gentle slope, 400 m to tarmac, water and power on site. Title deed ready for transfer."
    />
    <p className="text-xs text-muted-foreground">Buyers see this on the listing page.</p>
  </div>
);

export const Empty = () => (
  <Textarea
    className="w-80"
    placeholder="Tell buyers about access roads, utilities and nearby schools…"
  />
);
