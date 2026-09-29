import { ToggleGroup, ToggleGroupItem } from "land-eye-kenya-frontend";
import { LayoutGrid, List, Map } from "lucide-react";

export const ViewSwitcher = () => (
  <ToggleGroup type="single" defaultValue="map" variant="outline">
    <ToggleGroupItem value="map" aria-label="Map view">
      <Map /> Map
    </ToggleGroupItem>
    <ToggleGroupItem value="grid" aria-label="Grid view">
      <LayoutGrid /> Grid
    </ToggleGroupItem>
    <ToggleGroupItem value="list" aria-label="List view">
      <List /> List
    </ToggleGroupItem>
  </ToggleGroup>
);

export const MultiFilter = () => (
  <ToggleGroup type="multiple" defaultValue={["water", "power"]}>
    <ToggleGroupItem value="water">Water</ToggleGroupItem>
    <ToggleGroupItem value="power">Power</ToggleGroupItem>
    <ToggleGroupItem value="tarmac">Tarmac</ToggleGroupItem>
  </ToggleGroup>
);
