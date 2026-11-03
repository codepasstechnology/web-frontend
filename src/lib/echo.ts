import type Echo from "laravel-echo";
import { API_BASE, getToken } from "./api";

const KEY = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
const HOST = import.meta.env.VITE_REVERB_HOST as string | undefined;
const PORT = Number(import.meta.env.VITE_REVERB_PORT || 443);
const TLS = (import.meta.env.VITE_REVERB_SCHEME || "https") === "https";

let echo: Promise<Echo<"reverb">> | null = null;
let live = false;

/** Whether the WebSocket is up, so polling can slow down while events arrive on their own. */
export function realtimeConnected(): boolean {
  return live;
}

/**
 * One connection for the whole app, loaded only once someone signs in. Without
 * Reverb settings the app keeps working on polling alone.
 */
export function connectEcho(): Promise<Echo<"reverb">> | null {
  if (!KEY || typeof window === "undefined") return null;

  echo ??= Promise.all([import("laravel-echo"), import("pusher-js")]).then(
    ([{ default: EchoClient }, { default: Pusher }]) => {
      const client = new EchoClient({
        broadcaster: "reverb",
        Pusher,
        key: KEY,
        wsHost: HOST,
        wsPort: PORT,
        wssPort: PORT,
        forceTLS: TLS,
        enabledTransports: ["ws", "wss"],
        // The token can rotate mid-session, so it is read on every subscribe.
        authorizer: (channel: { name: string }) => ({
          authorize: (
            socketId: string,
            callback: (error: Error | null, data: { auth: string } | null) => void,
          ) => {
            fetch(`${API_BASE}/broadcasting/auth`, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken() ?? ""}`,
              },
              body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
            })
              .then(async (res) => {
                if (!res.ok) throw new Error(`Channel authorization failed (${res.status})`);
                callback(null, await res.json());
              })
              .catch((err: Error) => callback(err, null));
          },
        }),
      });
      client.connector.onConnectionChange((status) => {
        live = status === "connected";
      });
      return client;
    },
  );
  return echo;
}

export function disconnectEcho(): void {
  echo?.then((client) => client.disconnect());
  echo = null;
  live = false;
}
