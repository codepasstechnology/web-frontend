import { useState } from "react";
import { MailPlus, UserMinus, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ErrorBox, Field, Segmented } from "@/components/dashboard/wizard";
import { useAuth } from "@/lib/auth";
import { useMyAgency, useTeam, useTeamMutations, type TeamMember } from "@/lib/agency";

const ROLE_LABELS = { owner: "Owner", manager: "Manager", agent: "Agent" } as const;

function errorText(err: unknown, fallback: string): string {
  const e = err as { errors?: Record<string, string[]>; message?: string };
  return Object.values(e?.errors ?? {})[0]?.[0] ?? e?.message ?? fallback;
}

/** Who is on the agency, their roles, and invitations to join. */
export function TeamTab() {
  const { user, reloadUser } = useAuth();
  const navigate = useNavigate();
  const { data: agency } = useMyAgency();
  const { data: team, isLoading } = useTeam();
  const { invite, cancelInvite, setRole, remove } = useTeamMutations();
  const [email, setEmail] = useState("");
  const [role, setInviteRole] = useState<"agent" | "manager">("agent");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [transferTo, setTransferTo] = useState("");

  const isOwner = agency?.myRole === "owner";
  const seats = team?.seats ?? 1;
  const used = (team?.members.length ?? 0) + (team?.invitations.length ?? 0);

  const sendInvite = async () => {
    setNote(null);
    try {
      await invite.mutateAsync({ email: email.trim(), role });
      setEmail("");
      setNote({ ok: true, text: "Invitation sent. It's valid for 7 days." });
    } catch (err) {
      setNote({ ok: false, text: errorText(err, "Couldn't send the invitation.") });
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setNote(null);
    const leaving = removing.userId === user?.id;
    try {
      await remove.mutateAsync({ id: removing.id, transferTo: transferTo || undefined });
      setRemoving(null);
      setTransferTo("");
      if (leaving) {
        await reloadUser();
        navigate({ to: "/dashboard", search: { tab: "overview" } });
      }
    } catch (err) {
      setNote({ ok: false, text: errorText(err, "Couldn't do that.") });
    }
  };

  if (isLoading || !team) {
    return (
      <div className="flex justify-center py-16">
        <span className="gd-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="gd-r">
        <h1 className="gd-h1">Team</h1>
        <p className="gd-sub">
          Everyone here posts under {agency?.name ?? "your agency"}.{" "}
          {seats === -1 ? "Unlimited seats" : `${used} of ${seats} seats used`}.
        </p>
      </div>

      <section className="gd-r gd-card flex flex-col gap-3">
        <h2 className="gd-h2">Members</h2>
        <ul className="flex flex-col gap-2">
          {team.members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border px-3.5 py-3"
            >
              <span className="flex min-w-0 flex-col">
                <strong className="text-sm">
                  {m.name}
                  {m.userId === user?.id ? " (you)" : ""}
                </strong>
                <span className="text-xs text-muted-foreground">
                  {m.email} · {m.listings} {m.listings === 1 ? "listing" : "listings"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {isOwner && m.role !== "owner" ? (
                  <select
                    className="gd-input h-9 min-h-0 py-0 text-sm"
                    aria-label={`Role for ${m.name}`}
                    value={m.role}
                    onChange={(e) =>
                      setRole.mutate({ id: m.id, role: e.target.value as "manager" | "agent" })
                    }
                  >
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                  </select>
                ) : (
                  <span className="gd-st" data-k={m.role === "owner" ? "ok" : "muted"}>
                    {ROLE_LABELS[m.role]}
                  </span>
                )}
                {m.role !== "owner" && (isOwner || m.userId === user?.id) && (
                  <button
                    type="button"
                    className="gd-btn gd-o gd-sm"
                    onClick={() => {
                      setRemoving(m);
                      setTransferTo("");
                    }}
                  >
                    <UserMinus size={15} aria-hidden="true" />{" "}
                    {m.userId === user?.id ? "Leave" : "Remove"}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Owners handle billing and the team. Managers work on every listing and lead. Agents see
          their own.
        </p>
      </section>

      {removing && (
        <section className="gd-r gd-card flex flex-col gap-3" aria-live="polite">
          <h2 className="gd-h2">
            {removing.userId === user?.id ? "Leave the agency" : `Remove ${removing.name}`}
          </h2>
          <p className="text-sm">
            {removing.listings > 0
              ? `Their ${removing.listings} ${removing.listings === 1 ? "listing stays" : "listings stay"} with the agency, along with their leads. Choose who takes them over.`
              : "Their leads stay with the agency. Choose who takes them over."}
          </p>
          <Field id="tm-transfer" label="Hand over to">
            <select
              id="tm-transfer"
              className="gd-input"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            >
              <option value="">The agency owner</option>
              {team.members
                .filter((m) => m.id !== removing.id && m.role !== "owner")
                .map((m) => (
                  <option key={m.id} value={m.userId}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
          <div className="flex gap-2">
            <button
              type="button"
              className="gd-btn"
              onClick={confirmRemove}
              disabled={remove.isPending}
            >
              {removing.userId === user?.id ? "Leave agency" : "Remove from team"}
            </button>
            <button type="button" className="gd-btn gd-o" onClick={() => setRemoving(null)}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {isOwner && (
        <section className="gd-r gd-card flex flex-col gap-3">
          <h2 className="gd-h2">Invite someone</h2>
          <div className="gd-form2">
            <Field id="tm-email" label="Email">
              <input
                id="tm-email"
                className="gd-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Role">
              <Segmented
                label="Role"
                value={role}
                grid
                options={[
                  ["agent", "Agent"],
                  ["manager", "Manager"],
                ]}
                onChange={setInviteRole}
              />
            </Field>
          </div>
          <button
            type="button"
            className="gd-btn self-start"
            onClick={sendInvite}
            disabled={!email.trim() || invite.isPending || (seats !== -1 && used >= seats)}
          >
            <MailPlus size={16} aria-hidden="true" />{" "}
            {invite.isPending ? "Sending…" : "Send invitation"}
          </button>
          {seats !== -1 && used >= seats && (
            <p className="text-sm text-muted-foreground">
              Every seat on your plan is taken. Upgrade to add more people.
            </p>
          )}

          {team.invitations.length > 0 && (
            <>
              <h3 className="gd-lab mt-2">Waiting to join</h3>
              <ul className="flex flex-col gap-2">
                {team.invitations.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-dashed border-border px-3.5 py-2.5 text-sm"
                  >
                    <span>
                      {i.email} · {ROLE_LABELS[i.role]}
                    </span>
                    <button
                      type="button"
                      className="gd-ib"
                      aria-label={`Cancel invitation for ${i.email}`}
                      onClick={() => cancelInvite.mutate(i.id)}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {note &&
        (note.ok ? (
          <div
            role="status"
            className="rounded-[14px] bg-brand-subtle px-3.5 py-3 text-sm font-semibold text-brand-subtle-foreground"
          >
            {note.text}
          </div>
        ) : (
          <ErrorBox>{note.text}</ErrorBox>
        ))}
    </div>
  );
}
