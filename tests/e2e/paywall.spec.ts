import { expect, test, type Page } from "@playwright/test";

import {
  demoOwnerEmail,
  demoOwnerPassword,
  demoBusinessSlug,
} from "./fixtures";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email address").fill(demoOwnerEmail);
  await page.locator("#password").fill(demoOwnerPassword);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/businesses$/, { timeout: 20_000 });
}

async function openDemoBusiness(page: Page) {
  await page.goto(`/businesses/${demoBusinessSlug}/dashboard`);
  await expect(page).toHaveURL(
    new RegExp(`/businesses/${demoBusinessSlug}/dashboard$`),
    { timeout: 20_000 },
  );
}

test.describe("Paywall & Free Plan Gating", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("owner sees LockedFeatureOverlay over advanced analytics", async ({
    page,
  }) => {
    await openDemoBusiness(page);
    await page.getByRole("link", { name: "Analytics" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/businesses/${demoBusinessSlug}/dashboard/analytics$`),
    );

    // Click the "Conversion" tab which is gated for Free plans
    await page.getByRole("tab", { name: "Conversion" }).click();

    // Verify the blurred overlay appears
    await expect(page.getByText("Conversion analytics")).toBeVisible();
    await expect(
      page.getByText("See how inquiries convert to quotes and acceptances."),
    ).toBeVisible();

    await expect(
      page.getByText("Request Pro access"),
    ).toBeVisible();
  });

  test("owner sees LockedFeaturePage when accessing knowledge base", async ({
    page,
  }) => {
    await openDemoBusiness(page);
    await page.goto(
      `/businesses/${demoBusinessSlug}/dashboard/settings/knowledge`,
    );

    // Verify the full page lock component
    await expect(page.getByRole("heading", { name: "Knowledge base" })).toBeVisible();
    await expect(
      page.getByText("Manage FAQs and knowledge files for your AI assistant."),
    ).toBeVisible();

    await expect(
      page.getByText("Request Pro access"),
    ).toBeVisible();
  });

  test("owner sees dialog when attempting to create a second business", async ({
    page,
  }) => {
    // The landing after sign in is /businesses, where we should see the created business
    // and the "Create another business" card
    await page.goto("/businesses");

    // The free plan locks the multi-business feature via dialog submission intercept
    await page.getByLabel("Business name").fill("Test Business 2");
    await page.getByRole("button", { name: "Create business" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Multiple businesses" })).toBeVisible();
    await expect(
      page.getByText("Managing completely separate brands, services, and billing requires a Pro subscription"),
    ).toBeVisible();
  });

  test("owner sees Free plan badge in general settings", async ({ page }) => {
    await openDemoBusiness(page);
    await page.goto(
      `/businesses/${demoBusinessSlug}/dashboard/settings/general`,
    );

    // Check for the header PlanBadge outputting "Free"
    await expect(page.getByText("Free", { exact: true })).toBeVisible();
  });
});
