import { useEffect, useState } from "react";

export const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const SATELLITE_ATTRIBUTION = "Tiles &copy; Esri";
export const STREET_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const STREET_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Dark mode has no tiles of its own: map.css darkens the street tiles with a filter. */
export const DARK_TILES_CLASS = "gm-dark-tiles";

/** Follows the `dark` class useTheme puts on <html>. */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(() =>
    typeof document === "undefined" ? false : document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setDark(el.classList.contains("dark")));
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}
