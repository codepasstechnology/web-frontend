import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  addMessage,
  CONVERSATIONS_KEY,
  messagesKey,
  type ChatMessage,
  type MessagePages,
} from "@/lib/chat";
import { connectEcho, disconnectEcho } from "@/lib/echo";

interface SentEvent {
  id: string;
  conversation_id: string;
  body: string;
  sender_id: string | null;
  sender_name: string | null;
  client_id: string;
  created_at: string;
}

/**
 * Listens on the signed-in user's private channel and folds what arrives into
 * the chat queries. The API stays the source of truth: after a dropped
 * connection everything is fetched again rather than trusting the gap.
 */
export function ChatRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user && user.role !== "account_manager" ? user.id : null;

  useEffect(() => {
    if (!user) disconnectEcho();
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    const connecting = connectEcho();
    if (!connecting) return;

    const channel = `App.Models.User.${userId}`;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    };
    let stopWatching: (() => void) | undefined;
    let cancelled = false;

    connecting.then((echo) => {
      if (cancelled) return;
      // Refetching on a drop also moves the queries back to their fast polling
      // until the socket returns; refetching on its return picks up what was missed.
      let wasLive = echo.connectionStatus() === "connected";
      let everLive = wasLive;
      stopWatching = echo.connector.onConnectionChange((status) => {
        const isLive = status === "connected";
        if (isLive !== wasLive && everLive) refresh();
        wasLive = isLive;
        everLive ||= isLive;
      });

      echo
        .private(channel)
        .listen(".message.sent", (e: SentEvent) => {
          const mine = e.sender_id === userId;
          const message: ChatMessage = {
            id: e.id,
            conversationId: e.conversation_id,
            body: e.body,
            mine,
            senderName: e.sender_name,
            clientId: mine ? e.client_id : null,
            createdAt: e.created_at,
          };
          queryClient.setQueryData<MessagePages>(messagesKey(e.conversation_id), (prev) =>
            addMessage(prev, message),
          );
          queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
        })
        .listen(".conversation.read", () =>
          queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
        );
    });

    return () => {
      cancelled = true;
      stopWatching?.();
      connecting.then((echo) => echo.leave(channel));
    };
  }, [userId, queryClient]);

  return null;
}
