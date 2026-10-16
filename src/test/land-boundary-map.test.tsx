import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import L from "leaflet";

type Handler = (e: unknown) => void;
const listeners: Record<string, Handler[]> = {};
const fakeMap = {
  on: (ev: string, fn: Handler) => (listeners[ev] ??= []).push(fn),
  off: (ev: string, fn: Handler) => {
    listeners[ev] = (listeners[ev] ?? []).filter((f) => f !== fn);
  },
  fire: (ev: string, data: unknown) => (listeners[ev] ?? []).forEach((fn) => fn(data)),
  doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
  flyTo: vi.fn(),
};
let mapClick: ((e: { latlng: { lat: number; lng: number } }) => void) | undefined;

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  ZoomControl: () => null,
  Marker: ({ icon }: { icon: L.DivIcon }) => (
    <div data-testid="marker" data-kind={icon.options.className} />
  ),
  Polygon: () => <div data-testid="polygon" />,
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => fakeMap,
  useMapEvents: (h: { click?: typeof mapClick }) => {
    mapClick = h.click;
    return fakeMap;
  },
}));
vi.mock("leaflet-draw", () => ({}));

// A stand-in for leaflet-draw's polygon tool that fires the same events.
let corners: L.Marker[] = [];
const vertexChanged = () =>
  fakeMap.fire("draw:drawvertex", { layers: { getLayers: () => corners } });
class FakeDrawPolygon {
  enable() {
    corners = [];
    fakeMap.fire("draw:drawstart", {});
  }
  disable() {
    fakeMap.fire("draw:drawstop", {});
  }
  deleteLastVertex() {
    corners.pop();
    vertexChanged();
  }
  completeShape() {
    const layer = L.polygon(corners.map((m) => m.getLatLng()));
    fakeMap.fire("draw:created", { layerType: "polygon", layer });
    this.disable();
  }
}
Object.assign(L, {
  Draw: {
    Polygon: FakeDrawPolygon,
    Event: {
      DRAWSTART: "draw:drawstart",
      DRAWSTOP: "draw:drawstop",
      CREATED: "draw:created",
      DRAWVERTEX: "draw:drawvertex",
    },
  },
});

const tapCorner = (lat: number, lng: number) =>
  act(() => {
    corners.push(L.marker([lat, lng]));
    vertexChanged();
  });

const { LandBoundaryMap } = await import("@/components/LandBoundaryMap");

const onPin = vi.fn();
const onBoundary = vi.fn();

function Harness({
  initialPin = null,
  initialBoundary = null,
}: {
  initialPin?: [number, number] | null;
  initialBoundary?: { lat: number; lng: number }[] | null;
}) {
  const [pin, setPin] = useState(initialPin);
  const [boundary, setBoundary] = useState(initialBoundary);
  return (
    <LandBoundaryMap
      pin={pin}
      boundary={boundary}
      onPinChange={(p) => {
        onPin(p);
        setPin(p);
      }}
      onBoundaryChange={(b) => {
        onBoundary(b);
        setBoundary(b);
      }}
      hintText=""
      tutorial={false}
    />
  );
}

const renderReady = async (ui: React.ReactElement) => {
  const result = render(ui);
  // leaflet-draw is imported lazily; let that promise settle.
  await act(async () => {});
  return result;
};

const square = [
  { lat: -1.47, lng: 36.95 },
  { lat: -1.47, lng: 36.951 },
  { lat: -1.471, lng: 36.951 },
  { lat: -1.471, lng: 36.95 },
];

describe("LandBoundaryMap", () => {
  beforeEach(() => {
    onPin.mockReset();
    onBoundary.mockReset();
    for (const k of Object.keys(listeners)) delete listeners[k];
  });

  it("enables Undo from 2 corners and Confirm from 3, then pins the centre", async () => {
    await renderReady(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Trace boundary" }));
    expect(screen.getByText("Tap points around your land…")).toBeInTheDocument();

    const undo = () => screen.getByRole("button", { name: "Undo point" });
    const confirm = () => screen.getByRole("button", { name: "Confirm plot" });

    tapCorner(-1.47, 36.95);
    expect(undo()).toBeDisabled();
    tapCorner(-1.47, 36.952);
    expect(undo()).toBeEnabled();
    expect(confirm()).toBeDisabled();
    tapCorner(-1.472, 36.952);
    expect(confirm()).toBeEnabled();
    expect(screen.getByText("3 points placed · tap the first corner to close")).toBeInTheDocument();

    // user-event drops this click after the stubbed draw events; a plain DOM click is enough here.
    fireEvent.click(confirm());

    expect(onBoundary).toHaveBeenLastCalledWith([
      { lat: -1.47, lng: 36.95 },
      { lat: -1.47, lng: 36.952 },
      { lat: -1.472, lng: 36.952 },
    ]);
    const [lat, lng] = onPin.mock.calls.at(-1)?.[0] as [number, number];
    expect(lat).toBeCloseTo(-1.470667, 5);
    expect(lng).toBeCloseTo(36.951333, 5);
    expect(screen.getByText(/^Boundary traced · 3 points/)).toBeInTheDocument();
    expect(screen.getAllByTestId("marker").filter((m) => m.dataset.kind === "gm-bcn")).toHaveLength(
      3,
    );
  });

  it("stops a draft whose lines cross from being confirmed", async () => {
    await renderReady(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Trace boundary" }));

    tapCorner(square[0].lat, square[0].lng);
    tapCorner(square[2].lat, square[2].lng);
    tapCorner(square[1].lat, square[1].lng);
    tapCorner(square[3].lat, square[3].lng);

    expect(screen.getByText("Lines are crossing. Undo the last point.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm plot" })).toBeDisabled();
  });

  it("flags a saved boundary that crosses itself", async () => {
    await renderReady(
      <Harness
        initialPin={[-1.4705, 36.9505]}
        initialBoundary={[square[0], square[2], square[1], square[3]]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("This boundary crosses itself.");
  });

  it("keeps the pin when the boundary is deleted, and taps no longer move it", async () => {
    await renderReady(<Harness initialPin={[-1.4705, 36.9505]} initialBoundary={square} />);

    act(() => mapClick?.({ latlng: { lat: -1.5, lng: 37 } }));
    expect(onPin).not.toHaveBeenCalled();
    expect(screen.getByText('Tap "Retrace boundary" to change the shape')).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onBoundary).toHaveBeenLastCalledWith(null);
    expect(onPin).not.toHaveBeenCalled();
    expect(screen.getByText("Boundary deleted. Your pin is still set.")).toBeInTheDocument();
    expect(screen.getByText("Pin set · -1.47050, 36.95050")).toBeInTheDocument();
  });

  it("drops a pin where the map is tapped when nothing is traced", async () => {
    await renderReady(<Harness />);
    act(() => mapClick?.({ latlng: { lat: -1.3, lng: 36.8 } }));
    expect(onPin).toHaveBeenCalledWith([-1.3, 36.8]);
  });
});
