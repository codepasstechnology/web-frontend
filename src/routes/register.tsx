import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, type UserRole } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AuthLayout, type AuthMessage } from "@/components/auth/AuthLayout";
import {
  ArrowIcon,
  EyeButton,
  FloatField,
  PrimaryButton,
  StrengthMeter,
  type BusyState,
  type Shake,
} from "@/components/auth/AuthFields";
import { isValidEmail, kenyanMobileDigits, passwordScore } from "@/components/auth/validation";
import { useSignupsOpen } from "@/lib/settings";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — Geo Pin Properties Kenya" }] }),
  component: RegisterPage,
});

type Goal = "buy" | "sell" | "agent";
type Step = "role" | "details" | "owner" | "agent" | "password";

const MESSAGES: AuthMessage[] = [
  { h: "Pin your first plot.", n: "karibu! glad you're here" },
  { h: "See boundaries before you visit.", n: "know exactly what you're buying" },
  { h: "Every listing checked.", n: "we verify, you relax" },
];

const PERKS = [
  { text: "Save your favourite plots", icon: <BookmarkIcon /> },
  { text: "Get alerts when land is listed in your area", icon: <BellIcon /> },
  { text: "Message owners and agents directly", icon: <ChatIcon /> },
];

const GOALS: { id: Goal; label: string; desc: string; icon: string }[] = [
  {
    id: "buy",
    label: "Buy or rent",
    desc: "Find land, homes or a place to rent",
    icon: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6",
  },
  {
    id: "sell",
    label: "Sell or list my property",
    desc: "I own land or property",
    icon: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5v5M9.5 10h5",
  },
  {
    id: "agent",
    label: "I'm an agent",
    desc: "I list for clients",
    icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1",
  },
];

const COUNTIES = [
  "Nairobi",
  "Kiambu",
  "Kajiado",
  "Machakos",
  "Nakuru",
  "Mombasa",
  "Kisumu",
  "Uasin Gishu",
];
const LIST_TYPES = ["Land", "Houses for sale", "Rentals"];
const HOW_MANY = ["Just one", "2 to 5", "6 or more"];

// The account type the API stores. Buyers and sellers are individuals; the owner and
// agency details are collected on the form but not saved yet.
const API_ROLE: Record<Goal, UserRole> = { buy: "individual", sell: "individual", agent: "agent" };

function flowFor(goal: Goal): Step[] {
  const middle: Step[] = goal === "sell" ? ["owner"] : goal === "agent" ? ["agent"] : [];
  return ["role", "details", ...middle, "password"];
}

const STEP_NAMES: Record<Step, string> = {
  role: "Who you are",
  details: "Your details",
  owner: "Your property",
  agent: "Your agency",
  password: "Your password",
};

interface Form {
  goal: Goal;
  name: string;
  email: string;
  phone: string;
  listTypes: string[];
  county: string;
  howMany: string;
  agency: string;
  earb: string;
  areas: string[];
  password: string;
  terms: boolean;
}

const EMPTY: Form = {
  goal: "buy",
  name: "",
  email: "",
  phone: "",
  listTypes: [],
  county: "",
  howMany: "",
  agency: "",
  earb: "",
  areas: [],
  password: "",
  terms: false,
};

type Field = keyof Form;

const FIELDS_BY_STEP: Partial<Record<Step, Field[]>> = {
  details: ["name", "email", "phone"],
  owner: ["listTypes", "county", "howMany"],
  agent: ["agency", "earb", "areas"],
  password: ["password", "terms"],
};

function errorFor(form: Form, field: Field): string {
  switch (field) {
    case "name":
      return form.name.trim().length < 2 ? "Enter your full name." : "";
    case "email":
      return isValidEmail(form.email) ? "" : "Enter a valid email address.";
    case "phone":
      return kenyanMobileDigits(form.phone) ? "" : "Enter a valid Kenyan number, e.g. 712 345 678.";
    case "listTypes":
      return form.listTypes.length ? "" : "Pick at least one.";
    case "county":
      return form.county ? "" : "Choose a county.";
    case "howMany":
      return form.howMany ? "" : "Pick one.";
    case "agency":
      return form.agency.trim() ? "" : "Enter your agency name.";
    case "earb":
      return form.earb.trim() ? "" : "Enter your EARB registration number.";
    case "areas":
      return form.areas.length ? "" : "Pick at least one county.";
    case "password":
      return form.password.length < 8 ? "Use at least 8 characters." : "";
    case "terms":
      return form.terms ? "" : "Please accept the terms to continue.";
    default:
      return "";
  }
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const signupsOpen = useSignupsOpen();

  const [form, setForm] = useState<Form>(EMPTY);
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [run, setRun] = useState(0);
  const [tried, setTried] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");

  const flow = flowFor(form.goal);
  const step: Step = flow[stepIndex];
  const shake: Shake = attempt % 2 ? "b" : "a";
  const alt = run % 2 === 1;
  const set = <K extends Field>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const errorShown = (field: Field) =>
    tried && (FIELDS_BY_STEP[step] ?? []).includes(field) ? errorFor(form, field) : "";

  const move = (d: 1 | -1) => {
    setDir(d);
    setRun((r) => r + 1);
    setTried(false);
    setErr("");
    setStepIndex((i) => Math.max(0, Math.min(flow.length - 1, i + d)));
  };

  const finishSubmit = async () => {
    setErr("");
    setBusy("loading");
    try {
      const digits = kenyanMobileDigits(form.phone);
      await register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: digits ? `+254${digits}` : "",
        password: form.password,
        role: API_ROLE[form.goal],
      });
      setBusy("success");
      window.setTimeout(() => navigate({ to: "/loading", search: { mode: "signup" } }), 380);
    } catch (error: unknown) {
      const e = error as { errors?: Record<string, string[]>; message?: string };
      const msg = Object.values(e?.errors ?? {})[0]?.[0];
      setErr(msg ?? e?.message ?? "Registration failed. Please try again.");
      setBusy("idle");
    }
  };

  const next = (e?: FormEvent) => {
    e?.preventDefault();
    if (busy !== "idle") return;
    setTried(true);
    const keys = FIELDS_BY_STEP[step] ?? [];
    if (keys.some((k) => errorFor(form, k))) {
      setAttempt((n) => n + 1);
      return;
    }
    if (step === "password") {
      void finishSubmit();
      return;
    }
    move(1);
  };

  const onGoogleCredential = async (credential: string) => {
    setErr("");
    try {
      const result = await loginWithGoogle(credential, API_ROLE[form.goal]);
      if (result.status === "two_factor_required") {
        navigate({ to: "/login" });
      } else {
        navigate({ to: "/loading", search: { mode: "signup" } });
      }
    } catch (error: unknown) {
      const e = error as { errors?: Record<string, string[]>; message?: string };
      const msg = Object.values(e?.errors ?? {})[0]?.[0];
      setErr(msg ?? e?.message ?? "Google sign-up failed. Please try again.");
    }
  };

  const stepClass = `ga-step ${dir < 0 ? "is-back" : "is-fwd"}${alt ? " is-alt" : ""}`;
  const termsShake = errorShown("terms")
    ? shake === "a"
      ? "ga-shake-a"
      : "ga-shake-b"
    : undefined;

  if (!signupsOpen) {
    return (
      <AuthLayout messages={MESSAGES} wide>
        <div className="ga-heading">
          <h1>
            Registrations are closed<span className="ga-dot-mark">.</span>
          </h1>
          <p>New accounts are paused right now. Please check back later.</p>
        </div>
        <Link to="/login" className="ga-btn ga-press ga-primary">
          Sign in
          <ArrowIcon />
        </Link>
        <Link to="/" className="ga-link">
          Back to home
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout messages={MESSAGES} perks={step === "role" ? PERKS : undefined} wide>
      <div className="ga-stack" style={{ gap: 12 }}>
        <div className="ga-progress-head">
          <span>
            Step {stepIndex + 1} of {flow.length} · <strong>{STEP_NAMES[step]}</strong>
          </span>
          <Link to="/login" className="ga-link">
            Sign in instead
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="ga-bars"
          style={{ gridTemplateColumns: `repeat(${flow.length}, 1fr)` }}
        >
          {flow.map((_, i) => (
            <span key={i} className="ga-bar-track">
              <span
                className="ga-bar-fill"
                style={{ transform: `scaleX(${i <= stepIndex ? 1 : 0})` }}
              />
            </span>
          ))}
        </div>
      </div>

      {step === "role" && (
        <div className={stepClass}>
          <div className="ga-heading">
            <span className="ga-eyebrow">Sign up, it&apos;s free</span>
            <h1 className="is-display">
              Create your account<span className="ga-dot-mark">.</span>
            </h1>
            <p>First, what brings you to Geo Pin?</p>
          </div>
          <div role="radiogroup" aria-label="What brings you to Geo Pin" className="ga-roles">
            {GOALS.map((g) => {
              const on = form.goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`ga-role ga-press${on ? " is-on" : ""}`}
                  onClick={() => set("goal", g.id)}
                >
                  <span className="ga-role-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={g.icon} />
                    </svg>
                  </span>
                  <span className="ga-role-text">
                    <strong>{g.label}</strong>
                    <span>{g.desc}</span>
                  </span>
                  <span className="ga-radio" />
                </button>
              );
            })}
          </div>
          <PrimaryButton busy={busy} onClick={() => next()}>
            Continue
          </PrimaryButton>
          <div className="ga-or" aria-hidden="true">
            <span />
            or
            <span />
          </div>
          <div className="ga-google-slot">
            <GoogleSignInButton onCredential={onGoogleCredential} text="signup_with" />
          </div>
          {err && (
            <p role="alert" className="ga-err">
              {err}
            </p>
          )}
        </div>
      )}

      {step === "details" && (
        <form onSubmit={next} className={stepClass} noValidate>
          <div className="ga-heading">
            <h1 className="is-small">
              Tell us about you<span className="ga-dot-mark">.</span>
            </h1>
            <p>So owners and agents know who they&apos;re talking to.</p>
          </div>
          <div className="ga-stack">
            <FloatField
              id="rg-name"
              label="Full name"
              value={form.name}
              onChange={(v) => set("name", v)}
              error={errorShown("name")}
              valid={!errorFor(form, "name")}
              shake={errorShown("name") ? shake : null}
              placeholder="e.g. Wanjiku Kamau"
              autoComplete="name"
            />
            <FloatField
              id="rg-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              error={errorShown("email")}
              valid={!errorFor(form, "email")}
              shake={errorShown("email") ? shake : null}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <FloatField
              id="rg-phone"
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              error={errorShown("phone")}
              valid={!errorFor(form, "phone")}
              shake={errorShown("phone") ? shake : null}
              prefix="+254"
              placeholder="7XX XXX XXX"
              autoComplete="tel-national"
              inputMode="tel"
            />
          </div>
          <StepActions onBack={() => move(-1)} busy={busy} />
        </form>
      )}

      {step === "owner" && (
        <form onSubmit={next} className={stepClass} noValidate>
          <div className="ga-heading">
            <h1 className="is-small">
              About your property<span className="ga-dot-mark">.</span>
            </h1>
            <p>This helps us set up your listing tools. You can change it later.</p>
          </div>
          <ChipGroup
            label="What will you list?"
            options={LIST_TYPES}
            selected={form.listTypes}
            multi
            onToggle={(o) => set("listTypes", toggle(form.listTypes, o))}
            error={errorShown("listTypes")}
            shake={errorShown("listTypes") ? shake : null}
          />
          <ChipGroup
            label="Where is it?"
            options={[...COUNTIES, "Other"]}
            selected={[form.county]}
            onToggle={(o) => set("county", o)}
            error={errorShown("county")}
            shake={errorShown("county") ? shake : null}
          />
          <ChipGroup
            label="How many properties do you have?"
            options={HOW_MANY}
            selected={[form.howMany]}
            onToggle={(o) => set("howMany", o)}
            error={errorShown("howMany")}
            shake={errorShown("howMany") ? shake : null}
          />
          <StepActions onBack={() => move(-1)} busy={busy} />
        </form>
      )}

      {step === "agent" && (
        <form onSubmit={next} className={stepClass} noValidate>
          <div className="ga-heading">
            <h1 className="is-small">
              About your agency<span className="ga-dot-mark">.</span>
            </h1>
            <p>We use this to verify agents, so buyers can trust your listings.</p>
          </div>
          <div className="ga-stack">
            <FloatField
              id="ag-name"
              label="Agency or company name"
              value={form.agency}
              onChange={(v) => set("agency", v)}
              error={errorShown("agency")}
              valid={!errorFor(form, "agency")}
              shake={errorShown("agency") ? shake : null}
              placeholder="e.g. Savannah Realty Ltd"
              autoComplete="organization"
            />
            <FloatField
              id="ag-earb"
              label="EARB registration number"
              value={form.earb}
              onChange={(v) => set("earb", v)}
              error={errorShown("earb")}
              valid={!errorFor(form, "earb")}
              shake={errorShown("earb") ? shake : null}
              placeholder="Estate Agents Registration Board no."
              autoComplete="off"
            />
          </div>
          <ChipGroup
            label="Counties you work in"
            options={COUNTIES}
            selected={form.areas}
            multi
            onToggle={(o) => set("areas", toggle(form.areas, o))}
            error={errorShown("areas")}
            shake={errorShown("areas") ? shake : null}
          />
          <StepActions onBack={() => move(-1)} busy={busy} />
        </form>
      )}

      {step === "password" && (
        <form onSubmit={next} className={stepClass} noValidate>
          <div className="ga-heading">
            <h1 className="is-small">
              Secure your account<span className="ga-dot-mark">.</span>
            </h1>
            <p>Last step. Choose a password you&apos;ll remember.</p>
          </div>
          <FloatField
            id="rg-pw"
            label="Password"
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={(v) => set("password", v)}
            error={errorShown("password")}
            shake={errorShown("password") ? shake : null}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            action={<EyeButton shown={showPw} onToggle={() => setShowPw((v) => !v)} />}
          />
          <StrengthMeter pw={form.password} error={errorShown("password")} />
          <div className={termsShake}>
            <label
              className="ga-check"
              style={{ alignItems: "flex-start", padding: "4px 0", lineHeight: 1.5 }}
            >
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => set("terms", e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="ga-link">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="ga-link">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
          {errorShown("terms") && <span className="ga-err">{errorShown("terms")}</span>}
          {err && (
            <p role="alert" className="ga-err">
              {err}
            </p>
          )}
          <StepActions onBack={() => move(-1)} busy={busy} label="Create account" />
        </form>
      )}
    </AuthLayout>
  );
}

function StepActions({
  onBack,
  busy,
  label = "Continue",
}: {
  onBack: () => void;
  busy: BusyState;
  label?: string;
}) {
  return (
    <div className="ga-row">
      <button type="button" className="ga-btn ga-press ga-secondary" onClick={onBack}>
        Back
      </button>
      <PrimaryButton type="submit" busy={busy}>
        {label}
      </PrimaryButton>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  multi = false,
  onToggle,
  error,
  shake,
}: {
  label: string;
  options: string[];
  selected: string[];
  multi?: boolean;
  onToggle: (option: string) => void;
  error?: string;
  shake?: Shake;
}) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div className="ga-field-group">
      <span id={id} className="ga-group-label">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        className={shake === "a" ? "ga-shake-a" : shake === "b" ? "ga-shake-b" : undefined}
      >
        <div className="ga-chips">
          {options.map((o) => {
            const on = multi ? selected.includes(o) : selected[0] === o;
            return (
              <button
                key={o}
                type="button"
                className="ga-chip"
                aria-pressed={on}
                onClick={() => onToggle(o)}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
      {error && <span className="ga-err">{error}</span>}
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2F4520"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2F4520"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2F4520"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
