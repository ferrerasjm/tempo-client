import { RewardTray } from '../components/RewardTray';
import { Link, useParams } from 'react-router-dom';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useStudySetup } from '../hooks/useStudySetup';
import { useFocusRoom } from '../hooks/useFocusRoom';
import { useFocusMusic } from '../hooks/useFocusMusic';
import { useCafe } from '../state/CafeContext';
import { dateTime, timerText } from '../utils/dates';
import { artwork } from '../assets';
import { EmptyState, Feedback, Field, LoadState, PageHeading, Status } from '../components/ui';
import { SpaceBrowser } from '../components/SpaceBrowser';
import { SpaceIllustration } from '../components/SpaceIllustration';
import { MenuArtwork } from '../components/MenuArtwork';

export function StartFocusPage() {
  const setup = useStudySetup();
  const { state, form, step, busy, recommendation } = setup;
  const { register, watch, setValue, formState: { errors } } = form;
  const area = watch('area'); const task = watch('task');
  const titles = ['What’s your one thing?', 'Choose a quiet corner.', 'How are you feeling?', 'Your little plan.'];
  return <section className="page narrow centered study-setup"><LoadState {...state} retry={state.reload}>
    {state.data?.active ? <div className="study-paper"><PageHeading eyebrow="One thing at a time" title="Your session is waiting." /><EmptyState title="You have a session in progress." to={`/focus/${state.data.active._id}`} label="Return to session">Finish or cancel it before starting another.</EmptyState></div> : !state.data?.tasks.length ? <div className="study-paper"><PageHeading eyebrow="A small beginning" title={titles[0]} /><EmptyState title="Start with one task." to="/tasks/new?next=focus" label="Add a task">Write down what you’d like to work on.</EmptyState></div> : <>
      <div className="study-paper">
      <p className="step-caption">Step {step + 1} of 4 · {['Your task','Your space','Your pace','Ready to begin'][step]}</p>
      <PageHeading eyebrow="A quiet stretch of time" title={titles[step]} />
      <div className="setup-paper" key={step}>
        {step === 0 && <><div className="intention-note"><p className="eyebrow">Today, I will…</p><Field label="Task" error={errors.task?.message}><select {...register('task')} disabled={busy}>{state.data.tasks.map(item => <option key={item._id} value={item._id}>{item.title}</option>)}</select></Field></div><Link className="text-link" to="/tasks/new?next=focus">Add a different task</Link></>}
        {step === 1 && <><SpaceBrowser areas={state.data.areas} value={area} onChange={id => setValue('area', id, { shouldValidate: true })} /><Field label="Cafe area" error={errors.area?.message}><select {...register('area')} disabled={busy}>{state.data.areas.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field><p className="note">No reservation needed to begin.</p></>}
        {step === 2 && <fieldset className="energy-choices"><legend className="sr-only">Current energy</legend>{[['low','A gentle start','Low energy'],['medium','Ready to settle in','Medium energy'],['high','Let’s get into it','High energy']].map(([value,label,hint]) => <label key={value}><input type="radio" value={value} {...register('energyLevel')} /><span>{label}<small>{hint}</small></span></label>)}</fieldset>}
        {step === 3 && recommendation && <div className="recommendation" role="status"><img className="review-cup" src={artwork.cup} alt="" /><p className="eyebrow">Your suggested rhythm</p><h2>{state.data.tasks.find(item => item._id === task)?.title}</h2><p>{state.data.areas.find(item => item._id === area)?.name}</p><div className="rhythm"><strong>{recommendation.plannedMinutes}<small>minutes of focus</small></strong><span>then</span><strong>{recommendation.breakMinutes}<small>minutes of rest</small></strong></div></div>}
        <Feedback error={setup.error} />
        <div className="wizard-actions"><button className="button" disabled={busy || (step === 1 && !state.data.areas.length)} onClick={step === 3 ? setup.start : setup.next}>{busy ? 'One moment…' : step === 3 ? 'Start focusing →' : step === 2 ? 'Suggest a session' : 'Next →'}</button>{step > 0 && <button className="text-link" disabled={busy} onClick={setup.back}>← Back</button>}</div>
      </div></div>
    </>}
  </LoadState></section>;
}

export function ActiveFocusPage() {
  const { id = '' } = useParams(); const { user } = useCafe();
  const room = useFocusRoom(id);
  const { session, area, timer } = room;
  const running = session?.status === 'active';
  const paused = session?.status === 'paused';
  const planned = session?.status === 'planned';
  const completed = session?.status === 'completed';
  const music = useFocusMusic(Boolean(running && timer.remainingSeconds > 0));
  const corner = room.viewIndex >= 0;
  return <section className={`page focus-page session-room ${corner ? 'scene-corner' : 'scene-focus'}`}><LoadState {...room.state} retry={room.state.reload}>
    {session && room.state.data && area && (session.user !== user!._id ? <EmptyState title="This session belongs to another profile." to="/study/drink" label="Prepare your session" /> : <>
      <p className="space-badge">{corner ? area.name.toLowerCase() : completed ? 'break' : paused ? 'paused' : 'focus'}</p>
      {!corner && <h1>{session.sessionLabel ? session.sessionLabel + ' will ' : ''}{room.state.data.task.title}</h1>}
      {planned || running || paused || completed ? <>
        {!corner && <p className="timer" aria-label={completed ? 'Break remaining' : 'Time remaining'}>{timerText(completed ? timer.breakRemainingSeconds : timer.remainingSeconds)}</p>}
        <p className="focus-hint">{planned ? 'Choose your corner, then start when you’re ready.' : paused ? 'Your reward break is in progress.' : completed ? 'A little progress. A well-earned pause.' : timer.remainingSeconds ? 'One thing at a time.' : 'Time’s up. Stop to save your session.'}</p>
        <div className="focus-table"><SpaceIllustration name={area.name} /><div className="tabletop">
          <div className="session-drink"><MenuArtwork name={session.drinkName || 'Cafe Latte'} /></div>
          {corner && <><h1>{session.sessionLabel ? session.sessionLabel + ' will ' : ''}{room.state.data.task.title}</h1><p className="timer" aria-label={completed ? 'Break remaining' : 'Time remaining'}>{timerText(completed ? timer.breakRemainingSeconds : timer.remainingSeconds)}</p></>}
          {session.drinkName && <p className="drink-caption">{session.drinkSize} {session.drinkName}</p>}
          {planned || running || paused ? <>
            <div className="seat-status" role="status">{room.seats.loading ? 'Checking seats…' : room.seats.error ? <><span>Seats could not be checked.</span><button className="text-link" onClick={room.seats.reload}>Retry seats</button></> : room.seats.data && <>{area.name} · {room.seats.data.remainingSeats} / {room.seats.data.capacity} seats available {room.holdsSeat && <span>· your seat is reserved</span>}</>}</div>
            {running && !room.holdsSeat && <p className="browsing-note">You’re browsing. Your reserved seat is in {room.state.data.areas.find(item => item._id === session.area)?.name}.</p>}
            <div className="session-controls">
              {planned && <button className="button" disabled={room.busy || !room.canTakeSeat} onClick={() => room.action('start')}>{room.busy ? 'Starting…' : room.canTakeSeat ? 'Start session' : 'No seat available'}</button>}
              {paused && <button className="button" disabled={room.busy || !room.canTakeSeat} onClick={() => room.action('resume')}>{room.canTakeSeat ? 'Resume timer' : 'No seat available'}</button>}
              {running && !room.holdsSeat && timer.remainingSeconds > 0 && <button className="button" disabled={room.busy || !room.canTakeSeat} onClick={() => room.action('move')}>{room.canTakeSeat ? 'Reserve this seat' : 'Area full'}</button>}
              {(running || paused) && <button className="button" disabled={room.busy} onClick={() => room.action('stop')}>Stop session</button>}
              {planned && <button className="text-link" disabled={room.busy} onClick={() => room.action('stop')}>Cancel setup</button>}
            </div>
            {paused && <p className="reward-break" role="status">{timer.rewardBreakRemainingSeconds > 0 ? 'Break remaining: ' + timerText(timer.rewardBreakRemainingSeconds) : 'Break finished. Resuming needs an available seat.'}</p>}
            {!paused && <RewardTray rewards={room.rewards.data} loading={room.rewards.loading} error={room.rewards.error} retry={room.rewards.reload} enabled={running && timer.remainingSeconds > 0} busy={room.busy} useItem={item => room.action('pause', item)} />}
            <div className="music-controls"><button className="text-link" disabled={!music.available || !running || timer.remainingSeconds === 0} onClick={music.toggle}>{music.playing ? 'Pause music' : 'Play music'}</button><label>Volume<input type="range" min={0} max={1} step={.05} value={music.volume} disabled={!music.available} onChange={event => music.setVolume(Number(event.target.value))} /></label></div>
            {!music.available && <p className="music-note">Background music hasn’t been added yet.</p>}
            {music.error && <p className="music-note" role="status">{music.error}</p>}
            <details className="quiet-options"><summary>Session details</summary><p className="note">{session.plannedMinutes} minute focus · {session.breakMinutes} minute break · {timer.elapsedMinutes} minutes focused</p><p className="note">A purchased reward unlocks one short break and releases your seat. Resuming checks availability again. Stopping early saves your time but earns no mission credits.</p><button className="text-link" onClick={room.seats.reload}>Refresh seats</button></details>
          </> : <><p className="note">{session.tempoCreditsEarned ? session.tempoCreditsEarned + ' Tempo Credits earned / ' : ''}{session.completedMinutes} {session.completedMinutes === 1 ? 'minute' : 'minutes'} saved · Focus score {session.focusScore}%</p><Link className="button" to="/study/drink">Prepare another session</Link><div className="center-actions"><Link className="text-link" to={`/tasks/${room.state.data.task._id}/edit`}>Update task status</Link><Link className="text-link" to="/analytics">Productivity Analytics</Link><Link className="text-link" to="/menu">Reward shop</Link></div></>}
          <Feedback error={room.error} />
        </div></div>
        <nav className="scene-navigation" aria-label="Cafe spaces"><button className="icon-button" aria-label="Previous cafe space" disabled={room.viewIndex === -1 || room.busy} onClick={() => room.browse(room.viewIndex - 1)}>←</button><button className="icon-button" aria-label="Next cafe space" disabled={room.viewIndex === room.state.data.areas.length - 1 || room.busy} onClick={() => room.browse(room.viewIndex + 1)}>→</button></nav>
      </> : <EmptyState title="This session has ended." to="/study/drink" label="Prepare a new session" />}
    </>)}
  </LoadState></section>;
}

export function FocusHistoryPage() {
  const { user } = useCafe();
  const state = useApi(async () => {
    const [sessions, tasks, areas] = await Promise.all([cafeApi.sessions(user!._id), cafeApi.tasks(user!._id), cafeApi.areas()]);
    return { sessions, tasks, areas };
  }, [user!._id]);
  return <section className="page"><PageHeading eyebrow="Your time, well spent" title="A little history of focus." action={<Link className="button" to="/focus">Start a session →</Link>} /><LoadState {...state} retry={state.reload}>
    {!state.data?.sessions.length ? <EmptyState title="Your first session is waiting." to="/focus" label="Start focusing" /> : <div className="record-list">{state.data.sessions.map(session => <article className="record-row" key={session._id}><div><h2>{state.data!.tasks.find(task => task._id === session.task)?.title || 'Study task'}</h2><p>{state.data!.areas.find(area => area._id === session.area)?.name} · {dateTime(session.startedAt)}</p><div className="metadata"><Status value={session.status} /><span>{session.completedMinutes} / {session.plannedMinutes} min</span>{session.focusScore !== null && <span>Focus score {session.focusScore}%</span>}</div></div><Link className="text-link" to={`/focus/${session._id}`}>{['planned', 'active', 'paused'].includes(session.status) ? 'Resume →' : 'View →'}</Link></article>)}</div>}
  </LoadState></section>;
}

export function AnalyticsPage() {
  const { user } = useCafe(); const state = useApi(() => cafeApi.statistics(user!._id), [user!._id]);
  return <section className="page"><PageHeading eyebrow="Your study notebook" title="Productivity Analytics" description="A summary of the focus time and tasks you’ve completed." action={<Link className="text-link" to="/history">View session history →</Link>} /><LoadState {...state} retry={state.reload}>{state.data && <>
    {state.data.completedSessions === 0 && <p className="note">Your notebook is ready. Complete a focus session to start filling it.</p>}
    <dl className="metrics"><div><dt>Focus minutes</dt><dd>{state.data.totalFocusMinutes}</dd></div><div><dt>Sessions completed</dt><dd>{state.data.completedSessions}</dd></div><div><dt>Tasks completed</dt><dd>{state.data.completedTasks}</dd></div><div><dt>Average session</dt><dd>{state.data.averageSessionMinutes}<small> min</small></dd></div></dl>
    <div className="notebook"><h2>Your cafe habits</h2><dl className="summary-list"><div><dt>Current study streak</dt><dd>{state.data.currentStreak} {state.data.currentStreak === 1 ? 'day' : 'days'}</dd></div><div><dt>Longest study streak</dt><dd>{state.data.longestStreak} days</dd></div><div><dt>Most productive day</dt><dd>{state.data.mostProductiveDay ? `${state.data.mostProductiveDay.date} · ${state.data.mostProductiveDay.totalMinutes} min` : 'No completed sessions yet'}</dd></div><div><dt>Favorite corner</dt><dd>{state.data.favoriteCafeArea?.name || 'Still finding your corner'}</dd></div><div><dt>Most ordered drink</dt><dd>{state.data.mostOrderedDrink?.name || 'No drinks ordered yet'}</dd></div></dl><p className="note">Study days and streaks follow Philippine time.</p></div>
  </>}</LoadState></section>;
}
