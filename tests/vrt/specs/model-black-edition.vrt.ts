import { expect, test } from '@playwright/test';

test('has no visual regression', async ({ page }) => {
  await page.goto('/model-black-edition/');

  await expect(page).toHaveScreenshot('model-black-edition.png', {
    fullPage: true,
    maxDiffPixels: 100,
    threshold: 0.2,
  });
});
