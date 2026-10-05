import { useEffect, type RefObject } from "react";

const DEFAULT_STAGE_H = 820;
// Time constant of the ease toward the scroll target. Trackpad and touch
// scrolling arrive in jumps; easing toward the target turns them into motion.
// Time-based so 60Hz and 120Hz screens move at the same speed.
const EASE_MS = 110;
const MAX_FRAME_MS = 64;
const SETTLED = 0.0005;
// Story positions (0–1 through the pinned range) where each step is fully shown.
const STEP_P = [0.08, 0.33, 0.53, 0.84];
// How far past a step, as a share of the story, a gesture must travel to move on.
const SNAP_THRESHOLD = 0.05;
// Below this a gesture was a tap or a rest, not a scroll, so the page stays put.
const MIN_MOVE = 0.01;
const SETTLE_MS = 110;

function smoothstep(a: number, b: number, p: number): number {
  const x = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

function bump(p: number, centre: number, width: number): number {
  return Math.min(1, Math.max(0, (width - Math.abs(p - centre)) / 0.05));
}

function storyVars(p: number): Record<string, number> {
  return {
    "--p": p,
    "--z": smoothstep(0.2, 0.46, p),
    "--plots": smoothstep(0.43, 0.6, p),
    "--mesh": 1 - 0.92 * smoothstep(0.45, 0.6, p),
    "--hi": smoothstep(0.62, 0.7, p),
    "--pin": smoothstep(0.66, 0.77, p),
    "--card": smoothstep(0.75, 0.86, p),
    "--t0": p < 0.08 ? 1 : bump(p, 0.08, 0.14),
    "--t1": bump(p, 0.33, 0.1),
    "--t2": bump(p, 0.53, 0.08),
    "--t3": p > 0.84 ? 1 : bump(p, 0.84, 0.16),
  };
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * Drives the pinned story's CSS variables from scroll position. Variables are
 * only written when their rounded value changes, and the header's backdrop
 * blur is switched off while the story is on screen, since re-blurring the
 * animating map behind it on every frame is what makes scrolling stutter.
 */
export function useScrollStory(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const story = ref.current;
    if (!story) return;
    const root = story.closest(".geo-home");

    let stageH = DEFAULT_STAGE_H;
    let span = 0;
    let target = 0;
    let current = 0;
    let frame: number | null = null;
    let last: number | null = null;
    const written: Record<string, string> = {};
    let gesture: number | null = null;
    let snapping = false;
    let settle: number | null = null;

    const write = (p: number) => {
      for (const [name, value] of Object.entries(storyVars(p))) {
        const next = String(Math.round(value * 1000) / 1000);
        if (written[name] !== next) {
          story.style.setProperty(name, next);
          written[name] = next;
        }
      }
    };

    const step = () => {
      frame = null;
      const now = performance.now();
      const elapsed = last === null ? 16 : Math.min(MAX_FRAME_MS, now - last);
      last = now;
      const diff = target - current;
      const blend = 1 - Math.exp(-elapsed / EASE_MS);
      current = Math.abs(diff) < SETTLED ? target : current + diff * blend;
      write(current);
      if (current !== target) frame = requestAnimationFrame(step);
      else last = null;
    };

    const update = () => {
      const rect = story.getBoundingClientRect();
      span = rect.height - stageH;
      target = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      root?.classList.toggle("gp-in-story", rect.bottom > 0 && rect.top < window.innerHeight);

      if (prefersReducedMotion()) {
        current = target;
        write(current);
        return;
      }
      if (frame === null) {
        last = null;
        frame = requestAnimationFrame(step);
      }
    };

    const measure = () => {
      stageH = window.innerHeight || DEFAULT_STAGE_H;
      story.style.setProperty("--stage-h", `${stageH}px`);
      story.style.setProperty("--story-len", "4");
      update();
    };

    const nearestStep = () =>
      STEP_P.reduce(
        (best, s, i) => (Math.abs(s - target) < Math.abs(STEP_P[best] - target) ? i : best),
        0,
      );

    // A user gesture starts from the step it was on, so one gesture moves at most one step.
    const begin = () => {
      snapping = false;
      if (gesture === null) gesture = nearestStep();
    };

    const finish = () => {
      settle = null;
      if (snapping) {
        snapping = false;
        return;
      }
      const from = gesture;
      gesture = null;
      if (from === null || prefersReducedMotion() || span <= 0) return;
      if (target <= 0 || target >= 1) return;
      const move = target - STEP_P[from];
      if (Math.abs(move) < MIN_MOVE) return;
      let to = from;
      if (move > SNAP_THRESHOLD && from < STEP_P.length - 1) to = from + 1;
      else if (move < -SNAP_THRESHOLD && from > 0) to = from - 1;
      const docTop = story.getBoundingClientRect().top + window.scrollY;
      snapping = true;
      window.scrollTo({ top: docTop + STEP_P[to] * span, behavior: "smooth" });
    };

    const onScroll = () => {
      update();
      if (settle !== null) clearTimeout(settle);
      settle = window.setTimeout(finish, SETTLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("wheel", begin, { passive: true });
    window.addEventListener("touchstart", begin, { passive: true });
    window.addEventListener("keydown", begin);
    measure();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("wheel", begin);
      window.removeEventListener("touchstart", begin);
      window.removeEventListener("keydown", begin);
      if (settle !== null) clearTimeout(settle);
      if (frame !== null) cancelAnimationFrame(frame);
      root?.classList.remove("gp-in-story");
    };
  }, [ref]);
}
