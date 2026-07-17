import { test, expect } from '@playwright/test';
import { interceptApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
});

test('ET-001: submit graffiti report → confirmation page shows incident ID', async ({ page }) => {
  await page.goto('/report');

  // Select incident type via Radix Select
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /Graffiti/i }).first().click();

  // Fill required fields — reporterEmail is mandatory on every report
  await page.getByPlaceholder(/e\.g\. Charlemont/i).fill('Block A, Charlemont Street');
  await page.getByPlaceholder(/Describe what you observed/i).fill('Large graffiti tag on the south wall');
  await page.getByPlaceholder(/your\.email@example\.com/i).fill('jane@example.com');

  // The Túath/DCC complaint checkboxes default to checked, which makes
  // Full Name/Address required — uncheck both since this test is a bare
  // report, not the complaint flow.
  await page.getByRole('checkbox', { name: /Túath Housing/i }).uncheck();
  await page.getByRole('checkbox', { name: /Dublin City Council/i }).uncheck();

  // Submit
  await page.getByRole('button', { name: /Submit Report/i }).click();

  // Should navigate to success page with incident ID
  await expect(page).toHaveURL(/\/success\//);
  await expect(page.getByText('CW-ABC123')).toBeVisible();
});

test('ET-002: report without a formal complaint (name/address left blank) → success page with no crash', async ({ page }) => {
  await page.goto('/report');

  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /Maintenance Issue/i }).first().click();

  await page.getByPlaceholder(/e\.g\. Charlemont/i).fill('Stairwell B');
  await page.getByPlaceholder(/Describe what you observed/i).fill('Broken door lock on level 3');
  await page.getByPlaceholder(/your\.email@example\.com/i).fill('anon-tenant@example.com');

  // Uncheck both complaint boxes (checked by default) so Full Name/Address
  // stay optional, since this test is specifically about not complaining
  await page.getByRole('checkbox', { name: /Túath Housing/i }).uncheck();
  await page.getByRole('checkbox', { name: /Dublin City Council/i }).uncheck();
  await page.getByRole('button', { name: /Submit Report/i }).click();

  await expect(page).toHaveURL(/\/success\//);
});
