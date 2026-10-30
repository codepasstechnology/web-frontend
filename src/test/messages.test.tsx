import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
    className,
  }: {
    to: string;
    search?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to} className={className}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: { id: "u-1", role: "individual" } }) }));

const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    get: (path: string) => mockGet(path),
    post: (path: string, body?: unknown) => mockPost(path, body),
  },
}));

const { MessagesTab } = await import("@/components/dashboard/MessagesTab");
const { MessageSellerSheet } = await import("@/components/MessageSellerSheet");

const conversation = (overrides: Record<string, unknown> = {}) => ({
  id: "c-1",
  role: "buyer",
  with: { name: "Wanjiru Kamau", avatar_color: null },
  agency: null,
  listing: { type: "parcel", id: "p-1", title: "Kitengela plot" },
  last_message: {
    id: "m-2",
    conversation_id: "c-1",
    body: "Yes, it is available.",
    mine: false,
    sender_name: "Wanjiru Kamau",
    client_id: null,
    created_at: "2026-10-30T09:05:00Z",
  },
  unread: 2,
  can_reply: true,
  last_message_at: "2026-10-30T09:05:00Z",
  ...overrides,
});

const message = (id: string, body: string, mine: boolean, at: string) => ({
  id,
  conversation_id: "c-1",
  body,
  mine,
  sender_name: mine ? "Me" : "Wanjiru Kamau",
  client_id: mine ? `client-${id}` : null,
  created_at: at,
});

function serve(routes: Record<string, unknown>) {
  mockGet.mockImplementation((path: string) =>
    path in routes ? Promise.resolve(routes[path]) : Promise.reject(new Error(`No route ${path}`)),
  );
}

const list = (data: unknown[]) => ({ data, current_page: 1, last_page: 1, total: data.length });

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("MessagesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({});
  });

  it("lists conversations with who they are with, the listing and the unread count", async () => {
    serve({
      "/user/conversations?page=1": list([
        conversation(),
        conversation({
          id: "c-2",
          with: { name: "Otieno", avatar_color: null },
          unread: 0,
          last_message: { ...conversation().last_message, mine: true, body: "Thanks" },
        }),
      ]),
    });
    const onOpen = vi.fn();
    renderWithQuery(<MessagesTab onOpen={onOpen} onBack={vi.fn()} />);

    const first = await screen.findByRole("button", { name: /Wanjiru Kamau/ });
    expect(first).toHaveTextContent("Kitengela plot");
    expect(within(first).getByLabelText("2 unread")).toHaveTextContent("2");
    expect(screen.getByRole("button", { name: /Otieno/ })).toHaveTextContent("You: Thanks");
    expect(screen.getByText("Choose a conversation to read it.")).toBeInTheDocument();

    await userEvent.click(first);
    expect(onOpen).toHaveBeenCalledWith("c-1");
  });

  it("points people with no conversations to the listings", async () => {
    serve({ "/user/conversations?page=1": list([]) });
    renderWithQuery(<MessagesTab onOpen={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText("No messages yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore listings" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  it("shows the thread oldest first and marks it read when opened", async () => {
    serve({
      "/user/conversations?page=1": list([conversation()]),
      "/user/conversations/c-1": conversation(),
      "/user/conversations/c-1/messages": {
        data: [
          message("m-2", "Yes, it is available.", false, "2026-10-30T09:05:00Z"),
          message("m-1", "Is the plot still available?", true, "2026-10-30T09:00:00Z"),
        ],
        has_more: false,
      },
    });
    renderWithQuery(<MessagesTab conversationId="c-1" onOpen={vi.fn()} onBack={vi.fn()} />);

    const log = await screen.findByRole("log", { name: "Messages" });
    await within(log).findByText("Yes, it is available.");
    const bodies = within(log)
      .getAllByText(/available/)
      .map((el) => el.textContent);
    expect(bodies).toEqual(["Is the plot still available?", "Yes, it is available."]);
    expect(screen.getByRole("link", { name: "About Kitengela plot" })).toHaveAttribute(
      "href",
      "/explore?parcel=p-1",
    );
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/user/conversations/c-1/read", undefined),
    );
  });

  it("sends with Enter, and offers a retry that reuses the same message id", async () => {
    serve({
      "/user/conversations?page=1": list([conversation()]),
      "/user/conversations/c-1": conversation(),
      "/user/conversations/c-1/messages": { data: [], has_more: false },
    });
    mockPost.mockImplementation((path: string) =>
      path.endsWith("/messages") ? Promise.reject(new Error("offline")) : Promise.resolve({}),
    );
    renderWithQuery(<MessagesTab conversationId="c-1" onOpen={vi.fn()} onBack={vi.fn()} />);

    const box = await screen.findByRole("textbox", { name: "Message" });
    await userEvent.type(box, "Can I visit on Saturday?{Enter}");

    expect(box).toHaveValue("");
    expect(await screen.findByText("Not sent")).toBeInTheDocument();
    const sends = () => mockPost.mock.calls.filter(([path]) => path.endsWith("/messages"));
    const first = sends()[0][1] as { body: string; client_id: string };
    expect(first.body).toBe("Can I visit on Saturday?");

    mockPost.mockImplementation((path: string, body: { body: string; client_id: string }) =>
      path.endsWith("/messages")
        ? Promise.resolve({
            ...message("m-9", body.body, true, "2026-10-30T10:00:00Z"),
            client_id: body.client_id,
          })
        : Promise.resolve({}),
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByText("Not sent")).not.toBeInTheDocument());
    expect(sends()[1][1]).toEqual(first);
    expect(screen.getAllByText("Can I visit on Saturday?")).toHaveLength(1);
  });

  it("closes the composer once the agency behind the listing is suspended", async () => {
    const suspended = conversation({
      agency: { name: "Kilimani Homes", slug: "kilimani-homes" },
      can_reply: false,
    });
    serve({
      "/user/conversations?page=1": list([suspended]),
      "/user/conversations/c-1": suspended,
      "/user/conversations/c-1/messages": { data: [], has_more: false },
    });
    renderWithQuery(<MessagesTab conversationId="c-1" onOpen={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText(/you can't reply here/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Message" })).not.toBeInTheDocument();
  });
});

describe("MessageSellerSheet", () => {
  beforeEach(() => vi.clearAllMocks());

  function renderSheet() {
    const wrap = document.createElement("div");
    wrap.className = "gm-mapwrap";
    const anchor = document.createElement("aside");
    wrap.appendChild(anchor);
    document.body.appendChild(wrap);
    return renderWithQuery(
      <MessageSellerSheet
        anchor={anchor}
        kind="parcel"
        listingId="p-1"
        listingTitle="Kitengela plot"
        recipient="Wanjiru Kamau"
        onClose={vi.fn()}
      />,
    );
  }

  it("starts the conversation and links to it", async () => {
    mockPost.mockResolvedValue(conversation({ id: "c-7" }));
    renderSheet();

    expect(screen.getByRole("dialog", { name: "Message Wanjiru Kamau" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(mockPost).toHaveBeenCalledWith(
      "/listings/parcel/p-1/conversations",
      expect.objectContaining({ body: "Hi, is Kitengela plot still available?" }),
    );
    expect(await screen.findByRole("link", { name: "Open conversation" })).toHaveAttribute(
      "href",
      "/dashboard?tab=messages&c=c-7",
    );
  });

  it("shows why a listing can't be messaged", async () => {
    mockPost.mockRejectedValue(new Error("This is your own listing."));
    renderSheet();

    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This is your own listing.");
  });
});
