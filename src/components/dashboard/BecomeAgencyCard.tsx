import { useState } from "react";
import { Building2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ErrorBox, Field, ToggleChips } from "@/components/dashboard/wizard";
import { SPECIALTIES, SPECIALTY_LABELS, useCreateAgency, type Specialty } from "@/lib/agency";
import { kenyaCounties } from "@/lib/plans";
import { useSettingFlag } from "@/lib/settings";

/** Turns an individual account into an agency on the Agency Free plan. */
export function BecomeAgencyCard() {
  const enabled = useSettingFlag("agency_accounts_enabled");
  const navigate = useNavigate();
  const create = useCreateAgency();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [error, setError] = useState("");

  if (!enabled) return null;

  const submit = async () => {
    setError("");
    try {
      await create.mutateAsync({ name: name.trim(), areas, specialties });
      navigate({ to: "/dashboard", search: { tab: "agency" } });
    } catch (err) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      setError(
        Object.values(e?.errors ?? {})[0]?.[0] ?? e?.message ?? "Couldn't set up your agency.",
      );
    }
  };

  return (
    <section className="gd-r gd-card mb-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="gd-kico">
          <Building2 size={18} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="gd-h2">Switch to an agency account</h2>
          <p className="gd-sub mt-1 text-sm">
            Get a branded agency page and your logo on every listing, free. Paid agency plans add a
            team, a lead inbox and multi-unit buildings. Your current listings move under the
            agency.
          </p>
        </div>
        {!open && (
          <button type="button" className="gd-btn" onClick={() => setOpen(true)}>
            Get started
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="gd-form2">
            <Field id="ba-name" label="Agency name" full>
              <input
                id="ba-name"
                className="gd-input"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Savannah Realty"
              />
            </Field>
            <Field label="What you list" full>
              <ToggleChips
                options={SPECIALTIES.map((s) => SPECIALTY_LABELS[s])}
                selected={specialties.map((s) => SPECIALTY_LABELS[s])}
                onChange={(labels) =>
                  setSpecialties(SPECIALTIES.filter((s) => labels.includes(SPECIALTY_LABELS[s])))
                }
              />
            </Field>
            <Field label="Counties you work in" full>
              <ToggleChips options={kenyaCounties} selected={areas} onChange={setAreas} />
            </Field>
          </div>
          {error && <ErrorBox>{error}</ErrorBox>}
          <div className="flex gap-2">
            <button
              type="button"
              className="gd-btn"
              onClick={submit}
              disabled={name.trim().length < 2 || create.isPending}
            >
              {create.isPending ? "Setting up…" : "Create my agency"}
            </button>
            <button type="button" className="gd-btn gd-o" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
    </section>
  );
}
