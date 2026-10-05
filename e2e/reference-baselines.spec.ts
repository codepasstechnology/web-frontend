import { test, expect } from "@playwright/test";
import { STORY_SHOT, TOP_SHOT, dataMasks, scrollIntoStory } from "./home-helpers";

/**
 * Renders the approved design (e2e/reference/geo-pin-home.html) and writes it as the
 * baseline the app is compared against. Run with `npm run e2e:baseline`.
 */
const REFERENCE_URL = new URL("./reference/geo-pin-home.html", import.meta.url).href;

test("reference: first frame", async ({ page }) => {
  await page.goto(REFERENCE_URL);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(TOP_SHOT, {
    mask: dataMasks(page, "reference"),
    fullPage: false,
  });
});

test("reference: mid scroll story", async ({ page }) => {
  await page.goto(REFERENCE_URL);
  await page.evaluate(() => document.fonts.ready);
  await scrollIntoStory(page);
  await expect(page).toHaveScreenshot(STORY_SHOT, {
    mask: dataMasks(page, "reference"),
    fullPage: false,
  });
});
