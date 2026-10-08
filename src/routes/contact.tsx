import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Clock, Mail, MessageSquare, Phone } from "lucide-react";
import { KenyaMeshMap } from "@/components/site/KenyaMeshMap";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PageHero } from "@/components/site/PageHero";
import { usePublicSettings } from "@/lib/settings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact — Geo Pin Properties Kenya" }],
    links: MARKETING_FONT_LINKS,
  }),
  component: ContactPage,
});

// Nairobi as a share of the map's width and height.
const NAIROBI = { left: 37.14, top: 65.25 };

const topics = ["General", "A listing", "Verification", "My account", "Partnerships"];

type Field = "name" | "email" | "msg";

function checks(values: Record<Field, string>): Record<Field, string> {
  return {
    name: values.name.trim().length < 2 ? "Enter your name." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
      ? ""
      : "Enter a valid email address.",
    msg: values.msg.trim().length < 10 ? "Tell us a little more (at least 10 characters)." : "",
  };
}

function ContactPage() {
  const { data: settings } = usePublicSettings();
  const [topic, setTopic] = useState(topics[0]);
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", msg: "" });
  const [tried, setTried] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = checks(values);
  const shown = (f: Field) => (tried ? errors[f] : "");
  const shake = (f: Field) => (shown(f) ? (attempt % 2 ? "gs-shake-a" : "gs-shake-b") : undefined);
  const firstName = values.name.trim().split(/\s+/)[0] || "friend";

  const supportEmail = settings?.support_email;
  const contactItems = [
    {
      icon: Mail,
      label: "Email",
      value: supportEmail || "[EMAIL ADDRESS]",
      href: supportEmail ? `mailto:${supportEmail}` : undefined,
    },
    { icon: MessageSquare, label: "WhatsApp", value: "[WHATSAPP NUMBER]" },
    { icon: Phone, label: "Phone", value: "[PHONE NUMBER]" },
    { icon: Clock, label: "Hours", value: "[WORKING HOURS]" },
  ];

  const field = (f: Field) => ({
    value: values[f],
    onChange: (e: { target: { value: string } }) =>
      setValues((v) => ({ ...v, [f]: e.target.value })),
    "aria-invalid": !!shown(f),
    "aria-describedby": shown(f) ? `ct-${f}-error` : undefined,
  });

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (errors.name || errors.email || errors.msg) {
      setTried(true);
      setAttempt((a) => a + 1);
      return;
    }
    // No contact endpoint exists yet, so a valid message only plays the sending state.
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 900);
  }

  function handleReset() {
    setSent(false);
    setTried(false);
    setValues((v) => ({ ...v, msg: "" }));
  }

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Contact"
        title="Let's"
        highlight="talk land."
        lede="Questions about a listing, verification or your account? Send us a message and a real person will get back to you."
      />

      <section className="gs-wrap gs-contact">
        <div className="gs-card gs-form gs-reveal">
          {sent ? (
            <div role="status" className="gs-sent">
              <span className="gs-blob">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </span>
              <h2 className="gs-h" style={{ fontSize: 36 }}>
                Asante, {firstName}!
              </h2>
              <p className="gs-text">
                Your message is on its way. We&apos;ll reply to{" "}
                <strong style={{ color: "var(--ink)" }}>{values.email}</strong> within [RESPONSE
                TIME].
              </p>
              <button type="button" className="gs-btn gs-ghost" onClick={handleReset}>
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSend}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 22 }}
            >
              <h2 className="gs-h" style={{ fontSize: 30, letterSpacing: "-0.02em" }}>
                Send a message
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span id="ct-topic" className="gs-label">
                  What&apos;s it about?
                </span>
                <div role="group" aria-labelledby="ct-topic" className="gs-chips">
                  {topics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="gs-chip"
                      aria-pressed={topic === t}
                      onClick={() => setTopic(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div className="gs-field">
                  <label htmlFor="ct-name">Your name</label>
                  <div className={shake("name")}>
                    <input
                      id="ct-name"
                      className="gs-input"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Wanjiku Kamau"
                      {...field("name")}
                    />
                  </div>
                  {shown("name") && (
                    <span id="ct-name-error" className="gs-error">
                      {shown("name")}
                    </span>
                  )}
                </div>
                <div className="gs-field">
                  <label htmlFor="ct-email">Email</label>
                  <div className={shake("email")}>
                    <input
                      id="ct-email"
                      className="gs-input"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field("email")}
                    />
                  </div>
                  {shown("email") && (
                    <span id="ct-email-error" className="gs-error">
                      {shown("email")}
                    </span>
                  )}
                </div>
              </div>
              <div className="gs-field">
                <label htmlFor="ct-msg">Message</label>
                <div className={shake("msg")}>
                  <textarea
                    id="ct-msg"
                    className="gs-input"
                    placeholder="How can we help?"
                    {...field("msg")}
                  />
                </div>
                {shown("msg") && (
                  <span id="ct-msg-error" className="gs-error">
                    {shown("msg")}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="gs-btn"
                aria-busy={busy}
                style={{ minHeight: 58, width: "100%" }}
              >
                {busy ? (
                  <svg
                    className="gs-spin"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    role="img"
                    aria-label="Sending"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeOpacity=".3"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <>
                    Send message
                    <ArrowRight aria-hidden size={18} className="gs-arrow" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="gs-mini-map gs-reveal">
            <KenyaMeshMap pin={NAIROBI} />
            <span className="gs-mono gs-map-label">[OFFICE], NAIROBI</span>
          </div>
          {contactItems.map(({ icon: Icon, label, value, href }) => {
            const body = (
              <>
                <span className="gs-blob">
                  <Icon aria-hidden size={22} strokeWidth={1.8} />
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "var(--muted)", fontSize: 15 }}>{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} className="gs-info gs-lift">
                {body}
              </a>
            ) : (
              <div key={label} className="gs-info">
                {body}
              </div>
            );
          })}
          <span
            className="gs-hand"
            style={{ fontSize: 26, rotate: "-2deg", alignSelf: "flex-start", marginTop: 6 }}
          >
            karibu, we&apos;re happy to help
          </span>
        </div>
      </section>
    </MarketingShell>
  );
}
