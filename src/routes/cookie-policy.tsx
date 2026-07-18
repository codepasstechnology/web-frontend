import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage } from "@/components/LegalDocPage";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({ meta: [{ title: "Cookie Policy — LandConnect Kenya" }] }),
  component: () => <LegalDocPage type="cookie-policy" />,
});
