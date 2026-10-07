import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { cafeApi } from "../services/cafeApi";
import { useApi } from "../hooks/useApi";
import { useFocusRoom } from "../hooks/useFocusRoom";
import { useFocusMusic } from "../hooks/useFocusMusic";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { useCafe } from "../state/CafeContext";
import { dateTime, timerText } from "../utils/dates";
import {
  EmptyState,
  Feedback,
  LoadState,
  PageHeading,
  Status,
} from "../components/ui";
import { MenuArtwork } from "../components/MenuArtwork";
import { CafeRoomScene } from "../components/CafeRoomScene";
import { SessionFinish } from "../components/SessionFinish";
import { Pagination } from "../components/Pagination";
import { BackLink, PageNavigation } from "../state/SessionNavigation";
import { useConfirmation } from "../state/ConfirmationContext";
import { useSfx } from "../hooks/useSfx";

export function StartFocusPage() {
  const location = useLocation();
  return <Navigate to={"/study/drink" + location.search} replace />;
}

export function ActiveFocusPage() {
  const confirm = useConfirmation();
  const { id = "" } = useParams();
  const { user, openExplore } = useCafe();
  const room = useFocusRoom(id);
  const { session, area, timer } = room;
  const { play } = useSfx();
  const previousTimer = useRef({ focus: 0, break: 0, rewardBreak: 0 });
  const running = session?.status === "active";
  const paused = session?.status === "paused";
  const planned = session?.status === "planned";
  const completed = session?.status === "completed";
  const onBreak = Boolean(
    completed && session.completedMinutes >= session.plannedMinutes,
  );
  const rewardBreak = Boolean(paused && session?.rewardBreakEndsAt);
  const breakVisible =
    rewardBreak || onBreak || Boolean(running && timer.remainingSeconds === 0);
  const breakSeconds = rewardBreak
    ? timer.rewardBreakRemainingSeconds
    : timer.breakRemainingSeconds;
  useEffect(() => {
    const previous = previousTimer.current;
    const completedTimer = previous.focus > 0 && timer.remainingSeconds === 0;
    const completedBreak =
      previous.break > 0 && timer.breakRemainingSeconds === 0;
    const completedRewardBreak =
      previous.rewardBreak > 0 && timer.rewardBreakRemainingSeconds === 0;
    if (completedTimer || completedBreak || completedRewardBreak)
      play("success");
    previousTimer.current = {
      focus: timer.remainingSeconds,
      break: timer.breakRemainingSeconds,
      rewardBreak: timer.rewardBreakRemainingSeconds,
    };
  }, [
    play,
    timer.remainingSeconds,
    timer.breakRemainingSeconds,
    timer.rewardBreakRemainingSeconds,
  ]);
  const corner = room.viewIndex >= 0;
  const music = useFocusMusic(
    Boolean(corner && running && timer.remainingSeconds > 0),
    corner ? area?.name : "",
  );
  const playbackLabel = running
    ? "Pause timer"
    : paused
      ? "Resume timer"
      : "Play timer";
  const playbackTooltip = running
    ? "Pause Timer"
    : paused
      ? "Resume Timer"
      : "Play Timer";
  const pastry = room.state.data?.rewards.items?.find(
    (item) =>
      item.category === "snack" &&
      !(session?.rewardBreaks || []).some(
        (used) => used.order === item.order && used.menuItem === item.menuItem,
      ),
  );
  const canUsePastry = running && timer.remainingSeconds > 0 && !room.busy;
  const pastryTooltip = canUsePastry
    ? `${pastry?.name} · ${pastry?.breakMinutes || 5}-Minute Break`
    : room.busy
      ? "Please Wait"
      : paused
        ? rewardBreak
          ? "Finish Your Current Break First"
          : "Resume Your Focus Timer First"
        : running
          ? "Focus Timer Has Ended"
          : "Start a focus session first.";
  const tallDrink = /matcha|macchiato/i.test(session?.drinkName || "");
  async function usePastry() {
    if (!pastry || !running || room.busy || timer.remainingSeconds === 0)
      return;
    if (
      await confirm({
        title: "Take a pastry break?",
        message: `Use your ${pastry.name} for a ${pastry.breakMinutes || 5}-minute break? Your focus timer will pause and resume when the break ends.`,
        confirmLabel: "Start Break",
        cancelLabel: "Keep Focusing",
      })
    ) {
      await room.action("pause", pastry);
    }
  }
  return (
    <section
      className={`page focus-page session-room ${corner ? "scene-corner" : "scene-focus"} ${corner && area?.name === "Midnight Cafe" ? "scene-midnight" : ""}`}
    >
      <LoadState {...room.state} retry={room.state.reload}>
        {session &&
          room.state.data &&
          area &&
          (session.user !== user!._id ? (
            <EmptyState
              title="This session belongs to another profile."
              to="/study/drink"
              label="Prepare your session"
            />
          ) : (
            <>
              <p className="space-badge">
                {rewardBreak
                  ? "pastry break"
                  : corner
                    ? area.name.toLowerCase()
                    : breakVisible
                      ? breakSeconds > 0
                        ? "break"
                        : "break complete"
                      : completed
                        ? "session complete"
                        : paused
                          ? "paused"
                          : "focus"}
              </p>
              {planned || running || paused || completed ? (
                <>
                  {!corner && (
                    <div className="focus-readout">
                      <p
                        className="timer"
                        aria-label={
                          breakVisible ? "Break remaining" : "Time remaining"
                        }
                      >
                        {timerText(
                          breakVisible ? breakSeconds : timer.remainingSeconds,
                        )}
                      </p>
                      <h1>
                        {session.sessionLabel
                          ? session.sessionLabel + " will "
                          : ""}
                        {session.taskTitle || room.state.data.task.title}
                      </h1>
                    </div>
                  )}
                  {corner && (
                    <h1 className="sr-only">Focus session in {area.name}</h1>
                  )}
                  <div className="focus-table">
                    {corner && <CafeRoomScene areaName={area.name} />}
                    <div className="tabletop">
                      <div
                        className={`table-treats ${tallDrink ? "glass-drink" : "cup-drink"}${pastry ? " has-pastry" : ""}`}
                      >
                        <div
                          className="session-drink"
                          tabIndex={0}
                          data-cursor-tooltip
                          data-tooltip={`${session.drinkName || "Cafe Latte"}${session.drinkSize ? " · " + session.drinkSize.charAt(0).toUpperCase() + session.drinkSize.slice(1) : ""} · ${session.plannedMinutes} Min`}
                          aria-label={session.drinkName || "Cafe Latte"}
                        >
                          <MenuArtwork
                            name={session.drinkName || "Cafe Latte"}
                          />
                        </div>
                        {pastry && (
                          <button
                            type="button"
                            className="session-pastry"
                            data-cursor-tooltip
                            data-tooltip={pastryTooltip}
                            disabled={!canUsePastry}
                            onClick={() => void usePastry()}
                            aria-label={`${pastry.name}, ${pastry.breakMinutes || 5} minute break`}
                          >
                            <MenuArtwork name={pastry.name} snack />
                          </button>
                        )}
                      </div>
                      {corner && (
                        <p
                          className="timer"
                          aria-label={
                            breakVisible ? "Break remaining" : "Time remaining"
                          }
                        >
                          {timerText(
                            breakVisible
                              ? breakSeconds
                              : timer.remainingSeconds,
                          )}
                        </p>
                      )}
                      {planned || running || paused ? (
                        <>
                          <div className="session-controls">
                            <button
                              className="timer-control"
                              aria-label={playbackLabel}
                              data-tooltip={playbackTooltip}
                              disabled={
                                room.busy ||
                                (running && timer.remainingSeconds === 0)
                              }
                              onClick={() =>
                                room.action(
                                  running
                                    ? "pause"
                                    : paused
                                      ? "resume"
                                      : "start",
                                )
                              }
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                {running ? (
                                  <path d="M9 6v12M15 6v12" />
                                ) : (
                                  <path d="m9 5 10 7-10 7z" />
                                )}
                              </svg>
                            </button>
                            <button
                              className="timer-control stop-control"
                              aria-label="Stop session"
                              data-tooltip="Stop Session"
                              disabled={room.busy}
                              onClick={() => room.action("stop")}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect
                                  x="6"
                                  y="6"
                                  width="12"
                                  height="12"
                                  rx="2"
                                />
                              </svg>
                            </button>
                            <button
                              className="timer-control"
                              aria-label="Explore the Cafe"
                              data-tooltip="Explore The Cafe"
                              disabled={room.busy}
                              onClick={openExplore}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" />
                              </svg>
                            </button>
                          </div>
                          {corner && (
                            <label className="room-volume">
                              <span className="sr-only">Music volume</span>
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 9h4l5-4v14l-5-4H4z" />
                              </svg>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={music.volume}
                                disabled={!music.available}
                                onChange={(event) =>
                                  music.setVolume(Number(event.target.value))
                                }
                              />
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M3 9h4l5-4v14l-5-4H3zM16 8q5 4 0 8M19 4q9 8 0 16" />
                              </svg>
                            </label>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                  {completed && (
                    <div className="session-result" role="status">
                      <p>
                        {session.completedMinutes}{" "}
                        {session.completedMinutes === 1 ? "minute" : "minutes"}{" "}
                        focused
                        {session.tempoCreditsEarned ? (
                          <>
                            {" "}
                            ·{" "}
                            <span className="earned-credits">
                              +{session.tempoCreditsEarned} Tempo Credits
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  )}
                  <div className="session-feedback">
                    <Feedback
                      error={room.error || (corner ? music.error : "")}
                    />
                  </div>
                  <nav className="scene-navigation" aria-label="Cafe spaces">
                    <button
                      className="icon-button"
                      aria-label="Previous cafe space"
                      data-tooltip="Previous Space"
                      disabled={room.viewIndex === -1 || room.busy}
                      onClick={() => room.browse(room.viewIndex - 1)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 12H5m7-7-7 7 7 7" />
                      </svg>
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Next cafe space"
                      data-tooltip="Next Space"
                      disabled={
                        room.viewIndex === room.state.data.areas.length - 1 ||
                        room.busy
                      }
                      onClick={() => room.browse(room.viewIndex + 1)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                  <SessionFinish key={id} room={room} onExplore={openExplore} />
                </>
              ) : (
                <EmptyState
                  title="This session has ended."
                  to="/study/drink"
                  label="Prepare a new session"
                />
              )}
            </>
          ))}
      </LoadState>
    </section>
  );
}

export function FocusHistoryPage() {
  const { user } = useCafe();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const state = useApi(async () => {
    const [sessions, tasks, areas] = await Promise.all([
      cafeApi.sessions(user!._id),
      cafeApi.tasks(user!._id),
      cafeApi.areas(),
    ]);
    return { sessions, tasks, areas };
  }, [user!._id]);
  const sessions = state.data?.sessions || [];
  const pageCount = Math.max(1, Math.ceil(sessions.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleSessions = sessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  return (
    <section className="page focus-history-page">
      <PageNavigation to="/tasks" label="Back to Task Board" />
      <PageHeading
        eyebrow="Your time, well spent"
        title="A little history of focus."
        action={
          <Link className="button" to="/focus">
            Start A Session
          </Link>
        }
      />
      <LoadState {...state} retry={state.reload}>
        {!sessions.length ? (
          <EmptyState
            title="Your first session is waiting."
            to="/focus"
            label="Start Focusing"
          />
        ) : (
          <>
            <div className="record-list">
              {visibleSessions.map((session) => {
                const unfinished = ["planned", "active", "paused"].includes(
                  session.status,
                );
                return (
                  <article className="record-row" key={session._id}>
                    <div>
                      <h2>
                        {session.taskTitle ||
                          state.data!.tasks.find(
                            (task) => task._id === session.task,
                          )?.title ||
                          "Task"}
                      </h2>
                      <p>
                        {
                          state.data!.areas.find(
                            (area) => area._id === session.area,
                          )?.name
                        }{" "}
                        · {dateTime(session.startedAt)}
                      </p>
                      <div className="metadata">
                        <Status value={session.status} />
                        <span>
                          {session.completedMinutes} / {session.plannedMinutes}{" "}
                          min
                        </span>
                        {session.focusScore !== null && (
                          <span>Focus score {session.focusScore}%</span>
                        )}
                      </div>
                    </div>
                    {unfinished && (
                      <Link className="text-link" to={`/focus/${session._id}`}>
                        Return to Timer
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
            {sessions.length > 5 && (
              <Pagination
                currentPage={currentPage}
                pageCount={pageCount}
                pageSize={pageSize}
                label="Focus history pages"
                itemLabel="Sessions per page"
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </LoadState>
    </section>
  );
}

export function SipStatsPage() {
  const { user } = useCafe();
  const stats = useApi(async () => {
    const [sessions, tasks] = await Promise.all([
      cafeApi.sessions(user!._id),
      cafeApi.tasks(user!._id),
    ]);
    return { sessions, tasks };
  }, [user!._id]);
  const current =
    stats.data?.sessions.find((session) =>
      ["planned", "active", "paused"].includes(session.status),
    ) || null;
  const timer = useFocusTimer(current);
  const completed =
    stats.data?.sessions.filter((session) => session.status === "completed") ||
    [];
  const visibleSessions = current ? [current, ...completed] : completed;
  const drinkName =
    current?.drinkName || completed[0]?.drinkName || "Cafe Latte";
  const drinks = [
    ...new Set(completed.map((session) => session.drinkName || "Cafe Latte")),
  ];
  return (
    <section className="page sip-stats-page">
      <LoadState {...stats} retry={stats.reload}>
        {stats.data && (
          <div className="sip-stats-layout">
            <div className="sip-timer">
              <MenuArtwork name={drinkName} />
              <p
                aria-label={
                  current ? "Time remaining" : "Default focus duration"
                }
              >
                {timerText(current ? timer.remainingSeconds : 25 * 60)}
              </p>
            </div>
            <div className="sip-stats">
              <header className="sip-stats-heading">
                <h1>{user?.displayName || "Your"}'s Sip Stats</h1>
              </header>
              {visibleSessions.length ? (
                <div
                  className="sip-list"
                  tabIndex={0}
                  role="region"
                  aria-label="Current and completed focus sessions"
                >
                  {visibleSessions.map((session) => {
                    const seconds =
                      session._id === current?._id
                        ? timer.remainingSeconds
                        : (session.elapsedSeconds ??
                          session.completedMinutes * 60);
                    const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
                    const taskTitle =
                      session.taskTitle ||
                      stats.data!.tasks.find(
                        (task) => task._id === session.task,
                      )?.title ||
                      "Focus session";
                    return (
                      <div className="sip-row" key={session._id}>
                        <MenuArtwork name={session.drinkName || "Cafe drink"} />
                        <span>
                          <strong>{taskTitle}</strong>
                        </span>
                        <span>{duration}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="sip-empty">no tasks completed yet</p>
              )}
              <div className="sip-total">
                {completed.length
                  ? drinks.map((drink) => (
                      <span
                        className="sip-count"
                        key={drink}
                        aria-label={`${drink}: ${completed.filter((session) => (session.drinkName || "Cafe Latte") === drink).length} sips`}
                      >
                        <MenuArtwork name={drink} /> ×{" "}
                        {
                          completed.filter(
                            (session) =>
                              (session.drinkName || "Cafe Latte") === drink,
                          ).length
                        }
                      </span>
                    ))
                  : "no sips yet"}
              </div>
              <BackLink
                className="text-link sip-back"
                preferSession
                fallbackTo="/study/drink"
                fallbackLabel="Back to Session Setup"
              />
            </div>
          </div>
        )}
      </LoadState>
    </section>
  );
}

export function AnalyticsPage() {
  const { user } = useCafe();
  const state = useApi(() => cafeApi.statistics(user!._id), [user!._id]);
  const statistics = state.data;
  return (
    <section className="page analytics-page">
      <PageNavigation to="/tasks" label="Back to Task Board" />
      <PageHeading
        eyebrow="Your Productivity Notebook"
        title="Productivity Stats"
        description="A summary of the focus time and tasks you’ve completed."
        action={
          <Link className="text-link" to="/history">
            View Session History
          </Link>
        }
      />
      <LoadState {...state} retry={state.reload}>
        {statistics && (
          <>
            {statistics.completedSessions === 0 && (
              <p className="note">
                Your notebook is ready. Complete a focus session to start
                filling it.
              </p>
            )}
            <dl className="metrics">
              <div>
                <dt>Focus Minutes</dt>
                <dd>{statistics.totalFocusMinutes}</dd>
              </div>
              <div>
                <dt>Sessions Completed</dt>
                <dd>{statistics.completedSessions}</dd>
              </div>
              <div>
                <dt>Tasks Completed</dt>
                <dd>{statistics.completedTasks}</dd>
              </div>
              <div>
                <dt>Average Session</dt>
                <dd>
                  {statistics.averageSessionMinutes}
                  <small> min</small>
                </dd>
              </div>
            </dl>
            <div className="notebook">
              <h2>Your Cafe Habits</h2>
              <dl className="summary-list">
                <div>
                  <dt>Current Focus Streak</dt>
                  <dd>
                    {statistics.currentStreak}{" "}
                    {statistics.currentStreak === 1 ? "day" : "days"}
                  </dd>
                </div>
                <div>
                  <dt>Longest Focus Streak</dt>
                  <dd>{statistics.longestStreak} days</dd>
                </div>
                <div>
                  <dt>Most Productive Day</dt>
                  <dd>
                    {statistics.mostProductiveDay
                      ? `${statistics.mostProductiveDay.date} · ${statistics.mostProductiveDay.totalMinutes} min`
                      : "No completed sessions yet"}
                  </dd>
                </div>
                <div>
                  <dt>Favorite Corner</dt>
                  <dd>
                    {statistics.favoriteCafeArea?.name ||
                      "Still finding your corner"}
                  </dd>
                </div>
                <div>
                  <dt>Most Ordered Drink</dt>
                  <dd>
                    {statistics.mostOrderedDrink?.name ||
                      "No drinks ordered yet"}
                  </dd>
                </div>
              </dl>
              <p className="note">
                Focus days and streaks follow Philippine time.
              </p>
            </div>
          </>
        )}
      </LoadState>
    </section>
  );
}
