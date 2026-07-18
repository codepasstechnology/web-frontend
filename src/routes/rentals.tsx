import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { List, X } from "lucide-react";
import { LandMap } from "@/components/LandMap";
import { RentalPanel } from "@/components/PropertyPanel";
import { rentals, type Rental } from "@/lib/landData";

export const Route = createFileRoute("/rentals")({
  component: RentalsPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Rentals Map — LandVerify Kenya" },
      {
        name: "description",
        content: "Browse verified rental properties across Kenya on an interactive map.",
      },
    ],
  }),
});

function RentalsPage() {
  const [selected, setSelected] = useState<Rental | null>(null);
  const [listOpen, setListOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="relative flex flex-1 overflow-hidden">
        {isMobile && !listOpen && (
          <button
            onClick={() => setListOpen(true)}
            className="absolute left-3 top-3 z-[1100] flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-md md:hidden"
          >
            <List className="h-3.5 w-3.5" /> Listings
          </button>
        )}

        {isMobile && listOpen && (
          <div
            onClick={() => setListOpen(false)}
            className="fixed inset-0 z-[1050] bg-black/40 md:hidden"
          />
        )}

        {(listOpen || !isMobile) && (
          <aside
            className={`${
              isMobile ? "fixed left-0 top-0 z-[1060] h-full w-[85%] max-w-xs" : "relative w-72"
            } overflow-y-auto border-r border-border bg-card`}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Rental Listings</h3>
                <p className="text-[11px] text-muted-foreground">
                  {rentals.length} verified properties
                </p>
              </div>
              {isMobile && (
                <button
                  onClick={() => setListOpen(false)}
                  className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <ul>
              {rentals.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => {
                      setSelected(r);
                      if (isMobile) setListOpen(false);
                    }}
                    className={`flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left hover:bg-muted ${
                      selected?.id === r.id ? "bg-muted" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">{r.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.area}, {r.county}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      KES {r.price.toLocaleString()}/mo
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className="relative flex-1">
          <LandMap mode="rentals" onSelectRental={setSelected} selectedId={selected?.id ?? null} />
          {selected && <RentalPanel rental={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </div>
  );
}
