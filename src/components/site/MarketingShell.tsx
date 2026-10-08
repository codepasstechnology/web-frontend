import type { ReactNode } from "react";
import "@/components/home/home.css";
import "./site-pages.css";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeNavbar } from "@/components/home/HomeNavbar";

/** The home page's navbar and footer around the Pricing, Blog, About, Help and Contact pages. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="geo-home gs-root">
      <HomeNavbar />
      <main>{children}</main>
      <HomeFooter />
    </div>
  );
}
