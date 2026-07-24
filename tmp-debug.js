const { chromium, devices } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('request', request => console.log('REQUEST:', request.method(), request.url()));
  page.on('response', response => console.log('RESPONSE:', response.status(), response.url()));

  const user = { name: 'Debug User', email: 'debuguser@example.com', password: 'Password1!' };

  console.log('Creating user via API...');
  const apiResponse = await context.request.post('/api/register', { data: user });
  console.log('API CREATE STATUS', apiResponse.status(), await apiResponse.text());

  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.fill('[data-testid="register-name"]', user.name);
  await page.fill('[data-testid="register-email"]', user.email);
  await page.fill('[data-testid="register-password"]', user.password);
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/register')),
    page.click('[data-testid="register-submit"]'),
  ]);
  console.log('DUP API STATUS', response.status(), await response.text());
  console.log('PAGE URL AFTER SUBMIT', page.url());

  await browser.close();
})();
