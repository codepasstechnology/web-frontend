import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage } from "@/components/LegalDocPage";

export const Route = createFileRoute("/data-usage")({
  head: () => ({ meta: [{ title: "Data Usage — GeoPin Properties Kenya" }] }),
  component: () => <LegalDocPage type="data-usage" />,
});
