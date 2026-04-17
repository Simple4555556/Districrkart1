import { test, expect } from "@playwright/test";

test.describe("Vendor Flow - RBAC", () => {
  test("should deny access to vendor dashboard for unauthenticated users", async ({ page }) => {
    await page.goto("/vendor/products"); // A common vendor route
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // Note: To test 'PENDING' status or 'USER' role accessing vendor dashboard,
  // we would need to provide a storageState (session cookie) for those specific users.
  // This usually requires a global setup that logs in via the UI or API and saves the state.
});
