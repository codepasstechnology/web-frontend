import {
  Logo,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "land-eye-kenya-frontend";
import { BarChart3, LayoutGrid, List, Settings, ShieldCheck, Upload, Wallet } from "lucide-react";

const items = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "My Listings", icon: List, badge: "12" },
  { label: "Upload", icon: Upload },
  { label: "Analytics", icon: BarChart3 },
  { label: "Billing & Plan", icon: Wallet },
  { label: "KYC Status", icon: ShieldCheck },
];

export const Dashboard = () => (
  <SidebarProvider className="min-h-0 h-[30rem] w-64">
    <Sidebar collapsible="none" className="h-full border-r border-border">
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.label}>
                  <SidebarMenuButton isActive={it.active}>
                    <it.icon /> <span>{it.label}</span>
                  </SidebarMenuButton>
                  {it.badge && <SidebarMenuBadge>{it.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings /> <span>Account settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  </SidebarProvider>
);
