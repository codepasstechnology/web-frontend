import { useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { ToastContext, type ToastState } from "@/components/map/mapToastContext";

/** Lets anything on a map page raise the toast that MapToastOutlet draws over the map. */
export function MapToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastState["current"]>(null);
  const show = useCallback((text: string) => setCurrent({ text, key: Date.now() }), []);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 2300);
    return () => clearTimeout(t);
  }, [current]);

  return <ToastContext.Provider value={{ show, current }}>{children}</ToastContext.Provider>;
}

export function MapToastOutlet() {
  const { current } = useContext(ToastContext);
  if (!current) return null;
  return (
    <div key={current.key} className="gm-toast" role="status">
      <Check width={16} height={16} strokeWidth={2.6} aria-hidden />
      {current.text}
    </div>
  );
}
