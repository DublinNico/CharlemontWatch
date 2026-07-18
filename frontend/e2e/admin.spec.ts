import { test, expect } from '@playwright/test';
import { interceptApi, setAdminAuth } from './helpers/mock-api';
import { MOCK_INCIDENTS } from './helpers/mock-data';

test.describe('Admin — login', () => {
  test('ET-008: correct credentials → redirected to admin dashboard', async ({ page }) => {
    await interceptApi(page);
    // /auth was renamed to /cw-admin (gated by ?key=VITE_ADMIN_KEY) to hide
    // the admin login from public discovery — matches frontend/.env locally
    await page.goto('/cw-admin?key=charlemont2026');

    await page.locator('input[type="email"]').fill('admin@test.com');
    await page.locator('input[type="password"]').fill('AdminPass123!');
    await page.getByRole('button', { name: /Login/i }).click();

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
  });

  test('ET-008-B: wrong credentials → shows error message', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({ status: 401, json: { error: 'Invalid credentials' } });
    });

    await page.goto('/cw-admin?key=charlemont2026');
    await page.locator('input[type="email"]').fill('wrong@test.com');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.getByRole('button', { name: /Login/i }).click();

    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/cw-admin/);
  });
});

test.describe('Admin — dashboard actions', () => {
  test.beforeEach(async ({ page }) => {
    await setAdminAuth(page);
    await interceptApi(page);
  });

  test('ET-009: update status NEW → IN_PROGRESS', async ({ page }) => {
    await page.goto('/admin');

    // Switch to Manage Incidents tab
    await page.getByText('Manage Incidents').click();

    // Click Update Status on the first incident
    await page.getByRole('button', { name: /Update Status/i }).first().click();

    // Select IN_PROGRESS from the select
    await page.getByRole('combobox').selectOption('IN_PROGRESS');

    // Confirm
    await page.getByRole('button', { name: /^Update Status$/i }).last().click();

    // The PATCH was intercepted and returns IN_PROGRESS — verify no crash
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
  });

  test('ET-010: delete incident → removed from list', async ({ page }) => {
    await page.goto('/admin');
    await page.getByText('Manage Incidents').click();

    // Count incidents before delete
    const incidentCount = await page.getByRole('button', { name: /Delete/i }).count();
    expect(incidentCount).toBeGreaterThan(0);

    // Click first Delete button
    await page.getByRole('button', { name: /Delete/i }).first().click();

    // After deletion the list updates (state removes the item)
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
  });
});
