import { test, expect } from "@playwright/test";
import { STORY_SHOT, TOP_SHOT, dataMasks, scrollIntoStory } from "./home-helpers";

const VERIFIED_PARCEL = {
  id: "00000000-0000-4000-8000-000000000001",
  parcel_number: "LR-4471",
  county: "Kajiado",
  price: 3500000,
  listing_type: "sale",
  verified: true,
  featured: true,
  photos: [],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/parcels", (route) => route.fulfill({ json: [VERIFIED_PARCEL] }));
  await page.route("**/api/properties*", (route) => route.fulfill({ json: { data: [] } }));
});

test("first frame matches the approved design", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(TOP_SHOT, { mask: dataMasks(page, "app") });
});

test("mid scroll story matches the approved design", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await scrollIntoStory(page);
  await expect(page).toHaveScreenshot(STORY_SHOT, { mask: dataMasks(page, "app") });
});

test("mobile menu opens, and closes when a link is tapped", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 860, "mobile menu only exists below 860px");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(page.locator("#gp-menu")).toBeVisible();
  await page.locator("#gp-menu").getByRole("button", { name: "Pin Properties" }).click();
  await page.locator("#gp-menu").getByRole("link", { name: "Land" }).click();
  await expect(page.locator("#gp-menu")).toHaveCount(0);
});

test("no horizontal scrolling on a 360px phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
