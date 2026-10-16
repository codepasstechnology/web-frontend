import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

function mockMatchMedia(prefersDark: boolean, reducedMotion = false) {
  window.matchMedia = vi.fn((query: string) => ({
    matches:
      query === "(prefers-color-scheme: dark)"
        ? prefersDark
        : query === "(prefers-reduced-motion: reduce)"
          ? reducedMotion
          : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

// jsdom has no View Transitions API, so toggle() takes the overlay fallback.
function finishWipe() {
  act(() => {
    vi.advanceTimersByTime(1100);
  });
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to the system preference when nothing is stored", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("defaults to light when the system has no dark preference", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("a stored choice wins over the system preference", () => {
    localStorage.setItem("lv_theme", "dark");
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
  });

  it("toggle flips the theme and the documentElement's dark class", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });
    finishWipe();

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.toggle();
    });
    finishWipe();

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists the choice to localStorage", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });
    finishWipe();

    expect(localStorage.getItem("lv_theme")).toBe("dark");
  });

  it("grows an overlay in the new background, flips under it, then removes it", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle({ clientX: 100, clientY: 30 });
    });
    const wipe = document.querySelector<HTMLElement>(".theme-wipe");
    expect(wipe).not.toBeNull();
    expect(wipe?.style.background).toBe("rgb(21, 20, 15)");
    expect(document.documentElement.style.getPropertyValue("--wx")).toBe("100px");
    expect(result.current.theme).toBe("light");

    act(() => {
      vi.advanceTimersByTime(620);
    });
    expect(result.current.theme).toBe("dark");
    expect(wipe?.classList.contains("theme-wipe-out")).toBe(true);

    finishWipe();
    expect(document.querySelector(".theme-wipe")).toBeNull();
  });

  it("ignores a second toggle while a switch is still running", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
      result.current.toggle();
    });
    finishWipe();

    expect(result.current.theme).toBe("dark");
    expect(document.querySelectorAll(".theme-wipe")).toHaveLength(0);
  });

  it("switches instantly with no overlay under reduced motion", () => {
    mockMatchMedia(false, true);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("dark");
    expect(document.querySelector(".theme-wipe")).toBeNull();
  });
});
