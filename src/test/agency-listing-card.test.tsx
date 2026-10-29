import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ListingAgency } from "@/lib/listingAgency";

const mockPost = vi.fn<(path: string, body?: unknown) => Promise<unknown>>(() =>
  Promise.resolve({ message: "Message sent. The agency will get back to you soon." }),
);

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/api", () => ({
  api: { post: (path: string, body?: unknown) => mockPost(path, body) },
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));

const { ListingAgencyCard } = await import("@/components/agency/ListingAgencyCard");

const agency: ListingAgency = {
  id: "a-1",
  name: "Kilimani Homes",
  slug: "kilimani-homes",
  logoUrl: null,
  brandColor: "#2D5C9C",
  phone: "0712345678",
  whatsapp: "0712345678",
  agent: { name: "Jane Wanjiru", phone: "0712345678" },
  viewingHours: "Daily 9am–5pm",
};

function Harness() {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  return (
    <div className="gm-mapwrap">
      <aside ref={setAnchor}>
        <ListingAgencyCard
          agency={agency}
          anchor={anchor}
          kind="property"
          listingId="p-1"
          listingTitle="Sunrise Apartments"
        />
      </aside>
    </div>
  );
}

describe("listing agency card", () => {
  beforeEach(() => vi.clearAllMocks());

  it("names the agency and the agent, and links to the agency page", () => {
    render(<Harness />);

    expect(screen.getByText("Kilimani Homes")).toBeInTheDocument();
    expect(screen.getByText("Your agent: Jane Wanjiru")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View all listings from Kilimani Homes" }),
    ).toHaveAttribute("href", "/agency/$slug");
  });

  it("asks a signed-out visitor for a way to reach them before sending", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Send a message" }));

    await userEvent.clear(screen.getByLabelText("Message"));
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Add your name and a phone number");
    expect(mockPost).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText("Your name"), "Wanjiku");
    await userEvent.type(screen.getByLabelText("Phone"), "0722000000");
    await userEvent.type(screen.getByLabelText("Message"), "Is parking included?");
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(mockPost).toHaveBeenCalledWith(
      "/listings/property/p-1/lead",
      expect.objectContaining({
        source: "message",
        name: "Wanjiku",
        phone: "0722000000",
        message: "Is parking included?",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Message sent");
  });

  it("needs a time for a viewing request", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Request a viewing" }));

    expect(screen.getByText(/Viewings: Daily 9am–5pm/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Your name"), "Wanjiku");
    await userEvent.type(screen.getByLabelText("Phone"), "0722000000");
    await userEvent.click(screen.getByRole("button", { name: "Send viewing request" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Pick a day and time for the viewing.");
    expect(mockPost).not.toHaveBeenCalled();
  });
});
