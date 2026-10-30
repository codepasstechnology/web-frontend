import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MessagePages } from "@/lib/chat";

type Handler = (payload: unknown) => void;
const handlers: Record<string, Handler> = {};
let onStatus: ((status: string) => void) | undefined;
const channel = {
  listen: vi.fn((event: string, cb: Handler) => {
    handlers[event] = cb;
    return channel;
  }),
};
const fakeEcho = {
  connectionStatus: () => "connected",
  connector: {
    onConnectionChange: (cb: (status: string) => void) => {
      onStatus = cb;
      return () => {};
    },
  },
  private: vi.fn(() => channel),
  leave: vi.fn(),
};
const mockConnect = vi.fn(() => Promise.resolve(fakeEcho));
vi.mock("@/lib/echo", () => ({
  connectEcho: () => mockConnect(),
  disconnectEcho: vi.fn(),
  realtimeConnected: () => true,
}));

let mockUser: { id: string; role: string } | null = { id: "u-1", role: "individual" };
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: mockUser }) }));

const { ChatRealtime } = await import("@/components/ChatRealtime");

const sent = (overrides: Record<string, unknown> = {}) => ({
  id: "m-2",
  conversation_id: "c-1",
  body: "Yes, it is available.",
  sender_id: "u-2",
  sender_name: "Wanjiru Kamau",
  client_id: "client-2",
  created_at: "2026-10-30T09:05:00Z",
  ...overrides,
});

function setup() {
  const client = new QueryClient();
  client.setQueryData<MessagePages>(["messages", "c-1"], {
    pages: [{ messages: [], hasMore: false }],
    pageParams: [undefined],
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <ChatRealtime />
    </QueryClientProvider>,
  );
  const thread = () => client.getQueryData<MessagePages>(["messages", "c-1"])!.pages[0].messages;
  return { thread, invalidate };
}

describe("ChatRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "u-1", role: "individual" };
    onStatus = undefined;
  });

  it("adds an incoming message to the open thread once and refreshes the conversation list", async () => {
    const { thread, invalidate } = setup();
    await waitFor(() => expect(fakeEcho.private).toHaveBeenCalledWith("App.Models.User.u-1"));

    handlers[".message.sent"](sent());
    handlers[".message.sent"](sent());

    expect(thread()).toHaveLength(1);
    expect(thread()[0]).toMatchObject({ id: "m-2", mine: false, clientId: null });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversations"] });
  });

  it("recognises the user's own message sent from another tab", async () => {
    const { thread } = setup();
    await waitFor(() => expect(handlers[".message.sent"]).toBeDefined());

    handlers[".message.sent"](sent({ id: "m-3", sender_id: "u-1", client_id: "client-3" }));

    expect(thread()[0]).toMatchObject({ id: "m-3", mine: true, clientId: "client-3" });
  });

  it("refetches when the connection drops and again when it comes back", async () => {
    const { invalidate } = setup();
    await waitFor(() => expect(onStatus).toBeDefined());

    onStatus!("reconnecting");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["messages"] });

    invalidate.mockClear();
    onStatus!("reconnecting");
    expect(invalidate).not.toHaveBeenCalled();

    onStatus!("connected");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["messages"] });
  });

  it("clears unread badges when the conversation is read in another tab", async () => {
    const { invalidate } = setup();
    await waitFor(() => expect(handlers[".conversation.read"]).toBeDefined());

    handlers[".conversation.read"]({ conversation_id: "c-1" });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversations"] });
  });

  it("does not connect for account managers or signed-out visitors", () => {
    mockUser = { id: "u-9", role: "account_manager" };
    setup();
    mockUser = null;
    setup();

    expect(mockConnect).not.toHaveBeenCalled();
  });
});
