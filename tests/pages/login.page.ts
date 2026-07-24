import { type Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
  }

  async login(email: string, password: string) {
    await this.page.getByTestId('login-email').fill(email);
    await this.page.getByTestId('login-password').fill(password);
    await Promise.all([
      this.page.waitForURL(/\/dashboard$/, { timeout: 20000, waitUntil: 'commit' }),
      this.page.getByTestId('login-submit').click(),
    ]);
    await this.page.getByRole('button', { name: /add application/i }).waitFor({ timeout: 20000 });
  }

  async expectError(message: string) {
    await expect(this.page.getByTestId('login-error')).toContainText(message);
  }
}
