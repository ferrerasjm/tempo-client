import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, timezoneId: 'Asia/Manila' });
  await page.goto('http://localhost:5173/');
  await page.screenshot({ path: 'docs/screenshots/landing-desktop.png', fullPage: true });
  await page.goto('http://localhost:5173/welcome');
  await page.getByRole('button', { name: /demo@cafetempo.test/ }).click();
  await page.getByRole('heading', { name: /^Settle in/ }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/cafe-desktop.png', fullPage: true });
  await page.goto('http://localhost:5173/analytics');
  await page.locator('.metrics').waitFor();
  await page.screenshot({ path: 'docs/screenshots/progress-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:5173/menu');
  await page.getByRole('heading', { name: 'Cafe Latte', exact: true }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/menu-mobile.png', fullPage: true });
  const users = await (await page.request.get('http://localhost:5000/api/users')).json();
  const user = users.find(profile => profile.email === 'demo@cafetempo.test');
  const tasks = await (await page.request.get(`http://localhost:5000/api/tasks?user=${user._id}`)).json();
  const areas = await (await page.request.get('http://localhost:5000/api/cafe-areas')).json();
  const sessions = await (await page.request.get(`http://localhost:5000/api/focus-sessions?user=${user._id}`)).json();
  const orders = await (await page.request.get(`http://localhost:5000/api/orders?user=${user._id}`)).json();
  const paths = ['/', '/welcome', '/cafe', '/spaces', `/spaces/${areas[0]._id}`, '/tasks', '/tasks/new', `/tasks/${tasks[0]._id}/edit`, '/focus', `/focus/${sessions[0]._id}`, '/history', '/analytics', '/menu', '/order-summary', '/orders', `/orders/${orders[0]._id}`, '/reservations'];
  for (const width of [375, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await page.goto(`http://localhost:5173${path}`);
      await page.locator('h1').first().waitFor();
      await page.locator('.loading').waitFor({ state: 'hidden' });
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
        throw new Error(`Horizontal overflow on ${path} at ${width}px`);
      }
    }
  }
  console.log('Checked all 17 page routes at 375px and 1366px without horizontal overflow.');
  console.log('Saved read-only demo screenshots in docs/screenshots.');
} finally { await browser.close(); }
