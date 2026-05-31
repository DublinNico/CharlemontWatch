import { Page } from '@playwright/test';
import { MOCK_INCIDENTS, MOCK_INCIDENT, MOCK_LOGIN_RESPONSE } from './mock-data';

// Single catch-all handler avoids Playwright's last-registered-first-checked ordering issues
export async function interceptApi(page: Page) {
  await page.route(/\/api\//, async route => {
    const url  = route.request().url();
    const method = route.request().method();

    if (method === 'POST' && url.includes('/api/auth/login')) {
      return route.fulfill({ json: MOCK_LOGIN_RESPONSE });
    }
    if (method === 'POST' && url.includes('/api/incidents/report')) {
      return route.fulfill({ status: 201, json: { success: true, incidentId: 'CW-ABC123' } });
    }
    if (method === 'GET' && /\/api\/incidents$/.test(url)) {
      return route.fulfill({ json: MOCK_INCIDENTS });
    }
    if (method === 'PATCH' && url.includes('/api/incidents/admin/') && url.includes('/status')) {
      return route.fulfill({ json: { success: true, incident: { ...MOCK_INCIDENT, status: 'IN_PROGRESS' } } });
    }
    if (url.includes('/api/incidents/admin/')) {
      return route.fulfill({ json: { success: true } });
    }
    if (method === 'GET' && url.includes('/api/incidents/')) {
      return route.fulfill({ json: MOCK_INCIDENT });
    }

    route.continue();
  });
}

export async function setAdminAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-admin-jwt');
    localStorage.setItem('charlemont-user', JSON.stringify({ name: 'Admin', email: 'admin@test.com' }));
  });
}
