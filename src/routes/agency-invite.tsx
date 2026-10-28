import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, type AuthMessage } from "@/components/auth/AuthLayout";
import { ArrowIcon, PrimaryButton, type BusyState } from "@/components/auth/AuthFields";
import { AgencyLogo } from "@/components/agency/AgencyLogo";
import { useAuth } from "@/lib/auth";
import { useAcceptInvitation, useInvitation } from "@/lib/agency";

export const Route = createFileRoute("/agency-invite")({
  head: () => ({ meta: [{ title: "Join an agency — Geo Pin Properties Kenya" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  ssr: false,
  component: AgencyInvitePage,
});

const MESSAGES: AuthMessage[] = [
  { h: "One team, one brand.", n: "your listings carry the agency's name" },
  { h: "Leads come to you.", n: "enquiries land in the agency inbox" },
];

/** Sends the visitor back here after they sign in or sign up. */
function rememberReturn() {
  try {
    sessionStorage.setItem("lv_return_to", window.location.pathname + window.location.search);
  } catch {
    /* storage unavailable: the visitor opens the link again after signing in */
  }
}

function AgencyInvitePage() {
  const { token } = Route.useSearch();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const { data: invitation, isLoading, isError } = useInvitation(token);
  const accept = useAcceptInvitation();
  const [busy, setBusy] = useState<BusyState>("idle");
  const [err, setErr] = useState("");

  const onAccept = async () => {
    setErr("");
    setBusy("loading");
    try {
      await accept.mutateAsync(token);
      setBusy("success");
      window.setTimeout(() => navigate({ to: "/dashboard", search: { tab: "agency" } }), 380);
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Couldn't accept the invitation.");
      setBusy("idle");
    }
  };

  const roleLabel = invitation?.role === "manager" ? "a manager" : "an agent";

  return (
    <AuthLayout messages={MESSAGES}>
      {isLoading || !ready ? (
        <div className="ga-heading">
          <h1>
            Checking your invitation<span className="ga-dot-mark">.</span>
          </h1>
        </div>
      ) : isError || !invitation ? (
        <>
          <div className="ga-heading">
            <h1>
              This invitation has expired<span className="ga-dot-mark">.</span>
            </h1>
            <p>It may have been used already. Ask the agency owner to send you a new one.</p>
          </div>
          <Link to="/" className="ga-btn ga-press ga-primary">
            Go to Geo Pin Properties
            <ArrowIcon />
          </Link>
        </>
      ) : (
        <>
          <AgencyLogo
            name={invitation.agency.name}
            logoUrl={invitation.agency.logoUrl}
            brandColor={invitation.agency.brandColor}
            size={64}
          />
          <div className="ga-heading">
            <h1>
              Join {invitation.agency.name}
              <span className="ga-dot-mark">.</span>
            </h1>
            <p>
              You&apos;ve been invited as {roleLabel}. Your listings will carry the agency&apos;s
              brand, and leads will reach you in its inbox.
            </p>
          </div>
          {user ? (
            <div className="ga-stack">
              {user.email.toLowerCase() !== invitation.email && (
                <p role="alert" className="ga-err">
                  This invitation was sent to {invitation.email}. Sign in with that email to accept
                  it.
                </p>
              )}
              {err && (
                <p role="alert" className="ga-err">
                  {err}
                </p>
              )}
              <PrimaryButton
                busy={busy}
                onClick={onAccept}
                disabled={user.email.toLowerCase() !== invitation.email}
              >
                Accept and join
              </PrimaryButton>
            </div>
          ) : (
            <div className="ga-stack">
              <p className="ga-sub">Sign in or create an account with {invitation.email} first.</p>
              <Link to="/login" onClick={rememberReturn} className="ga-btn ga-press ga-primary">
                Sign in
                <ArrowIcon />
              </Link>
              <Link to="/register" onClick={rememberReturn} className="ga-btn ga-press">
                Create an account
              </Link>
            </div>
          )}
        </>
      )}
    </AuthLayout>
  );
}
