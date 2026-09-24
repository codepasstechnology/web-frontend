import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage } from "@/components/LegalDocPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — GeoPin Properties Kenya" }] }),
  component: () => <LegalDocPage type="privacy" />,
});
