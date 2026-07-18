import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage } from "@/components/LegalDocPage";

export const Route = createFileRoute("/data-usage")({
  head: () => ({ meta: [{ title: "Data Usage — LandConnect Kenya" }] }),
  component: () => <LegalDocPage type="data-usage" />,
});
