import { type Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  }

  async openAddApplication() {
    await this.page.getByTestId('add-application-button').click();
    await this.page.getByTestId('application-modal').waitFor({ timeout: 10000 });
  }

  async createApplication(payload: {
    company: string;
    role: string;
    jobUrl?: string;
    salary?: string;
    notes?: string;
    status?: string;
  }) {
    await this.openAddApplication();
    await this.page.getByTestId('application-company').fill(payload.company);
    await this.page.getByTestId('application-role').fill(payload.role);
    if (payload.jobUrl) {
      await this.page.getByTestId('application-jobUrl').fill(payload.jobUrl);
    }
    if (payload.salary) {
      await this.page.getByTestId('application-salary').fill(payload.salary);
    }
    if (payload.status) {
      await this.page.getByTestId('application-status').selectOption(payload.status);
    }
    if (payload.notes) {
      await this.page.getByTestId('application-notes').fill(payload.notes);
    }
    await this.page.getByTestId('save-application').click();
    await expect(this.page.getByText(payload.company, { exact: true })).toBeVisible();
  }

  async openApplication(company: string) {
    await this.page
      .getByTestId(/^application-card-/)
      .filter({ hasText: company })
      .first()
      .click();
    await this.page.getByText('Selected application').waitFor({ timeout: 10000 });
  }

  async moveSelectedApplicationTo(stage: string) {
    await this.page.getByTestId(`move-to-${stage.toLowerCase()}-button`).click();
    await expect(this.page.getByTestId('application-modal')).toBeHidden({ timeout: 10000 });
  }

  async expectApplicationVisible(company: string) {
    await expect(this.page.getByText(company, { exact: true })).toBeVisible();
  }

  async expectApplicationInStage(company: string, stage: string) {
    await expect(
      this.page.getByTestId(`stage-column-${stage.toLowerCase()}`).getByText(company, { exact: true })
    ).toBeVisible();
  }

  async expectStageCount(stage: string, count: number) {
    await expect(
      this.page.getByTestId(`stage-column-${stage.toLowerCase()}`).getByText(String(count), { exact: true })
    ).toBeVisible();
  }
}
