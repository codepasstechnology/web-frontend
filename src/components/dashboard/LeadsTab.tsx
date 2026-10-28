import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, Mail, MessageCircle, Phone, Plus, Search, Trash2 } from "lucide-react";
import { StatusChip, type ChipKind } from "@/components/dashboard/parts";
import { ErrorBox, Field } from "@/components/dashboard/wizard";
import {
  canManage,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  useLeads,
  useMyAgency,
  useSavedReplies,
  useSavedReplyMutations,
  useUpdateLead,
  type Lead,
  type LeadSource,
  type LeadStatus,
  type SavedReply,
} from "@/lib/agency";

const STATUS_KIND: Record<LeadStatus, ChipKind> = {
  new: "warn",
  contacted: "ok",
  viewing_booked: "ok",
  closed: "muted",
};

const STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function waUrl(phone: string, text: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 9) return null;
  return `https://wa.me/${d.startsWith("0") ? `254${d.slice(1)}` : d}?text=${encodeURIComponent(text)}`;
}

/** Every enquiry, viewing request and Call/WhatsApp tap on the agency's listings. */
export function LeadsTab() {
  const { data: agency } = useMyAgency();
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [source, setSource] = useState<LeadSource | "">("");
  const [q, setQ] = useState("");
  const locked = agency !== undefined && !agency.plan.leadInbox;
  const { data, isLoading, error } = useLeads(
    { status, source, q: q.trim() },
    agency?.plan.leadInbox === true,
  );
  const { data: replies = [] } = useSavedReplies();
  const [showReplies, setShowReplies] = useState(false);

  const counts = data?.counts ?? {};
  const total = STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0);

  if (locked) {
    const n = agency.newLeads;
    return (
      <div className="flex flex-col gap-4">
        <h1 className="gd-h1">Leads</h1>
        <div className="gd-card flex flex-col items-start gap-3">
          <strong className="text-lg">
            {n > 0
              ? `You have ${n} new ${n === 1 ? "lead" : "leads"} waiting`
              : "Your lead inbox comes with a paid agency plan"}
          </strong>
          <p className="text-muted-foreground">
            Every message and viewing request still reaches you by email, plus a summary at 7am. The
            inbox puts them in one place: reply, confirm or move viewings, use saved replies and see
            who on your team has answered.
          </p>
          {agency.myRole === "owner" ? (
            <Link to="/dashboard" search={{ tab: "billing" }} className="gd-btn">
              See agency plans
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask your agency&apos;s owner to move to a paid agency plan.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="gd-h1">Leads</h1>
        <div className="gd-card flex flex-col items-start gap-3">
          <p>{(error as Error).message}</p>
          <Link to="/pricing" search={{ audience: "agency" }} className="gd-btn">
            See agency plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="gd-r flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="gd-h1">Leads</h1>
          <p className="gd-sub">
            {canManage(agency?.myRole)
              ? "Everyone who contacted your agency."
              : "Leads assigned to you."}{" "}
            Reply fast: it shows on your agency page.
          </p>
        </div>
        <button type="button" className="gd-btn gd-o" onClick={() => setShowReplies((v) => !v)}>
          Saved replies ({replies.length})
        </button>
      </div>

      {showReplies && <SavedReplies replies={replies} editable={canManage(agency?.myRole)} />}

      <div className="gd-r flex flex-wrap gap-2" role="group" aria-label="Lead status">
        <button
          type="button"
          className="gd-chip min-h-10 text-sm"
          aria-pressed={status === ""}
          onClick={() => setStatus("")}
        >
          All ({total})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className="gd-chip min-h-10 text-sm"
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
          >
            {LEAD_STATUS_LABELS[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="gd-r flex flex-wrap gap-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search leads</span>
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="gd-input pl-9"
            placeholder="Name, phone or listing"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Source</span>
          <select
            className="gd-input"
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource | "")}
          >
            <option value="">All sources</option>
            {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="gd-spin" />
        </div>
      ) : (data?.leads.length ?? 0) === 0 ? (
        <div className="gd-card text-center text-sm text-muted-foreground">
          No leads here yet. Messages, viewing requests and Call or WhatsApp taps on your listings
          show up here.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data?.leads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              replies={replies}
              members={agency?.members ?? []}
              manages={canManage(agency?.myRole)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadRow({
  lead,
  replies,
  members,
  manages,
}: {
  lead: Lead;
  replies: SavedReply[];
  members: { userId: string; name: string }[];
  manages: boolean;
}) {
  const update = useUpdateLead();
  const [reply, setReply] = useState(
    `Hi ${lead.name?.split(" ")[0] ?? "there"}, thanks for your interest in ${lead.listingTitle ?? "our listing"}.`,
  );
  const [reschedule, setReschedule] = useState("");
  const responded = () =>
    update.mutate({
      id: lead.id,
      responded: true,
      status: lead.status === "new" ? "contacted" : undefined,
    });

  const wa = lead.phone ? waUrl(lead.phone, reply) : null;
  const tel = (lead.phone ?? "").replace(/[^\d+]/g, "");

  return (
    <li className="gd-card flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <strong>{lead.name ?? "Anonymous visitor"}</strong>
          <span className="text-sm text-muted-foreground">
            {LEAD_SOURCE_LABELS[lead.source]}
            {lead.listingTitle ? ` · ${lead.listingTitle}` : ""} · {when(lead.createdAt)}
          </span>
          {(lead.phone || lead.email) && (
            <span className="text-sm">{[lead.phone, lead.email].filter(Boolean).join(" · ")}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!lead.respondedAt &&
            lead.status === "new" &&
            (lead.source === "message" || lead.source === "viewing") && (
              <StatusChip kind="err" label="Awaiting reply" />
            )}
          <StatusChip kind={STATUS_KIND[lead.status]} label={LEAD_STATUS_LABELS[lead.status]} />
        </div>
      </div>

      {lead.message && <p className="rounded-[12px] bg-muted px-3 py-2 text-sm">{lead.message}</p>}

      {lead.source === "viewing" && lead.viewingAt && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <CalendarClock size={16} aria-hidden="true" />
          <span>
            Wants to view on <strong>{lead.preferredTime ?? when(lead.viewingAt)}</strong>
            {lead.viewingStatus && lead.viewingStatus !== "requested"
              ? ` · ${lead.viewingStatus}`
              : ""}
          </span>
          {lead.viewingStatus !== "confirmed" && lead.viewingStatus !== "declined" && (
            <>
              <button
                type="button"
                className="gd-btn gd-sm"
                onClick={() => update.mutate({ id: lead.id, viewing_status: "confirmed" })}
              >
                Confirm
              </button>
              <button
                type="button"
                className="gd-btn gd-o gd-sm"
                onClick={() => update.mutate({ id: lead.id, viewing_status: "declined" })}
              >
                Decline
              </button>
            </>
          )}
          <span className="flex items-center gap-1.5">
            <input
              type="datetime-local"
              className="gd-input h-9 min-h-0 py-0 text-sm"
              aria-label="New viewing time"
              value={reschedule}
              onChange={(e) => setReschedule(e.target.value)}
            />
            <button
              type="button"
              className="gd-btn gd-o gd-sm"
              disabled={!reschedule}
              onClick={() =>
                update.mutate({
                  id: lead.id,
                  viewing_status: "rescheduled",
                  viewing_at: new Date(reschedule).toISOString(),
                })
              }
            >
              Reschedule
            </button>
          </span>
        </div>
      )}

      {lead.phone && (
        <div className="flex flex-col gap-2">
          {replies.length > 0 && (
            <select
              className="gd-input"
              aria-label="Use a saved reply"
              defaultValue=""
              onChange={(e) => {
                const r = replies.find((x) => x.id === e.target.value);
                if (r) setReply(r.body);
              }}
            >
              <option value="">Use a saved reply…</option>
              {replies.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          )}
          <textarea
            className="gd-input"
            rows={2}
            aria-label="Reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="gd-btn gd-sm"
            onClick={responded}
          >
            <MessageCircle size={15} aria-hidden="true" /> Reply on WhatsApp
          </a>
        )}
        {tel.length >= 9 && (
          <a href={`tel:${tel}`} className="gd-btn gd-o gd-sm" onClick={responded}>
            <Phone size={15} aria-hidden="true" /> Call
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}?subject=${encodeURIComponent(lead.listingTitle ?? "Your enquiry")}&body=${encodeURIComponent(reply)}`}
            className="gd-btn gd-o gd-sm"
            onClick={responded}
          >
            <Mail size={15} aria-hidden="true" /> Email
          </a>
        )}
        <span className="flex-1" />
        <label className="flex items-center gap-1.5 text-sm">
          Status
          <select
            className="gd-input h-9 min-h-0 py-0 text-sm"
            value={lead.status}
            onChange={(e) => update.mutate({ id: lead.id, status: e.target.value as LeadStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        {manages && (
          <label className="flex items-center gap-1.5 text-sm">
            Assigned to
            <select
              className="gd-input h-9 min-h-0 py-0 text-sm"
              value={lead.assignedTo ?? ""}
              onChange={(e) => update.mutate({ id: lead.id, assigned_to: e.target.value || null })}
            >
              <option value="">Nobody</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </li>
  );
}

function SavedReplies({ replies, editable }: { replies: SavedReply[]; editable: boolean }) {
  const { create, remove } = useSavedReplyMutations();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const add = async () => {
    setError("");
    try {
      await create.mutateAsync({ title: title.trim(), body: body.trim() });
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that reply.");
    }
  };

  return (
    <section className="gd-card flex flex-col gap-3">
      <div>
        <h2 className="gd-h2">Saved replies</h2>
        <p className="gd-sub mt-1 text-sm">
          Answers to the questions you get every day, ready to send in one tap.
        </p>
      </div>
      {replies.map((r) => (
        <div
          key={r.id}
          className="flex items-start justify-between gap-3 rounded-[14px] border border-border px-3.5 py-2.5"
        >
          <span className="flex flex-col gap-0.5">
            <strong className="text-sm">{r.title}</strong>
            <span className="text-sm text-muted-foreground">{r.body}</span>
          </span>
          {editable && (
            <button
              type="button"
              className="gd-ib"
              aria-label={`Delete ${r.title}`}
              onClick={() => remove.mutate(r.id)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      {editable && (
        <div className="gd-form2">
          <Field id="sr-title" label="Title">
            <input
              id="sr-title"
              className="gd-input"
              maxLength={80}
              placeholder="Still available?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field id="sr-body" label="Reply" full>
            <textarea
              id="sr-body"
              className="gd-input"
              rows={2}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <button
            type="button"
            className="gd-btn self-start"
            onClick={add}
            disabled={!title.trim() || !body.trim() || create.isPending}
          >
            <Plus size={16} aria-hidden="true" /> Save reply
          </button>
        </div>
      )}
      {error && <ErrorBox>{error}</ErrorBox>}
    </section>
  );
}
