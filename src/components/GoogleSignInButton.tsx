import { useEffect, useRef } from "react";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme: string;
          size: string;
          shape: string;
          text: string;
          width: number;
          logo_alignment: string;
        },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

/**
 * There are two build entry points (SSR via __root.tsx and the cPanel SPA via
 * index.cpanel.html), so the script is loaded on demand here rather than being
 * duplicated into both templates.
 */
function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function GoogleSignInButton({
  onCredential,
  text = "signin_with",
}: {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  const target = useRef<HTMLDivElement>(null);
  // Kept in a ref so re-rendering the parent never re-initialises Google.
  const handler = useRef(onCredential);
  handler.current = onCredential;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !target.current) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !target.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handler.current(response.credential),
        });

        window.google.accounts.id.renderButton(target.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          width: 336,
          logo_alignment: "left",
        });
      })
      .catch(() => {
        /* Offline or blocked — the password form still works. */
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId) return null;

  return <div ref={target} className="mt-3 flex justify-center" />;
}
