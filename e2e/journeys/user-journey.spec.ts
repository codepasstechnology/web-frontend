import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

const API = "http://127.0.0.1:8000/api";
const PASSWORD = "JourneyTest!2026";
const backend = process.env.E2E_BACKEND_DIR ?? path.resolve("../backend");

async function verificationCode(): Promise<string> {
  const log = await readFile(
    path.join(process.env.E2E_STORAGE_DIR ?? path.join(backend, "storage"), "logs/e2e-mail.html"),
    "utf8",
  );
  const codes = [...log.matchAll(/>\s*(\d{6})\s*</g)];
  return codes.at(-1)?.[1] ?? "";
}

async function signUp(page: Page): Promise<string> {
  const email = `journey-${randomUUID()}@example.test`;
  await page.goto("/register");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Journey Test Owner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone number", { exact: true }).fill("712345678");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verify your account" })).toBeVisible();
  await expect.poll(verificationCode).toMatch(/^\d{6}$/);
  await page.getByLabel("Verification code").fill(await verificationCode());
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verify your account" })).toBeHidden();
  return email;
}

async function token(page: Page): Promise<string> {
  const value = await page.evaluate(() => localStorage.getItem("lv_token_v1"));
  expect(value).toBeTruthy();
  return value!;
}

test("signup, verify email, login, submit documents, approve and publish", async ({
  page,
  request,
}) => {
  // External map imagery/geocoding is not part of the marketplace contract.
  await page.route("https://nominatim.openstreetmap.org/**", (route) =>
    route.fulfill({ json: { address: { county: "Nairobi" } } }),
  );
  const email = await signUp(page);
  const initialToken = await token(page);
  expect(
    (
      await request.post(`${API}/auth/logout`, {
        headers: { Authorization: `Bearer ${initialToken}` },
      })
    ).ok(),
  ).toBeTruthy();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  const headers = { Authorization: `Bearer ${await token(page)}` };

  await page.goto("/dashboard/upload?type=land");
  const title = `E2E/NAI/${Date.now()}`;
  await page.getByLabel("Title number", { exact: true }).fill(title);
  await page.getByLabel("County", { exact: true }).selectOption("Nairobi");
  await page.getByLabel("Size in acres", { exact: true }).fill("1");
  await page.getByLabel("Asking price (KES)", { exact: true }).fill("1500000");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("dialog", { name: "How it works" })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByLabel("Search a place in Kenya", { exact: true }).fill("-1.2864, 36.8172");
  await page.getByRole("option", { name: /Drop a pin at these coordinates/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  for (const type of ["national_id", "title_deed"]) {
    await page.getByLabel("Document type", { exact: true }).selectOption(type);
    await page.locator('input[type="file"][accept="application/pdf,image/*"]').setInputFiles({
      name: `${type}.pdf`,
      mimeType: "application/pdf",
      buffer: Buffer.from(`%PDF-1.4\nSynthetic ${type} for CI only\n%%EOF`),
    });
  }
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const submitted = page.waitForResponse(
    (response) =>
      response.url() === `${API}/user/listings` && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Publish listing", exact: true }).click();
  const response = await submitted;
  expect(response.status(), await response.text()).toBe(201);
  const listing = await response.json();
  await expect(page.getByRole("heading", { name: "Listing submitted", exact: true })).toBeVisible();
  expect((await request.get(`${API}/parcels/${listing.id}`)).status()).toBe(404);

  const applications = await request.get(`${API}/user/kyc`, { headers });
  const rows: {
    id: string;
    parcel_id: string;
    documents: { id: string }[];
    parcel: { id: string };
  }[] = await applications.json();
  const application = rows.find((row) => row.parcel?.id === listing.id);
  expect(application).toBeTruthy();
  expect(application!.documents).toHaveLength(2);
  const document = application!.documents[0];
  expect(
    (
      await request.get(`${API}/user/kyc/${application!.id}/documents/${document.id}`, { headers })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.get(`${API}/user/kyc/${application!.id}/documents/${document.id}`, {
        headers: { Accept: "application/json" },
      })
    ).status(),
  ).toBe(401);

  const adminLogin = await request.post(`${API}/auth/admin/login`, {
    data: { email: "superadmin@landconnect.test", password: "password" },
  });
  expect(adminLogin.ok(), await adminLogin.text()).toBeTruthy();
  const admin = { Authorization: `Bearer ${(await adminLogin.json()).token}` };
  expect(
    (
      await request.patch(`${API}/admin/kyc/${application!.id}/identity`, {
        headers: admin,
        data: { document_owner_name: "Journey Test Owner", id_matches_title_deed: true },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.patch(`${API}/admin/kyc/${application!.id}/status`, {
        headers: admin,
        data: { status: "approved" },
      })
    ).ok(),
  ).toBeTruthy();
  const published = await request.get(`${API}/parcels/${listing.id}`);
  expect(published.ok()).toBeTruthy();
  expect((await published.json()).verified).toBe(true);
  await page.goto("/dashboard?tab=kyc");
  await page.getByRole("button", { name: new RegExp(`${title}.*Approved`) }).click();
  await expect(page.getByText("Documents approved", { exact: true })).toBeVisible();
});
