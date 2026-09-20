import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage } from "@/components/LegalDocPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — GeoPin Properties Kenya" }] }),
  component: () => <LegalDocPage type="terms" />,
});
