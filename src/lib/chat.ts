import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { api, type Paginated } from "./api";
import { useAuth } from "./auth";
import { realtimeConnected } from "./echo";

export interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  mine: boolean;
  senderName: string | null;
  /** Only on your own messages: the id the browser sent it with. */
  clientId: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  /** Whether you are the one asking about the listing or the one selling it. */
  role: "buyer" | "seller";
  with: { name: string; avatarColor: string | null };
  agency: { name: string; slug: string } | null;
  listing: { type: "parcel" | "property"; id: string; title: string | null };
  lastMessage: ChatMessage | null;
  unread: number;
  /** False once the agency behind the listing is suspended. */
  canReply: boolean;
  lastMessageAt: string | null;
}

interface ApiMessage {
  id: string;
  conversation_id: string;
  body: string;
  mine: boolean;
  sender_name: string | null;
  client_id: string | null;
  created_at: string;
}

interface ApiConversation {
  id: string;
  role: "buyer" | "seller";
  with: { name: string; avatar_color: string | null };
  agency: { name: string; slug: string } | null;
  listing: { type: "parcel" | "property"; id: string; title: string | null };
  last_message: ApiMessage | null;
  unread: number;
  can_reply: boolean;
  last_message_at: string | null;
}

export interface MessagePage {
  /** Newest first. */
  messages: ChatMessage[];
  hasMore: boolean;
}

export type MessagePages = InfiniteData<MessagePage, string | undefined>;

const mapMessage = (m: ApiMessage): ChatMessage => ({
  id: m.id,
  conversationId: m.conversation_id,
  body: m.body,
  mine: m.mine,
  senderName: m.sender_name,
  clientId: m.client_id,
  createdAt: m.created_at,
});

const mapConversation = (c: ApiConversation): Conversation => ({
  id: c.id,
  role: c.role,
  with: { name: c.with.name, avatarColor: c.with.avatar_color },
  agency: c.agency,
  listing: c.listing,
  lastMessage: c.last_message && mapMessage(c.last_message),
  unread: c.unread,
  canReply: c.can_reply,
  lastMessageAt: c.last_message_at,
});

export const CONVERSATIONS_KEY = ["conversations"];
export const UNREAD_KEY = ["conversations", "unread"];
const LIST_KEY = ["conversations", "list"];
export const messagesKey = (id: string) => ["messages", id];
const conversationKey = (id: string) => ["conversations", "one", id];

// While the WebSocket is up, events keep these current; a slow poll still
// catches anything a dropped event would otherwise leave stale.
const FALLBACK_POLL = 120_000;

export function useConversations() {
  return useInfiniteQuery({
    queryKey: LIST_KEY,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<Paginated<ApiConversation>>(
        `/user/conversations?page=${pageParam}`,
      );
      return { ...res, data: res.data.map(mapConversation) };
    },
    getNextPageParam: (last) =>
      last.current_page < last.last_page ? last.current_page + 1 : undefined,
    refetchInterval: () => (realtimeConnected() ? FALLBACK_POLL : 30_000),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKey(id),
    queryFn: async () =>
      mapConversation(await api.get<ApiConversation>(`/user/conversations/${id}`)),
    retry: false,
  });
}

/** How many conversations have messages you haven't read, for the header and sidebar badges. */
export function useUnreadMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: UNREAD_KEY,
    enabled: !!user && user.role !== "account_manager",
    queryFn: async () => (await api.get<{ count: number }>("/user/conversations/unread")).count,
    refetchInterval: () => (realtimeConnected() ? FALLBACK_POLL : 60_000),
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: messagesKey(conversationId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<MessagePage> => {
      const res = await api.get<{ data: ApiMessage[]; has_more: boolean }>(
        `/user/conversations/${conversationId}/messages${pageParam ? `?before=${pageParam}` : ""}`,
      );
      return { messages: res.data.map(mapMessage), hasMore: res.has_more };
    },
    getNextPageParam: (last) => (last.hasMore ? last.messages.at(-1)?.id : undefined),
    refetchInterval: () => (realtimeConnected() ? FALLBACK_POLL : 15_000),
  });
}

/** Puts a message into the conversation's history unless it is already there. */
export function addMessage(prev: MessagePages | undefined, message: ChatMessage) {
  if (!prev || prev.pages.some((p) => p.messages.some((m) => m.id === message.id))) return prev;
  const [first, ...rest] = prev.pages;
  return { ...prev, pages: [{ ...first, messages: [message, ...first.messages] }, ...rest] };
}

/**
 * Sends with an id made in the browser, so retrying a message that seemed to
 * fail never posts it twice.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, clientId }: { body: string; clientId: string }) =>
      mapMessage(
        await api.post<ApiMessage>(`/user/conversations/${conversationId}/messages`, {
          body,
          client_id: clientId,
        }),
      ),
    onSuccess: (message) => {
      queryClient.setQueryData<MessagePages>(messagesKey(conversationId), (prev) =>
        addMessage(prev, message),
      );
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

/** The first message from a listing; writing again continues the same conversation. */
export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      type,
      listingId,
      body,
    }: {
      type: "parcel" | "property";
      listingId: string;
      body: string;
    }) =>
      mapConversation(
        await api.post<ApiConversation>(`/listings/${type}/${listingId}/conversations`, {
          body,
          client_id: crypto.randomUUID(),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/user/conversations/${id}/read`),
    onMutate: (id) => {
      queryClient.setQueryData<InfiniteData<Paginated<Conversation>>>(LIST_KEY, (prev) =>
        prev
          ? {
              ...prev,
              pages: prev.pages.map((p) => ({
                ...p,
                data: p.data.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
              })),
            }
          : prev,
      );
      queryClient.setQueryData<Conversation>(conversationKey(id), (prev) =>
        prev ? { ...prev, unread: 0 } : prev,
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: UNREAD_KEY }),
  });
}
