import type { Page } from "@playwright/test";

export const TOP_SHOT = "home-top.png";
export const STORY_SHOT = "home-story.png";

/**
 * Scroll the story to a fixed point in its pinned range. The router restores the
 * scroll position once it has hydrated, so wait for the page to settle and then
 * re-apply the scroll until it holds.
 */
export async function scrollIntoStory(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.getByRole("heading", { level: 1 }).waitFor();
  for (let attempt = 0; attempt < 10; attempt++) {
    const { target, y } = await page.evaluate(() => {
      const story = document.getElementById("story");
      if (!story) throw new Error("#story not found");
      const target = story.offsetTop + window.innerHeight * 1.5;
      window.scrollTo({ top: target, behavior: "instant" });
      return { target, y: window.scrollY };
    });
    await page.waitForTimeout(300);
    const settled = await page.evaluate(() => window.scrollY);
    if (Math.abs(settled - target) < 2 && Math.abs(y - target) < 2) return;
  }
  throw new Error("could not hold the story scroll position");
}

/**
 * The header carries the site links added to the reference (Pricing, Blog, About, Help, Contact),
 * so it is compared by behaviour rather than by pixels. Live listing data is masked for the same reason: is masked in the comparison: the reference shows placeholder
 * copy, while the app shows whatever the API returns.
 */
export function dataMasks(page: Page, source: "reference" | "app") {
  if (source === "reference") {
    return [
      page.locator("header"),
      page.locator("#listings"),
      page.getByText(/PARCEL/),
      page.getByText(/acre plot, Kitengela/),
      page.getByText(/Message the owner/),
    ];
  }
  return [
    page.locator("header"),
    page.locator("#listings"),
    page.locator(".gp-card-meta"),
    page.locator(".gp-card-title"),
    page.locator(".gp-card-sub"),
  ];
}
