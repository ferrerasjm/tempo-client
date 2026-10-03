import { test, expect } from '@playwright/test';

test('sip stats matches the empty and populated layouts and keeps the current timer', async ({ page }) => {
  let sessions: Record<string, unknown>[] = [];
  await page.addInitScript(() => localStorage.setItem('tempo-profile', 'profile'));
  await page.route('http://localhost:5000/api/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname === '/api/users'
      ? [{ _id: 'profile', displayName: 'jm', email: 'jm@example.test' }] : sessions,
  }));
  await page.setViewportSize({ width: 1915, height: 945 });
  await page.goto('/sip-stats');
  await expect(page.getByRole('heading', { name: "jm's sip stats" })).toBeVisible();
  await expect(page.getByText('no tasks completed yet')).toBeVisible();
  await expect(page.getByText('no sips yet')).toBeVisible();
  await expect(page.getByLabel('Default focus duration')).toHaveText('25:00');
  await expect(page.locator('.sip-back')).toHaveAttribute('href', '/study/drink');
  await expect(page.locator('.site-header')).toHaveCount(0);
  const panel = await page.locator('.sip-stats').boundingBox();
  expect(panel!.width).toBe(500);
  expect(panel!.height).toBe(665);
  await page.screenshot({ path: 'docs/screenshots/sip-stats-empty.png', fullPage: true });

  sessions = Array.from({ length: 6 }, (_, index) => ({ _id: `done-${index}`, status: 'completed', drinkName: 'Matcha Tea', taskTitle: index === 5 ? 'Build our project for advanced web' : `Completed task ${index + 1}`, elapsedSeconds: 384, completedMinutes: 6 }));
  sessions.unshift({ _id: 'running', status: 'active', drinkName: 'Matcha Tea', plannedMinutes: 25, startedAt: new Date(Date.now() - 20 * 60000).toISOString(), pausedMilliseconds: 0 });
  await page.reload();
  await expect(page.locator('.sip-row')).toHaveCount(6);
  await expect(page.locator('.sip-timer img')).toHaveAttribute('src', '/assets/cafe/matcha.webp');
  await expect(page.locator('.sip-total')).toContainText('6');
  await expect(page.locator('.sip-row').first()).toContainText('6:24');
  await expect(page.locator('.sip-back')).toHaveAttribute('href', '/focus/running');
  const before = await page.getByLabel('Time remaining').textContent();
  await expect(page.getByLabel('Time remaining')).not.toHaveText(before!);
  await page.screenshot({ path: 'docs/screenshots/sip-stats-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('.sip-back')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/sip-stats-mobile.png', fullPage: true });

  sessions[0] = { ...sessions[0], status: 'paused', pausedAt: new Date(Date.now()).toISOString() };
  sessions.push(...Array.from({ length: 20 }, (_, index) => ({ ...sessions[1], _id: `extra-${index}` })));
  await page.reload();
  await expect(page.locator('.sip-row')).toHaveCount(26);
  const stopped = await page.getByLabel('Time remaining').textContent();
  await page.waitForTimeout(1200);
  await expect(page.getByLabel('Time remaining')).toHaveText(stopped!);
  expect(await page.locator('.sip-list').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
});
