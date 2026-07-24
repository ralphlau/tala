import { test, expect, type Page } from '@playwright/test';
import { createTestUser, createTestApplication } from '../fixtures/test-data';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

async function createUserAndLogin(page: Page, user: { name: string; email: string; password: string }) {
  const response = await page.request.post('/api/register', { data: user });
  expect(response.ok()).toBeTruthy();
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.password);
}

test.describe('application management', () => {
  test('creates a new application and shows it in the Applied stage', async ({ page }) => {
    const user = createTestUser('appuser');
    const app = createTestApplication({ company: 'Acme Playwright', role: 'QA Engineer', status: 'Applied' });

    await createUserAndLogin(page, user);
    const dashboard = new DashboardPage(page);
    await dashboard.createApplication(app);
    await dashboard.expectApplicationVisible(app.company);
    await dashboard.expectStageCount('Applied', 1);
  });

  test('moves an application from Applied to Interview using the details panel', async ({ page }) => {
    const user = createTestUser('moveapp');
    const app = createTestApplication({ company: 'Acme Move', role: 'QA Engineer', status: 'Applied' });

    await createUserAndLogin(page, user);
    const dashboard = new DashboardPage(page);
    await dashboard.createApplication(app);
    await dashboard.openApplication(app.company);
    await dashboard.moveSelectedApplicationTo('Interview');
    await dashboard.expectApplicationInStage(app.company, 'Interview');
  });
});
