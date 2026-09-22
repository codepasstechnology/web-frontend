import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider } from "land-eye-kenya-frontend";

export const Loading = () => (
  <SidebarProvider className="min-h-0 h-56 w-64">
    <Sidebar collapsible="none" className="h-full border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {[0, 1, 2, 3, 4].map((i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  </SidebarProvider>
);
