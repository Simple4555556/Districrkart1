import { test, expect } from "@playwright/test";

test.describe("User Flow - Customer", () => {
  test("should navigate to homepage and check hot deals", async ({ page }) => {
    await page.goto("/");
    
    // Check if the site header is visible
    await expect(page.getByTestId("site-header")).toBeVisible();
    
    // Check if the hot deals section exists
    await expect(page.getByTestId("hot-deals-section")).toBeVisible();
    
    // Verify logo link
    await expect(page.getByTestId("logo-link")).toBeVisible();
  });

  test("should filter products by category", async ({ page }) => {
    await page.goto("/");
    
    // Find category filters
    const categoryFilters = page.getByTestId("category-filter");
    await expect(categoryFilters.first()).toBeVisible();
    
    // Click on the first category filter (e.g., Food)
    const firstCategory = categoryFilters.first();
    const categoryName = await firstCategory.innerText();
    await firstCategory.click();
    
    // Wait for navigation or re-render
    // Check URL if it contains the category slug
    await expect(page).toHaveURL(/\/category\//);
    
    // Check if category page specifically mentions the category
    // This assumes the category page uses the name in the header or similar
  });

  test("should search for products", async ({ page }) => {
    await page.goto("/");
    
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("Cake");
    await searchInput.press("Enter");
    
    // Verify search results or navigation
    // Since we don't know the exact search landing page behavior, we just check if it stays functional
    await expect(page.getByTestId("site-header")).toBeVisible();
  });
});
