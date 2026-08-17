import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home page loads and redirects to login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('h1')).toContainText('TALA');
  });
});
