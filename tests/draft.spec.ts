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
const CafeArea = serverRequire('./src/models/CafeArea');
const fixtureUsers: string[] = [];
const fixtureAreas: string[] = [];
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
  fixtureUsers.push(userId);
});
test.afterAll(async () => {
  for (const id of fixtureUsers) {
    await FocusSession.deleteMany({ user: id });
    await Reservation.deleteMany({ user: id });
    await Order.deleteMany({ user: id });
    await Task.deleteMany({ user: id });
    await User.findByIdAndDelete(id);
  }
  for (const id of fixtureAreas) await CafeArea.findByIdAndDelete(id);
  await mongoose.disconnect();
});

test('real frontend → API → Atlas flow', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'cafe tempo', exact: true })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/landing-desktop.png`, fullPage: true });
  await page.getByRole('link', { name: 'Enter Cafe Tempo', exact: true }).click();
  await expect(page.getByText('Selecting a profile is not a password login.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(profileName) }).click();
  await expect(page.getByRole('heading', { name: 'What would you like to drink?' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose Cafe Latte' }).click();
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await page.getByText('Grande', { exact: true }).click();
  await expect(page.getByRole('radio', { name: /Grande/ })).toBeChecked();
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await page.getByLabel('Name or label').fill('Focus learner');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByText('Enter a task title.')).toBeVisible();
  await page.getByLabel('Task to accomplish').fill('Draft focus task');
  await page.getByText('Task details', { exact: true }).click();
  await page.getByLabel('Deadline').fill(futureInput(48));
  await page.getByLabel('Description', { exact: true }).fill('Verify the complete cafe flow.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: `${screenshotDir}/notepad-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start session', exact: true })).toBeVisible();
  focusPath = new URL(page.url()).pathname;
  await expect(page.getByLabel('Time remaining')).toHaveText('45:00');
  await page.reload();
  await expect(page.getByLabel('Time remaining')).toHaveText('45:00');
  await page.getByRole('button', { name: 'Next cafe space' }).click();
  await expect(page.locator('.space-badge')).toHaveText('garden patio');
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/focus-active-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Pause timer' }).click();
  await expect(page.getByRole('button', { name: 'Resume timer' })).toBeVisible();
  const frozen = await page.getByLabel('Time remaining').textContent();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Resume timer' })).toBeVisible();
  await expect(page.getByLabel('Time remaining')).toHaveText(frozen!);
  await page.getByRole('button', { name: 'Resume timer' }).click();
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play music' })).toBeDisabled();
  await expect(page.getByText('Background music hasn’t been added yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Next cafe space' }).click();
  await expect(page.locator('.space-badge')).toHaveText('garden patio');
  await page.getByRole('button', { name: 'Next cafe space' }).click();
  await expect(page.locator('.space-badge')).toHaveText('library table');
  await expect(page.getByText('You’re browsing.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Reserve this seat' }).click();
  await expect(page.locator('.seat-status')).toContainText('your seat is reserved');
  const running = await (await page.request.get('http://localhost:5000/api/focus-sessions?user=' + userId)).json();
  expect(running.filter((session: { status: string }) => session.status === 'active')).toHaveLength(1);
  expect(running[0].drinkSize).toBe('grande');
  expect(running[0].plannedMinutes).toBe(45);
  expect(running[0].sessionLabel).toBe('Focus learner');
  // Advance only this fixture's start time; no minute-long test wait is needed.
  await FocusSession.findByIdAndUpdate(focusPath.split('/').pop(), { startedAt: new Date(Date.now() - 65000) });
  await page.reload();
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Stop session' }).click();
  await expect(page.getByText('1 minute saved', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Update task status' }).click();
  await page.getByLabel('Description', { exact: true }).fill('Edited task from the working UI.');
  await page.getByLabel('Status', { exact: true }).selectOption('completed');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Edited task from the working UI.')).toBeVisible();
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
  const drinks = await (await page.request.get('http://localhost:5000/api/menu-items')).json();
  await page.evaluate(({ userId, drink }) => sessionStorage.setItem('tempo-study-' + userId, JSON.stringify({ drink, size: 'tall', label: 'Mobile learner', taskId: '' })), { userId, drink: drinks.find((item: { category: string }) => item.category === 'drink')._id });
  for (const path of ['/', '/welcome', '/cafe', '/spaces', '/tasks', '/tasks/new', '/focus', '/study/drink', '/study/size', '/study/label', '/study/task', focusPath, '/history', '/analytics', '/menu', '/order-summary', '/orders', orderPath, '/reservations']) {
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



test('capacity prevents concurrent bookings, starts and full-area resumes', async ({ request }) => {
  test.setTimeout(120000);
  const area = await CafeArea.create({ name: 'ZZ Capacity ' + Date.now(), theme: 'Isolated capacity test', capacity: 1, suggestedFocusMinutes: 25 });
  fixtureAreas.push(String(area._id));
  const users = [];
  const tasks = [];
  for (let index = 0; index < 2; index++) {
    const profile = await User.create({ displayName: 'Capacity ' + index, email: 'capacity-' + index + '-' + Date.now() + '@cafetempo.test' });
    fixtureUsers.push(String(profile._id)); users.push(String(profile._id));
    const task = await Task.create({ user: profile._id, title: 'Capacity test task', deadline: new Date(Date.now() + 86400000), difficulty: 'medium', estimatedMinutes: 25 });
    tasks.push(String(task._id));
  }
  const start = new Date(Date.now() + 3000).toISOString();
  const end = new Date(Date.now() + 30 * 60000).toISOString();
  const booked = await Promise.all(users.map(user => request.post('http://localhost:5000/api/reservations', { data: { user, area: String(area._id), startsAt: start, endsAt: end } })));
  expect(booked.map(response => response.status()).sort()).toEqual([201, 400]);
  const winner = await booked.find(response => response.status() === 201)!.json();
  const menu = await (await request.get('http://localhost:5000/api/menu-items')).json();
  const drink = menu.find((item: { category: string }) => item.category === 'drink')._id;
  const sessionIds = [];
  for (let index = 0; index < 2; index++) {
    const response = await request.post('http://localhost:5000/api/focus-sessions', { data: { user: users[index], task: tasks[index], area: String(area._id), energyLevel: 'medium', status: 'planned', drink, drinkSize: 'tall', sessionLabel: 'Capacity learner' } });
    expect(response.status()).toBe(201); sessionIds.push((await response.json())._id);
  }
  const occupied = await request.patch('http://localhost:5000/api/focus-sessions/' + sessionIds[users.indexOf(winner.user) === 0 ? 1 : 0], { data: { action: 'start' } });
  expect(occupied.status()).toBe(400);
  expect((await occupied.json()).message).toContain('No seats remain');
  await request.patch('http://localhost:5000/api/reservations/' + winner._id, { data: { status: 'cancelled' } });
  const started = await Promise.all(sessionIds.map(id => request.patch('http://localhost:5000/api/focus-sessions/' + id, { data: { action: 'start' } })));
  expect(started.map(response => response.status()).sort()).toEqual([200, 400]);
  const first = started.findIndex(response => response.status() === 200);
  const second = first === 0 ? 1 : 0;
  const action = (index: number, value: string) => request.patch('http://localhost:5000/api/focus-sessions/' + sessionIds[index], { data: { action: value } });
  const pause = await action(first, 'pause'); expect(pause.status()).toBe(200);
  const paused = await pause.json();
  await new Promise(resolve => setTimeout(resolve, 1200));
  const saved = await (await request.get('http://localhost:5000/api/focus-sessions/' + sessionIds[first])).json();
  expect(saved.status).toBe('paused'); expect(saved.elapsedSeconds).toBe(paused.elapsedSeconds);
  expect((await action(second, 'start')).status()).toBe(200);
  const full = await action(first, 'resume');
  expect(full.status()).toBe(400); expect((await full.json()).message).toContain('No seats remain');
  const availability = await (await request.get('http://localhost:5000/api/cafe-areas/' + area._id + '/availability', { params: { startsAt: new Date().toISOString(), endsAt: end } })).json();
  expect(availability.remainingSeats).toBe(0);
  expect((await action(second, 'stop')).status()).toBe(200);
  const resumed = await action(first, 'resume'); expect(resumed.status()).toBe(200);
  expect((await resumed.json()).pausedMilliseconds).toBeGreaterThanOrEqual(1200);
  expect((await action(first, 'stop')).status()).toBe(200);
  expect((await action(first, 'stop')).status()).toBe(400);
});
