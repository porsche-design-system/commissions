import { expect, test } from '../utils';

test.describe('has WCAG 2.2 (AA) compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop-shopping-cart/');
  });

  test('when page is loaded initially', async ({ makeAxeBuilder }) => {
    const a11y = await makeAxeBuilder().analyze();
    expect(a11y.violations).toEqual([]);
  });
});
