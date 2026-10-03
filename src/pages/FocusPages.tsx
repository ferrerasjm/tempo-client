import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { useCafe } from '../state/CafeContext';
import { errorMessage } from '../api/http';
import { dateTime, timerText } from '../utils/dates';
import { artwork } from '../assets';
import { completionSchema, focusSchema, type CompletionValues, type FocusValues } from '../schemas/forms';
import { EmptyState, Feedback, Field, LoadState, PageHeading, Status } from '../components/ui';
import type { Recommendation } from '../types';

export function StartFocusPage() {
  const { user, notify } = useCafe(); const navigate = useNavigate(); const [params] = useSearchParams();
  const state = useApi(async () => {
    const [tasks, areas, sessions] = await Promise.all([cafeApi.tasks(user!._id), cafeApi.areas(), cafeApi.sessions(user!._id)]);
    return { tasks: tasks.filter(task => task.status !== 'completed'), areas: areas.filter(area => area.active), active: sessions.find(session => session.status === 'active') };
  }, [user!._id]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState(''); const [starting, setStarting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FocusValues>({ resolver: zodResolver(focusSchema), defaultValues: { task: params.get('task') || '', area: params.get('area') || '', energyLevel: 'medium' } });
  const task = watch('task'); const area = watch('area'); const energyLevel = watch('energyLevel');
  useEffect(() => { setRecommendation(null); setError(''); }, [task, area, energyLevel]);
  async function recommend(values: FocusValues) {
    setError(''); setRecommendation(null);
    try { setRecommendation(await cafeApi.recommendation(values.task, values.energyLevel)); }
    catch (reason) { setError(errorMessage(reason)); }
  }
  async function start() {
    if (!recommendation) return;
    setStarting(true); setError('');
    try {
      const session = await cafeApi.startSession({ user: user!._id, task, area, energyLevel });
      notify('Your focus session has started.'); navigate(`/focus/${session._id}`);
    } catch (reason) { setError(errorMessage(reason)); state.reload(); }
    finally { setStarting(false); }
  }
  return <section className="page narrow"><PageHeading eyebrow="A quiet stretch of time" title="What will you focus on?" description="Choose your task, your corner, and how much energy you have today." action={<Link className="text-link" to="/history">Focus history →</Link>} /><LoadState {...state} retry={state.reload}>
    {state.data?.active ? <div className="empty"><h2>You have a session in progress.</h2><p>Finish or cancel it before starting another.</p><Link className="button" to={`/focus/${state.data.active._id}`}>Return to session</Link></div> : !state.data?.tasks.length ? <EmptyState title="Start with one task." to="/tasks/new" label="Add a task">Your study board needs an unfinished task.</EmptyState> : <form className="paper-form" onSubmit={handleSubmit(recommend)} noValidate>
      <Field label="Task" error={errors.task?.message}><select {...register('task')} disabled={isSubmitting || starting}><option value="">Choose a task</option>{state.data.tasks.map(task => <option key={task._id} value={task._id}>{task.title}</option>)}</select></Field>
      <Field label="Cafe area" error={errors.area?.message}><select {...register('area')} disabled={isSubmitting || starting}><option value="">Choose your corner</option>{state.data.areas.map(area => <option key={area._id} value={area._id}>{area.name}</option>)}</select></Field>
      <Field label="Current energy" error={errors.energyLevel?.message}><select {...register('energyLevel')} disabled={isSubmitting || starting}><option value="low">Low — a gentle start</option><option value="medium">Medium — ready to settle in</option><option value="high">High — let’s get into it</option></select></Field>
      <Feedback error={error} /><button className="button secondary" disabled={isSubmitting || starting}>{isSubmitting ? 'Finding your rhythm…' : 'Suggest a session'}</button>
      {recommendation && <div className="recommendation" role="status"><p className="eyebrow">Your suggested rhythm</p><div className="rhythm"><strong>{recommendation.plannedMinutes}<small>minutes of focus</small></strong><span>then</span><strong>{recommendation.breakMinutes}<small>minutes of rest</small></strong></div><button type="button" className="button" disabled={starting} onClick={start}>{starting ? 'Starting…' : 'Start focusing →'}</button></div>}
    </form>}
  </LoadState></section>;
}

export function ActiveFocusPage() {
  const { id = '' } = useParams(); const { user, notify } = useCafe(); const navigate = useNavigate();
  const state = useApi(async () => {
    const session = await cafeApi.session(id);
    const [task, area] = await Promise.all([cafeApi.task(session.task), cafeApi.area(session.area)]);
    return { session, task, area };
  }, [id]);
  const timer = useFocusTimer(state.data?.session || null);
  const [error, setError] = useState(''); const [cancelling, setCancelling] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CompletionValues>({ resolver: zodResolver(completionSchema), defaultValues: { completedMinutes: 0 } });
  useEffect(() => {
    if (state.data?.session.status === 'active') setValue('completedMinutes', Math.min(120, Math.max(0, Math.floor((Date.now() - new Date(state.data.session.startedAt!).getTime()) / 60000))));
  }, [state.data, setValue]);
  async function complete(values: CompletionValues) {
    setError('');
    try { await cafeApi.finishSession(id, { status: 'completed', ...values }); notify('Focus session saved. Time for a break.'); state.reload(); }
    catch (reason) { setError(errorMessage(reason)); }
  }
  async function cancel() {
    if (!window.confirm('Cancel this focus session? It will not count toward your focus statistics.')) return;
    setCancelling(true); setError('');
    try { await cafeApi.finishSession(id, { status: 'cancelled' }); notify('Focus session cancelled.'); navigate('/focus'); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setCancelling(false); }
  }
  return <section className="page focus-page"><LoadState {...state} retry={state.reload}>{state.data && (state.data.session.user !== user!._id ? <EmptyState title="This session belongs to another profile." to="/focus" label="Start your session" /> : <>
    <p className="eyebrow">{state.data.area.name} · {state.data.session.status === 'completed' ? 'A well-earned pause' : 'One thing at a time'}</p><h1>{state.data.task.title}</h1><img className="focus-cup" src={artwork.cup} alt="A warm cup beside your study task." />
    {state.data.session.status === 'active' ? <><p className="timer" aria-label="Time remaining">{timerText(timer.remainingSeconds)}</p><p>{timer.remainingSeconds ? 'Let everything else wait a little.' : 'Your session time is up. Save the minutes you worked.'}</p><p className="note">{state.data.session.plannedMinutes} minute focus · {state.data.session.breakMinutes} minute break · {timer.elapsedMinutes} minutes elapsed</p>
      <form className="completion-form" onSubmit={handleSubmit(complete)} noValidate><Field label="Minutes you actually focused" error={errors.completedMinutes?.message}><input type="number" min={1} max={120} {...register('completedMinutes', { valueAsNumber: true })} /></Field><button type="button" className="text-link" onClick={() => setValue('completedMinutes', timer.elapsedMinutes, { shouldValidate: true })}>Use elapsed minutes</button><Feedback error={error} /><div className="form-actions"><button className="button" disabled={isSubmitting || cancelling}>{isSubmitting ? 'Saving…' : 'Finish session'}</button><button className="text-link danger" type="button" disabled={cancelling || isSubmitting} onClick={cancel}>Cancel session</button></div></form>
    </> : state.data.session.status === 'completed' ? <><p className="timer">{timerText(timer.breakRemainingSeconds)}</p><p>{timer.breakRemainingSeconds ? 'Your break is underway. Stretch, breathe, sip.' : 'Your break is finished. Ready when you are.'}</p><p className="note">{state.data.session.completedMinutes} minutes saved · Focus score {state.data.session.focusScore}%</p><div className="center-actions"><Link className="button" to="/focus">Choose the next task</Link><Link className="text-link" to={`/tasks/${state.data.task._id}/edit`}>Update task status</Link><Link className="text-link" to="/history">View focus history</Link></div></> : <EmptyState title="This session has ended." to="/focus" label="Start a new session" />}
  </>)}</LoadState></section>;
}

export function FocusHistoryPage() {
  const { user } = useCafe();
  const state = useApi(async () => {
    const [sessions, tasks, areas] = await Promise.all([cafeApi.sessions(user!._id), cafeApi.tasks(user!._id), cafeApi.areas()]);
    return { sessions, tasks, areas };
  }, [user!._id]);
  return <section className="page"><PageHeading eyebrow="Your time, well spent" title="A little history of focus." action={<Link className="button" to="/focus">Start a session →</Link>} /><LoadState {...state} retry={state.reload}>
    {!state.data?.sessions.length ? <EmptyState title="Your first session is waiting." to="/focus" label="Start focusing" /> : <div className="record-list">{state.data.sessions.map(session => <article className="record-row" key={session._id}><div><h2>{state.data!.tasks.find(task => task._id === session.task)?.title || 'Study task'}</h2><p>{state.data!.areas.find(area => area._id === session.area)?.name} · {dateTime(session.startedAt)}</p><div className="metadata"><Status value={session.status} /><span>{session.completedMinutes} / {session.plannedMinutes} min</span>{session.focusScore !== null && <span>Focus score {session.focusScore}%</span>}</div></div><Link className="text-link" to={`/focus/${session._id}`}>{session.status === 'active' ? 'Resume →' : 'View →'}</Link></article>)}</div>}
  </LoadState></section>;
}

export function AnalyticsPage() {
  const { user } = useCafe(); const state = useApi(() => cafeApi.statistics(user!._id), [user!._id]);
  return <section className="page"><PageHeading eyebrow="Your study notebook" title="Small sessions add up." description="A summary of the focus time and tasks you’ve completed." action={<Link className="text-link" to="/history">View session history →</Link>} /><LoadState {...state} retry={state.reload}>{state.data && <>
    {state.data.completedSessions === 0 && <p className="note">Your notebook is ready. Complete a focus session to start filling it.</p>}
    <dl className="metrics"><div><dt>Focus minutes</dt><dd>{state.data.totalFocusMinutes}</dd></div><div><dt>Sessions completed</dt><dd>{state.data.completedSessions}</dd></div><div><dt>Tasks completed</dt><dd>{state.data.completedTasks}</dd></div><div><dt>Average session</dt><dd>{state.data.averageSessionMinutes}<small> min</small></dd></div></dl>
    <div className="notebook"><h2>Your cafe habits</h2><dl className="summary-list"><div><dt>Current study streak</dt><dd>{state.data.currentStreak} {state.data.currentStreak === 1 ? 'day' : 'days'}</dd></div><div><dt>Longest study streak</dt><dd>{state.data.longestStreak} days</dd></div><div><dt>Most productive day</dt><dd>{state.data.mostProductiveDay ? `${state.data.mostProductiveDay.date} · ${state.data.mostProductiveDay.totalMinutes} min` : 'No completed sessions yet'}</dd></div><div><dt>Favorite corner</dt><dd>{state.data.favoriteCafeArea?.name || 'Still finding your corner'}</dd></div><div><dt>Most ordered drink</dt><dd>{state.data.mostOrderedDrink?.name || 'No drinks ordered yet'}</dd></div></dl><p className="note">Study days and streaks follow Philippine time.</p></div>
  </>}</LoadState></section>;
}
