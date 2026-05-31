import { test, expect } from '@playwright/test';
import { interceptApi } from './helpers/mock-api';

// These tests run on the 'mobile' project (iPhone SE, 375px) defined in playwright.config.ts

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
});

test('ET-011: mobile — incident list renders at 375px', async ({ page }) => {
  await page.goto('/incidents');
  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();
});

test('ET-012: mobile — report form is usable at 375px', async ({ page }) => {
  await page.goto('/report');

  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /Safety Hazard/i }).first().click();

  await page.getByPlaceholder(/e\.g\. Charlemont/i).fill('Near the bin area');
  await page.getByPlaceholder(/Describe what you observed/i).fill('Broken glass on ground');

  await page.getByRole('button', { name: /Submit Report/i }).click();
  await expect(page).toHaveURL(/\/success\//);
});

test('ET-013: mobile — track report search works at 375px', async ({ page }) => {
  await page.goto('/track');

  await page.getByPlaceholder(/Enter Incident ID/i).fill('CW-ABC123');
  await page.getByRole('button', { name: /Search/i }).click();

  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();
});

test('ET-014: mobile — header shows CharlemontWatch title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('CharlemontWatch')).toBeVisible();
});
