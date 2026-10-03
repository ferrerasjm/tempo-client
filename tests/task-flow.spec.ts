import { test, expect } from '@playwright/test';

test('expired confirmation can reopen and continue the same task without creating another', async ({ page }) => {
  const task = { _id: 'task', user: 'profile', title: 'Finish report', status: 'todo' };
  let session = { _id: 'session', user: 'profile', task: 'task', area: 'room', status: 'active', energyLevel: 'medium', plannedMinutes: 25, completedMinutes: 0, taskConfirmed: false, breakMinutes: 5, drink: 'drink', drinkSize: 'tall', drinkName: 'Cafe Latte', startedAt: new Date(Date.now() - 26 * 60000).toISOString() };
  let createdTasks = 0;
  let nextTask = '';
  await page.addInitScript(() => localStorage.setItem('tempo-profile', 'profile'));
  await page.route('http://localhost:5000/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (method === 'POST' && path === '/api/tasks') createdTasks++;
    if (method === 'PATCH' && path === '/api/focus-sessions/session') { session = { ...session, status: 'completed', completedMinutes: 25 }; if (route.request().postDataJSON().action === 'confirm_task') session.taskConfirmed = true; }
    if (method === 'POST' && path === '/api/focus-sessions') {
      nextTask = route.request().postDataJSON().task;
      session = { ...session, _id: 'next', status: 'active', startedAt: new Date().toISOString() };
    }
    const data = path === '/api/users' ? [{ _id: 'profile', displayName: 'JM', email: 'jm@example.test' }]
      : path === '/api/tasks/task' ? task
      : path === '/api/cafe-areas' ? [{ _id: 'room', name: 'Quiet Corner', active: true, capacity: 8 }]
      : path === '/api/menu-items' ? [{ _id: 'drink', name: 'Cafe Latte', category: 'drink', available: true }]
      : session;
    await route.fulfill({ json: data });
  });
  await page.goto('/focus/session');
  const confirmation = page.getByRole('dialog', { name: 'Was this the task you completed?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: /Close/ }).click();
  await page.getByRole('button', { name: 'Confirm Completed Task' }).click();
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Task isn’t finished yet' }).click();
  const next = page.getByRole('dialog', { name: 'Good job! Next cuppa?' });
  await expect(next.getByRole('radio', { name: 'Continue This Task' })).toBeChecked();
  await expect(next.getByRole('textbox')).toHaveValue('Finish report');
  await next.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page).toHaveURL(/\/focus\/next$/);
  expect(createdTasks).toBe(0);
  expect(nextTask).toBe('task');
});

test('empty existing-task list cannot accidentally create a task', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tempo-profile', 'profile');
    sessionStorage.setItem('tempo-study-profile', JSON.stringify({ drink: 'drink', size: 'tall', label: 'JM', taskId: 'stale' }));
  });
  await page.route('http://localhost:5000/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/tasks/stale') return route.fulfill({ status: 404, json: { message: 'Task not found' } });
    return route.fulfill({ json: path === '/api/users' ? [{ _id: 'profile', displayName: 'JM' }] : [] });
  });
  await page.goto('/study/task');
  await expect(page.getByRole('radio', { name: 'New task', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Existing task', exact: true }).check();
  await expect(page.getByText('No unfinished tasks are available. Choose New Task to begin.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'New task', exact: true }).check();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeEnabled();
});

test('session preparation failure explains the saved task and retries without duplicates', async ({ page }) => {
  let creates = 0;
  let attempts = 0;
  let saved: object | null = null;
  await page.addInitScript(() => {
    localStorage.setItem('tempo-profile', 'profile');
    sessionStorage.setItem('tempo-study-profile', JSON.stringify({ drink: 'drink', size: 'tall', label: 'JM', taskId: '' }));
  });
  await page.route('http://localhost:5000/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === '/api/tasks' && method === 'POST') {
      creates++;
      saved = { ...route.request().postDataJSON(), _id: 'saved' };
      return route.fulfill({ json: saved });
    }
    if (path === '/api/tasks/saved') return route.fulfill({ json: saved });
    if (path === '/api/focus-sessions' && method === 'POST') {
      attempts++;
      return route.fulfill({ status: 400, json: { message: 'This space is full.' } });
    }
    return route.fulfill({ json: path === '/api/users' ? [{ _id: 'profile', displayName: 'JM' }]
      : path === '/api/cafe-areas' ? [{ _id: 'room', name: 'Quiet Corner', active: true }] : [] });
  });
  await page.goto('/study/task');
  await page.getByRole('textbox', { name: 'Task to accomplish' }).fill('Draft report');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Your task is saved on the Task Board');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect.poll(() => attempts).toBe(2);
  expect(creates).toBe(1);
});

test('failed confirmation recovers after refresh and a saved next task is reused', async ({ page }) => {
  let task = { _id: 'task', user: 'profile', title: 'Report', status: 'todo' };
  let session = { _id: 'session', user: 'profile', task: 'task', area: 'room', status: 'active', energyLevel: 'medium', taskConfirmed: false, taskCompleted: false, plannedMinutes: 25, completedMinutes: 0, breakMinutes: 5, drink: 'drink', drinkSize: 'tall', startedAt: new Date(Date.now() - 26 * 60000).toISOString() };
  let failedConfirm = false;
  let sessionAttempts = 0;
  let taskCreates = 0;
  await page.addInitScript(() => localStorage.setItem('tempo-profile', 'profile'));
  await page.route('http://localhost:5000/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (method === 'PATCH' && path.includes('focus-sessions')) {
      const body = route.request().postDataJSON();
      if (body.action === 'stop') session = { ...session, status: 'completed', completedMinutes: 25 };
      if (body.action === 'confirm_task') {
        if (!failedConfirm) { failedConfirm = true; return route.fulfill({ status: 500, json: { message: 'Temporary task confirmation failure' } }); }
        task = { ...task, status: 'completed' }; session = { ...session, taskConfirmed: true, taskCompleted: true };
      }
    }
    if (method === 'POST' && path === '/api/tasks') { taskCreates++; return route.fulfill({ json: { ...route.request().postDataJSON(), _id: 'saved-next' } }); }
    if (method === 'POST' && path === '/api/focus-sessions') {
      sessionAttempts++;
      if (sessionAttempts === 1) return route.fulfill({ status: 400, json: { message: 'Space temporarily full' } });
      session = { ...session, _id: 'next', task: 'saved-next', status: 'active', taskConfirmed: false, completedMinutes: 0, startedAt: new Date().toISOString() };
    }
    const data = path === '/api/users' ? [{ _id: 'profile', displayName: 'JM' }]
      : path === '/api/cafe-areas' ? [{ _id: 'room', name: 'Quiet Corner', active: true, capacity: 8 }]
      : path === '/api/menu-items' ? [{ _id: 'drink', name: 'Cafe Latte', category: 'drink', available: true }]
      : path === '/api/tasks/task' ? task
      : path === '/api/tasks/saved-next' ? { ...task, _id: 'saved-next', status: 'todo', title: 'Next report' }
      : session;
    return route.fulfill({ json: data });
  });
  await page.goto('/focus/session');
  const confirm = page.getByRole('dialog', { name: 'Was this the task you completed?' });
  await confirm.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(confirm.getByRole('alert')).toBeVisible();
  await confirm.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirm Completed Task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose Next Cuppa' })).toHaveCount(0);
  await page.reload();
  await confirm.getByRole('button', { name: 'Submit', exact: true }).click();
  const next = page.getByRole('dialog', { name: 'Good job! Next cuppa?' });
  await next.getByRole('textbox').fill('Next report');
  await next.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(next.getByRole('alert')).toBeVisible();
  await page.reload();
  await expect(next.getByRole('textbox')).toHaveValue('Next report');
  await next.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page).toHaveURL(/\/focus\/next$/);
  expect(taskCreates).toBe(1);
});


test('early stopped sessions retain confirmation after dismissal and refresh', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tempo-profile', 'profile'));
  await page.route('http://localhost:5000/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const data = path === '/api/users' ? [{ _id: 'profile', displayName: 'JM' }]
      : path === '/api/tasks/task' ? { _id: 'task', user: 'profile', title: 'Report', status: 'todo' }
      : path === '/api/cafe-areas' ? [{ _id: 'room', name: 'Quiet Corner', active: true, capacity: 8 }]
      : { _id: 'session', user: 'profile', task: 'task', area: 'room', status: 'completed', plannedMinutes: 25, completedMinutes: 2, taskConfirmed: false, breakMinutes: 5 };
    return route.fulfill({ json: data });
  });
  await page.goto('/focus/session');
  const confirmation = page.getByRole('dialog', { name: 'Was this the task you completed?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirm Completed Task' })).toBeVisible();
  await page.reload();
  await expect(confirmation).toBeVisible();
});
