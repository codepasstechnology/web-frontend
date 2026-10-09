import type { ReactNode } from "react";
import "@/components/home/home.css";
import "@/components/site/site-pages.css";
import "@/components/map/map.css";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { MapToastProvider } from "@/components/map/MapToast";

/** The site navbar over a full-height sidebar + map. */
export function MapPageShell({ children }: { children: ReactNode }) {
  return (
    <MapToastProvider>
      <div className="geo-home gs-root gm-page">
        <HomeNavbar />
        <div className="gm-app">{children}</div>
      </div>
    </MapToastProvider>
  );
}
