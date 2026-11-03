import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, MessagesSquare, RotateCw, Send } from "lucide-react";
import {
  useConversation,
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" });

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(d, new Date())) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
}

function listTime(iso: string): string {
  return sameDay(new Date(iso), new Date())
    ? time(iso)
    : new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function Avatar({ conversation }: { conversation: Conversation }) {
  if (conversation.role === "buyer" && conversation.agency) {
    return (
      <span className="gd-avatar" aria-hidden="true">
        <Building2 size={18} />
      </span>
    );
  }
  return (
    <span
      className="gd-avatar"
      aria-hidden="true"
      style={conversation.with.avatarColor ? { background: conversation.with.avatarColor } : {}}
    >
      {initials(conversation.with.name)}
    </span>
  );
}

/** Buyers' conversations with sellers, and sellers' with the people asking about their listings. */
export function MessagesTab({
  conversationId,
  onOpen,
  onBack,
}: {
  conversationId?: string;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={`gd-h1 ${conversationId ? "hidden md:block" : ""}`}>Messages</h1>
      <div className="gd-card flex h-[calc(100dvh-220px)] min-h-[420px] overflow-hidden p-0 md:h-[calc(100vh-230px)]">
        <div
          className={`${conversationId ? "hidden md:flex" : "flex"} w-full flex-col border-border md:w-[320px] md:flex-none md:border-r`}
        >
          <ConversationList activeId={conversationId} onOpen={onOpen} />
        </div>
        <div className={`${conversationId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
          {conversationId ? (
            <Thread key={conversationId} id={conversationId} onBack={onBack} />
          ) : (
            <div className="m-auto flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
              <MessagesSquare size={28} aria-hidden="true" />
              Choose a conversation to read it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationList({
  activeId,
  onOpen,
}: {
  activeId?: string;
  onOpen: (id: string) => void;
}) {
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useConversations();
  const conversations = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="gd-skel h-14" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 p-4">
        <p className="text-sm text-muted-foreground">We couldn&apos;t load your messages.</p>
        <button type="button" className="gd-btn gd-sm" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="gd-empty m-4">
        <MessagesSquare size={24} aria-hidden="true" />
        <strong>No messages yet</strong>
        <p className="text-sm text-muted-foreground">
          Message a seller from any listing on the map, and their replies will show up here.
        </p>
        <Link to="/explore" className="gd-link">
          Explore listings
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex-1 divide-y divide-border overflow-y-auto">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onOpen(c.id)}
            aria-current={c.id === activeId ? "true" : undefined}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 aria-[current=true]:bg-muted"
          >
            <Avatar conversation={c} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-baseline justify-between gap-2">
                <span className={`truncate ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>
                  {c.with.name}
                </span>
                {c.lastMessageAt && (
                  <span className="flex-none text-xs text-muted-foreground">
                    {listTime(c.lastMessageAt)}
                  </span>
                )}
              </span>
              {c.listing.title && (
                <span className="truncate text-xs text-muted-foreground">{c.listing.title}</span>
              )}
              <span className="flex items-center justify-between gap-2">
                <span
                  className={`truncate text-sm ${c.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {c.lastMessage &&
                    (c.lastMessage.mine ? `You: ${c.lastMessage.body}` : c.lastMessage.body)}
                </span>
                {c.unread > 0 && (
                  <span className="gd-nav-count" aria-label={`${c.unread} unread`}>
                    {c.unread > 99 ? "99+" : c.unread}
                  </span>
                )}
              </span>
            </span>
          </button>
        </li>
      ))}
      {hasNextPage && (
        <li className="p-3 text-center">
          <button
            type="button"
            className="gd-link"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading…" : "Show older conversations"}
          </button>
        </li>
      )}
    </ul>
  );
}

interface Outgoing {
  clientId: string;
  body: string;
  createdAt: string;
  failed: boolean;
}

function Thread({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: conversation, isError: missing } = useConversation(id);
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const markRead = useMarkConversationRead();
  const [outbox, setOutbox] = useState<Outgoing[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const heightBeforeOlder = useRef<number | null>(null);

  const history = (messages.data?.pages.flatMap((p) => p.messages) ?? []).slice().reverse();
  const delivered = new Set(history.map((m) => m.clientId).filter(Boolean));
  const pending = outbox.filter((o) => !delivered.has(o.clientId));
  const newest = history.at(-1);
  const newestIncoming = history.filter((m) => !m.mine).at(-1)?.id;
  const { mutate: markAsRead } = markRead;

  useEffect(() => {
    markAsRead(id);
  }, [id, newestIncoming, markAsRead]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (heightBeforeOlder.current !== null) {
      el.scrollTop += el.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [newest?.id, pending.length, messages.data?.pages.length]);

  const deliver = (body: string, clientId: string) => {
    setOutbox((o) => [
      ...o.filter((x) => x.clientId !== clientId),
      { clientId, body, createdAt: new Date().toISOString(), failed: false },
    ]);
    send
      .mutateAsync({ body, clientId })
      .then(() => setOutbox((o) => o.filter((x) => x.clientId !== clientId)))
      .catch(() =>
        setOutbox((o) => o.map((x) => (x.clientId === clientId ? { ...x, failed: true } : x))),
      );
  };

  const loadOlder = () => {
    heightBeforeOlder.current = scroller.current?.scrollHeight ?? null;
    messages.fetchNextPage();
  };

  if (missing) {
    return (
      <div className="m-auto flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-muted-foreground">This conversation isn&apos;t available.</p>
        <button type="button" className="gd-link" onClick={onBack}>
          Back to messages
        </button>
      </div>
    );
  }

  const showSender = conversation?.role === "buyer" && !!conversation.agency;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          className="gd-ib md:hidden"
          onClick={onBack}
          aria-label="Back to messages"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        {conversation && (
          <>
            <Avatar conversation={conversation} />
            <span className="flex min-w-0 flex-col">
              <strong className="truncate">{conversation.with.name}</strong>
              {conversation.listing.title && (
                <Link
                  to="/explore"
                  search={
                    conversation.listing.type === "parcel"
                      ? { parcel: conversation.listing.id }
                      : { property: conversation.listing.id }
                  }
                  className="truncate text-xs text-muted-foreground hover:underline"
                >
                  About {conversation.listing.title}
                </Link>
              )}
            </span>
          </>
        )}
      </header>

      <div
        ref={scroller}
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {messages.isLoading && <div className="gd-skel m-auto h-10 w-40" aria-busy="true" />}
        {messages.isError && (
          <p className="m-auto text-sm text-muted-foreground">
            We couldn&apos;t load this conversation.
          </p>
        )}
        {messages.hasNextPage && (
          <button
            type="button"
            className="gd-link mx-auto mb-2"
            disabled={messages.isFetchingNextPage}
            onClick={loadOlder}
          >
            {messages.isFetchingNextPage ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {history.map((m, i) => (
          <Fragment key={m.id}>
            {(i === 0 || !sameDay(new Date(history[i - 1].createdAt), new Date(m.createdAt))) && (
              <p className="my-2 text-center text-xs font-semibold text-muted-foreground">
                {dayLabel(m.createdAt)}
              </p>
            )}
            <Bubble message={m} showSender={showSender} />
          </Fragment>
        ))}
        {pending.map((o) => (
          <Bubble
            key={o.clientId}
            message={{
              id: o.clientId,
              conversationId: id,
              body: o.body,
              mine: true,
              senderName: null,
              clientId: o.clientId,
              createdAt: o.createdAt,
            }}
            status={o.failed ? "failed" : "sending"}
            onRetry={() => deliver(o.body, o.clientId)}
          />
        ))}
      </div>

      {conversation && !conversation.canReply ? (
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          This agency is no longer on Geo Pin Properties, so you can&apos;t reply here.
        </p>
      ) : (
        <Composer onSend={(body) => deliver(body, crypto.randomUUID())} />
      )}
    </>
  );
}

function Bubble({
  message,
  showSender,
  status,
  onRetry,
}: {
  message: ChatMessage;
  showSender?: boolean;
  status?: "sending" | "failed";
  onRetry?: () => void;
}) {
  return (
    <div className={`flex flex-col ${message.mine ? "items-end" : "items-start"}`}>
      {showSender && !message.mine && message.senderName && (
        <span className="mb-0.5 px-1 text-xs text-muted-foreground">{message.senderName}</span>
      )}
      <div
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] ${
          message.mine ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"
        } ${status ? "opacity-70" : ""}`}
      >
        {message.body}
      </div>
      <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">
        {status === "sending" && "Sending…"}
        {status === "failed" && (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            Not sent
            <button type="button" className="gd-link" onClick={onRetry}>
              <RotateCw size={12} aria-hidden="true" /> Retry
            </button>
          </span>
        )}
        {!status && time(message.createdAt)}
      </span>
    </div>
  );
}

function Composer({ onSend }: { onSend: (body: string) => void }) {
  const [body, setBody] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = body.trim();
    if (!text) return;
    onSend(text);
    setBody("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
      <textarea
        className="gd-input max-h-40 min-h-[44px] flex-1 resize-none py-2.5 [field-sizing:content]"
        rows={1}
        value={body}
        maxLength={2000}
        placeholder="Write a message"
        aria-label="Message"
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button type="submit" className="gd-btn" disabled={!body.trim()} aria-label="Send message">
        <Send size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
