import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "land-eye-kenya-frontend";

export const MapAndList = () => (
  <ResizablePanelGroup
    orientation="horizontal"
    className="h-48 w-[32rem] rounded-lg border border-border"
  >
    <ResizablePanel defaultSize="35">
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        Filters
      </div>
    </ResizablePanel>
    <ResizableHandle withHandle />
    <ResizablePanel defaultSize="65">
      <div className="flex h-full items-center justify-center bg-muted/50 p-4 text-sm text-muted-foreground">
        Map
      </div>
    </ResizablePanel>
  </ResizablePanelGroup>
);
