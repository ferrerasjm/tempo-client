import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useFocusRoom } from '../hooks/useFocusRoom';
import { useFocusMusic } from '../hooks/useFocusMusic';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { useCafe } from '../state/CafeContext';
import { dateTime, timerText } from '../utils/dates';
import { EmptyState, Feedback, LoadState, PageHeading, Status } from '../components/ui';
import { MenuArtwork } from '../components/MenuArtwork';
import { CafeRoomScene } from '../components/CafeRoomScene';
import { SessionFinish } from '../components/SessionFinish';

export function StartFocusPage() {
  const location = useLocation();
  return <Navigate to={'/study/drink' + location.search} replace />;
}

export function ActiveFocusPage() {
  const { id = '' } = useParams(); const { user, openExplore } = useCafe();
  const room = useFocusRoom(id);
  const { session, area, timer } = room;
  const running = session?.status === 'active';
  const paused = session?.status === 'paused';
  const planned = session?.status === 'planned';
  const completed = session?.status === 'completed';
  const corner = room.viewIndex >= 0;
  const music = useFocusMusic(Boolean(corner && running && timer.remainingSeconds > 0));
  const playbackLabel = running ? 'Pause timer' : paused ? 'Resume timer' : 'Play timer';
  return <section className={`page focus-page session-room ${corner ? 'scene-corner' : 'scene-focus'}`}><LoadState {...room.state} retry={room.state.reload}>
    {session && room.state.data && area && (session.user !== user!._id ? <EmptyState title="This session belongs to another profile." to="/study/drink" label="Prepare your session" /> : <>
      <p className="space-badge">{corner ? area.name.toLowerCase() : completed ? 'break' : paused ? 'paused' : 'focus'}</p>
      {planned || running || paused || completed ? <>
        {!corner && <div className="focus-readout"><p className="timer" aria-label={completed ? 'Break remaining' : 'Time remaining'}>{timerText(completed ? timer.breakRemainingSeconds : timer.remainingSeconds)}</p><h1>{session.sessionLabel ? session.sessionLabel + ' will ' : ''}{session.taskTitle || room.state.data.task.title}</h1>
        </div>}
        {corner && <h1 className="sr-only">Focus session in {area.name}</h1>}
        <div className="focus-table">{corner && <CafeRoomScene />}<div className="tabletop">
          <div className="session-drink"><MenuArtwork name={session.drinkName || 'Cafe Latte'} /></div>
          {corner && <p className="timer" aria-label={completed ? 'Break remaining' : 'Time remaining'}>{timerText(completed ? timer.breakRemainingSeconds : timer.remainingSeconds)}</p>}
          {planned || running || paused ? <>
            <div className="session-controls">
              <button className="timer-control" aria-label={playbackLabel} title={playbackLabel} disabled={room.busy || (running && timer.remainingSeconds === 0)} onClick={() => room.action(running ? 'pause' : paused ? 'resume' : 'start')}>
                <svg viewBox="0 0 24 24" aria-hidden="true">{running ? <path d="M9 6v12M15 6v12" /> : <path d="m9 5 10 7-10 7z" />}</svg>
              </button>
              <button className="timer-control stop-control" aria-label="Stop session" title="Stop session" disabled={room.busy} onClick={() => room.action('stop')}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg></button>
              <button className="timer-control" aria-label="Explore the Cafe" title="Explore the Cafe" disabled={room.busy} onClick={openExplore}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" /></svg></button>
            </div>
            {corner && <label className="room-volume"><span className="sr-only">Music volume</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" /></svg><input type="range" min={0} max={1} step={.05} value={music.volume} disabled={!music.available} onChange={event => music.setVolume(Number(event.target.value))} /><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3zM16 8q5 4 0 8M19 4q9 8 0 16" /></svg></label>}
          </> : null}
        </div></div>
        {completed && <div className="session-result"><p>{session.tempoCreditsEarned ? session.tempoCreditsEarned + ' Tempo Credits earned / ' : ''}{session.completedMinutes} {session.completedMinutes === 1 ? 'minute' : 'minutes'} saved · Focus score {session.focusScore}%</p><Link className="button" to="/study/drink">Prepare Another Session</Link><div className="center-actions"><Link className="text-link" to={`/tasks/${room.state.data.task._id}/edit`}>Update Task Status</Link><Link className="text-link" to="/analytics">Productivity Analytics</Link><Link className="text-link" to="/menu">Reward Shop</Link></div></div>}
        <div className="session-feedback"><Feedback error={room.error || (corner ? music.error : '')} /></div>
        <nav className="scene-navigation" aria-label="Cafe spaces"><button className="icon-button" aria-label="Previous cafe space" disabled={room.viewIndex === -1 || room.busy} onClick={() => room.browse(room.viewIndex - 1)}>←</button><button className="icon-button" aria-label="Next cafe space" disabled={room.viewIndex === room.state.data.areas.length - 1 || room.busy} onClick={() => room.browse(room.viewIndex + 1)}>→</button></nav>
        <SessionFinish key={id} room={room} />
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
  return <section className="page"><PageHeading eyebrow="Your time, well spent" title="A little history of focus." action={<Link className="button" to="/focus">Start A Session →</Link>} /><LoadState {...state} retry={state.reload}>
    {!state.data?.sessions.length ? <EmptyState title="Your first session is waiting." to="/focus" label="Start Focusing" /> : <div className="record-list">{state.data.sessions.map(session => <article className="record-row" key={session._id}><div><h2>{session.taskTitle || state.data!.tasks.find(task => task._id === session.task)?.title || 'Task'}</h2><p>{state.data!.areas.find(area => area._id === session.area)?.name} · {dateTime(session.startedAt)}</p><div className="metadata"><Status value={session.status} /><span>{session.completedMinutes} / {session.plannedMinutes} min</span>{session.focusScore !== null && <span>Focus score {session.focusScore}%</span>}</div></div><Link className="text-link" to={`/focus/${session._id}`}>{['planned', 'active', 'paused'].includes(session.status) ? 'Resume →' : 'View →'}</Link></article>)}</div>}
  </LoadState></section>;
}

export function SipStatsPage() {
  const { user } = useCafe();
  const stats = useApi(async () => {
    const [sessions, tasks] = await Promise.all([cafeApi.sessions(user!._id), cafeApi.tasks(user!._id)]);
    return { sessions, tasks };
  }, [user!._id]);
  const current = stats.data?.sessions.find(session => ['planned', 'active', 'paused'].includes(session.status)) || null;
  const timer = useFocusTimer(current);
  const completed = stats.data?.sessions.filter(session => session.status === 'completed') || [];
  const visibleSessions = current ? [current, ...completed] : completed;
  const drinkName = current?.drinkName || completed[0]?.drinkName || 'Cafe Latte';
  const drinks = [...new Set(completed.map(session => session.drinkName || 'Cafe Latte'))];
  return <section className="page sip-stats-page">
    <LoadState {...stats} retry={stats.reload}>
    {stats.data && <div className="sip-stats-layout">
      <div className="sip-timer">
        <MenuArtwork name={drinkName} />
        <p aria-label={current ? 'Time remaining' : 'Default focus duration'}>{timerText(current ? timer.remainingSeconds : 25 * 60)}</p>
      </div>
      <div className="sip-stats">
      <header className="sip-stats-heading"><h1>{user?.displayName || 'Your'}'s Sip Stats</h1></header>
          {visibleSessions.length ? <div className="sip-list" tabIndex={0} role="region" aria-label="Current and completed focus sessions">{visibleSessions.map(session => {
            const seconds = session._id === current?._id
              ? timer.remainingSeconds
              : session.elapsedSeconds ?? session.completedMinutes * 60;
            const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
            const taskTitle = session.taskTitle || stats.data!.tasks.find(task => task._id === session.task)?.title || 'Focus session';
            return <div className="sip-row" key={session._id}><MenuArtwork name={session.drinkName || 'Cafe drink'} /><span><strong>{taskTitle}</strong></span><span>{duration}</span></div>;
          })}</div> : <p className="sip-empty">no tasks completed yet</p>}
          <div className="sip-total">{completed.length ? drinks.map(drink => <span className="sip-count" key={drink} aria-label={`${drink}: ${completed.filter(session => (session.drinkName || 'Cafe Latte') === drink).length} sips`}><MenuArtwork name={drink} /> × {completed.filter(session => (session.drinkName || 'Cafe Latte') === drink).length}</span>) : 'no sips yet'}</div>
          <Link className="text-link sip-back" to={current ? `/focus/${current._id}` : '/study/drink'}>← Back to Timer</Link>
      </div>
    </div>}
    </LoadState>
  </section>;
}

export function AnalyticsPage() {
  const { user } = useCafe(); const state = useApi(() => cafeApi.statistics(user!._id), [user!._id]);
  return <section className="page"><PageHeading eyebrow="Your productivity notebook" title="Productivity Analytics" description="A summary of the focus time and tasks you’ve completed." action={<Link className="text-link" to="/history">View Session History →</Link>} /><LoadState {...state} retry={state.reload}>{state.data && <>
    {state.data.completedSessions === 0 && <p className="note">Your notebook is ready. Complete a focus session to start filling it.</p>}
    <dl className="metrics"><div><dt>Focus minutes</dt><dd>{state.data.totalFocusMinutes}</dd></div><div><dt>Sessions completed</dt><dd>{state.data.completedSessions}</dd></div><div><dt>Tasks completed</dt><dd>{state.data.completedTasks}</dd></div><div><dt>Average session</dt><dd>{state.data.averageSessionMinutes}<small> min</small></dd></div></dl>
    <div className="notebook"><h2>Your cafe habits</h2><dl className="summary-list"><div><dt>Current focus streak</dt><dd>{state.data.currentStreak} {state.data.currentStreak === 1 ? 'day' : 'days'}</dd></div><div><dt>Longest focus streak</dt><dd>{state.data.longestStreak} days</dd></div><div><dt>Most productive day</dt><dd>{state.data.mostProductiveDay ? `${state.data.mostProductiveDay.date} · ${state.data.mostProductiveDay.totalMinutes} min` : 'No completed sessions yet'}</dd></div><div><dt>Favorite corner</dt><dd>{state.data.favoriteCafeArea?.name || 'Still finding your corner'}</dd></div><div><dt>Most ordered drink</dt><dd>{state.data.mostOrderedDrink?.name || 'No drinks ordered yet'}</dd></div></dl><p className="note">Focus days and streaks follow Philippine time.</p></div>
  </>}</LoadState></section>;
}
