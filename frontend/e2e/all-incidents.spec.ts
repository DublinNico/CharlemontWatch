import { test, expect } from '@playwright/test';
import { interceptApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
});

test('ET-005: browse all incidents → list renders with all incident cards', async ({ page }) => {
  await page.goto('/incidents');

  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();
  await expect(page.getByText('Charlemont Gate, Block C')).toBeVisible();
  await expect(page.getByText('Stairwell B')).toBeVisible();
});

test('ET-006: type filter → shows only matching incidents', async ({ page }) => {
  await page.goto('/incidents');
  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();

  // Type filter is rendered as button pills — click the Graffiti pill
  await page.getByRole('button', { name: 'Graffiti' }).click();

  // Only the graffiti incident should remain visible
  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();
  await expect(page.getByText('Charlemont Gate, Block C')).not.toBeVisible();
});

test('ET-007: click incident card → navigates to TrackReport with incident loaded', async ({ page }) => {
  await page.goto('/incidents');

  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();

  // Click the first incident card
  await page.getByText('Block A, Charlemont Street').click();

  // Should navigate to /track with the incident details
  await expect(page).toHaveURL(/\/track/);
  await expect(page.getByText('Block A, Charlemont Street')).toBeVisible();
});
