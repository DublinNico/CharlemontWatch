import { test, expect } from '@playwright/test';
import { interceptApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
});

test('ET-003: track report by ID → incident details displayed', async ({ page }) => {
  await page.goto('/track');

  await page.getByPlaceholder(/Enter Incident ID/i).fill('CW-ABC123');
  await page.getByRole('button', { name: /Search/i }).click();

  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();
  await expect(page.getByText('Large graffiti tag on the south wall')).toBeVisible();
});

test('ET-004: track report with unknown ID → shows not found message', async ({ page }) => {
  // Override the default mock to return 404
  await page.route('**/api/incidents/CW-XXXXXX', route => {
    route.fulfill({ status: 404, json: { error: 'Incident not found' } });
  });

  await page.goto('/track');
  await page.getByPlaceholder(/Enter Incident ID/i).fill('CW-XXXXXX');
  await page.getByRole('button', { name: /Search/i }).click();

  await expect(page.getByText(/No incident found/i)).toBeVisible();
});
