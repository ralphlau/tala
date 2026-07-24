const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const page = await context.newPage();

  page.on('request', request => {
    if (request.url().includes('/api/register')) {
      console.log('REQUEST POST DATA:', request.postData());
      console.log('REQUEST HEADERS:', JSON.stringify(request.headers(), null, 2));
    }
  });
  page.on('response', response => {
    if (response.url().includes('/api/register')) {
      console.log('RESPONSE STATUS', response.status());
      response.text().then(text => console.log('RESPONSE BODY', text));
    }
  });

  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.fill('[data-testid="register-name"]', 'Debug User');
  await page.fill('[data-testid="register-email"]', 'debuguser@example.com');
  await page.fill('[data-testid="register-password"]', 'Password1!');
  await page.click('[data-testid="register-submit"]');
  await page.waitForTimeout(2000);
  console.log('PAGE URL AFTER SUBMIT', page.url());
  await browser.close();
})();
