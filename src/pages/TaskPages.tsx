import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useCafe } from '../state/CafeContext';
import { errorMessage } from '../api/http';
import { dateTime, localInput } from '../utils/dates';
import { taskSchema, type TaskFormValues } from '../schemas/forms';
import { EmptyState, Feedback, Field, LoadState, PageHeading, Status } from '../components/ui';
import type { Task } from '../types';
import { pendingRequest, clearPendingRequest } from '../utils/pendingRequests';

export function TaskListPage() {
  const { user, notify } = useCafe();
  const state = useApi(async () => {
    const [tasks, priorities] = await Promise.all([cafeApi.tasks(user!._id), cafeApi.priorities(user!._id)]);
    return tasks.map(task => ({ ...task, priorityScore: priorities.find(item => item._id === task._id)?.priorityScore }));
  }, [user!._id]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const tasks = (state.data || []).filter(task => filter === 'all' || task.status === filter)
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  const pageCount = Math.max(1, Math.ceil(tasks.length / 5));
  const currentPage = Math.min(page, pageCount);
  const firstItem = (currentPage - 1) * 5;
  const visibleTasks = tasks.slice(firstItem, firstItem + 5);
  useEffect(() => { if (!state.loading && page > pageCount) setPage(pageCount); }, [state.loading, page, pageCount]);

  async function remove(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setBusy(task._id); setError('');
    try { await cafeApi.deleteTask(task._id); notify('Task deleted.'); state.reload(); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(''); }
  }

  return <section className="page task-board"><PageHeading eyebrow="Your task board" title="What’s on your mind?" description="Choose one thing to work on. The most urgent tasks appear first." action={<Link className="button" to="/tasks/new">Add Task</Link>} />
    <Feedback error={error} /><LoadState {...state} retry={state.reload}>
      <div className="task-filters"><div className="task-filter-field"><label htmlFor="task-status">Task Status</label><div className="task-filter-control"><select id="task-status" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="all">All Tasks</option><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select><span className="task-filter-chevron" aria-hidden="true" /></div></div><p role="status">{tasks.length ? `${firstItem + 1}–${Math.min(firstItem + 5, tasks.length)} of ${tasks.length}` : '0'} {tasks.length === 1 ? 'task' : 'tasks'}</p></div>
      {tasks.length === 0 ? <EmptyState title={filter === 'all' ? 'A clear board.' : 'No tasks match this filter.'}>{filter === 'all' ? 'Use Add Task above to plan your next thing.' : <button className="text-link" onClick={() => { setFilter('all'); setPage(1); }}>Clear Filter</button>}</EmptyState> : <div className="record-list">{visibleTasks.map(task => <article className="task-row" key={task._id}><div className="task-score">{task.status === 'completed' ? '✓' : task.priorityScore ?? 0}<small>{task.status === 'completed' ? 'done' : 'priority'}</small></div><div className="record-main"><h2>{task.title}</h2><p>{task.description}</p><div className="metadata"><span>{dateTime(task.deadline)}</span><span>{task.estimatedMinutes} min · {task.difficulty} difficulty</span><Status value={task.status} /></div></div><div className="row-actions">{task.status !== 'completed' && <Link className="text-link" to={`/study/drink?task=${task._id}`}>Focus →</Link>}<details className="task-management"><summary>Manage Task</summary><Link className="text-link" to={`/tasks/${task._id}/edit`}>Edit</Link><button className="text-link danger" disabled={busy === task._id} onClick={() => remove(task)}>Delete</button></details></div></article>)}</div>}
      {tasks.length > 5 && <nav className="task-pagination" aria-label="Task pages"><button className="button secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button className="button secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
    </LoadState>
  </section>;
}

export function TaskFormPage() {
  const { id } = useParams(); const [params] = useSearchParams();
  const { user, notify } = useCafe();
  const navigate = useNavigate();
  const state = useApi<Task | null>(() => id ? cafeApi.task(id) : Promise.resolve(null), [id]);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', deadline: localInput(new Date(Date.now() + 86400000)), difficulty: 'medium', estimatedMinutes: 45, status: 'todo' },
  });
  useEffect(() => {
    if (state.data) reset({ ...state.data, deadline: localInput(state.data.deadline) });
  }, [state.data, reset]);

  async function submit(values: TaskFormValues) {
    setError('');
    try {
      const body = { ...values, user: user!._id, deadline: new Date(values.deadline).toISOString() };
      const task = id ? await cafeApi.updateTask(id, body) : await cafeApi.createTask({ ...body, requestKey: pendingRequest(user!._id + '-task-form') });
      if (!id) clearPendingRequest(user!._id + '-task-form');
      notify(id ? 'Task updated.' : 'Task added to the task board.');
      navigate(params.get('next') === 'focus' ? `/study/drink?task=${task._id}` : '/tasks');
    } catch (reason) { setError(errorMessage(reason)); }
  }

  return <section className="page narrow"><PageHeading eyebrow="Your task board" title={id ? 'A little change of plan.' : 'Make room for one task.'} description="A clear task makes it easier to begin." /><LoadState {...state} retry={state.reload}>
    {state.data && state.data.user !== user!._id ? <EmptyState title="This task belongs to another profile." to="/tasks" label="Back to your tasks" /> : <form className="paper-form" onSubmit={handleSubmit(submit)} noValidate>
      <Field label="Task title" error={errors.title?.message}><input {...register('title')} maxLength={120} autoFocus /></Field>
      <Field label="Description" error={errors.description?.message}><textarea {...register('description')} rows={3} /></Field>
      <Field label="Deadline" error={errors.deadline?.message} hint="Shown in your device’s local time."><input type="datetime-local" {...register('deadline')} /></Field>
      <div className="form-grid"><Field label="Difficulty" error={errors.difficulty?.message}><select {...register('difficulty')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
      <Field label="Estimated minutes" error={errors.estimatedMinutes?.message}><input type="number" min={15} max={480} {...register('estimatedMinutes', { valueAsNumber: true })} /></Field></div>
      {id && <Field label="Status" error={errors.status?.message}><select {...register('status')}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></Field>}
      <Feedback error={error} /><div className="form-actions"><button className="button" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : id ? 'Save Changes' : 'Add Task'}</button><Link className="text-link" to="/tasks">Cancel</Link></div>
    </form>}
  </LoadState></section>;
}
