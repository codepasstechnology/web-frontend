import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  DOC_TYPES,
  KYC_KEY,
  REQUIRED_DOCS,
  needsUserAction,
  useKycApplications,
  type KycApplication,
} from "@/lib/kyc";
import { LandBoundaryMap } from "@/components/LandBoundaryMap";
import { Beacon, StatusChip, type ChipKind } from "@/components/dashboard/parts";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { compressImage } from "@/lib/compressImage";

const STATUS: Record<
  string,
  { label: string; kind: ChipKind; icon: React.ReactNode; step: number }
> = {
  pending: { label: "Pending review", kind: "warn", icon: <Clock size={15} />, step: 1 },
  under_review: { label: "Under review", kind: "muted", icon: <ShieldCheck size={15} />, step: 2 },
  info_requested: {
    label: "Info requested",
    kind: "warn",
    icon: <MessageSquare size={15} />,
    step: 2,
  },
  location_correction_requested: {
    label: "Fix location",
    kind: "warn",
    icon: <MapPin size={15} />,
    step: 2,
  },
  approved: { label: "Approved", kind: "ok", icon: <Check size={15} strokeWidth={2.6} />, step: 3 },
  rejected: { label: "Rejected", kind: "err", icon: <AlertTriangle size={15} />, step: 3 },
};

const STEPS = ["Submitted", "In review", "Decision"];
const ACTIVE = ["pending", "under_review", "info_requested", "location_correction_requested"];
const REPLY_ERROR = "Couldn't send your reply. Check your connection and try again.";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

const docLabel = (type: string) => DOC_TYPES.find((t) => t.value === type)?.label ?? type;

interface UserParcel {
  id: string;
  title: string;
  parcel_number: string | null;
}

function KycCard({
  kyc,
  replied,
  locationFixed,
  onReplied,
  onLocationFixed,
  onResubmit,
  startOpen = false,
}: {
  kyc: KycApplication;
  replied: boolean;
  locationFixed: boolean;
  onReplied: (text: string, file: File | null) => void;
  onLocationFixed: (pin: [number, number], boundary: { lat: number; lng: number }[] | null) => void;
  onResubmit: () => void;
  startOpen?: boolean;
}) {
  const cfg = STATUS[kyc.status] ?? {
    label: kyc.status,
    kind: "muted" as ChipKind,
    icon: <ShieldCheck size={15} />,
    step: 1,
  };
  const alreadyReplied = !!kyc.user_reply || !!kyc.user_reply_document_path || replied;
  const isInfo = kyc.status === "info_requested";
  const isLocation = kyc.status === "location_correction_requested";
  const [expanded, setExpanded] = useState(
    startOpen ||
      (isInfo && !alreadyReplied) ||
      (isLocation && !locationFixed) ||
      !!kyc.admin_acknowledgment,
  );
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [locPin, setLocPin] = useState<[number, number] | null>(
    kyc.parcel?.latitude != null && kyc.parcel?.longitude != null
      ? [kyc.parcel.latitude, kyc.parcel.longitude]
      : null,
  );
  const [locBoundary, setLocBoundary] = useState<{ lat: number; lng: number }[] | null>(
    kyc.parcel?.boundary && kyc.parcel.boundary.length >= 3 ? kyc.parcel.boundary : null,
  );
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const tags: { kind: ChipKind; text: string }[] = [];
  if (isInfo && !alreadyReplied) tags.push({ kind: "warn", text: "Action required" });
  if (isLocation && !locationFixed) tags.push({ kind: "warn", text: "Fix location required" });
  if (locationFixed) tags.push({ kind: "ok", text: "Location updated" });
  if (isInfo && alreadyReplied)
    tags.push({ kind: "ok", text: kyc.admin_acknowledgment ? "Acknowledged" : "Reply sent" });

  const viewDoc = async (docId: string) => {
    setViewingDoc(docId);
    try {
      const blob = await api.getBlob(`/user/kyc/${kyc.id}/documents/${docId}`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Couldn't open that document. Try again.");
    } finally {
      setViewingDoc(null);
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if ((!text && !replyFile) || sending) return;
    setSending(true);
    setReplyError(false);
    try {
      const fd = new FormData();
      if (text) fd.append("reply", text);
      if (replyFile) fd.append("document", await compressImage(replyFile));
      await api.post(`/user/kyc/${kyc.id}/reply`, fd);
      onReplied(text, replyFile);
      toast.success("Reply sent to the reviewer.");
    } catch {
      setReplyError(true);
      toast.error(REPLY_ERROR);
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async () => {
    if (!locPin || locBusy) return;
    setLocBusy(true);
    setLocError(false);
    try {
      await api.patch(`/user/kyc/${kyc.id}/update-location`, {
        latitude: locPin[0],
        longitude: locPin[1],
        boundary: locBoundary ?? undefined,
      });
      onLocationFixed(locPin, locBoundary);
      toast.success("Corrected location submitted.");
    } catch {
      setLocError(true);
      toast.error("Couldn't submit the location. Check your connection and try again.");
    } finally {
      setLocBusy(false);
    }
  };

  return (
    <article className="gd-kc" data-k={cfg.kind}>
      <button
        type="button"
        className="gd-kh"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="gd-mono text-base font-semibold">
              {kyc.parcel?.parcel_number ?? kyc.parcel?.title ?? "Land parcel"}
            </span>
            {kyc.parcel?.parcel_number && (
              <span className="text-sm text-muted-foreground">{kyc.parcel.title}</span>
            )}
            {tags.map((t) => (
              <StatusChip key={t.text} kind={t.kind} label={t.text} />
            ))}
          </span>
          <span className="text-[13px] text-muted-foreground">
            Ref <span className="gd-mono">{kyc.reference}</span> · Submitted{" "}
            {fmtDate(kyc.created_at)}
          </span>
        </span>
        <span className="gd-pill" data-k={cfg.kind}>
          <span className="flex" aria-hidden="true">
            {cfg.icon}
          </span>
          {cfg.label}
        </span>
        <span className="gd-chev" data-open={expanded}>
          <ChevronDown size={18} aria-hidden="true" />
        </span>
      </button>

      <div
        className="gd-track"
        aria-label={`Progress: step ${cfg.step} of 3, ${STEPS[cfg.step - 1]}`}
      >
        {STEPS.map((t, i) => {
          const done = i + 1 < cfg.step || (cfg.step === 3 && i === 2);
          const state = done ? "done" : i + 1 === cfg.step ? "cur" : "next";
          return (
            <span key={t} className="gd-ts" data-s={state}>
              <span className="gd-tdot">
                {done ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span>{t}</span>
            </span>
          );
        })}
      </div>

      {expanded && (
        <div className="gd-kb">
          {kyc.status === "approved" && (
            <div className="gd-box" data-k="ok">
              <strong>Documents approved</strong>
              <span>
                Your documents have been reviewed. Buyers now see a Documents reviewed badge on the
                listing.
                {kyc.reviewed_at && ` · ${fmtDate(kyc.reviewed_at)}`}
              </span>
            </div>
          )}

          {kyc.status === "rejected" && (
            <div className="gd-box" data-k="err">
              <strong>Application rejected</strong>
              <span className="whitespace-pre-wrap">
                {kyc.rejection_reason ?? "Your application did not meet our document requirements."}
                {kyc.reviewed_at && ` · ${fmtDate(kyc.reviewed_at)}`}
              </span>
              <button
                type="button"
                className="gd-btn gd-sm gd-o mt-1 self-start"
                onClick={onResubmit}
              >
                Submit a new application
              </button>
            </div>
          )}

          {(kyc.status === "pending" || kyc.status === "under_review") && (
            <div className="gd-box" data-k="muted">
              <strong>Your application is being reviewed</strong>
              <span>
                We&apos;ll notify you once a decision is made. No action needed right now.
              </span>
            </div>
          )}

          {isInfo && kyc.info_request_message && (
            <>
              <div className="gd-box" data-k="warn">
                <span className="gd-eyebrow text-inherit">Additional information needed</span>
                <span className="whitespace-pre-wrap text-[15px] text-foreground">
                  {kyc.info_request_message}
                </span>
              </div>
              {alreadyReplied ? (
                <>
                  <div className="gd-box" data-k="ok">
                    <strong>
                      Your reply was sent
                      {kyc.user_replied_at && ` · ${fmtDate(kyc.user_replied_at)}`}
                    </strong>
                    {kyc.user_reply && (
                      <span className="whitespace-pre-wrap text-foreground">{kyc.user_reply}</span>
                    )}
                    {kyc.user_reply_document_name && (
                      <a
                        href={`${import.meta.env.VITE_API_URL ?? "http://localhost/Landconnect/backend/public/api"}/user/kyc/${kyc.id}/reply-document`}
                        target="_blank"
                        rel="noreferrer"
                        className="gd-link gd-mono text-[13px]"
                      >
                        <Download size={14} aria-hidden="true" />
                        {kyc.user_reply_document_name}
                      </a>
                    )}
                  </div>
                  {kyc.admin_acknowledgment && (
                    <div className="gd-box" data-k="ok">
                      <strong>
                        Message from reviewer
                        {kyc.admin_acknowledged_at && ` · ${fmtDate(kyc.admin_acknowledged_at)}`}
                      </strong>
                      <span className="whitespace-pre-wrap text-foreground">
                        {kyc.admin_acknowledgment}
                      </span>
                      <span>No further action needed from you.</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="gd-lab m-0" htmlFor={`reply-${kyc.id}`}>
                    Your reply
                  </label>
                  <textarea
                    id={`reply-${kyc.id}`}
                    className="gd-input"
                    rows={4}
                    maxLength={3000}
                    placeholder="Provide the requested information or explain what you've uploaded…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex flex-wrap items-center gap-2.5">
                    {replyFile ? (
                      <span className="inline-flex items-center gap-2 rounded-[10px] bg-track px-2.5 py-1.5 text-[13.5px]">
                        <Paperclip size={14} aria-hidden="true" />
                        <span className="gd-mono">{replyFile.name}</span>
                        <button
                          type="button"
                          className="gd-link min-h-6 text-[13px]"
                          onClick={() => {
                            setReplyFile(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                        >
                          Remove
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="gd-btn gd-o gd-sm"
                        onClick={() => fileRef.current?.click()}
                      >
                        <Paperclip size={15} aria-hidden="true" /> Attach file
                      </button>
                    )}
                    <span className="text-[12.5px] text-muted-foreground">
                      JPG, PNG or PDF · max 10 MB
                    </span>
                    <span className="flex-1" />
                    <button
                      type="button"
                      className="gd-btn gd-sm"
                      onClick={sendReply}
                      disabled={(!replyText.trim() && !replyFile) || sending}
                    >
                      {sending ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                  {replyError && (
                    <div className="gd-err" role="alert">
                      {REPLY_ERROR}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {isLocation && (
            <>
              <div className="gd-box" data-k="warn">
                <span className="gd-eyebrow text-inherit">Location correction requested</span>
                {kyc.correction_note && (
                  <span className="whitespace-pre-wrap text-[15px] text-foreground">
                    {kyc.correction_note}
                  </span>
                )}
              </div>
              {locationFixed ? (
                <div className="gd-box" data-k="ok">
                  <strong>Updated location submitted</strong>
                  <span>It&apos;s back in the review queue.</span>
                </div>
              ) : (
                <>
                  <LandBoundaryMap
                    pin={locPin}
                    boundary={locBoundary}
                    onPinChange={setLocPin}
                    onBoundaryChange={setLocBoundary}
                    heightClassName="h-[240px]"
                    hintText='This shows where you originally placed your land. Drop a new pin to correct it, or tap "Trace boundary" / "Retrace boundary" to redraw the shape.'
                    requireTapToActivate
                  />
                  {locPin && (
                    <span className="gd-mono text-[12.5px] text-muted-foreground">
                      Pin at {locPin[0].toFixed(5)}, {locPin[1].toFixed(5)}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    <button
                      type="button"
                      className="gd-btn gd-sm"
                      onClick={sendLocation}
                      disabled={!locPin || locBusy}
                    >
                      {locBusy ? "Submitting…" : "Submit corrected location"}
                    </button>
                  </div>
                  {locError && (
                    <div className="gd-err" role="alert">
                      Couldn&apos;t submit the location. Check your connection and try again.
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {kyc.documents?.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="gd-eyebrow">Submitted documents</span>
              {kyc.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-[14px] border border-border-subtle bg-background px-3 py-2.5"
                >
                  <FileText size={17} className="text-muted-foreground" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{docLabel(doc.type)}</span>
                    <span className="gd-mono truncate text-[12.5px] text-muted-foreground">
                      {doc.file_deleted_at
                        ? "Deleted under the 60-day retention policy"
                        : doc.original_name}
                    </span>
                  </span>
                  {doc.verification_status === "accepted" && (
                    <StatusChip kind="ok" label="Documents reviewed" />
                  )}
                  {doc.verification_status === "rejected" && (
                    <StatusChip kind="err" label="Rejected" />
                  )}
                  <button
                    type="button"
                    className="gd-link text-[13.5px]"
                    onClick={() => viewDoc(doc.id)}
                    disabled={!!doc.file_deleted_at || viewingDoc === doc.id}
                  >
                    {doc.file_deleted_at ? "Deleted" : viewingDoc === doc.id ? "Opening…" : "View"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {kyc.reviewer_notes && (
            <div className="flex flex-col gap-1.5">
              <span className="gd-eyebrow">Reviewer notes</span>
              <span className="text-[14.5px] leading-normal">{kyc.reviewer_notes}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function SubmitKycDialog({
  open,
  applications,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  applications: KycApplication[];
  onClose: () => void;
  onSubmitted: (kyc: KycApplication) => void;
}) {
  const [parcels, setParcels] = useState<UserParcel[] | null>(null);
  const [parcelId, setParcelId] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [documents, setDocuments] = useState<{ type: string; file: File }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadParcels = async () => {
    if (parcels) return;
    try {
      const data = await api.get<{ data: UserParcel[] }>("/user/listings");
      setParcels(data.data ?? []);
    } catch {
      setParcels([]);
      toast.error("Couldn't load your parcels. Try again.");
    }
  };

  useEffect(() => {
    if (!open) return;
    setParcelId("");
    setDocType(DOC_TYPES[0].value);
    setDocuments([]);
    setError("");
    loadParcels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const attached = new Set(documents.map((d) => d.type));
  const hasRequired = REQUIRED_DOCS.every((r) => attached.has(r.value));

  const submit = async () => {
    const forParcel = applications.filter((a) => a.parcel?.id === parcelId);
    if (!parcelId || documents.length === 0)
      return setError("Please select a parcel and add at least one document.");
    if (!hasRequired) return setError("A National ID and a title deed are required.");
    if (forParcel.some((a) => a.status === "approved"))
      return setError("This parcel's documents have already been reviewed.");
    if (forParcel.some((a) => ACTIVE.includes(a.status)))
      return setError("An active KYC application already exists for this parcel.");

    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("parcel_id", parcelId);
      const files = await Promise.all(documents.map((d) => compressImage(d.file)));
      documents.forEach((d, i) => {
        fd.append(`documents[${i}][type]`, d.type);
        fd.append(`documents[${i}][file]`, files[i]);
      });
      const res = await api.post<{ data: KycApplication }>("/user/kyc", fd);
      onSubmitted(res.data);
      toast.success("KYC application submitted.");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Submission failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="gd-dialog [&>button:last-child]:hidden" style={{ maxWidth: 500 }}>
        <div className="flex justify-between gap-3">
          <div>
            <DialogTitle className="gd-h1 text-[26px]">Submit KYC application</DialogTitle>
            <DialogDescription className="gd-sub">
              Our team checks your documents against the land registry.
            </DialogDescription>
          </div>
          <button
            type="button"
            className="gd-ib"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div>
          <label className="gd-lab" htmlFor="k-parcel">
            Land parcel
          </label>
          {parcels === null ? (
            <div className="gd-skel h-12" />
          ) : parcels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No land parcels found. Add a listing first.
            </p>
          ) : (
            <select
              id="k-parcel"
              className="gd-input"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
            >
              <option value="">Select a parcel…</option>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parcel_number ?? p.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="gd-lab m-0">Required</span>
          <div className="flex flex-wrap gap-2">
            {REQUIRED_DOCS.map((r) => (
              <span key={r.value} className="gd-reqi" data-ok={attached.has(r.value)}>
                <span className="gd-tick2">
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                </span>
                {r.label}
                <span className="sr-only">
                  {attached.has(r.value) ? "(attached)" : "(missing)"}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="gd-lab" htmlFor="k-type">
            Add a document
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              id="k-type"
              className="gd-input min-w-[180px] flex-1"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (fileRef.current) fileRef.current.value = "";
                if (file) setDocuments((prev) => [...prev, { type: docType, file }]);
              }}
            />
            <button
              type="button"
              className="gd-btn gd-o min-h-12"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} aria-hidden="true" /> Choose file
            </button>
          </div>
          <div className="gd-hint">JPG, PNG or PDF · max 10 MB per document</div>
        </div>

        {documents.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {documents.map((d, i) => (
              <li
                key={`${d.type}-${d.file.name}-${i}`}
                className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <FileText size={16} className="text-brand" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  <strong>{docLabel(d.type)}</strong> ·{" "}
                  <span className="gd-mono text-[12.5px] text-muted-foreground">{d.file.name}</span>
                </span>
                <button
                  type="button"
                  className="gd-link text-[13px]"
                  data-tone="muted"
                  onClick={() => setDocuments((prev) => prev.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-[14px] bg-destructive-subtle px-3.5 py-3 text-sm font-semibold text-destructive"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="gd-btn gd-o" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="gd-btn"
            onClick={submit}
            disabled={busy || !parcelId || !hasRequired}
          >
            {busy ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KycTab() {
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading, isError, refetch } = useKycApplications();
  const [replied, setReplied] = useState<string[]>([]);
  const [locationFixed, setLocationFixed] = useState<string[]>([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [newest, setNewest] = useState<string | null>(null);

  const patch = (id: string, change: (a: KycApplication) => KycApplication) =>
    queryClient.setQueryData<KycApplication[]>(KYC_KEY, (prev) =>
      prev?.map((a) => (a.id === id ? change(a) : a)),
    );

  const needsAction = applications.filter(
    (a) => needsUserAction(a) && !replied.includes(a.id) && !locationFixed.includes(a.id),
  );
  const rest = applications.filter((a) => !needsAction.includes(a));
  const approved = applications.filter((a) => a.status === "approved").length;
  const pending = applications.filter(
    (a) => a.status === "pending" || a.status === "under_review",
  ).length;

  const card = (kyc: KycApplication) => (
    <KycCard
      key={kyc.id}
      kyc={kyc}
      startOpen={kyc.id === newest}
      replied={replied.includes(kyc.id)}
      locationFixed={locationFixed.includes(kyc.id)}
      onResubmit={() => setShowSubmit(true)}
      onReplied={(text, file) => {
        setReplied((prev) => [...prev, kyc.id]);
        patch(kyc.id, (a) => ({
          ...a,
          user_reply: text || a.user_reply,
          user_replied_at: new Date().toISOString(),
          user_reply_document_name: file?.name ?? a.user_reply_document_name,
          user_reply_document_path: file ? "pending" : a.user_reply_document_path,
        }));
      }}
      onLocationFixed={([lat, lng], boundary) => {
        setLocationFixed((prev) => [...prev, kyc.id]);
        patch(kyc.id, (a) => ({
          ...a,
          status: "pending",
          parcel: a.parcel
            ? {
                ...a.parcel,
                latitude: lat,
                longitude: lng,
                boundary,
                boundary_source: boundary ? "traced" : "approximate",
              }
            : a.parcel,
        }));
      }}
    />
  );

  return (
    <>
      <div className="gd-r flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="gd-h1">KYC Status</h1>
          <p className="gd-sub">
            Submit your listing documents for review, and track each application.
          </p>
        </div>
        <button type="button" className="gd-btn" onClick={() => setShowSubmit(true)}>
          <Plus size={17} strokeWidth={2.4} aria-hidden="true" /> Submit KYC
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-[60px]">
          <span className="gd-spin" style={{ width: 34, height: 34, borderWidth: 3 }} />
        </div>
      ) : isError ? (
        <div className="gd-empty">
          <ShieldCheck size={30} className="text-muted-foreground" aria-hidden="true" />
          <span className="gd-h2">Unable to load applications</span>
          <span className="text-muted-foreground">
            Something went wrong. Please refresh the page or try again later.
          </span>
          <button type="button" className="gd-btn gd-o" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="gd-empty">
          <Beacon width={26} height={36} />
          <span className="gd-h2">No KYC applications yet</span>
          <span className="max-w-[420px] text-muted-foreground">
            Listings whose documents we have reviewed carry a Documents reviewed badge, which helps
            buyers move forward with confidence. You&apos;ll need your National ID and the title
            deed.
          </span>
          <button type="button" className="gd-btn" onClick={() => setShowSubmit(true)}>
            <Plus size={17} strokeWidth={2.4} aria-hidden="true" /> Submit KYC application
          </button>
        </div>
      ) : (
        <>
          <div className="gd-r gd-ksum">
            {(
              [
                ["Total", applications.length, ""],
                ["Needs action", needsAction.length, needsAction.length ? "text-warning" : ""],
                ["Approved", approved, "text-brand"],
                ["Pending", pending, ""],
              ] as const
            ).map(([label, value, tone]) => (
              <div key={label} className="gd-card flex flex-col gap-1 px-[18px] py-4">
                <span className="gd-eyebrow">{label}</span>
                <span className={`gd-h text-[30px] ${tone}`}>{value}</span>
              </div>
            ))}
          </div>

          {needsAction.length > 0 && (
            <>
              <h2 className="gd-h2 gd-r mt-1.5 flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning" aria-hidden="true" />
                Needs your attention
                <StatusChip kind="warn" label={String(needsAction.length)} />
              </h2>
              <div className="flex flex-col gap-3.5">{needsAction.map(card)}</div>
              {rest.length > 0 && <h2 className="gd-h2 mt-2.5">All applications</h2>}
            </>
          )}
          <div className="flex flex-col gap-3.5">{rest.map(card)}</div>
        </>
      )}

      <SubmitKycDialog
        open={showSubmit}
        applications={applications}
        onClose={() => setShowSubmit(false)}
        onSubmitted={(kyc) => {
          queryClient.setQueryData<KycApplication[]>(KYC_KEY, (prev) => [kyc, ...(prev ?? [])]);
          setNewest(kyc.id);
          setShowSubmit(false);
        }}
      />
    </>
  );
}
