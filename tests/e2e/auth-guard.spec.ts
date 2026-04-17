import { test, expect } from "@playwright/test";

test.describe("Auth Guards - Unauthorized Access", () => {
  test("should redirect unauthenticated user from admin dashboard to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated user from checkout to login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated user from user profile to login", async ({ page }) => {
    await page.goto("/user/profile");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
