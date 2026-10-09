import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mapProps = vi.fn();
const mockPost = vi.fn<(path: string, body?: unknown) => Promise<unknown>>(() =>
  Promise.resolve({ overlaps: false }),
);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({ type: "land" }) }),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/components/DashboardShell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/UpgradeModal", () => ({ UpgradeModal: () => null }));
vi.mock("@/components/map/LazyMaps", () => ({
  LandBoundaryMap: (props: { attentionKey?: number }) => {
    mapProps(props);
    return <div data-testid="plot-map" data-attention={props.attentionKey} />;
  },
}));
vi.mock("@/lib/api", () => ({
  api: { post: (path: string, body?: unknown) => mockPost(path, body) },
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/lib/draftPhotoStore", () => ({
  saveDraftPhotos: vi.fn(),
  loadDraftPhotos: () => Promise.resolve([]),
  clearDraftPhotos: vi.fn(),
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

const corner = (lat: number, lng: number) => ({ lat, lng });
const square = [
  corner(-1.47, 36.95),
  corner(-1.47, 36.951),
  corner(-1.471, 36.951),
  corner(-1.471, 36.95),
];
const bowtie = [square[0], square[2], square[1], square[3]];

function startOnLocationStep(boundary: { lat: number; lng: number }[]) {
  localStorage.setItem(
    "lv_upload_draft_v1",
    JSON.stringify({
      step: 1,
      parcelNumber: "KAJ/KTG/4521",
      phone: "",
      county: "Kajiado",
      area: "",
      sizeUnit: "acres",
      sizeAcres: "0.5",
      sizeHectares: "",
      sizeWidthFt: "",
      sizeLengthFt: "",
      price: "1000000",
      description: "",
      listingType: "sale",
      landType: "residential",
      utilities: [],
      pin: [-1.4705, 36.9505],
      boundary,
    }),
  );
}

describe("upload wizard, location step", () => {
  beforeEach(() => {
    localStorage.clear();
    mapProps.mockClear();
    mockPost.mockClear();
  });

  it("won't move on while the boundary crosses itself, and shakes the note instead", async () => {
    startOnLocationStep(bowtie);
    render(<UploadPage />);

    expect(screen.getByRole("heading", { name: "Where is your land?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Photos & documents/ }));

    expect(screen.getByRole("heading", { name: "Where is your land?" })).toBeInTheDocument();
    expect(screen.getByTestId("plot-map")).toHaveAttribute("data-attention", "1");
  });

  it("moves on to photos once the boundary is clean", async () => {
    startOnLocationStep(square);
    render(<UploadPage />);

    await userEvent.click(screen.getByRole("button", { name: /Photos & documents/ }));

    expect(screen.queryByRole("heading", { name: "Where is your land?" })).not.toBeInTheDocument();
  });

  it("passes the size typed in step 1 to the map for the size hint", () => {
    startOnLocationStep(square);
    render(<UploadPage />);

    expect(mapProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ typedSize: { acres: 0.5, label: "0.5 acres" } }),
    );
  });

  it("warns on the map when the location covers land that's already listed", async () => {
    mockPost.mockResolvedValue({ overlaps: true });
    startOnLocationStep(square);
    render(<UploadPage />);

    await waitFor(
      () =>
        expect(mapProps).toHaveBeenLastCalledWith(
          expect.objectContaining({ overlapWarning: true }),
        ),
      { timeout: 2000 },
    );
    expect(mockPost).toHaveBeenCalledWith("/user/listings/overlap-check", {
      boundary: square,
      except_id: undefined,
    });
  });
});
