import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { AppUser } from "@/lib/auth";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

const mockGet = vi.fn<(path: string) => Promise<unknown>>();
const mockDelete = vi.fn<(path: string) => Promise<unknown>>();
vi.mock("@/lib/api", () => ({
  api: { get: (p: string) => mockGet(p), delete: (p: string) => mockDelete(p) },
}));
const mockToastError = vi.fn();
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mockToastError } }));
vi.mock("@/lib/plans", () => ({ kenyaCounties: ["Kajiado"], usePlans: () => ({ data: [] }) }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const { SettingsTab } = await import("@/components/dashboard/SettingsTab");

const user = {
  id: "u-1",
  fullName: "Wanjiku Kamau",
  email: "wanjiku@example.com",
  phone: "0712345678",
  role: "agent",
  plan: "basic",
  county: "Kajiado",
} as unknown as AppUser;

const sessions = [
  {
    id: 2,
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36",
    ip_address: "41.90.1.2",
    last_used_at: new Date().toISOString(),
    current: true,
  },
  {
    id: 1,
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1",
    ip_address: "41.90.3.4",
    last_used_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    current: false,
  },
];

const show = ({
  onUpdate = vi.fn(() => Promise.resolve()),
  onRequestEmailChange = vi.fn(() => Promise.resolve()),
  onConfirmEmailChange = vi.fn(() => Promise.resolve()),
} = {}) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SettingsTab
        user={user}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onLogout={vi.fn()}
        onChangePassword={vi.fn()}
        onSignedOut={vi.fn()}
        onEnableTwoFactor={vi.fn()}
        onConfirmTwoFactor={vi.fn()}
        onDisableTwoFactor={vi.fn()}
        onRequestEmailChange={onRequestEmailChange}
        onConfirmEmailChange={onConfirmEmailChange}
      />
    </QueryClientProvider>,
  );

describe("SettingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(sessions);
    mockDelete.mockResolvedValue({});
  });

  it("changes the email only after the code sent to the new address is entered", async () => {
    const onRequestEmailChange = vi.fn(() => Promise.resolve());
    const onConfirmEmailChange = vi.fn(() => Promise.resolve());
    show({ onRequestEmailChange, onConfirmEmailChange });

    expect(screen.getByLabelText("Email address")).toHaveAttribute("readonly");
    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    await userEvent.type(screen.getByLabelText("New email address"), "new@example.com");
    await userEvent.type(screen.getByLabelText("Your password"), "secret-pass");
    await userEvent.click(screen.getByRole("button", { name: "Send code" }));

    expect(onRequestEmailChange).toHaveBeenCalledWith("new@example.com", "secret-pass");
    expect(screen.getByText("new@example.com")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Code"), "12a3456");
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onConfirmEmailChange).toHaveBeenCalledWith("123456");
    expect(screen.getByText("Your sign-in email is updated.")).toBeInTheDocument();
  });

  it("shows the server's reason when the email change is refused", async () => {
    const onRequestEmailChange = vi.fn(() =>
      Promise.reject({
        message: "The given data was invalid.",
        errors: { password: ["Your password is incorrect."] },
      }),
    );
    show({ onRequestEmailChange });

    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    await userEvent.type(screen.getByLabelText("New email address"), "new@example.com");
    await userEvent.type(screen.getByLabelText("Your password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Send code" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Your password is incorrect.");
    expect(screen.queryByLabelText("Code")).not.toBeInTheDocument();
  });

  it("saves the role with the rest of the profile", async () => {
    const onUpdate = vi.fn(() => Promise.resolve());
    show({ onUpdate });

    expect(screen.getByRole("button", { name: "Agent / Broker" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "Developer" }));
    await userEvent.click(screen.getByRole("button", { name: /Save changes/ }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ role: "developer" }));
  });

  it("only enables Save once something changes, and reports a failed save", async () => {
    const onUpdate = vi.fn(() => Promise.reject(new Error("offline")));
    show({ onUpdate });

    const save = screen.getByRole("button", { name: /Save changes/ });
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Company / Agency"), "Kamau Land");
    await userEvent.click(save);

    expect(onUpdate).toHaveBeenCalled();
    expect(
      screen.getByText("Couldn't save your changes. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalled();
  });

  it("lists real sessions and signs out another device", async () => {
    show();

    await userEvent.click(screen.getByRole("tab", { name: /Security/ }));

    expect(await screen.findByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("This device")).toBeInTheDocument();
    expect(screen.getByText("Safari on iPhone")).toBeInTheDocument();
    expect(screen.getByText("41.90.3.4 · 2 days ago")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("/user/sessions/1"));

    await userEvent.click(screen.getByRole("button", { name: "Sign out all other devices" }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("/user/sessions/others"));
  });

  it("emails listing and KYC updates, with no SMS channel", async () => {
    const onUpdate = vi.fn(() => Promise.resolve());
    show({ onUpdate });

    await userEvent.click(screen.getByRole("tab", { name: /Notifications/ }));

    expect(screen.getByRole("switch", { name: "New inquiries" })).toBeInTheDocument();
    expect(screen.queryByText(/SMS alerts/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Listing and KYC updates" }));
    await userEvent.click(screen.getByRole("button", { name: /Save preferences/ }));

    expect(onUpdate).toHaveBeenCalledWith({
      notifications: expect.objectContaining({ listingKycUpdates: false }),
    });
  });

  it("saves the default map view", async () => {
    const onUpdate = vi.fn(() => Promise.resolve());
    show({ onUpdate });

    await userEvent.click(screen.getByRole("tab", { name: /Preferences/ }));
    expect(screen.getByRole("link", { name: /Cookie settings/ })).toHaveAttribute(
      "href",
      "/cookie-settings",
    );
    const save = screen.getByRole("button", { name: /Save preferences/ });
    expect(save).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Satellite" }));
    await userEvent.click(save);

    expect(onUpdate).toHaveBeenCalledWith({ language: "en", defaultMapView: "satellite" });
  });
});
