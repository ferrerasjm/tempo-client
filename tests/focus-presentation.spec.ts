import { test, expect, type Page } from '@playwright/test';

// Presentation checks use API fixtures and never write to the database.
async function openSession(page: Page, drinkName = 'Matcha Tea', expired = false) {
  const session = { _id: 'session', user: 'student', task: 'task', area: 'library', status: 'active', plannedMinutes: 25, breakMinutes: 5, completedMinutes: 0, startedAt: new Date(Date.now() - (expired ? 25 * 60000 + 1000 : 0)).toISOString(), endedAt: null, pausedAt: null, pausedMilliseconds: 0, drinkName, sessionLabel: 'JM' };
  await page.addInitScript(() => localStorage.setItem('tempo-profile', 'student'));
  await page.route('http://localhost:5000/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'PATCH') {
      session.status = route.request().postDataJSON().action === 'pause' ? 'paused' : 'active';
    }
    const data = path === '/api/users' ? [{ _id: 'student', displayName: 'JM', email: 'student@example.test' }]
      : path === '/api/tasks/task' ? { _id: 'task', title: 'Finish this project', user: 'student' }
      : path === '/api/cafe-areas' ? [{ _id: 'library', name: 'Library Table', active: true, capacity: 8 }]
      : path === '/api/focus-sessions' ? [session]
      : path === '/api/menu-items' ? [{ _id: 'drink', name: 'Matcha Tea', category: 'drink', available: true, priceCredits: 30 }]
      : session;
    return route.fulfill({ json: data });
  });
  await page.goto('/focus/session');
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible();
}

test('cup, timer and controls fit the supplied table on desktop and mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSession(page);
  for (const size of [{ width: 375, height: 812 }, { width: 434, height: 918 }, { width: 1366, height: 900 }, { width: 1915, height: 945 }]) {
    await page.setViewportSize(size);
    await expect(page.getByRole('slider')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'JM will Finish this project' })).toBeVisible();
    await page.getByRole('button', { name: 'Next cafe space' }).click();
    await expect(page.getByText('JM will Finish this project')).toHaveCount(0);
    await expect(page.getByRole('slider', { name: 'Music volume' })).toBeVisible();
    await expect(page.locator('.tabletop button')).toHaveCount(3);
    const visitors = page.locator('.cafe-visitor');
    await expect(visitors).toHaveCount(4);
    if (size.width > 800) {
      const positions = await visitors.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().y));
      expect(positions[0]).toBeGreaterThan(positions[1]);
      expect(positions[2]).toBeGreaterThan(positions[3]);
    }
    const colors = await page.locator('.visitor-character').evaluateAll(images => images.map(image => image.getAttribute('src')));
    expect(colors).toEqual(['/assets/cafe/1-yellow.svg', '/assets/cafe/2-green.svg', '/assets/cafe/3-blue.svg', '/assets/cafe/4-red.svg']);
    const bounds = await page.locator('.session-room').boundingBox();
    const cup = await page.locator('.session-drink').boundingBox();
    const timer = await page.getByLabel('Time remaining').boundingBox();
    const controls = await page.locator('.session-controls').boundingBox();
    const volume = await page.locator('.room-volume').boundingBox();
    expect(bounds && cup && timer && controls && volume).toBeTruthy();
    for (const visitor of await visitors.all()) {
      await expect(visitor).toBeVisible();
      const furniture = await visitor.locator('.visitor-furniture').boundingBox();
      expect(furniture).toBeTruthy();
      const overlapsCup = furniture!.x < cup!.x + cup!.width && furniture!.x + furniture!.width > cup!.x
        && furniture!.y < cup!.y + cup!.height && furniture!.y + furniture!.height > cup!.y;
      expect(overlapsCup).toBe(false);
    }
    await visitors.first().focus();
    await expect(visitors.first().locator('.character-tooltip')).toHaveText('working on a little idea');
    await expect(visitors.first().locator('.character-tooltip')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(visitors.first().locator('.character-tooltip')).toBeHidden();
    await visitors.first().evaluate(visitor => (visitor as HTMLElement).blur());
    await page.mouse.move(0, 0);
    // Both supplied backgrounds have the same table edge at the center.
    const scale = Math.max(bounds!.width / 1200, bounds!.height / 853);
    const tableEdge = bounds!.y + (bounds!.height - 853 * scale) / 2 + 545 * scale;
    expect(cup!.y).toBeLessThan(tableEdge);
    expect(cup!.y + cup!.height).toBeGreaterThan(tableEdge + 60);
    expect(timer!.y).toBeGreaterThanOrEqual(cup!.y + cup!.height);
    expect(controls!.y).toBeGreaterThanOrEqual(timer!.y + timer!.height);
    expect(volume!.y).toBeGreaterThanOrEqual(controls!.y + controls!.height);
    expect(volume!.y + volume!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height);
    const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('*')].filter(element => element.getBoundingClientRect().right > innerWidth).map(element => element.className).slice(0, 12) }));
    expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);
    if (size.width === 375 || size.width === 1366) {
      await page.screenshot({ path: `docs/screenshots/table-space-${size.width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Previous cafe space' }).click();
    await expect(page.getByRole('slider')).toHaveCount(0);
    if (size.width === 375 || size.width === 1366) {
      await page.screenshot({ path: `docs/screenshots/table-focus-${size.width}.png`, fullPage: true });
    }
  }
});

test('Explore is centered, simplified and returns to the running timer', async ({ page }) => {
  await openSession(page);
  for (const size of [{ width: 1366, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(size);
    const button = page.getByRole('button', { name: 'Explore the Cafe', exact: true });
    const sign = await button.boundingBox();
    const image = await button.locator('img').boundingBox();
    expect(Math.abs(image!.x + image!.width / 2 - sign!.x - sign!.width / 2)).toBeLessThan(2);
    await expect(button.locator('img')).toHaveAttribute('src', '/assets/cafe/bathroom-sign.svg');
    const home = page.getByRole('link', { name: 'Cafe Tempo home' });
    await expect(home.locator('img')).toHaveAttribute('src', '/assets/cafe/coffee-sign.svg');
    for (const control of [home, button]) {
      const tooltip = control.locator('.sign-tooltip');
      await control.hover();
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      await control.focus();
      await page.keyboard.press('Escape');
      await expect(tooltip).toBeHidden();
      await control.evaluate(element => (element as HTMLElement).blur());
      await page.mouse.move(size.width / 2, size.height / 2);
      await control.focus();
      await expect(tooltip).toBeVisible();
    }
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Explore the Cafe', exact: true });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(Math.abs(bounds!.x + bounds!.width / 2 - size.width / 2)).toBeLessThan(2);
    expect(Math.abs(bounds!.y + bounds!.height / 2 - size.height / 2)).toBeLessThan(2);
    await expect(dialog.getByRole('link', { name: 'Return To Focus' })).toHaveAttribute('href', '/focus/session');
    await expect(dialog.getByRole('link', { name: 'Smart focus recommendation' })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'Your reservations' })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'Cafe Lobby' })).toHaveCount(0);
    await page.screenshot({ path: `docs/screenshots/explore-${size.width}.png`, fullPage: true });
    await dialog.getByRole('link', { name: 'Return To Focus' }).click();
    await expect(dialog).toBeHidden();
  }
  await page.goto('/study/drink');
  await expect(page).toHaveURL(/\/focus\/session$/);
  await expect(page.getByText('Your session is waiting.')).toHaveCount(0);
  await page.route('http://localhost:5000/api/focus-sessions?*', route => route.fulfill({ json: [] }));
  await page.getByRole('button', { name: 'Explore the Cafe', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Choose A Drink', exact: true })).toBeVisible();
});

test('zero timer opens a centered confirmation without completing the task automatically', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openSession(page, 'Matcha Tea', true);
  const dialog = page.getByRole('dialog', { name: 'Was this the task you completed?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.finished-task')).toHaveText('Finish this project');
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThan(0); expect(bounds!.y).toBeGreaterThan(0);
  expect(Math.abs(bounds!.x + bounds!.width / 2 - 375 / 2)).toBeLessThan(2);
  expect(Math.abs(bounds!.y + bounds!.height / 2 - 812 / 2)).toBeLessThan(2);
  await page.screenshot({ path: 'docs/screenshots/session-confirm-layout-mobile.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Stop session' })).toBeVisible();
});

test('music follows room, pause and focus transitions', async ({ page }) => {
  // Supply a track only inside this test; no placeholder audio is added to the app.
  await page.route('**/src/assets.ts*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/music:\s*(["'])\1/, 'music: "/test-track.mp3"');
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    class TestAudio extends EventTarget {
      paused = true; volume = .35; loop = false; preload = '';
      constructor(_source?: string) { super(); Object.assign(window, { testAudio: this }); }
      play() { this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
      pause() { this.paused = true; }
      removeAttribute() {}
    }
    Object.assign(window, { Audio: TestAudio });
  });
  await openSession(page);
  const audio = () => page.evaluate(() => (window as unknown as { testAudio: { paused: boolean; volume: number } }).testAudio);
  await expect.poll(async () => (await audio()).paused).toBe(true);
  await page.getByRole('button', { name: 'Next cafe space' }).click();
  const slider = page.getByRole('slider', { name: 'Music volume' });
  await expect(slider).toBeEnabled();
  await expect.poll(async () => (await audio()).paused).toBe(false);
  await slider.fill('0.7');
  await expect.poll(async () => (await audio()).volume).toBe(.7);
  await page.getByRole('button', { name: 'Pause timer' }).click();
  await expect(page.getByRole('button', { name: 'Resume timer' })).toBeVisible();
  await expect.poll(async () => (await audio()).paused).toBe(true);
  await page.getByRole('button', { name: 'Resume timer' }).click();
  await expect.poll(async () => (await audio()).paused).toBe(false);
  await page.getByRole('button', { name: 'Previous cafe space' }).click();
  await expect(slider).toHaveCount(0);
  await expect.poll(async () => (await audio()).paused).toBe(true);
  await page.getByRole('button', { name: 'Next cafe space' }).click();
  await expect.poll(async () => (await audio()).paused).toBe(false);
  await expect(slider).toHaveValue('0.7');
});
