import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Notification } from "@/lib/notifications";

const mockNavigate = vi.fn();
const mockMarkRead = vi.fn();
let notifications: Notification[] = [];

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mockNavigate }));
vi.mock("@/lib/notifications", () => ({
  useNotifications: () => ({ data: notifications, isError: false }),
  useMarkNotificationsRead: () => ({ mutate: mockMarkRead }),
}));

const { NotificationBell } = await import("@/components/NotificationBell");

const note = (id: string, type: string, read = false): Notification => ({
  id,
  data: { type, message: `Message ${id}` },
  read_at: read ? "2026-10-14T09:00:00Z" : null,
  created_at: "2026-10-14T09:20:00Z",
});

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications = [];
  });

  it("gives every type a readable title, with a fallback for unknown ones", async () => {
    notifications = [
      note("1", "kyc_info_requested"),
      note("2", "kyc_location_correction_requested"),
      note("3", "payment_received"),
      note("4", "something_new"),
    ];
    render(<NotificationBell />);

    await userEvent.click(screen.getByRole("button", { name: "Notifications, 4 unread" }));

    [
      "KYC — Additional information requested",
      "KYC — Location correction requested",
      "Payment received",
      "Update on your account",
    ].forEach((title) => expect(screen.getByText(title)).toBeInTheDocument());
    expect(screen.queryByText("something_new")).not.toBeInTheDocument();
    expect(mockMarkRead).toHaveBeenCalledTimes(1);
  });

  it("opens the related tab when an item is clicked", async () => {
    notifications = [note("1", "kyc_info_requested", true)];
    render(<NotificationBell />);

    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));
    await userEvent.click(screen.getByText("KYC — Additional information requested"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard", search: { tab: "kyc" } });
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it("opens the agency page for viewing updates and replies", async () => {
    notifications = [
      {
        ...note("1", "viewing_confirmed"),
        data: {
          type: "viewing_confirmed",
          message: "Kilimani Homes confirmed your viewing",
          agency_slug: "kilimani-homes",
        },
      },
      note("2", "agency_replied", true),
    ];
    render(<NotificationBell />);

    await userEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    expect(screen.getByText("New reply")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Viewing confirmed"));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/agency/$slug",
      params: { slug: "kilimani-homes" },
    });
  });
});
