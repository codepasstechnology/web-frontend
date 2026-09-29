import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Geo Pin Properties Kenya" }] }),
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

const topics = [
  "Verification result question",
  "Account or billing issue",
  "Technical problem",
  "Partnership enquiry",
  "Other",
];

const emptyForm = { name: "", email: "", subject: "", message: "" };

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to backend
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader eyebrow="Contact" title="Get in touch">
        <p className="max-w-[56ch] text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
          Questions about a verification? Need help with your account? Our team is here for you.
        </p>
      </PageHeader>

      <main className="mx-auto grid max-w-[1100px] gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-5">
        <aside className="flex flex-col gap-8 lg:col-span-2">
          <ul className="flex flex-col gap-6">
            {contactItems.map(({ icon: Icon, label, value, sub }) => (
              <li key={label} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon aria-hidden className="h-5 w-5 text-brand" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{sub}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <p className="font-semibold">Looking for help articles?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Most common questions are answered in the Help Centre.
            </p>
            <Link
              to="/help"
              className="mt-3 inline-flex text-sm font-semibold text-brand hover:underline"
            >
              Go to Help Centre →
            </Link>
          </div>
        </aside>

        <section className="rounded-xl border border-border bg-card p-6 text-card-foreground md:p-8 lg:col-span-3">
          {sent ? (
            <div role="status" className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 aria-hidden className="h-12 w-12 text-success" />
              <h2 className="text-lg font-bold">Message received!</h2>
              <p className="text-muted-foreground">
                We&apos;ll get back to you at {form.email} within one business day.
              </p>
              <Button
                variant="link"
                className="text-brand"
                onClick={() => {
                  setSent(false);
                  setForm(emptyForm);
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <h2 className="text-lg font-bold">Send a message</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="contact-name">Full name</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="contact-email">Email address</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="contact-subject">Subject</Label>
                <Select
                  name="subject"
                  required
                  value={form.subject}
                  onValueChange={(subject) => setForm((prev) => ({ ...prev, subject }))}
                >
                  <SelectTrigger id="contact-subject">
                    <SelectValue placeholder="Select a topic…" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Describe your question or issue…"
                  className="resize-none"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 bg-brand px-6 text-base text-brand-foreground hover:bg-brand-hover"
                >
                  <Send /> Send message
                </Button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
