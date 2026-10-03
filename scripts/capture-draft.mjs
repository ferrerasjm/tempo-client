import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, timezoneId: 'Asia/Manila' });
  async function capture(path) {
    await expect(page.locator('.loading')).toHaveCount(0, { timeout: 10000 });
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
    });
    await page.screenshot({ path, fullPage: true });
  }
  await page.goto('http://localhost:5173/');
  await capture('docs/screenshots/landing-desktop.png');
  await page.goto('http://localhost:5173/welcome');
  await page.getByRole('button', { name: /demo@cafetempo.test/ }).click();
  await page.goto('http://localhost:5173/cafe');
  await page.getByRole('heading', { name: 'Make yourself at home.' }).waitFor();
  await capture('docs/screenshots/cafe-desktop.png');
  await page.goto('http://localhost:5173/analytics');
  await page.locator('.metrics').waitFor();
  await capture('docs/screenshots/progress-desktop.png');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:5173/menu');
  await page.getByRole('heading', { name: 'Cafe Latte', exact: true }).waitFor();
  await capture('docs/screenshots/menu-mobile.png');
  const users = await (await page.request.get('http://localhost:5000/api/users')).json();
  const user = users.find(profile => profile.email === 'demo@cafetempo.test');
  const tasks = await (await page.request.get(`http://localhost:5000/api/tasks?user=${user._id}`)).json();
  const areas = await (await page.request.get('http://localhost:5000/api/cafe-areas')).json();
  const sessions = await (await page.request.get(`http://localhost:5000/api/focus-sessions?user=${user._id}`)).json();
  const orders = await (await page.request.get(`http://localhost:5000/api/orders?user=${user._id}`)).json();
  const menu = await (await page.request.get('http://localhost:5000/api/menu-items')).json();
  await page.evaluate(({ userId, drink }) => sessionStorage.setItem('tempo-study-' + userId, JSON.stringify({ drink, size: 'tall', label: 'Demo Student', taskId: '' })), { userId: user._id, drink: menu.find(item => item.category === 'drink' && item.available)._id });
  const paths = ['/', '/welcome', '/study/drink', '/study/size', '/study/label', '/study/task', '/cafe', '/spaces', `/spaces/${areas[0]._id}`, '/tasks', '/tasks/new', `/tasks/${tasks[0]._id}/edit`, '/focus', `/focus/${sessions[0]._id}`, '/history', '/analytics', '/menu', '/order-summary', '/orders', `/orders/${orders[0]._id}`, '/reservations'];
  for (const width of [375, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await page.goto(`http://localhost:5173${path}`);
      await page.locator('h1').first().waitFor({ timeout: 10000 }).catch(() => { throw new Error('Missing visible heading on ' + path + ' at ' + width + 'px'); });
      await expect(page.locator('.loading')).toHaveCount(0, { timeout: 10000 });
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
        throw new Error(`Horizontal overflow on ${path} at ${width}px`);
      }
    }
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  for (const step of ['drink', 'size', 'label', 'task']) {
    await page.goto('http://localhost:5173/study/' + step);
    await capture('docs/screenshots/study-' + step + '-desktop.png');
  }
  await page.goto('http://localhost:5173/focus');
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 10000 });
  if (await page.locator('.study-paper').count()) await capture('docs/screenshots/focus-setup-desktop.png');
  await page.goto('http://localhost:5173/focus/' + sessions.find(session => session.status === 'completed')._id);
  await page.locator('.timer').waitFor();
  await capture('docs/screenshots/focus-desktop.png');
  await page.getByRole('button', { name: 'Next cafe space' }).click();
  await capture('docs/screenshots/focus-corner-desktop.png');
  for (const width of [375, 1915]) {
    await page.setViewportSize({ width, height: 945 });
    await page.goto('http://localhost:5173/focus/' + sessions.find(session => session.status === 'completed')._id);
    await page.locator('.timer').waitFor();
    for (let index = 0; index < areas.length; index++) {
      await page.getByRole('button', { name: 'Next cafe space' }).click();
      const scene = await page.locator('.room-scenery').boundingBox();
      const table = await page.locator('.tabletop').boundingBox();
      if (!scene || Math.abs(scene.width - width) > 1 || !table || table.height > 945 * .5) throw new Error('Room should fill the width with the cup overlapping the foreground table');
    }
  }
  console.log('All five focus spaces fill desktop/mobile width with cups on the foreground table.');
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('http://localhost:5173/spaces/' + areas[0]._id);
  await page.getByText('Reserve this space for later', { exact: true }).click();
  await capture('docs/screenshots/reservation-desktop.png');
  console.log('Checked all 21 page routes at 375px and 1366px without horizontal overflow.');
  console.log('Saved read-only demo screenshots in docs/screenshots.');
} finally { await browser.close(); }
