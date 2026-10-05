import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/HomePage";

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Caveat:wght@500;700&display=swap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Geo Pin Properties — Home" }],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: FONTS_URL },
    ],
  }),
  component: HomePage,
});
