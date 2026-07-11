import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage } from "@/components/LegalDocPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — LandConnect Kenya" }] }),
  component: () => <LegalDocPage type="terms" />,
});
