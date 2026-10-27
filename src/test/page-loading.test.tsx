import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLoading } from "@/components/PageLoading";

describe("PageLoading", () => {
  it("shows the Geo Pin Properties loader with a Loading message", () => {
    render(<PageLoading />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Geo Pin Properties")).toBeInTheDocument();
  });
});
