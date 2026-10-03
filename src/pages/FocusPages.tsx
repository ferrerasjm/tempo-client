import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useStudySetup } from '../hooks/useStudySetup';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { useCafe } from '../state/CafeContext';
import { errorMessage } from '../api/http';
import { dateTime, timerText } from '../utils/dates';
import { artwork } from '../assets';
import { completionSchema, type CompletionValues } from '../schemas/forms';
import { EmptyState, Feedback, Field, LoadState, PageHeading, Status } from '../components/ui';
import { SpaceBrowser } from '../components/SpaceBrowser';
import { SpaceIllustration } from '../components/SpaceIllustration';
import { Modal } from '../components/Modal';

export function StartFocusPage() {
  const setup = useStudySetup();
  const { state, form, step, busy, recommendation } = setup;
  const { register, watch, setValue, formState: { errors } } = form;
  const area = watch('area'); const task = watch('task');
  const titles = ['What’s your one thing?', 'Choose a quiet corner.', 'How are you feeling?', 'Your little plan.'];
  return <section className="page narrow centered study-setup"><LoadState {...state} retry={state.reload}>
    {state.data?.active ? <EmptyState title="You have a session in progress." to={`/focus/${state.data.active._id}`} label="Return to session">Finish or cancel it before starting another.</EmptyState> : !state.data?.tasks.length ? <><PageHeading eyebrow="A small beginning" title={titles[0]} /><EmptyState title="Start with one task." to="/tasks/new?next=focus" label="Add a task">Write down what you’d like to work on.</EmptyState></> : <>
      <p className="step-caption">Step {step + 1} of 4 · {['Your task','Your space','Your pace','Ready to begin'][step]}</p>
      <PageHeading eyebrow="A quiet stretch of time" title={titles[step]} />
      <div className="setup-paper" key={step}>
        {step === 0 && <><div className="intention-note"><p className="eyebrow">Today, I will…</p><Field label="Task" error={errors.task?.message}><select {...register('task')} disabled={busy}>{state.data.tasks.map(item => <option key={item._id} value={item._id}>{item.title}</option>)}</select></Field></div><Link className="text-link" to="/tasks/new?next=focus">Add a different task</Link></>}
        {step === 1 && <><SpaceBrowser areas={state.data.areas} value={area} onChange={id => setValue('area', id, { shouldValidate: true })} /><Field label="Cafe area" error={errors.area?.message}><select {...register('area')} disabled={busy}>{state.data.areas.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field><p className="note">No reservation needed to begin.</p></>}
        {step === 2 && <fieldset className="energy-choices"><legend className="sr-only">Current energy</legend>{[['low','A gentle start','Low energy'],['medium','Ready to settle in','Medium energy'],['high','Let’s get into it','High energy']].map(([value,label,hint]) => <label key={value}><input type="radio" value={value} {...register('energyLevel')} /><span>{label}<small>{hint}</small></span></label>)}</fieldset>}
        {step === 3 && recommendation && <div className="recommendation" role="status"><img className="review-cup" src={artwork.cup} alt="" /><p className="eyebrow">Your suggested rhythm</p><h2>{state.data.tasks.find(item => item._id === task)?.title}</h2><p>{state.data.areas.find(item => item._id === area)?.name}</p><div className="rhythm"><strong>{recommendation.plannedMinutes}<small>minutes of focus</small></strong><span>then</span><strong>{recommendation.breakMinutes}<small>minutes of rest</small></strong></div></div>}
        <Feedback error={setup.error} />
        <div className="wizard-actions"><button className="button" disabled={busy || (step === 1 && !state.data.areas.length)} onClick={step === 3 ? setup.start : setup.next}>{busy ? 'One moment…' : step === 3 ? 'Start focusing →' : step === 2 ? 'Suggest a session' : 'Next →'}</button>{step > 0 && <button className="text-link" disabled={busy} onClick={setup.back}>← Back</button>}</div>
      </div>
    </>}
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
  const [error, setError] = useState(''); const [cancelling, setCancelling] = useState(false); const [finishing, setFinishing] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CompletionValues>({ resolver: zodResolver(completionSchema), defaultValues: { completedMinutes: 0 } });
  useEffect(() => { if (finishing) { setValue('completedMinutes', Math.min(120, timer.elapsedMinutes)); setError(''); } }, [finishing, setValue]);
  async function complete(values: CompletionValues) {
    setError('');
    try { await cafeApi.finishSession(id, { status: 'completed', ...values }); setFinishing(false); notify('Focus session saved. Time for a break.'); state.reload(); }
    catch (reason) { setError(errorMessage(reason)); }
  }
  async function cancel() {
    if (!window.confirm('Cancel this focus session? It will not count toward your focus statistics.')) return;
    setCancelling(true); setError('');
    try { await cafeApi.finishSession(id, { status: 'cancelled' }); notify('Focus session cancelled.'); navigate('/focus'); }
    catch (reason) { setError(errorMessage(reason)); } finally { setCancelling(false); }
  }
  const active = state.data?.session.status === 'active'; const completed = state.data?.session.status === 'completed';
  return <section className="page focus-page"><LoadState {...state} retry={state.reload}>{state.data && (state.data.session.user !== user!._id ? <EmptyState title="This session belongs to another profile." to="/focus" label="Start your session" /> : <>
    <p className="space-badge">{state.data.area.name} · {completed ? 'break time' : 'focus time'}</p>
    <h1>{state.data.task.title}</h1>
    {active || completed ? <>
      <p className="timer" aria-label={active ? 'Time remaining' : 'Break remaining'}>{timerText(active ? timer.remainingSeconds : timer.breakRemainingSeconds)}</p>
      <p className="focus-hint">{active ? timer.remainingSeconds ? 'One thing at a time. You’re right where you need to be.' : 'Time’s up. Save your session when you’re ready.' : timer.breakRemainingSeconds ? 'Stretch, breathe, sip. You’ve earned a pause.' : 'Ready when you are.'}</p>
      <div className="focus-table"><SpaceIllustration name={state.data.area.name} /><div className="tabletop"><img className="focus-cup" src={artwork.cup} alt="An original illustration of a warm cup on your table." />
      {active ? <><button className="button" onClick={() => setFinishing(true)}>Finish session</button><details className="quiet-options"><summary>Session details</summary><p className="note">{state.data.session.plannedMinutes} minute focus · {state.data.session.breakMinutes} minute break · {timer.elapsedMinutes} minutes elapsed</p><button className="text-link danger" disabled={cancelling} onClick={cancel}>Cancel session</button><Feedback error={error} /></details></> : <><p className="note">{state.data.session.completedMinutes} {state.data.session.completedMinutes === 1 ? 'minute' : 'minutes'} saved · Focus score {state.data.session.focusScore}%</p><Link className="button" to="/focus">Choose the next task</Link><div className="center-actions"><Link className="text-link" to={`/tasks/${state.data.task._id}/edit`}>Update task status</Link><Link className="text-link" to="/history">View focus history</Link></div></>}
      </div></div>
    </> : <EmptyState title="This session has ended." to="/focus" label="Start a new session" />}
    <Modal open={finishing} title="A little progress, saved." onClose={() => setFinishing(false)} busy={isSubmitting}><form onSubmit={handleSubmit(complete)} noValidate><p className="note">Save the minutes you actually worked. At least one minute is needed to complete a session.</p><Field label="Minutes you actually focused" error={errors.completedMinutes?.message}><input type="number" min={1} max={120} {...register('completedMinutes', { valueAsNumber: true })} /></Field><button type="button" className="text-link" onClick={() => setValue('completedMinutes', Math.min(120, timer.elapsedMinutes), { shouldValidate: true })}>Use elapsed minutes</button><Feedback error={error} /><button className="button w-full" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save session'}</button></form></Modal>
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
