import { useEffect, useRef, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, Link2, MessageCircle, MoreHorizontal, X } from "lucide-react";
import { previewOutline } from "@/lib/mapGeo";
import { whatsappShareUrl } from "@/lib/mapLinks";
import { useMapToast } from "@/components/map/mapToastContext";

export type ShareShape =
  | { kind: "polygon"; points: [number, number][]; verified: boolean }
  | { kind: "approx" }
  | { kind: "home" };

const W = 360;
const H = 200;

export function ShareSheet({
  anchor,
  noun,
  title,
  mono,
  meta,
  price,
  url,
  waText,
  shape,
  color,
  imageUrl,
  onClose,
}: {
  /** Any element inside the map area; the sheet opens over that area. */
  anchor: HTMLElement | null;
  noun: string;
  title: string;
  mono: boolean;
  meta: string;
  price: string;
  url: string;
  waText: string;
  shape: ShareShape;
  color: string;
  imageUrl?: string;
  onClose: () => void;
}) {
  const toast = useMapToast();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      toast("Couldn't copy the link");
    }
  };

  const saveImage = async () => {
    if (!imageUrl) return;
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], `${title.replace(/[^\w-]+/g, "-")}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(href);
      toast("Image saved to your downloads");
    } catch {
      toast("Couldn't save the image");
    }
  };

  const moreApps = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* the viewer closed the share sheet */
      }
      return;
    }
    await copyLink();
  };

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const target = anchor?.closest(".gm-mapwrap");
  if (!target) return null;

  return createPortal(
    <div
      className="gm-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Share this ${noun}`}
      onClick={onBackdrop}
    >
      <div className="gm-mcard" style={{ maxWidth: 440 }}>
        <div className="gm-mhead">
          <h2 className="gm-h" style={{ fontSize: 24 }}>
            Share this {noun}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="gm-mbtn"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "none" }}
          >
            <X width={16} height={16} aria-hidden />
          </button>
        </div>
        <div className="gm-scard" aria-label="Share image preview">
          <SharePreview shape={shape} color={color} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 10,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span
                className={mono ? "gm-mono" : "gm-h"}
                style={{ fontWeight: mono ? 600 : 700, fontSize: mono ? 15 : 17 }}
              >
                {title}
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{meta}</span>
              <span style={{ fontWeight: 700 }}>{price}</span>
            </div>
            <span className="gm-mark">
              <span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
                </svg>
              </span>
              Geo Pin
            </span>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          This picture shows up when you share the link on WhatsApp, so people see the actual land
          before they open it.
        </p>
        <div className="gm-sgrid">
          <a
            href={whatsappShareUrl(waText)}
            target="_blank"
            rel="noopener noreferrer"
            className="gm-btn gm-wa"
          >
            <MessageCircle width={18} height={18} aria-hidden /> WhatsApp
          </a>
          <button type="button" className="gm-btn gm-ghost" onClick={copyLink}>
            <Link2 width={18} height={18} aria-hidden /> Copy link
          </button>
          {imageUrl && (
            <button type="button" className="gm-btn gm-ghost" onClick={saveImage}>
              <ImageIcon width={18} height={18} aria-hidden /> Save image
            </button>
          )}
          <button type="button" className="gm-btn gm-ghost" onClick={moreApps}>
            <MoreHorizontal width={18} height={18} aria-hidden /> More apps
          </button>
        </div>
      </div>
    </div>,
    target,
  );
}

function SharePreview({ shape, color }: { shape: ShareShape; color: string }) {
  let outline = null;
  if (shape.kind === "polygon") {
    const pts = previewOutline(shape.points);
    outline = (
      <>
        <path
          d={`M${pts.map((p) => p.join(" ")).join("L")}Z`}
          fill={color}
          fillOpacity={shape.verified ? 0.4 : 0.22}
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={shape.verified ? undefined : "7 5"}
          strokeLinejoin="round"
        />
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill="var(--surface)"
            stroke={color}
            strokeWidth="2"
          />
        ))}
      </>
    );
  } else if (shape.kind === "approx") {
    outline = (
      <>
        <circle
          cx="180"
          cy="100"
          r="70"
          fill={color}
          fillOpacity=".15"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
        <circle cx="180" cy="100" r="7" fill="var(--surface)" stroke={color} strokeWidth="2" />
      </>
    );
  } else {
    outline = <path d="M155 125 180 102 205 125V152H155Z" fill={color} />;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <rect width={W} height={H} fill="var(--bg2)" />
      <path
        d="M-10 150 C 80 140, 160 160, 370 120"
        stroke="var(--surface)"
        strokeWidth="14"
        fill="none"
      />
      <path
        d="M250 -10 C 240 60, 270 120, 260 210"
        stroke="var(--surface)"
        strokeWidth="10"
        fill="none"
      />
      <path
        d="M20 30h70v50h-70zM110 20h60v40h-60zM290 30h60v60h-60zM30 170h80v40h-80z"
        fill="var(--soft)"
        opacity=".7"
      />
      {outline}
    </svg>
  );
}
