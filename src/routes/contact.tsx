import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — LandVerify Kenya" }] }),
  component: ContactPage,
});

const contactItems = [
  {
    icon: Mail,
    label: "Email us",
    value: "support@landverify.co.ke",
    sub: "We reply within one business day.",
  },
  {
    icon: Phone,
    label: "Call us",
    value: "+254 700 123 456",
    sub: "Mon – Fri, 8 am – 6 pm EAT.",
  },
  {
    icon: MapPin,
    label: "Visit us",
    value: "Westlands, Nairobi",
    sub: "Delta Corner, 4th Floor.",
  },
];

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to backend
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Get in touch</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Questions about a verification? Need help with your account? Our team is here for you.
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-5">
        {/* Contact info */}
        <aside className="lg:col-span-2">
          <div className="space-y-6">
            {contactItems.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 font-medium text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Looking for help articles?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Check our Help Centre — most common questions are answered there.
            </p>
            <a
              href="/help"
              className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
            >
              Go to Help Centre →
            </a>
          </div>
        </aside>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-3">
          {sent ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">Message received!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll get back to you at {form.email} within one business day.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", email: "", subject: "", message: "" });
                }}
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Send a message</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Full name
                  </label>
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Email address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Subject
                </label>
                <select
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Select a topic…</option>
                  <option>Verification result question</option>
                  <option>Account or billing issue</option>
                  <option>Technical problem</option>
                  <option>Partnership enquiry</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  placeholder="Describe your question or issue…"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-secondary"
              >
                <Send className="h-4 w-4" />
                Send message
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
