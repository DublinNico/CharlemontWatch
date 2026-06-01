import { test } from '@playwright/test';
import { interceptApi, setAdminAuth } from './helpers/mock-api';
import * as fs from 'fs';

const dir = 'test-results/screenshots';

test.beforeAll(() => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
});

test('screenshot: Home', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/01-home.png`, fullPage: true });
});

test('screenshot: About', async ({ page }) => {
  await page.goto('/about');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/02-about.png`, fullPage: true });
});

test('screenshot: Report Incident', async ({ page }) => {
  await page.goto('/report');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/03-report-incident.png`, fullPage: true });
});

test('screenshot: Report Incident — Anti-Social form expanded', async ({ page }) => {
  await page.goto('/report');
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /Anti-Social/i }).first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/04-report-antisocial.png`, fullPage: true });
});

test('screenshot: Report Incident — complaint section expanded', async ({ page }) => {
  await page.goto('/report');
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /Graffiti/i }).first().click();
  await page.waitForTimeout(200);
  const tuathCheckbox = page.locator('#send-tuath');
  await tuathCheckbox.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/05-report-complaint.png`, fullPage: true });
});

test('screenshot: Track Report', async ({ page }) => {
  await page.goto('/track');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/06-track-report.png`, fullPage: true });
});

test('screenshot: All Incidents', async ({ page }) => {
  await page.goto('/incidents');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/07-all-incidents.png`, fullPage: true });
});

test('screenshot: Privacy Policy', async ({ page }) => {
  await page.goto('/privacy');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/08-privacy.png`, fullPage: true });
});

test('screenshot: Login', async ({ page }) => {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/09-login.png`, fullPage: true });
});

test('screenshot: Admin Dashboard', async ({ page }) => {
  await setAdminAuth(page);
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${dir}/10-admin.png`, fullPage: true });
});
