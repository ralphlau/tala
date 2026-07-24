const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const page = await context.newPage();

  page.on('console', (msg) => console.log('[PAGE CONSOLE]', msg.text()));
  page.on('request', (request) => console.log('[REQUEST]', request.method(), request.url()));
  page.on('response', async (response) => {
    if (response.url().includes('/api/register')) {
      console.log('[RESPONSE]', response.status(), response.url());
      console.log('[RESPONSE BODY]', await response.text());
    }
  });

  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="register-submit"]', { state: 'visible', timeout: 10000 });
  await page.fill('[data-testid="register-name"]', 'Debug User');
  await page.fill('[data-testid="register-email"]', 'debuguser@example.com');
  await page.fill('[data-testid="register-password"]', 'Password1!');
  const formState = await page.evaluate(() => ({
    foundForm: !!document.querySelector('form'),
    submitType: document.querySelector('[data-testid="register-submit"]')?.getAttribute('type'),
    name: document.querySelector('input[data-testid="register-name"]')?.value,
    email: document.querySelector('input[data-testid="register-email"]')?.value,
    password: document.querySelector('input[data-testid="register-password"]')?.value,
    onSubmit: (() => {
      const form = document.querySelector('form');
      if (!form) return null;
      // cannot inspect event listener reliably; just report DOM presence
      return 'exists';
    })(),
  }));
  console.log('FORM STATE', formState);

  await page.click('[data-testid="register-submit"]');
  await page.waitForTimeout(3000);
  console.log('PAGE URL AFTER SUBMIT', page.url());
  await browser.close();
})();
