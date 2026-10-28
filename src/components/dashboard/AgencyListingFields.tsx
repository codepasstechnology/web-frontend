import { Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/dashboard/wizard";
import { canManage, toLocalInput, type MyAgency } from "@/lib/agency";
import type { PropertyUnit } from "@/lib/properties";
import { formatThousands, toDigits } from "@/lib/utils";

/**
 * Who handles the listing, which project it belongs to and when it goes
 * public. Agents always handle their own listings, so they don't get a picker.
 */
export function AgencyListingFields({
  agency,
  assignedAgentId,
  projectId,
  publishAt,
  onChange,
}: {
  agency: MyAgency;
  assignedAgentId: string;
  projectId: string;
  publishAt: string;
  onChange: (patch: { assignedAgentId?: string; projectId?: string; publishAt?: string }) => void;
}) {
  return (
    <>
      <div className="col-span-full rounded-2xl bg-track px-4 py-3.5 text-sm">
        Posted as <strong>{agency.name}</strong>. Buyers see your agency&apos;s logo and contact
        details on this listing.
      </div>
      {canManage(agency.myRole) && (
        <Field
          id="p-assignee"
          label="Handled by"
          hint="Leads and calls for this listing go to this person."
        >
          <select
            id="p-assignee"
            className="gd-input"
            value={assignedAgentId}
            onChange={(e) => onChange({ assignedAgentId: e.target.value })}
          >
            <option value="">Me</option>
            {agency.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {agency.projects.length > 0 && (
        <Field id="p-project" label="Project" optional>
          <select
            id="p-project"
            className="gd-input"
            value={projectId}
            onChange={(e) => onChange({ projectId: e.target.value })}
          >
            <option value="">None</option>
            {agency.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field
        id="p-publish"
        label="Publish on"
        optional
        hint="Leave blank to go live as soon as it's approved."
      >
        <input
          id="p-publish"
          type="datetime-local"
          className="gd-input"
          min={toLocalInput(new Date().toISOString())}
          value={publishAt}
          onChange={(e) => onChange({ publishAt: e.target.value })}
        />
      </Field>
    </>
  );
}

const EMPTY_UNIT: PropertyUnit = {
  name: "",
  bedrooms: 1,
  bathrooms: 1,
  price: 0,
  totalUnits: 1,
  availableUnits: 1,
};

/** One building, many unit types: each with its price and how many are free. */
export function UnitsEditor({
  units,
  onChange,
  allowed,
  period,
}: {
  units: PropertyUnit[];
  onChange: (units: PropertyUnit[]) => void;
  allowed: boolean;
  period: string;
}) {
  if (!allowed) {
    return (
      <div className="col-span-full rounded-2xl bg-track px-4 py-3.5 text-sm text-muted-foreground">
        Listing a building with several unit types comes with an agency plan.
      </div>
    );
  }

  const patch = (i: number, p: Partial<PropertyUnit>) =>
    onChange(units.map((u, j) => (j === i ? { ...u, ...p } : u)));

  return (
    <div className="col-span-full flex flex-col gap-2">
      <span className="gd-lab">
        Unit types{" "}
        <span className="font-normal text-muted-foreground">(optional, for buildings)</span>
      </span>
      {units.length === 0 && (
        <span className="text-sm text-muted-foreground">
          Add unit types if this is a building with several flats, e.g. 1 bedroom and 2 bedroom. The
          listing then shows &ldquo;from&rdquo; the cheapest price.
        </span>
      )}
      {units.map((u, i) => (
        <div
          key={i}
          className="grid grid-cols-2 gap-2 rounded-[14px] border border-border p-3 sm:grid-cols-6"
        >
          <label className="col-span-2 sm:col-span-2">
            <span className="sr-only">Unit name</span>
            <input
              className="gd-input"
              placeholder="e.g. 2 bedroom"
              value={u.name}
              maxLength={80}
              onChange={(e) => patch(i, { name: e.target.value })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Beds</span>
            <input
              className="gd-input"
              type="number"
              min={0}
              value={u.bedrooms}
              onChange={(e) => patch(i, { bedrooms: Number(e.target.value) })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Price{period}</span>
            <input
              className="gd-input"
              inputMode="numeric"
              value={formatThousands(String(u.price || ""))}
              onChange={(e) => patch(i, { price: Number(toDigits(e.target.value)) })}
            />
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Total</span>
            <input
              className="gd-input"
              type="number"
              min={1}
              value={u.totalUnits}
              onChange={(e) => {
                const total = Math.max(1, Number(e.target.value));
                patch(i, { totalUnits: total, availableUnits: Math.min(u.availableUnits, total) });
              }}
            />
          </label>
          <label className="flex items-end gap-2">
            <span className="flex-1">
              <span className="text-xs text-muted-foreground">Available</span>
              <input
                className="gd-input"
                type="number"
                min={0}
                max={u.totalUnits}
                value={u.availableUnits}
                onChange={(e) =>
                  patch(i, {
                    availableUnits: Math.min(u.totalUnits, Math.max(0, Number(e.target.value))),
                  })
                }
              />
            </span>
            <button
              type="button"
              className="gd-ib"
              aria-label={`Remove ${u.name || "unit"}`}
              onClick={() => onChange(units.filter((_, j) => j !== i))}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </label>
        </div>
      ))}
      <button
        type="button"
        className="gd-btn gd-o self-start"
        onClick={() => onChange([...units, EMPTY_UNIT])}
        disabled={units.length >= 20}
      >
        <Plus size={16} aria-hidden="true" /> Add a unit type
      </button>
    </div>
  );
}
