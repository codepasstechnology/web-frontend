import { useRef, useState } from "react";
import { FileUp, ListChecks, X } from "lucide-react";
import { toast } from "sonner";
import { ErrorBox, Field } from "@/components/dashboard/wizard";
import { useBulkTools } from "@/lib/agency";
import { formatPrice, type MyProperty } from "@/lib/properties";
import { formatThousands, toDigits } from "@/lib/utils";

type Action = "price" | "taken" | "available" | "pause" | "resume";

const ACTIONS: [Action, string][] = [
  ["price", "Change price"],
  ["taken", "Mark as taken"],
  ["available", "Mark as available again"],
  ["pause", "Pause"],
  ["resume", "Make live"],
];

const TEMPLATE =
  "title,county,area,intent,type,price,bedrooms,bathrooms,furnished,latitude,longitude,description\n" +
  "Ruaka 1BR Apartment,Kiambu,Ruaka,rent,apartment,25000,1,1,no,-1.2101,36.7766,Near Two Rivers\n";

/** Edit many rentals at once, and import a spreadsheet of new ones. */
export function BulkTools({ properties }: { properties: MyProperty[] }) {
  const { update, importCsv } = useBulkTools();
  const [open, setOpen] = useState<"edit" | "import" | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<Action>("price");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const apply = async () => {
    setError("");
    try {
      const res = await update.mutateAsync({
        ids: selected,
        action,
        price: action === "price" ? Number(price) : undefined,
      });
      toast.success(`${res.changed} updated${res.skipped ? `, ${res.skipped} skipped` : ""}.`);
      if (res.message) toast.message(res.message);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update those listings.");
    }
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    setErrors([]);
    try {
      const res = await importCsv.mutateAsync(f);
      toast.success(res.message);
      setErrors(res.errors);
    } catch (err) {
      const e = err as { message?: string; errors?: { line: number; message: string }[] };
      setError(e?.message ?? "Couldn't import that file.");
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "geo-pin-listings-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        className="gd-btn gd-o"
        onClick={() => setOpen(open === "edit" ? null : "edit")}
      >
        <ListChecks size={17} aria-hidden="true" /> Bulk edit
      </button>
      <button
        type="button"
        className="gd-btn gd-o"
        onClick={() => setOpen(open === "import" ? null : "import")}
      >
        <FileUp size={17} aria-hidden="true" /> Import CSV
      </button>

      {open && (
        <section
          className="gd-card col-span-full flex w-full flex-col gap-3"
          aria-label={open === "edit" ? "Bulk edit" : "Import listings"}
        >
          <div className="flex items-center justify-between">
            <h2 className="gd-h2">
              {open === "edit" ? "Bulk edit rentals" : "Import listings from a spreadsheet"}
            </h2>
            <button
              type="button"
              className="gd-ib"
              aria-label="Close"
              onClick={() => setOpen(null)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {open === "edit" ? (
            <>
              {properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rentals or homes to edit yet.</p>
              ) : (
                <ul className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto">
                  <li>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={selected.length === properties.length}
                        onChange={(e) =>
                          setSelected(e.target.checked ? properties.map((p) => p.id) : [])
                        }
                      />
                      Select all ({properties.length})
                    </label>
                  </li>
                  {properties.map((p) => (
                    <li key={p.id}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggle(p.id)}
                        />
                        <span className="min-w-0 flex-1 truncate">{p.title}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatPrice(p.price, p.pricePeriod)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <Field id="bk-action" label="Do this">
                  <select
                    id="bk-action"
                    className="gd-input"
                    value={action}
                    onChange={(e) => setAction(e.target.value as Action)}
                  >
                    {ACTIONS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                {action === "price" && (
                  <Field id="bk-price" label="New price (KES)">
                    <input
                      id="bk-price"
                      className="gd-input"
                      inputMode="numeric"
                      value={formatThousands(price)}
                      onChange={(e) => setPrice(toDigits(e.target.value))}
                    />
                  </Field>
                )}
                <button
                  type="button"
                  className="gd-btn"
                  onClick={apply}
                  disabled={
                    selected.length === 0 ||
                    update.isPending ||
                    (action === "price" && !(Number(price) > 0))
                  }
                >
                  {update.isPending ? "Updating…" : `Apply to ${selected.length}`}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Buildings with unit types keep their unit prices; change those on the listing
                itself.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm">
                One row per listing. Imported listings go to review like any other and have no
                photos yet, so add those after. Up to 200 at a time.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="gd-btn gd-o" onClick={downloadTemplate}>
                  Download the template
                </button>
                <input
                  ref={file}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  aria-label="Choose a CSV file"
                  onChange={(e) => onImport(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="gd-btn"
                  onClick={() => file.current?.click()}
                  disabled={importCsv.isPending}
                >
                  <FileUp size={16} aria-hidden="true" />{" "}
                  {importCsv.isPending ? "Importing…" : "Choose CSV file"}
                </button>
              </div>
              {errors.length > 0 && (
                <div className="rounded-[14px] bg-warning-subtle px-3.5 py-3 text-sm text-warning">
                  <strong>Some rows weren&apos;t imported:</strong>
                  <ul className="mt-1 list-disc pl-5">
                    {errors.map((e) => (
                      <li key={e.line}>
                        Line {e.line}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {error && <ErrorBox>{error}</ErrorBox>}
        </section>
      )}
    </>
  );
}
