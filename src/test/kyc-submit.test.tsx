import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { KycApplication } from "@/lib/kyc";

const mockGet = vi.fn<(path: string) => Promise<unknown>>();
const mockPost = vi.fn<(path: string, body?: unknown) => Promise<unknown>>();

vi.mock("@/lib/api", () => ({
  api: { get: (p: string) => mockGet(p), post: (p: string, b?: unknown) => mockPost(p, b) },
}));
vi.mock("@/components/LandBoundaryMap", () => ({ LandBoundaryMap: () => <div /> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { KycTab } = await import("@/components/dashboard/KycTab");

const approved = {
  id: "k-1",
  reference: "KYC-1",
  status: "approved",
  parcel: { id: "l-1", title: "Plot", parcel_number: "KAJ/KTG/4521" },
  documents: [],
  created_at: "2026-10-01",
} as unknown as KycApplication;

function setup(applications: KycApplication[] = []) {
  mockGet.mockImplementation((path) =>
    Promise.resolve(
      path === "/user/kyc"
        ? applications
        : {
            data: [
              { id: "l-1", title: "Plot", parcel_number: "KAJ/KTG/4521" },
              { id: "l-2", title: "Farm", parcel_number: "KIA/JUJ/7730" },
            ],
          },
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <KycTab />
    </QueryClientProvider>,
  );
}

async function openModal() {
  await userEvent.click((await screen.findAllByRole("button", { name: /Submit KYC/ }))[0]);
  return within(await screen.findByRole("dialog"));
}

async function attach(modal: ReturnType<typeof within>, type: string, name: string) {
  await userEvent.selectOptions(modal.getByLabelText("Add a document"), type);
  const input = modal
    .getByRole("button", { name: /Choose file/ })
    .parentElement?.querySelector("input[type=file]") as HTMLInputElement;
  await userEvent.upload(input, new File(["x"], name, { type: "application/pdf" }));
}

describe("KYC submit modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: { ...approved, id: "k-new", status: "pending" } });
  });

  it("offers National ID and waits for both required documents", async () => {
    setup();
    const modal = await openModal();

    await userEvent.selectOptions(await modal.findByLabelText("Land parcel"), "l-2");
    const submit = modal.getByRole("button", { name: "Submit application" });
    expect(modal.getByRole("option", { name: "National ID" })).toBeInTheDocument();

    await attach(modal, "title_deed", "deed.pdf");
    expect(submit).toBeDisabled();
    expect(modal.getByText("(missing)")).toBeInTheDocument();

    await attach(modal, "national_id", "id.pdf");
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    expect(mockPost).toHaveBeenCalledWith("/user/kyc", expect.any(FormData));
  });

  it("won't resubmit a parcel that is already verified", async () => {
    setup([approved]);
    const modal = await openModal();

    await userEvent.selectOptions(await modal.findByLabelText("Land parcel"), "l-1");
    await attach(modal, "national_id", "id.pdf");
    await attach(modal, "title_deed", "deed.pdf");
    await userEvent.click(modal.getByRole("button", { name: "Submit application" }));

    expect(modal.getByRole("alert")).toHaveTextContent(
      "This parcel's documents have already been reviewed.",
    );
    expect(mockPost).not.toHaveBeenCalled();
  });
});
