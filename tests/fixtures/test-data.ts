export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export interface TestApplication {
  company: string;
  role: string;
  salary: string;
  notes: string;
  status: string;
}

export function createTestUser(prefix = 'qauser'):
  TestUser {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return {
    name: `${prefix} ${randomSuffix}`,
    email: `${prefix}${randomSuffix}@example.com`,
    password: 'StrongPass123!',
  };
}

export function createTestApplication(overrides: Partial<TestApplication> = {}): TestApplication {
  const suffix = Math.random().toString(36).slice(2, 6);
  return {
    company: `Acme ${suffix}`,
    role: 'QA Engineer',
    salary: '$90k',
    notes: 'Playwright test application',
    status: 'Applied',
    ...overrides,
  };
}
