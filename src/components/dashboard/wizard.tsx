import { Fragment, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  ImagePlus,
  RotateCcw,
  Star,
  X,
} from "lucide-react";

/** Back link, title, step tabs and draft notice shared by the land and property wizards. */
export function WizardHeader({
  backLabel,
  onBack,
  title,
  sub,
  steps,
  step,
  maxStep,
  onStep,
}: {
  backLabel: string;
  onBack: () => void;
  title: string;
  sub: string;
  steps: string[];
  step: number;
  /** Furthest step the user may jump to from the tabs. */
  maxStep: number;
  onStep: (i: number) => void;
}) {
  return (
    <>
      <div className="gd-r flex flex-col gap-1.5">
        <button type="button" className="gd-link self-start" data-tone="muted" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> {backLabel}
        </button>
        <h1 className="gd-h1">{title}</h1>
        <p className="gd-sub mt-0">{sub}</p>
      </div>
      <nav aria-label="Steps" className="gd-r gd-steps">
        {steps.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "next";
          return (
            <button
              key={label}
              type="button"
              className="gd-stp"
              data-s={state}
              aria-current={i === step ? "step" : undefined}
              disabled={i > maxStep}
              onClick={() => onStep(i)}
            >
              <span className="gd-sn">
                {i < step ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span className="gd-stl">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export function DraftNotice({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="gd-r flex flex-wrap items-center gap-3 rounded-2xl bg-brand-subtle px-4 py-3 text-sm text-brand-subtle-foreground"
    >
      <RotateCcw size={17} aria-hidden="true" />
      <span className="min-w-[220px] flex-1">{text}</span>
      <button type="button" className="gd-link" style={{ color: "inherit" }} onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}

export function StepHeading({
  title,
  step,
  total,
}: {
  title: string;
  step: number;
  total: number;
}) {
  return (
    <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="gd-h2 text-[22px]">{title}</h2>
      <span className="text-[13.5px] text-muted-foreground">
        Step {step + 1} of {total} · saved as a draft
      </span>
    </div>
  );
}

export function Field({
  id,
  label,
  optional,
  hint,
  error,
  full,
  children,
}: {
  id?: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  const Tag = id ? "label" : "span";
  return (
    <div className={full ? "col-span-full" : undefined}>
      <Tag className="gd-lab" htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Tag>
      {children}
      {hint && <div className="gd-hint">{hint}</div>}
      {error && (
        <div className="gd-err" role="alert" id={id ? `${id}-err` : undefined}>
          {error}
        </div>
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  grid,
  className = "",
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
  /** Stretch the options into equal columns. */
  grid?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`gd-seg ${className}`}
      role="group"
      aria-label={label}
      style={
        grid
          ? { display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)` }
          : undefined
      }
    >
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          className={grid ? "justify-center" : undefined}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function ToggleChips({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            className="gd-chip min-h-10 text-sm"
            aria-pressed={on}
            onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export type PickerPhoto = { key: string; url: string };

/** Drop zone, thumbnail grid with cover star and remove, and the plan's photo limit. */
export function PhotoPicker({
  photos,
  coverKey,
  limit,
  planName,
  error,
  sizeLine,
  onAdd,
  onRemove,
  onCover,
  onUpgrade,
}: {
  photos: PickerPhoto[];
  coverKey: string | undefined;
  limit: number;
  planName: string;
  error: string;
  sizeLine?: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (key: string) => void;
  onCover: (key: string) => void;
  onUpgrade: () => void;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const full = photos.length >= limit;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="gd-h2">Photos</span>
        <span className="text-[13.5px] text-muted-foreground">
          {photos.length} of {limit} on {planName}
          {full && (
            <>
              {" · "}
              <button type="button" className="gd-link" onClick={onUpgrade}>
                Upgrade to upload more
              </button>
            </>
          )}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="gd-drop"
        disabled={full}
        data-over={over}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!full) onAdd(e.dataTransfer.files);
        }}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand-subtle-foreground">
          <ImagePlus size={22} aria-hidden="true" />
        </span>
        <span className="font-semibold">Drag and drop photos, or click to browse</span>
        <span className="text-[13px] text-muted-foreground">
          JPG, PNG, WEBP or HEIC · max 5 MB each · the starred photo is the cover
        </span>
      </button>
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-destructive-subtle px-3.5 py-2.5 text-sm font-semibold text-destructive"
        >
          {error}
        </div>
      )}
      {photos.length > 0 && (
        <div className="gd-pgrid">
          {photos.map((p) => {
            const cover = p.key === coverKey;
            return (
              <div key={p.key} className="gd-ph">
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                {cover && <span className="gd-cover">Cover</span>}
                <button
                  type="button"
                  className="gd-phb left-1.5"
                  aria-label={cover ? "Cover photo" : "Set as cover"}
                  aria-pressed={cover}
                  onClick={() => onCover(p.key)}
                >
                  <Star size={15} fill={cover ? "currentColor" : "none"} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="gd-phb right-1.5"
                  aria-label="Remove photo"
                  onClick={() => onRemove(p.key)}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {sizeLine && <span className="text-[13px] text-muted-foreground">{sizeLine}</span>}
    </div>
  );
}

export type ReviewRow = { label: string; value: string; step: number; mono?: boolean };

export function ReviewRows({
  rows,
  onEdit,
}: {
  rows: ReviewRow[];
  onEdit: (step: number) => void;
}) {
  return (
    <div className="gd-review">
      {rows.map((r) => (
        <Fragment key={r.label}>
          <span className="gd-eyebrow self-center">{r.label}</span>
          <span
            className={`min-w-0 break-words text-[15px] font-medium ${r.mono ? "gd-mono" : ""}`}
          >
            {r.value}
          </span>
          <button
            type="button"
            className="gd-link justify-self-end text-[13px]"
            aria-label={`Edit ${r.label.toLowerCase()}`}
            onClick={() => onEdit(r.step)}
          >
            Edit
          </button>
        </Fragment>
      ))}
    </div>
  );
}

export function WarnBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-[14px] bg-warning-subtle px-3.5 py-3 text-left text-sm leading-snug text-warning">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-[14px] bg-destructive-subtle px-3.5 py-3 text-sm font-semibold text-destructive"
    >
      {children}
    </div>
  );
}

export function WizardFooter({
  prevLabel,
  onPrev,
  prevDisabled,
  nextLabel,
  onNext,
  nextDisabled,
  arrow,
}: {
  prevLabel: string;
  onPrev: () => void;
  prevDisabled: boolean;
  nextLabel: ReactNode;
  onNext: () => void;
  nextDisabled?: boolean;
  arrow: boolean;
}) {
  return (
    <div className="mt-[26px] flex flex-wrap justify-between gap-2.5 border-t border-border-subtle pt-[18px]">
      <button type="button" className="gd-btn gd-o" onClick={onPrev} disabled={prevDisabled}>
        <ArrowLeft size={16} aria-hidden="true" /> {prevLabel}
      </button>
      <button
        type="button"
        className="gd-btn min-w-[170px]"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
        {arrow && <ChevronRight size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}

export function SuccessPanel({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 px-2.5 py-[30px] text-center" role="status">
      <span className="flex h-[72px] w-[72px] animate-[gdPop_.5s_cubic-bezier(.2,.7,.2,1)_backwards] items-center justify-center rounded-full bg-brand text-brand-foreground">
        <Check size={34} strokeWidth={2.6} aria-hidden="true" />
      </span>
      <h2 className="gd-h1 text-[30px]">{title}</h2>
      <p className="gd-sub m-0 max-w-[460px]">{text}</p>
      {children}
    </div>
  );
}
