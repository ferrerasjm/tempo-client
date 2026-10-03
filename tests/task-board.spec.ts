import { test, expect, type Page } from '@playwright/test';

// Mocked records keep these UI checks independent of MongoDB.
async function openBoard(page: Page, count: number) {
  let tasks = Array.from({ length: count }, (_, index) => ({
    _id: `task-${index}`, user: 'profile', title: `Task ${index + 1}`,
    description: '', deadline: '2026-10-04T10:00:00Z', difficulty: 'medium',
    estimatedMinutes: 25, status: index < 6 ? 'todo' : 'completed', priorityScore: count - index,
  }));
  await page.addInitScript(() => localStorage.setItem('tempo-profile', 'profile'));
  await page.route('http://localhost:5000/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'DELETE') {
      tasks = tasks.filter(task => !path.endsWith('/' + task._id));
      return route.fulfill({ status: 204 });
    }
    const data = path === '/api/users' ? [{ _id: 'profile', displayName: 'JM', email: 'jm@example.test' }]
      : path === '/api/tasks/priorities' ? { tasks } : tasks;
    await route.fulfill({ json: data });
  });
  await page.goto('/tasks');
  await expect(page.getByLabel('Task Status')).toBeVisible();
}

test('empty board has one add action and no pagination', async ({ page }) => {
  await openBoard(page, 0);
  await expect(page.getByRole('link', { name: 'Add Task', exact: true })).toHaveCount(1);
  await expect(page.getByText('A clear board.')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Task pages' })).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/study/i);
  await page.getByLabel('Task Status').selectOption('completed');
  await expect(page.getByText('No tasks match this filter.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear Filter' }).click();
  await expect(page.getByLabel('Task Status')).toHaveValue('all');
  await page.screenshot({ path: 'docs/screenshots/task-board-empty.png', fullPage: true });
});

test('five tasks need no pagination', async ({ page }) => {
  await openBoard(page, 5);
  await expect(page.locator('.task-row')).toHaveCount(5);
  await expect(page.getByRole('navigation', { name: 'Task pages' })).toHaveCount(0);
});

test('pagination follows filters and stays valid after deleting its last item', async ({ page }) => {
  await openBoard(page, 8);
  await expect(page.locator('.task-row')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByLabel('Task Status').selectOption('completed');
  await expect(page.locator('.task-row')).toHaveCount(2);
  await expect(page.getByRole('navigation', { name: 'Task pages' })).toHaveCount(0);
  await page.getByLabel('Task Status').selectOption('todo');
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(1);
  page.on('dialog', dialog => dialog.accept());
  await page.getByText('Manage Task', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(5);
  await expect(page.getByRole('navigation', { name: 'Task pages' })).toHaveCount(0);
  await page.getByLabel('Task Status').selectOption('all');
  for (const width of [1366, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `docs/screenshots/task-board-${width}.png`, fullPage: true });
  }
});
