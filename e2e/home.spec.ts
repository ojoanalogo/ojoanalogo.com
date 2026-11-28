import { expect, test } from '@playwright/test';

test('home and about render', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Alfonso Reyes');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Alfonso Reyes');

  await page.goto('/about');
  await expect(page).toHaveTitle('Quién soy · Alfonso Reyes');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Alfonso Reyes');
});
