import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "@/components/maintenance/MaintenancePage";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Down for maintenance — Geo Pin Properties Kenya" },
      { name: "robots", content: "noindex" },
    ],
    links: MARKETING_FONT_LINKS,
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    from: typeof s.from === "string" ? s.from : undefined,
  }),
  component: MaintenanceRoute,
});

function MaintenanceRoute() {
  const { from } = Route.useSearch();
  return <MaintenancePage from={from} />;
}
