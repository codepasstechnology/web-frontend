import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Building2,
  Camera,
  Cookie,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Languages,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Phone,
  Save,
  Shield,
  Smartphone,
  Trash,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import type { AppUser, UserRole } from "@/lib/auth";
import { kenyaCounties, usePlans } from "@/lib/plans";
import {
  describeDevice,
  revokeOtherSessions,
  revokeSession,
  sessionsKey,
  useSessions,
} from "@/lib/sessions";
import { useTheme } from "@/hooks/useTheme";
import { StatusChip } from "@/components/dashboard/parts";

type Section = "profile" | "security" | "notifications" | "preferences" | "danger";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <UserIcon size={16} aria-hidden="true" /> },
  { id: "security", label: "Security", icon: <Shield size={16} aria-hidden="true" /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} aria-hidden="true" /> },
  { id: "preferences", label: "Preferences", icon: <Languages size={16} aria-hidden="true" /> },
  { id: "danger", label: "Danger zone", icon: <AlertTriangle size={16} aria-hidden="true" /> },
];

const ROLE_LABELS: Record<string, string> = {
  individual: "Individual",
  agent: "Agent / Broker",
  developer: "Developer",
};
const ROLES = ["individual", "agent", "developer"] as const;

// Green/cream-friendly avatar colours the camera button cycles through.
const AVATAR_COLORS = ["#3F5A2A", "#23756C", "#2D5C9C", "#1E2418", "#6E7F3A", "#A8600C"];

const BIO_MAX = 2000;
const SAVE_ERROR = "Couldn't save your changes. Check your connection and try again.";

const strength = (s: string) => {
  let n = 0;
  if (s.length >= 8) n++;
  if (/[A-Za-z]/.test(s) && /\d/.test(s)) n++;
  if (s.length >= 12) n++;
  if (/[^A-Za-z0-9]/.test(s)) n++;
  return n;
};
const STRENGTH_TEXT = ["Too short", "Weak", "Okay", "Strong", "Very strong"];

type Note = { type: "ok" | "err"; text: string };

const lastActive = (iso: string | null) => {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 5) return "active now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (mins < 60) return rtf.format(-mins, "minute");
  if (mins < 1440) return rtf.format(-Math.round(mins / 60), "hour");
  return rtf.format(-Math.round(mins / 1440), "day");
};

const fieldError = (e: unknown, ...fields: string[]) => {
  const err = e as { message: string; errors?: Record<string, string[]> };
  for (const f of fields) if (err.errors?.[f]) return err.errors[f][0];
  return err.message;
};

function NoteBox({ note }: { note: Note }) {
  return (
    <div
      role={note.type === "err" ? "alert" : "status"}
      className={`rounded-[14px] px-3.5 py-3 text-sm font-semibold ${
        note.type === "err"
          ? "bg-destructive-subtle text-destructive"
          : "bg-brand-subtle text-brand-subtle-foreground"
      }`}
    >
      {note.text}
    </div>
  );
}

function Label({
  htmlFor,
  icon,
  children,
}: {
  htmlFor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <Tag className="gd-lab" htmlFor={htmlFor}>
      {icon && <span className="flex text-muted-foreground">{icon}</span>}
      {children}
    </Tag>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="gd-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    />
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  invalid: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          id={id}
          className="gd-input pr-[52px] [&::-ms-reveal]:hidden"
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
        />
        <button
          type="button"
          className="gd-ib absolute right-1 top-1"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Hide password" : "Show password"}
        >
          {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </>
  );
}

export function SettingsTab({
  user,
  onUpdate,
  onDelete,
  onLogout,
  onChangePassword,
  onSignedOut,
  onEnableTwoFactor,
  onConfirmTwoFactor,
  onDisableTwoFactor,
  onRequestEmailChange,
  onConfirmEmailChange,
}: {
  user: AppUser;
  onUpdate: (patch: Partial<AppUser>) => Promise<void>;
  onDelete: () => Promise<void>;
  onLogout: () => void;
  onChangePassword: (current: string, next: string) => Promise<void>;
  onSignedOut: () => void;
  onEnableTwoFactor: () => Promise<void>;
  onConfirmTwoFactor: (code: string) => Promise<void>;
  onDisableTwoFactor: (password: string) => Promise<void>;
  onRequestEmailChange: (email: string, password: string) => Promise<void>;
  onConfirmEmailChange: (code: string) => Promise<void>;
}) {
  const { data: plans = [] } = usePlans();
  const { theme, toggle: toggleTheme } = useTheme();
  const initialForm = {
    fullName: user.fullName,
    phone: user.phone || "",
    county: user.county || "",
    company: user.company || "",
    bio: user.bio || "",
    role: user.role as UserRole,
  };
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(initialForm);
  const initialNotif = user.notifications || {
    emailInquiries: true,
    smsAlerts: false,
    weeklyDigest: false,
    marketing: false,
    listingKycUpdates: true,
  };
  const [notif, setNotif] = useState(initialNotif);
  const [savedNotif, setSavedNotif] = useState(initialNotif);
  const [language, setLanguage] = useState(user.language || "en");
  const [mapView, setMapView] = useState(user.defaultMapView || "map");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState<"profile" | "notif" | "prefs" | null>(null);
  const [saveError, setSaveError] = useState<"profile" | "notif" | "prefs" | null>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState<(Note & { field?: "current" | "next" | "confirm" }) | null>(
    null,
  );
  const [pwdBusy, setPwdBusy] = useState(false);
  const [tfaStep, setTfaStep] = useState<"idle" | "confirm" | "disable">("idle");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaPassword, setTfaPassword] = useState("");
  const [tfaBusy, setTfaBusy] = useState(false);
  const [tfaMsg, setTfaMsg] = useState<Note | null>(null);
  const [confirmDel, setConfirmDel] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState<Section>("profile");
  const [emailStep, setEmailStep] = useState<"idle" | "form" | "code">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<Note | null>(null);
  const queryClient = useQueryClient();
  const sessions = useSessions();
  const [revoking, setRevoking] = useState<number | "others" | null>(null);

  const initials = form.fullName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const avatarColor = user.avatarColor || AVATAR_COLORS[0];
  const planName = plans.find((p) => p.id === user.plan)?.name ?? user.plan;
  const profileDirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notifDirty = JSON.stringify(notif) !== JSON.stringify(savedNotif);
  const pwStrength = strength(pwd.next);
  const prefsDirty =
    language !== (user.language || "en") || mapView !== (user.defaultMapView || "map");

  const stamp = () => {
    const t = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setSavedAt(t);
    toast.success(`Saved at ${t}`);
  };

  const save = async (which: "profile" | "notif" | "prefs", patch: Partial<AppUser>) => {
    setSaving(which);
    setSaveError(null);
    try {
      await onUpdate(patch);
      stamp();
      return true;
    } catch {
      setSaveError(which);
      toast.error(SAVE_ERROR);
      return false;
    } finally {
      setSaving(null);
    }
  };

  const saveProfile = async () => {
    if (await save("profile", form)) setSaved(form);
  };
  const saveNotif = async () => {
    if (await save("notif", { notifications: notif })) setSavedNotif(notif);
  };

  const cycleAvatar = () => {
    const next = AVATAR_COLORS[(AVATAR_COLORS.indexOf(avatarColor) + 1) % AVATAR_COLORS.length];
    onUpdate({ avatarColor: next }).catch(() => toast.error(SAVE_ERROR));
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy your user ID.");
    }
  };

  const startTwoFactor = async () => {
    setTfaMsg(null);
    setTfaBusy(true);
    try {
      await onEnableTwoFactor();
      setTfaStep("confirm");
    } catch (e) {
      setTfaMsg({ type: "err", text: (e as { message: string }).message });
    } finally {
      setTfaBusy(false);
    }
  };

  const confirmTwoFactorCode = async () => {
    setTfaMsg(null);
    setTfaBusy(true);
    try {
      await onConfirmTwoFactor(tfaCode);
      setTfaStep("idle");
      setTfaCode("");
      setTfaMsg({ type: "ok", text: "Two-step sign-in is on." });
    } catch (e) {
      const err = e as { message: string; errors?: Record<string, string[]> };
      setTfaMsg({ type: "err", text: err.errors?.code?.[0] ?? err.message });
    } finally {
      setTfaBusy(false);
    }
  };

  const turnOffTwoFactor = async () => {
    setTfaMsg(null);
    setTfaBusy(true);
    try {
      await onDisableTwoFactor(tfaPassword);
      setTfaStep("idle");
      setTfaPassword("");
      setTfaMsg({ type: "ok", text: "Two-step sign-in is off." });
    } catch (e) {
      const err = e as { message: string; errors?: Record<string, string[]> };
      setTfaMsg({ type: "err", text: err.errors?.password?.[0] ?? err.message });
    } finally {
      setTfaBusy(false);
    }
  };

  const changePassword = async () => {
    if (pwd.next.length < 8)
      return setPwdMsg({
        type: "err",
        text: "Password must be at least 8 characters.",
        field: "next",
      });
    if (pwd.next !== pwd.confirm)
      return setPwdMsg({ type: "err", text: "Passwords do not match.", field: "confirm" });

    setPwdBusy(true);
    try {
      await onChangePassword(pwd.current, pwd.next);
      setPwd({ current: "", next: "", confirm: "" });
      setPwdMsg({ type: "ok", text: "Password updated. Signing you out on all devices…" });
      setTimeout(onSignedOut, 1500);
    } catch (e) {
      const err = e as { message: string; errors?: Record<string, string[]> };
      setPwdMsg({
        type: "err",
        text: err.errors?.current_password?.[0] ?? err.errors?.password?.[0] ?? err.message,
        field: err.errors?.current_password ? "current" : err.errors?.password ? "next" : undefined,
      });
      setPwdBusy(false);
    }
  };

  const sendEmailCode = async () => {
    setEmailMsg(null);
    setEmailBusy(true);
    try {
      await onRequestEmailChange(newEmail.trim(), emailPassword);
      setEmailPassword("");
      setEmailStep("code");
    } catch (e) {
      setEmailMsg({ type: "err", text: fieldError(e, "email", "password") });
    } finally {
      setEmailBusy(false);
    }
  };

  const confirmEmail = async () => {
    setEmailMsg(null);
    setEmailBusy(true);
    try {
      await onConfirmEmailChange(emailCode);
      setEmailStep("idle");
      setEmailCode("");
      setNewEmail("");
      setEmailMsg({ type: "ok", text: "Your sign-in email is updated." });
    } catch (e) {
      setEmailMsg({ type: "err", text: fieldError(e, "code") });
    } finally {
      setEmailBusy(false);
    }
  };

  const closeEmailChange = () => {
    setEmailStep("idle");
    setNewEmail("");
    setEmailPassword("");
    setEmailCode("");
    setEmailMsg(null);
  };

  const signOutDevice = async (id: number | "others", name: string) => {
    setRevoking(id);
    try {
      await (id === "others" ? revokeOtherSessions() : revokeSession(id));
      await queryClient.invalidateQueries({ queryKey: sessionsKey });
      toast.success(id === "others" ? "Signed out of all other devices" : `Signed out of ${name}`);
    } catch {
      toast.error("Couldn't sign that device out. Check your connection and try again.");
    } finally {
      setRevoking(null);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      toast.error("Couldn't delete your account. Try again.");
      setDeleting(false);
    }
  };

  const pwInvalid = (f: "current" | "next" | "confirm") =>
    pwdMsg?.type === "err" && pwdMsg.field === f;

  return (
    <>
      <div className="gd-r flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="gd-h1">Account Settings</h1>
          <p className="gd-sub">Manage your profile, security and preferences.</p>
        </div>
        {savedAt && (
          <span role="status" className="text-[13.5px]">
            <StatusChip kind="ok" label={`Saved at ${savedAt}`} />
          </span>
        )}
      </div>

      <div className="gd-r gd-card flex flex-wrap items-center gap-[18px]">
        <div className="relative">
          <span
            className="gd-avatar"
            style={{ width: 64, height: 64, fontSize: 20, background: avatarColor }}
          >
            {initials || "U"}
          </span>
          <button
            type="button"
            onClick={cycleAvatar}
            aria-label="Change avatar colour"
            className="absolute -bottom-1 -right-1 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-card bg-foreground text-background"
          >
            <Camera size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <span className="gd-h text-2xl">{user.fullName}</span>
          <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {user.email}
            <span className="gd-type">{ROLE_LABELS[user.role] ?? user.role}</span>
            <StatusChip kind="ok" label={`${planName} plan`} />
          </span>
        </div>
        <button type="button" className="gd-btn gd-o gd-sm" onClick={copyId}>
          <Copy size={15} aria-hidden="true" /> {copied ? "Copied" : "Copy user ID"}
        </button>
      </div>

      <div className="gd-r gd-seg gd-tabs" role="tablist" aria-label="Settings sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            aria-pressed={section === s.id}
            onClick={() => setSection(s.id)}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <div className="gd-r flex flex-col gap-4" role="tabpanel">
        {section === "profile" && (
          <div className="gd-card flex flex-col gap-[18px]">
            <div>
              <h2 className="gd-h2">Profile information</h2>
              <p className="gd-sub mt-1 text-sm">
                Buyers see your name, phone and company on your listings.
              </p>
            </div>
            <div className="gd-form2">
              <div>
                <Label htmlFor="s-name" icon={<UserIcon size={15} aria-hidden="true" />}>
                  Full name
                </Label>
                <input
                  id="s-name"
                  className="gd-input"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="s-email" icon={<Mail size={15} aria-hidden="true" />}>
                  Email address
                </Label>
                <div className="flex gap-2">
                  <input
                    id="s-email"
                    className="gd-input bg-track text-muted-foreground"
                    value={user.email}
                    readOnly
                    aria-readonly="true"
                  />
                  {emailStep === "idle" && (
                    <button
                      type="button"
                      className="gd-btn gd-o shrink-0"
                      onClick={() => {
                        setEmailMsg(null);
                        setEmailStep("form");
                      }}
                    >
                      Change
                    </button>
                  )}
                </div>
                {emailMsg?.type === "ok" && (
                  <div role="status" className="gd-hint font-semibold text-brand-subtle-foreground">
                    {emailMsg.text}
                  </div>
                )}
              </div>
              {emailStep !== "idle" && (
                <div className="gd-inl col-span-full">
                  {emailStep === "form" ? (
                    <>
                      <span className="text-sm">
                        We&apos;ll send a 6-digit code to the new address. Your email only changes
                        once you enter it.
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="gd-input w-[260px]"
                          type="email"
                          autoComplete="email"
                          placeholder="New email address"
                          aria-label="New email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <input
                          className="gd-input w-[200px]"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Your password"
                          aria-label="Your password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="gd-btn"
                          onClick={sendEmailCode}
                          disabled={emailBusy || !newEmail.trim() || !emailPassword}
                        >
                          {emailBusy ? "Sending…" : "Send code"}
                        </button>
                        <button type="button" className="gd-btn gd-o" onClick={closeEmailChange}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">
                        Enter the code we sent to <strong>{newEmail.trim()}</strong>.
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="gd-input gd-mono w-[170px] text-center tracking-[.35em]"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          aria-label="Code"
                          value={emailCode}
                          onChange={(e) =>
                            setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                        />
                        <button
                          type="button"
                          className="gd-btn"
                          onClick={confirmEmail}
                          disabled={emailBusy || emailCode.length !== 6}
                        >
                          {emailBusy ? "Confirming…" : "Confirm"}
                        </button>
                        <button type="button" className="gd-btn gd-o" onClick={closeEmailChange}>
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                  {emailMsg?.type === "err" && <NoteBox note={emailMsg} />}
                </div>
              )}
              <div>
                <Label htmlFor="s-phone" icon={<Phone size={15} aria-hidden="true" />}>
                  Phone
                </Label>
                <input
                  id="s-phone"
                  className="gd-input"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <div className="gd-hint">Shown to buyers. We never send SMS from this number.</div>
              </div>
              <div>
                <Label htmlFor="s-co" icon={<Building2 size={15} aria-hidden="true" />}>
                  Company / Agency
                </Label>
                <input
                  id="s-co"
                  className="gd-input"
                  placeholder="Optional"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="s-county" icon={<MapPin size={15} aria-hidden="true" />}>
                  County
                </Label>
                <select
                  id="s-county"
                  className="gd-input"
                  value={form.county}
                  onChange={(e) => setForm({ ...form, county: e.target.value })}
                >
                  <option value="">Choose a county</option>
                  {form.county && !kenyaCounties.includes(form.county) && (
                    <option value={form.county}>{form.county}</option>
                  )}
                  {kenyaCounties.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label icon={<Shield size={15} aria-hidden="true" />}>I&apos;m posting as</Label>
                <div className="gd-seg grid grid-cols-3" role="group" aria-label="Role">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="justify-center"
                      aria-pressed={form.role === r}
                      onClick={() => setForm({ ...form, role: r })}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-full">
                <Label htmlFor="s-bio" icon={<FileText size={15} aria-hidden="true" />}>
                  Bio
                </Label>
                <textarea
                  id="s-bio"
                  className="gd-input"
                  rows={3}
                  maxLength={BIO_MAX}
                  placeholder="Short bio shown on your public profile."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
                <div className="gd-hint">
                  {form.bio.length.toLocaleString()} / {BIO_MAX.toLocaleString()}
                </div>
              </div>
            </div>
            {saveError === "profile" && <NoteBox note={{ type: "err", text: SAVE_ERROR }} />}
            <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
              <button
                type="button"
                className="gd-btn gd-o"
                onClick={() => setForm(saved)}
                disabled={!profileDirty || saving === "profile"}
              >
                Reset
              </button>
              <button
                type="button"
                className="gd-btn"
                onClick={saveProfile}
                disabled={!profileDirty || saving === "profile"}
              >
                <Save size={16} aria-hidden="true" />
                {saving === "profile" ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {section === "security" && (
          <>
            <div className="gd-card flex flex-col gap-4">
              <div>
                <h2 className="gd-h2">Change password</h2>
                <p className="gd-sub mt-1 text-sm">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
              </div>
              <div className="gd-form2">
                <div className="col-span-full">
                  <PasswordInput
                    id="pw-current"
                    label="Current password"
                    autoComplete="current-password"
                    value={pwd.current}
                    onChange={(v) => setPwd({ ...pwd, current: v })}
                    invalid={pwInvalid("current")}
                  />
                </div>
                <div>
                  <PasswordInput
                    id="pw-next"
                    label="New password"
                    autoComplete="new-password"
                    value={pwd.next}
                    onChange={(v) => setPwd({ ...pwd, next: v })}
                    invalid={pwInvalid("next")}
                  />
                  {pwd.next.length > 0 && (
                    <>
                      <div className="mt-2 flex gap-1" aria-hidden="true">
                        {[0, 1, 2, 3].map((k) => (
                          <span
                            key={k}
                            className={`h-[5px] flex-1 rounded-[3px] ${
                              k < pwStrength
                                ? pwStrength < 2
                                  ? "bg-destructive"
                                  : pwStrength < 3
                                    ? "bg-warning"
                                    : "bg-brand"
                                : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="gd-hint mt-1">{STRENGTH_TEXT[pwStrength]}</div>
                    </>
                  )}
                </div>
                <div>
                  <PasswordInput
                    id="pw-confirm"
                    label="Confirm password"
                    autoComplete="new-password"
                    value={pwd.confirm}
                    onChange={(v) => setPwd({ ...pwd, confirm: v })}
                    invalid={pwInvalid("confirm")}
                  />
                </div>
              </div>
              {pwdMsg && <NoteBox note={pwdMsg} />}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="gd-btn"
                  onClick={changePassword}
                  disabled={pwdBusy}
                >
                  {pwdBusy ? "Updating…" : "Update password"}
                </button>
              </div>
            </div>

            <div className="gd-card flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="gd-h2">Two-step sign-in</h2>
                  <p className="gd-sub mt-1 text-sm">
                    Require a code sent to {user.email} each time you sign in.
                  </p>
                </div>
                <Switch
                  checked={Boolean(user.twoFactor) || tfaStep === "confirm"}
                  label="Two-step sign-in"
                  onChange={(next) => {
                    setTfaMsg(null);
                    setTfaCode("");
                    setTfaPassword("");
                    if (tfaStep !== "idle") setTfaStep("idle");
                    else if (next) startTwoFactor();
                    else setTfaStep("disable");
                  }}
                />
              </div>
              {tfaStep === "confirm" && (
                <div className="gd-inl">
                  <span className="text-sm">
                    Enter the 6-digit code we just emailed you to finish turning this on.
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="gd-input gd-mono w-[170px] text-center tracking-[.35em]"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      aria-label="Code"
                      value={tfaCode}
                      onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                    <button
                      type="button"
                      className="gd-btn"
                      onClick={confirmTwoFactorCode}
                      disabled={tfaBusy || tfaCode.length !== 6}
                    >
                      {tfaBusy ? "Confirming…" : "Confirm"}
                    </button>
                    <button
                      type="button"
                      className="gd-btn gd-o"
                      onClick={() => setTfaStep("idle")}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {tfaStep === "disable" && (
                <div className="gd-inl">
                  <span className="text-sm">Enter your password to turn off two-step sign-in.</span>
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="gd-input w-[240px]"
                      type="password"
                      placeholder="Your password"
                      aria-label="Password"
                      value={tfaPassword}
                      onChange={(e) => setTfaPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="gd-btn gd-danger"
                      onClick={turnOffTwoFactor}
                      disabled={tfaBusy || !tfaPassword}
                    >
                      {tfaBusy ? "Turning off…" : "Turn off"}
                    </button>
                    <button
                      type="button"
                      className="gd-btn gd-o"
                      onClick={() => setTfaStep("idle")}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {tfaMsg &&
                (tfaMsg.type === "ok" ? (
                  <span className="text-sm font-semibold text-brand-subtle-foreground">
                    {tfaMsg.text}
                  </span>
                ) : (
                  <NoteBox note={tfaMsg} />
                ))}
            </div>

            <div className="gd-card flex flex-col gap-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="gd-h2">Where you&apos;re signed in</h2>
                  <p className="gd-sub mt-1 text-sm">
                    Sign out of any device you don&apos;t recognise.
                  </p>
                </div>
                {(sessions.data?.length ?? 0) > 1 && (
                  <button
                    type="button"
                    className="gd-btn gd-o gd-sm"
                    onClick={() => signOutDevice("others", "")}
                    disabled={revoking !== null}
                  >
                    {revoking === "others" ? "Signing out…" : "Sign out all other devices"}
                  </button>
                )}
              </div>
              {sessions.isPending && (
                <span className="text-sm text-muted-foreground">Loading your devices…</span>
              )}
              {sessions.isError && (
                <NoteBox
                  note={{
                    type: "err",
                    text: "Couldn't load your devices. Check your connection and try again.",
                  }}
                />
              )}
              {sessions.data?.map((s) => {
                const device = describeDevice(s.user_agent);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3.5 border-t border-border-subtle py-3"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-track text-muted-foreground">
                      {device.mobile ? (
                        <Smartphone size={18} aria-hidden="true" />
                      ) : (
                        <Monitor size={18} aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2 font-semibold">
                        {device.name}
                        {s.current && <StatusChip kind="ok" label="This device" />}
                      </span>
                      <span className="text-[13px] text-muted-foreground">
                        {[s.ip_address, s.current ? "active now" : lastActive(s.last_used_at)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {!s.current && (
                      <button
                        type="button"
                        className="gd-link text-destructive"
                        onClick={() => signOutDevice(s.id, device.name)}
                        disabled={revoking !== null}
                      >
                        {revoking === s.id ? "Signing out…" : "Sign out"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === "notifications" && (
          <div className="gd-card flex flex-col gap-1">
            <h2 className="gd-h2">Email notifications</h2>
            <p className="gd-sub mb-2 mt-1 text-sm">
              Choose what we email you about. Account and security emails always arrive.
            </p>
            {(
              [
                [
                  "emailInquiries",
                  "New inquiries",
                  "When a buyer or tenant asks about one of your listings.",
                ],
                [
                  "listingKycUpdates",
                  "Listing and KYC updates",
                  "Approvals, reviewer requests and decisions.",
                ],
                ["weeklyDigest", "Weekly digest", "A performance summary every Monday."],
                ["marketing", "Tips and offers", "Product news, selling tips and offers."],
              ] as const
            ).map(([key, title, desc]) => (
              <div
                key={key}
                className="flex items-center gap-4 border-t border-border-subtle py-3.5"
              >
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="font-semibold">{title}</span>
                  <span className="text-[13.5px] text-muted-foreground">{desc}</span>
                </span>
                <Switch
                  checked={notif[key]}
                  label={title}
                  onChange={(v) => setNotif({ ...notif, [key]: v })}
                />
              </div>
            ))}
            {saveError === "notif" && <NoteBox note={{ type: "err", text: SAVE_ERROR }} />}
            <div className="flex justify-end border-t border-border-subtle pt-4">
              <button
                type="button"
                className="gd-btn"
                onClick={saveNotif}
                disabled={!notifDirty || saving === "notif"}
              >
                <Save size={16} aria-hidden="true" />
                {saving === "notif" ? "Saving…" : "Save preferences"}
              </button>
            </div>
          </div>
        )}

        {section === "preferences" && (
          <>
            <div className="gd-card flex flex-col gap-[18px]">
              <h2 className="gd-h2">Display &amp; language</h2>
              <div className="gd-form2">
                <div>
                  <Label>Language</Label>
                  <div className="gd-seg grid grid-cols-2" role="group" aria-label="Language">
                    {(
                      [
                        ["en", "English"],
                        ["sw", "Kiswahili"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className="justify-center"
                        aria-pressed={language === id}
                        onClick={() => setLanguage(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="gd-hint">
                    Swahili translation of the site is on the way; emails switch first.
                  </div>
                </div>
                <div>
                  <Label>Default map view</Label>
                  <div
                    className="gd-seg grid grid-cols-2"
                    role="group"
                    aria-label="Default map view"
                  >
                    {(
                      [
                        ["map", "Map"],
                        ["satellite", "Satellite"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className="justify-center"
                        aria-pressed={mapView === id}
                        onClick={() => setMapView(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="gd-hint">Used when you open Explore, Land and Rentals.</div>
                </div>
                <div>
                  <Label>Theme</Label>
                  <div className="gd-seg grid grid-cols-2" role="group" aria-label="Theme">
                    {(
                      [
                        ["light", "Light"],
                        ["dark", "Dark"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className="justify-center"
                        aria-pressed={theme === id}
                        onClick={(e) =>
                          theme !== id && toggleTheme({ clientX: e.clientX, clientY: e.clientY })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 border-t border-dashed border-border pt-4">
                <span className="gd-h2 text-[17px]">Connected accounts</span>
                {(
                  [
                    ["G", "Google", "Sign in with your Google account."],
                    ["W", "WhatsApp Business", "Reply to inquiries from WhatsApp."],
                  ] as const
                ).map(([i, name, desc]) => (
                  <div
                    key={name}
                    className="flex items-center gap-3.5 border-t border-border-subtle py-3"
                  >
                    <span className="gd-h flex h-10 w-10 items-center justify-center rounded-xl bg-track">
                      {i}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="font-semibold">{name}</span>
                      <span className="text-[13px] text-muted-foreground">{desc}</span>
                    </span>
                    <StatusChip kind="muted" label="Coming soon" />
                  </div>
                ))}
              </div>
              {saveError === "prefs" && <NoteBox note={{ type: "err", text: SAVE_ERROR }} />}
              <div className="flex justify-end border-t border-border-subtle pt-4">
                <button
                  type="button"
                  className="gd-btn"
                  onClick={() => save("prefs", { language, defaultMapView: mapView })}
                  disabled={!prefsDirty || saving === "prefs"}
                >
                  <Save size={16} aria-hidden="true" />
                  {saving === "prefs" ? "Saving…" : "Save preferences"}
                </button>
              </div>
            </div>
            <div className="gd-card flex flex-wrap items-center justify-between gap-3.5">
              <div>
                <h2 className="gd-h2">Cookies</h2>
                <p className="gd-sub mt-1 text-sm">
                  See what Geo Pin Properties stores and turn optional cookies on or off.
                </p>
              </div>
              <Link to="/cookie-settings" className="gd-btn gd-o">
                <Cookie size={16} aria-hidden="true" /> Cookie settings
              </Link>
            </div>
          </>
        )}

        {section === "danger" && (
          <>
            <div className="gd-card flex flex-wrap items-center justify-between gap-3.5">
              <div>
                <h2 className="gd-h2">Sign out</h2>
                <p className="gd-sub mt-1 text-sm">End your session on this device.</p>
              </div>
              <button type="button" className="gd-btn gd-o" onClick={onLogout}>
                <LogOut size={16} aria-hidden="true" /> Log out
              </button>
            </div>
            <div className="gd-card flex flex-col gap-3.5 border-destructive bg-destructive-subtle">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex text-destructive">
                  <AlertTriangle size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="gd-h2 text-destructive">Delete account</h2>
                  <p className="gd-sub mt-1 text-sm text-foreground">
                    This permanently removes your account, listings, KYC documents and invoices.
                    Active plans are cancelled without a refund. Type{" "}
                    <strong className="gd-mono">DELETE</strong> to confirm.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  className="gd-input gd-mono w-[220px] bg-card"
                  placeholder="Type DELETE"
                  aria-label="Type DELETE to confirm"
                  value={confirmDel}
                  onChange={(e) => setConfirmDel(e.target.value)}
                />
                <button
                  type="button"
                  className="gd-btn gd-danger"
                  onClick={deleteAccount}
                  disabled={confirmDel !== "DELETE" || deleting}
                >
                  <Trash size={16} aria-hidden="true" />
                  {deleting ? "Deleting…" : "Delete account"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
