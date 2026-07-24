import { test, expect, type Page } from '@playwright/test';
import { createTestUser } from '../fixtures/test-data';
import { LoginPage } from '../pages/login.page';

const registerUrl = '/register';
const loginUrl = '/login';

async function fillRegistrationForm(page: Page, user: { name: string; email: string; password: string }) {
  await page.getByTestId('register-name').fill(user.name);
  await page.getByTestId('register-email').fill(user.email);
  await page.getByTestId('register-password').fill(user.password);
}

async function registerUserViaUI(page: Page, user: { name: string; email: string; password: string }) {
  await page.goto(registerUrl, { waitUntil: 'domcontentloaded' });
  await fillRegistrationForm(page, user);
  await Promise.all([
    page.waitForURL(/\/login$/, { timeout: 20000, waitUntil: 'commit' }),
    page.getByTestId('register-submit').click(),
  ]);
}

async function createUserViaApi(page: Page, user: { name: string; email: string; password: string }) {
  const response = await page.request.post('/api/register', { data: user });
  expect(response.ok()).toBeTruthy();
}

test.describe('authentication', () => {
  test('registers a new user and redirects to login', async ({ page }) => {
    const user = createTestUser('portfolio');
    await registerUserViaUI(page, user);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
  });

  test('shows an error for duplicate registration', async ({ page }) => {
    const user = createTestUser('dupuser');
    await createUserViaApi(page, user);
    await page.goto(registerUrl, { waitUntil: 'domcontentloaded' });
    await fillRegistrationForm(page, user);
    await page.getByTestId('register-submit').click();
    await expect(page.getByTestId('register-error')).toContainText(/already exists/i);
  });

  test('logs in successfully and lands on dashboard', async ({ page }) => {
    const user = createTestUser('login');
    await createUserViaApi(page, user);
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    const loginPage = new LoginPage(page);
    await loginPage.login(user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('button', { name: /add application/i })).toBeVisible();
  });
});
