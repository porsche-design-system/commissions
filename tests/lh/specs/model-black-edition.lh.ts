import { expect, test } from '../utils';

test.beforeEach(async ({ page }) => {
  await page.goto('/model/');
});

test.describe('has sufficient lighthouse score', () => {
  test('on mobile', async ({ lighthouseAuditMobile }) => {
    const { performance, accessibility, bestPractices, seo } = await lighthouseAuditMobile();

    expect(performance, 'Performance').toBeGreaterThanOrEqual(80);
    expect(accessibility, 'Accessibility').toBeGreaterThanOrEqual(100);
    expect(bestPractices, 'Best Practices').toBeGreaterThanOrEqual(100);
    expect(seo, 'SEO').toBeGreaterThanOrEqual(66);
  });

  test('on desktop', async ({ lighthouseAuditDesktop }) => {
    const { performance, accessibility, bestPractices, seo } = await lighthouseAuditDesktop();

    expect(performance, 'Performance').toBeGreaterThanOrEqual(90);
    expect(accessibility, 'Accessibility').toBeGreaterThanOrEqual(100);
    expect(bestPractices, 'Best Practices').toBeGreaterThanOrEqual(100);
    expect(seo, 'SEO').toBeGreaterThanOrEqual(66);
  });
});
