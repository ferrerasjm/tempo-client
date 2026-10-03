import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

// Browser tests use an isolated Atlas profile; cleanup only touches that profile.
const serverDir = process.env.TEMPO_SERVER_DIR || resolve('../server');
const serverRequire = createRequire(resolve(serverDir, 'package.json'));
const mongoose = serverRequire('mongoose');
serverRequire('dotenv').config({ path: resolve(serverDir, '.env'), quiet: true });
const User = serverRequire('./src/models/User');
const Task = serverRequire('./src/models/Task');
const FocusSession = serverRequire('./src/models/FocusSession');
const Reservation = serverRequire('./src/models/Reservation');
const Order = serverRequire('./src/models/Order');
let userId: string;
let focusPath = '';
let orderPath = '';
const profileName = `Draft Test ${Date.now()}`;
const screenshotDir = resolve('docs/screenshots');

function futureInput(hours: number) {
  return new Date(Date.now() + hours * 3600000 + 8 * 3600000).toISOString().slice(0, 16);
}

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => {
  mkdirSync(screenshotDir, { recursive: true });
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.create({ displayName: profileName, email: `draft-${Date.now()}@cafetempo.test` });
  userId = String(user._id);
});
test.afterAll(async () => {
  if (userId) {
    await FocusSession.deleteMany({ user: userId });
    await Reservation.deleteMany({ user: userId });
    await Order.deleteMany({ user: userId });
    await Task.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);
  }
  await mongoose.disconnect();
});

test('real frontend → API → Atlas flow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little room to focus.' })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/landing-desktop.png`, fullPage: true });
  await page.getByRole('link', { name: 'Come on in' }).click();
  await expect(page.getByText('Selecting a profile is not a password login.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(profileName) }).click();
  await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/cafe-desktop.png`, fullPage: true });

  await page.getByRole('link', { name: /Study board/ }).click();
  await expect(page.getByRole('heading', { name: 'A clear board.' })).toBeVisible();
  await page.getByRole('link', { name: 'Add a task +', exact: true }).click();
  await page.getByLabel('Task title').fill('');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByText('Enter a task title.')).toBeVisible();
  await page.getByLabel('Task title').fill('Draft focus task');
  await page.getByLabel('Description', { exact: true }).fill('Verify the complete cafe flow.');
  await page.getByLabel('Deadline').fill(futureInput(48));
  await page.getByLabel('Estimated minutes').fill('45');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Draft focus task', exact: true })).toBeVisible();
  await page.getByText('Manage task', { exact: true }).click();
  await page.getByRole('link', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Task title')).toHaveValue('Draft focus task');
  await page.getByLabel('Description', { exact: true }).fill('Edited task from the working UI.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Edited task from the working UI.')).toBeVisible();

  await page.getByRole('link', { name: 'Focus →', exact: true }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByLabel('Cafe area').selectOption({ label: 'Garden Patio' });
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: 'Suggest a session' }).click();
  await expect(page.getByText('Your suggested rhythm')).toBeVisible();
  await page.getByRole('button', { name: 'Start focusing →' }).click();
  await expect(page.getByRole('button', { name: 'Finish session' })).toBeVisible();
  focusPath = new URL(page.url()).pathname;
  await page.reload();
  await expect(page.getByRole('button', { name: 'Finish session' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish session' }).click();
  await page.getByLabel('Minutes you actually focused').fill('1');
  await page.getByRole('button', { name: 'Save session' }).click();
  await expect(page.getByText('1 minute saved', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Update task status' }).click();
  await page.getByLabel('Status', { exact: true }).selectOption('completed');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.status-completed')).toHaveText('completed');

  await page.goto('/menu');
  await page.getByRole('button', { name: 'Choose Cafe Latte' }).click();
  await page.getByRole('button', { name: 'Add one Cafe Latte' }).click();
  await page.getByRole('button', { name: 'Choose Butter Cookie' }).click();
  await page.getByRole('link', { name: 'Review your order' }).click();
  await expect(page.getByText('Your completed focus session today earned 10% off.', { exact: false })).toBeVisible();
  await expect(page.locator('.summary-list .total dd')).toHaveText('67 credits');
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await expect(page.locator('.status-placed')).toBeVisible();
  orderPath = new URL(page.url()).pathname;
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Cancel order' }).click();
  await expect(page.locator('.status-cancelled')).toBeVisible();

  const areas = await (await page.request.get('http://localhost:5000/api/cafe-areas')).json();
  const garden = areas.find((area: { name: string }) => area.name === 'Garden Patio');
  await page.goto('/spaces/' + garden._id);
  await page.getByText('Reserve this space for later', { exact: true }).click();
  await page.getByLabel('Start time').fill(futureInput(24));
  await page.getByLabel('Duration', { exact: true }).selectOption('60');
  await page.getByRole('button', { name: 'Check availability' }).click();
  await expect(page.getByText('Ready to reserve', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Change time' }).click();
  await page.getByLabel('Duration', { exact: true }).selectOption('120');
  await expect(page.getByRole('button', { name: 'Confirm reservation', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Check availability' }).click();
  await page.getByRole('button', { name: 'Confirm reservation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A seat for later.' })).toBeVisible();
  // Checking another space at the same time catches this profile's overlap before confirmation.
  await page.goto('/spaces/' + areas.find((area: { _id: string }) => area._id !== garden._id)._id);
  await page.getByText('Reserve this space for later', { exact: true }).click();
  await page.getByLabel('Start time').fill(futureInput(24));
  await page.getByRole('button', { name: 'Check availability' }).click();
  await expect(page.getByRole('alert')).toContainText('You already have a reservation during this time');
  await expect(page.getByRole('button', { name: 'Confirm reservation' })).toHaveCount(0);
  await page.goto('/reservations');
  await page.getByRole('button', { name: 'Cancel reservation' }).click();
  await page.getByText('Past & cancelled reservations (1)', { exact: true }).click();
  await expect(page.locator('.status-cancelled')).toBeVisible();
  await page.goto('/analytics');
  await expect(page.locator('.metrics dd').first()).toHaveText('1');
  await expect(page.locator('.metrics dd').nth(2)).toHaveText('1');
  await page.screenshot({ path: `${screenshotDir}/progress-desktop.png`, fullPage: true });

  // A separate unlinked task verifies the delete flow and confirmation.
  await page.goto('/tasks/new');
  await page.getByLabel('Task title').fill('Draft task to delete');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const row = page.locator('.task-row').filter({ has: page.getByRole('heading', { name: 'Draft task to delete' }) });
  await row.getByText('Manage task', { exact: true }).click();
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'Draft task to delete' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('375px pages, navigation and error recovery', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/welcome');
  await page.getByRole('button', { name: new RegExp(profileName) }).click();
  await page.getByRole('button', { name: /Explore/ }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Drink & snack menu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What would you like?' })).toBeVisible();
  await page.getByRole('button', { name: /Explore/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  for (const path of ['/', '/cafe', '/spaces', '/tasks', '/tasks/new', '/focus', focusPath, '/history', '/analytics', '/menu', '/order-summary', '/orders', orderPath, '/reservations']) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.loading')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Cafe Latte', exact: true })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/menu-mobile.png`, fullPage: true });
  await page.route('**/api/menu-items', route => route.abort());
  await page.goto('/menu');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.unroute('**/api/menu-items');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Cafe Latte', exact: true })).toBeVisible();
  await page.goto('/spaces/000000000000000000000000');
  await expect(page.getByRole('alert')).toHaveText('Cafe area not found');
});
