import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, Check, Flag, Info, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useAgencyReviews,
  useReportReview,
  useSubmitReview,
  type AgencyProfile,
} from "@/lib/agency";
import { StarIcon, Stars } from "@/components/agency/page/icons";

const PICK_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];
const AVATAR = ["#3F5A2A", "#2D5C9C", "#A8600C", "#23756C", "#8A3F78", "#1E2418"];
const SHOWN = 4;

type Sort = "new" | "high" | "low";

export function AgencyReviews({ agency, shortName }: { agency: AgencyProfile; shortName: string }) {
  const { user } = useAuth();
  const { data } = useAgencyReviews(agency.slug, true);
  const submit = useSubmitReview(agency.slug);
  const report = useReportReview();
  const [pick, setPick] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [all, setAll] = useState(false);
  const [reported, setReported] = useState<string[]>([]);

  const count = data?.count ?? 0;
  const reviews = [...(data?.reviews ?? [])].sort((a, b) =>
    sort === "high"
      ? b.rating - a.rating
      : sort === "low"
        ? a.rating - b.rating
        : b.createdAt.localeCompare(a.createdAt),
  );
  const lit = hover || pick;
  const maxDist = Math.max(1, ...(data?.distribution ?? []).map((d) => d.count));

  const post = async () => {
    setError("");
    try {
      await submit.mutateAsync({ rating: pick, body: comment.trim() });
      setPosted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post your review.");
    }
  };

  const onReport = async (id: string) => {
    const reason = window.prompt("What's wrong with this review?");
    if (!reason || reason.trim().length < 5) return;
    await report.mutateAsync({ id, reason: reason.trim() }).catch(() => {});
    setReported((r) => [...r, id]);
  };

  return (
    <section id="reviews" className="ag-sec" aria-labelledby="h-reviews">
      <div className="ag-sechead">
        <h2 id="h-reviews" className="gs-h ag-h2">
          Reviews
        </h2>
      </div>

      {count > 0 && data?.rating != null && (
        <div className="ag-rsum">
          <div
            style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}
          >
            <span className="gs-h" style={{ fontSize: 56, lineHeight: 1 }}>
              {data.rating.toFixed(1)}
            </span>
            <Stars value={data.rating} label={`${data.rating.toFixed(1)} out of 5`} />
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {count} {count === 1 ? "review" : "reviews"}
            </span>
          </div>
          <div className="ag-dist">
            {data.distribution.map((d) => (
              <span key={d.star} style={{ display: "contents" }}>
                <span>{d.star}</span>
                <span style={{ color: "var(--accent)", display: "flex" }}>
                  <StarIcon size={12} />
                </span>
                <span className="ag-bar">
                  <span style={{ width: `${(d.count / maxDist) * 100}%` }} />
                </span>
                <span className="ag-dn">{d.count}</span>
              </span>
            ))}
          </div>
          <p className="ag-rnote">
            <Info size={15} aria-hidden />
            <span>
              Only people who messaged this agency or booked a viewing through Geo Pin can review
              it.
            </span>
          </p>
        </div>
      )}

      {!user && (
        <div className="ag-rbox">
          <span>Sign in after messaging them or booking a viewing to leave a review.</span>
          <Link to="/login" className="gs-btn gs-ghost" style={{ minHeight: 42, fontSize: 14 }}>
            Sign in
          </Link>
        </div>
      )}

      {data?.canReview && !posted && (
        <div className="ag-rform">
          <span style={{ fontWeight: 700 }}>
            {data.myReview ? "Update your review" : `How was ${shortName}?`}
          </span>
          <div
            className="ag-pick"
            role="radiogroup"
            aria-label="Your rating"
            onMouseLeave={() => setHover(0)}
          >
            {PICK_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={pick === i + 1}
                aria-label={`${i + 1} star${i ? "s" : ""}, ${label}`}
                data-lit={i < lit}
                onMouseEnter={() => setHover(i + 1)}
                onClick={() => setPick(i + 1)}
              >
                <StarIcon size={28} />
              </button>
            ))}
            <span style={{ fontSize: 14, color: "var(--muted)", marginLeft: 6 }}>
              {lit ? PICK_LABELS[lit - 1] : "Pick a rating"}
            </span>
          </div>
          <textarea
            className="gs-input"
            rows={3}
            maxLength={1000}
            placeholder="What went well, and what could be better? (optional)"
            aria-label="Your review (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ minHeight: 96, fontSize: 15 }}
          />
          {error && (
            <div role="alert" className="ag-err">
              {error}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Your first name and the date are shown with your review.
            </span>
            <button
              type="button"
              className="gs-btn"
              onClick={post}
              disabled={pick === 0 || submit.isPending}
              style={{ minHeight: 46, fontSize: 15 }}
            >
              {submit.isPending ? "Posting…" : data.myReview ? "Update review" : "Post review"}
            </button>
          </div>
        </div>
      )}

      {posted && (
        <div
          className="ag-rbox"
          role="status"
          style={{
            background: "var(--soft)",
            color: "var(--soft-ink)",
            borderColor: "transparent",
          }}
        >
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <Check size={16} aria-hidden /> Thanks, your review is posted.
          </span>
        </div>
      )}

      {reviews.length > 0 ? (
        <>
          <div
            className="ag-seg"
            role="group"
            aria-label="Sort reviews"
            style={{ alignSelf: "flex-start" }}
          >
            {(
              [
                ["new", "Newest"],
                ["high", "Highest"],
                ["low", "Lowest"],
              ] as const
            ).map(([s, label]) => (
              <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>
                {label}
              </button>
            ))}
          </div>
          <div className="ag-rlist">
            {(all ? reviews : reviews.slice(0, SHOWN)).map((r) => (
              <article key={r.id} className="ag-rev">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      className="ag-rav"
                      style={{ background: AVATAR[r.author.charCodeAt(0) % AVATAR.length] }}
                      aria-hidden
                    >
                      {r.author.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontWeight: 700 }}>{r.author}</span>
                      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </span>
                  <Stars value={r.rating} size={14} label={`${r.rating} out of 5 stars`} />
                </div>
                {r.context && (
                  <span className="ag-ctx">
                    {r.context === "viewing" ? (
                      <CalendarCheck size={13} aria-hidden />
                    ) : (
                      <MessageCircle size={13} aria-hidden />
                    )}
                    {r.context === "viewing" ? "Booked a viewing" : "Messaged the agency"}
                  </span>
                )}
                {r.body && <p style={{ margin: 0, lineHeight: 1.6, fontSize: 15 }}>{r.body}</p>}
                {r.reply && (
                  <div className="ag-reply">
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>Reply from {shortName}</span>
                    <span style={{ fontSize: 14.5, lineHeight: 1.55 }}>{r.reply}</span>
                  </div>
                )}
                {user && (
                  <button
                    type="button"
                    className="ag-report"
                    onClick={() => onReport(r.id)}
                    disabled={reported.includes(r.id)}
                  >
                    <Flag size={12} aria-hidden />
                    {reported.includes(r.id) ? "Reported" : "Report"}
                  </button>
                )}
              </article>
            ))}
          </div>
          {!all && reviews.length > SHOWN && (
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={() => setAll(true)}
              style={{ alignSelf: "flex-start", minHeight: 44, fontSize: 14 }}
            >
              Show all {count} reviews
            </button>
          )}
        </>
      ) : (
        data && (
          <div className="ag-empty" style={{ padding: 26 }}>
            <strong>No reviews yet.</strong>
            <span>
              After you message {shortName} or book a viewing, you can be the first to review them.
            </span>
          </div>
        )
      )}
    </section>
  );
}
