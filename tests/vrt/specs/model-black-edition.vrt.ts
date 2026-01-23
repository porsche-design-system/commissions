import { expect, test } from '@playwright/test';

test('has no visual regression', async ({ page }) => {
  await page.goto('/model-black-edition/');

  await page.addStyleTag({
    content: `
            :root {
              --p-animation-duration: 0s !important;
              --p-transition-duration: 0s !important;
              --transition-duration-short: 0s !important;
              --transition-duration-moderate: 0s !important;
              --transition-duration-long: 0s !important;
              --transition-duration-very-long: 0s !important;
            }
            
            * {
              animation: none !important;
              transition: none !important;
            }
            
          `,
  });

  await expect(page).toHaveScreenshot('model-black-edition.png', { fullPage: true });
});
