import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCafe } from '../state/CafeContext';
import { drinkSizes, useStudyDraft } from '../state/StudyDraftContext';
import { useStudyEntry } from '../hooks/useStudyEntry';
import { useApi } from '../hooks/useApi';
import { cafeApi } from '../services/cafeApi';
import { localInput } from '../utils/dates';
import { studyLabelSchema, studyTaskSchema, type StudyLabelValues, type StudyTaskValues } from '../schemas/forms';
import { EmptyState, Feedback, Field, LoadState } from '../components/ui';
import { clearPendingRequest } from '../utils/pendingRequests';
import { MenuArtwork } from '../components/MenuArtwork';

function EntryPaper({ title, step, children }: { title: string; step: number; children: ReactNode }) {
  return <section className="page narrow centered entry-page"><div className="entry-paper">
    <h1>{title}</h1><div className="entry-content">{children}</div><p className="step-caption">Step {step} of 4</p>
  </div></section>;
}

export function StudyDrinkPage() {
  const { user } = useCafe(); const { draft, update } = useStudyDraft(); const [params] = useSearchParams();
  const state = useApi(async () => {
    const [items, sessions] = await Promise.all([cafeApi.menu(), cafeApi.sessions(user!._id)]);
    return { drinks: items.filter(item => item.category === 'drink'), unfinished: sessions.find(item => ['planned','active','paused'].includes(item.status)) };
  }, [user!._id]);
  useEffect(() => {
    const requestedTask = params.get('task');
    const requestedArea = params.get('area');
    if (requestedArea && requestedArea !== draft.areaId) update({ areaId: requestedArea });
    if (requestedTask && state.data?.unfinished === undefined && requestedTask !== draft.taskId) update({ taskId: requestedTask });
  }, [params, state.data?.unfinished, draft.taskId, update]);
  const chosen = state.data?.drinks.find(item => item._id === draft.drink && item.available);
  if (state.data?.unfinished) return <Navigate to={'/focus/' + state.data.unfinished._id} replace />;
  return <EntryPaper title="What would you like to drink?" step={1}><LoadState {...state} retry={state.reload}>
    {!state.data?.drinks.length ? <EmptyState title="The drinks aren’t ready yet." /> : <>
      <div className="study-drinks">{state.data.drinks.map(item => <button key={item._id} className={draft.drink === item._id ? 'drink-choice chosen' : 'drink-choice'} disabled={!item.available} aria-pressed={draft.drink === item._id} aria-label={'Choose ' + item.name} onClick={() => update({ drink: item._id })}><MenuArtwork name={item.name} /><span>{item.name}</span>{!item.available && <small>Unavailable</small>}</button>)}</div>
      {chosen ? <Link className="button" to="/study/size">Next</Link> : <button className="button" disabled>Choose A Drink First</button>}
      <p className="note">Your focus companion. Virtual orders are available separately at the counter.</p>
    </>}
  </LoadState></EntryPaper>;
}

function useSelectedDrink() {
  const { draft } = useStudyDraft();
  const state = useApi(async () => (await cafeApi.menu()).find(item => item._id === draft.drink && item.category === 'drink' && item.available) || null, [draft.drink]);
  return { draft, state };
}

export function StudySizePage() {
  const { draft, state } = useSelectedDrink(); const { update } = useStudyDraft();
  if (!draft.drink) return <Navigate to="/study/drink" replace />;
  return <EntryPaper title="Find your rhythm." step={2}><LoadState {...state} retry={state.reload}>
    {state.data ? <><div className="entry-drink"><MenuArtwork name={state.data.name} /></div>
      <fieldset className="size-choices"><legend className="sr-only">Drink size and timer duration</legend>{drinkSizes.map(size => <label className={draft.size === size.value ? 'selected' : ''} key={size.value}><input type="radio" name="drinkSize" value={size.value} checked={draft.size === size.value} onChange={() => update({ size: size.value })} /><span>{size.label}</span><span className="dotted-line" /><span>{size.minutes} minutes</span></label>)}</fieldset>
      <Link className="button" to="/study/label">Next</Link><Link className="text-link entry-back" to="/study/drink">← Back</Link></> : <EmptyState title="Choose another drink." to="/study/drink" label="Back To Drinks" />}
  </LoadState></EntryPaper>;
}

export function StudyLabelPage() {
  const { user } = useCafe(); const { draft, state } = useSelectedDrink(); const { update } = useStudyDraft(); const navigate = useNavigate();
  const form = useForm<StudyLabelValues>({ resolver: zodResolver(studyLabelSchema), defaultValues: { label: draft.label || user!.displayName } });
  if (!draft.drink) return <Navigate to="/study/drink" replace />;
  return <EntryPaper title="A drink for…" step={3}><LoadState {...state} retry={state.reload}>
    {state.data ? <form onSubmit={form.handleSubmit(values => { update(values); navigate('/study/task'); })} noValidate>
      <div className="drink-ticket"><MenuArtwork name={state.data.name} /><Field label="Name or label" error={form.formState.errors.label?.message}><input maxLength={80} {...form.register('label')} autoComplete="off" /></Field><p>1 × {draft.size} {state.data.name}</p></div>
      <button className="button">Next</button><Link className="text-link entry-back" to="/study/size">← Back</Link>
    </form> : <EmptyState title="Choose another drink." to="/study/drink" label="Back To Drinks" />}
  </LoadState></EntryPaper>;
}

export function StudyTaskPage() {
  const entry = useStudyEntry();
  const { user } = useCafe();
  const state = useApi(() => entry.draft.taskId ? cafeApi.task(entry.draft.taskId) : Promise.resolve(null), [entry.draft.taskId]);
  const tasks = useApi(() => cafeApi.tasks(user!._id), [user!._id]);
  const [taskChoice, setTaskChoice] = useState(entry.draft.taskId ? 'existing' : 'new');
  const form = useForm<StudyTaskValues>({ resolver: zodResolver(studyTaskSchema), defaultValues: {
    title: '', description: '', deadline: localInput(new Date(Date.now() + 86400000)), difficulty: 'medium',
    estimatedMinutes: entry.minutes, status: 'todo', energyLevel: 'medium',
  } });
  useEffect(() => {
    if (tasks.data && entry.draft.taskId && !tasks.data.some(item => item._id === entry.draft.taskId && item.status !== 'completed')) {
      entry.update({ taskId: '' }); setTaskChoice('new');
      form.reset({ title: '', description: '', deadline: localInput(new Date(Date.now() + 86400000)), difficulty: 'medium', estimatedMinutes: entry.minutes, status: 'todo', energyLevel: form.getValues('energyLevel') });
    }
  }, [tasks.data]);
  useEffect(() => {
    const firstTask = tasks.data?.find(item => item.status !== 'completed');
    if (taskChoice === 'existing' && !entry.draft.taskId && firstTask) entry.update({ taskId: firstTask._id });
  }, [taskChoice, entry.draft.taskId, tasks.data, entry.update]);
  useEffect(() => { if (state.data && state.data.user === user!._id && state.data.status !== 'completed') form.reset({ ...state.data, deadline: localInput(state.data.deadline), energyLevel: form.getValues('energyLevel') }); }, [state.data, form]);
  if (!entry.draft.drink) return <Navigate to="/study/drink" replace />;
  if (!entry.draft.label.trim()) return <Navigate to="/study/label" replace />;
  const { register, formState: { errors, isSubmitting } } = form;
  return <EntryPaper title="One thing at a time." step={4}><LoadState {...state} retry={state.reload}>
    <form onSubmit={form.handleSubmit(entry.prepare)} noValidate>
      <LoadState {...tasks} retry={tasks.reload}><fieldset className="entry-task-choice"><legend className="eyebrow">What are you working on?</legend><label><input type="radio" value="new" checked={taskChoice === 'new'} onChange={() => { clearPendingRequest(user!._id + '-prepare-task'); clearPendingRequest(user!._id + '-prepare-session'); setTaskChoice('new'); entry.update({ taskId: '' }); form.reset({ title: '', description: '', deadline: localInput(new Date(Date.now() + 86400000)), difficulty: 'medium', estimatedMinutes: entry.minutes, status: 'todo', energyLevel: form.getValues('energyLevel') }); }} /> New task</label><label><input type="radio" value="existing" checked={taskChoice === 'existing'} onChange={() => setTaskChoice('existing')} /> Existing task</label>{taskChoice === 'existing' && <select aria-label="Existing task" value={entry.draft.taskId} onChange={event => entry.update({ taskId: event.target.value })} disabled={tasks.loading}><option value="">Choose A Task</option>{tasks.data?.filter(item => item.status !== 'completed').map(item => <option key={item._id} value={item._id}>{item.title}</option>)}</select>}</fieldset>{taskChoice === 'existing' && !tasks.data?.some(item => item.status !== 'completed') && <p className="note">No unfinished tasks are available. Choose New Task to begin.</p>}</LoadState>
      <div className="task-notepad"><p className="eyebrow">I will…</p><Field label="Task to accomplish" error={errors.title?.message}><textarea rows={3} maxLength={120} {...register('title')} autoFocus /></Field></div>
      <details className="entry-task-details"><summary>Task Details</summary>
        <Field label="Deadline" error={errors.deadline?.message} hint="Your device’s local time."><input type="datetime-local" {...register('deadline')} /></Field>
        <div className="form-grid"><Field label="Difficulty" error={errors.difficulty?.message}><select {...register('difficulty')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field><Field label="Estimated minutes" error={errors.estimatedMinutes?.message}><input type="number" min={15} max={480} {...register('estimatedMinutes', { valueAsNumber: true })} /></Field></div>
        <Field label="Current energy"><select {...register('energyLevel')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
        <Field label="Description" error={errors.description?.message}><textarea rows={2} {...register('description')} /></Field>
      </details>
      {Object.keys(errors).some(key => key !== 'title') && <p className="form-error" role="alert">Open Task Details to fix the highlighted fields.</p>}
      <p className="note">{entry.minutes} minutes of focus · You’ll choose your seat next.</p><Feedback error={entry.error} />
      <button className="button" disabled={isSubmitting || tasks.loading || Boolean(tasks.error) || (taskChoice === 'existing' && !tasks.data?.some(item => item._id === entry.draft.taskId && item.user === user!._id && item.status !== 'completed'))}>{isSubmitting ? 'Preparing…' : 'Start'}</button><Link className="text-link entry-back" to="/study/label">← Back</Link>
    </form>
  </LoadState></EntryPaper>;
}
