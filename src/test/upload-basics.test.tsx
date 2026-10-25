import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({ type: "land" }) }),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/components/DashboardShell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/UpgradeModal", () => ({ UpgradeModal: () => null }));
vi.mock("@/components/map/LazyMaps", () => ({ LandBoundaryMap: () => <div /> }));
vi.mock("@/lib/api", () => ({ api: { post: () => Promise.resolve({ overlaps: false }) } }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/lib/draftPhotoStore", () => ({
  saveDraftPhotos: vi.fn(),
  loadDraftPhotos: () => Promise.resolve([]),
  clearDraftPhotos: vi.fn(),
}));
vi.mock("@/lib/properties", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/properties")>()),
  useUsedListings: () => 0,
}));
vi.mock("@/lib/plans", () => ({ kenyaCounties: ["Kajiado"], usePlans: () => ({ data: [] }) }));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { role: "individual", plan: "free", listings: [], maxListings: 5 },
    ready: true,
    addListing: vi.fn(),
    fetchListing: vi.fn(),
    updateListing: vi.fn(),
  }),
}));

const { Route } = await import("@/routes/dashboard.upload");
const UploadPage = (Route as unknown as { component: React.ComponentType }).component;

describe("upload wizard, basic details", () => {
  beforeEach(() => localStorage.clear());

  it("explains every missing field on Next instead of disabling it", async () => {
    render(<UploadPage />);

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    [
      "Enter the title number from the title deed.",
      "Choose the county the land is in.",
      "Enter a size greater than 0.",
      "Enter the asking price in KES.",
    ].forEach((msg) => expect(screen.getByText(msg)).toBeInTheDocument());
    expect(screen.getByLabelText("Title number")).toHaveFocus();
  });

  it("upper-cases the title number and checks its format", async () => {
    render(<UploadPage />);

    const title = screen.getByLabelText("Title number");
    await userEvent.type(title, "kaj#ktg");
    expect(title).toHaveValue("KAJ#KTG");

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByText(
        "Use letters, numbers, spaces and / . - ( ) , as on the deed, including the plot number.",
      ),
    ).toBeInTheDocument();
  });

  it.each([
    "naivasha/maraigushu block 7/2312",
    "(naivasha/maraigushu block 7/2312)",
    "l.r. no. 209/1234",
    "ir 12345",
  ])("accepts real deed formats like %s", async (deed) => {
    render(<UploadPage />);

    await userEvent.type(screen.getByLabelText("Title number"), deed);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByText(/as on the deed, including the plot number/)).not.toBeInTheDocument();
  });

  it("moves on once the basics are filled in", async () => {
    render(<UploadPage />);

    await userEvent.type(screen.getByLabelText("Title number"), "kaj/ktg/4521");
    await userEvent.selectOptions(screen.getByLabelText("County"), "Kajiado");
    await userEvent.type(screen.getByLabelText("Size in acres"), "0.5");
    await userEvent.type(screen.getByLabelText("Asking price (KES)"), "1000000");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Where is your land?" })).toBeInTheDocument();
  });
});
