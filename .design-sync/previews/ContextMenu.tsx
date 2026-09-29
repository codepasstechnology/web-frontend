import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "land-eye-kenya-frontend";

export const MapArea = () => (
  <ContextMenu>
    <ContextMenuTrigger className="flex h-36 w-80 items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-sm text-muted-foreground">
      Right-click the map for options
    </ContextMenuTrigger>
    <ContextMenuContent className="w-52">
      <ContextMenuItem>Drop a pin here</ContextMenuItem>
      <ContextMenuItem>Measure distance</ContextMenuItem>
      <ContextMenuItem>Copy coordinates</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);
