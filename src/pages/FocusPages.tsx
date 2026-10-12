import { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { errorMessage } from "../api/http";
import { cafeApi } from "../services/cafeApi";
import { useApi } from "../hooks/useApi";
import { useFocusRoom } from "../hooks/useFocusRoom";
import { useSessionMusic } from "../state/FocusMusicContext";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { useCafe } from "../state/CafeContext";
import { timerText } from "../utils/dates";
import { EmptyState, Feedback, LoadState } from "../components/ui";
import { MenuArtwork } from "../components/MenuArtwork";
import { CafeRoomScene } from "../components/CafeRoomScene";
import { SessionFinish } from "../components/SessionFinish";
import { useConfirmation } from "../state/ConfirmationContext";
import { useSfx } from "../hooks/useSfx";
import { BackLink, PageNavigation } from "../state/SessionNavigation";
import { artwork, displayAreaName } from "../assets";
import { SessionProfile } from "../components/SessionProfile";
import { Modal } from "../components/Modal";

export function StartFocusPage() {
  const location = useLocation();
  return <Navigate to={"/study/drink" + location.search} replace />;
}

export function ActiveFocusPage() {
  const confirm = useConfirmation();
  const { id = "" } = useParams();
  const { user, notify } = useCafe();
  const navigate = useNavigate();
  const [openingTasks, setOpeningTasks] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [today, setToday] = useState(() => new Date());
  const calendarCard = useRef<HTMLDivElement>(null);
  const infoMenuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const interval = window.setInterval(() => setToday(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!calendarOpen && !infoMenuOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!calendarCard.current?.contains(event.target as Node)) {
        setCalendarOpen(false);
        setInfoMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [calendarOpen, infoMenuOpen]);
  function closeInfoMenu() {
    setInfoMenuOpen(false);
    infoMenuButton.current?.focus();
  }
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
  const music = useSessionMusic();
  const { updatePlayback } = music;
  useEffect(() => {
    if (session && area) updatePlayback(session, corner ? area.name : "");
  }, [session, area?.name, corner, updatePlayback]);
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
  async function navigateFromSession(to: string) {
    if (!session || !area || openingTasks || room.busy) return;
    setOpeningTasks(true);
    try {
      if (running) {
        const saved = await cafeApi.sessionAction(id, "pause", session.area);
        updatePlayback(saved, corner ? area.name : "");
      }
      navigate(to, { state: { returnTo: `/focus/${id}`, from: "focus" } });
    } catch (reason) {
      notify("Could not pause your focus timer. " + errorMessage(reason));
    } finally {
      setOpeningTasks(false);
    }
  }
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
              <div className="session-header">
                <div
                  className="session-info-container"
                  ref={calendarCard}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setCalendarOpen(false);
                      closeInfoMenu();
                    }
                  }}
                >
                  <button
                    ref={infoMenuButton}
                    type="button"
                    className="session-menu-toggle"
                    aria-label="Cafe menu"
                    aria-expanded={infoMenuOpen}
                    aria-controls="session-info-actions"
                    onClick={() => {
                      setCalendarOpen(false);
                      setInfoMenuOpen((open) => !open);
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M3 5h18v3H3zM3 11h18v3H3zM3 17h18v3H3z" />
                    </svg>
                  </button>
                  <div
                    className={`session-info-card${infoMenuOpen ? " is-open" : ""}`}
                    id="session-info-actions"
                    role="group"
                    aria-label="Cafe information"
                  >
                    <button
                      type="button"
                      className="session-info-icon"
                      aria-label="Date"
                      aria-expanded={calendarOpen}
                      aria-controls="session-today"
                      onClick={() => {
                        closeInfoMenu();
                        setToday(new Date());
                        setCalendarOpen((open) => !open);
                      }}
                      data-tooltip="Date"
                      data-cursor-tooltip
                    >
                      <img
                        src={artwork.calendar}
                        alt=""
                        width={48}
                        height={48}
                      />
                      <span className="session-info-label">Date</span>
                    </button>
                    <button
                      type="button"
                      className="session-info-icon"
                      aria-label="Credits"
                      onClick={() => {
                        closeInfoMenu();
                        setCalendarOpen(false);
                        setCreditsOpen(true);
                      }}
                      data-tooltip="Credits"
                      data-cursor-tooltip
                    >
                      <img
                        src={artwork.credits}
                        alt=""
                        width={48}
                        height={48}
                      />
                      <span className="session-info-label">Credits</span>
                    </button>
                    <button
                      type="button"
                      className="session-info-icon"
                      aria-label="About Cafe Tempo"
                      data-tooltip="About"
                      data-cursor-tooltip
                      onClick={() => {
                        closeInfoMenu();
                        setCalendarOpen(false);
                        setAboutOpen(true);
                      }}
                    >
                      <img src={artwork.about} alt="" width={48} height={48} />
                      <span className="session-info-label">
                        About Cafe Tempo
                      </span>
                    </button>
                  </div>
                  {calendarOpen && (
                    <div
                      className="session-calendar-date"
                      id="session-today"
                      role="status"
                    >
                      <span>Today</span>
                      <time
                        dateTime={new Intl.DateTimeFormat("en-CA", {
                          timeZone: "Asia/Taipei",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }).format(today)}
                      >
                        {new Intl.DateTimeFormat("en-US", {
                          timeZone: "Asia/Taipei",
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }).format(today)}
                      </time>
                    </div>
                  )}
                </div>
                <div className="session-top-actions">
                  <SessionProfile
                    onNavigate={navigateFromSession}
                    navigating={openingTasks || room.busy}
                  />
                </div>
              </div>
              <Modal
                open={creditsOpen}
                title="𑣲𝄞  Tempo Credits"
                onClose={() => setCreditsOpen(false)}
                className="cafe-about cafe-credits"
              >
                <p>Music used in our café spaces:</p>
                <ul className="cafe-music-credits">
                  {[
                    [
                      "Garden Patio",
                      "https://www.youtube.com/watch?v=MeCWuFZMQzA",
                    ],
                    ["Library", "https://www.youtube.com/watch?v=hCtwi8XkB4o"],
                    [
                      "Midnight Cafe",
                      "https://www.youtube.com/watch?v=cjZxPhryD3E",
                    ],
                    [
                      "Quiet Corner",
                      "https://www.youtube.com/watch?v=7PvYu-1iEbY",
                    ],
                    [
                      "Window View",
                      "https://www.youtube.com/watch?v=-B0_METsdCQ",
                    ],
                  ].map(([space, source]) => (
                    <li key={space}>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          className="credits-youtube-icon"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <rect
                            x="1"
                            y="4"
                            width="22"
                            height="16"
                            rx="4"
                            fill="#c4302b"
                          />
                          <path d="m10 8 6 4-6 4z" fill="#fff" />
                        </svg>
                        <span>{space}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Modal>
              <Modal
                open={aboutOpen}
                title={
                  <span className="cafe-about-title">
                    <img src={artwork.cafeLogo} alt="" width={48} height={48} />
                    <span>About Cafe Tempo</span>
                  </span>
                }
                onClose={() => setAboutOpen(false)}
                className="cafe-about"
              >
                <p>
                  Cafe Tempo is a cozy space to focus, one task at a time.
                  Choose a drink, settle into your favorite café spot, and build
                  a steady rhythm with focus timers, small rewards, and a record
                  of your progress.
                </p>
                <p className="cafe-about-credit">created by: jm &amp; sab</p>
              </Modal>
              <div className="session-location">
                <p className="space-badge">
                  {rewardBreak
                    ? "pastry break"
                    : corner
                      ? displayAreaName(area.name).toLowerCase()
                      : breakVisible
                        ? breakSeconds > 0
                          ? "break"
                          : "break complete"
                        : completed
                          ? "session complete"
                          : "focus"}
                </p>
              </div>
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
                    </div>
                  )}
                  <h1 className="sr-only">Focus session in {area.name}</h1>
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
                      <div className="table-desk-items">
                        <Link
                          className="table-task-notebook"
                          to="/tasks"
                          state={{ returnTo: `/focus/${id}` }}
                          aria-label="Task Board"
                          aria-disabled={openingTasks || room.busy}
                          data-tooltip="To-Do List"
                          data-cursor-tooltip
                          data-tooltip-anchor
                          onClick={(event) => {
                            event.preventDefault();
                            void navigateFromSession("/tasks");
                          }}
                        >
                          <img src={artwork.taskNotebook} alt="" />
                        </Link>
                        <Link
                          className="table-sip-stats"
                          to="/sip-stats"
                          state={{ returnTo: `/focus/${id}` }}
                          aria-label="Sip Stats"
                          data-tooltip="Sip Stats"
                          data-cursor-tooltip
                          data-tooltip-anchor
                        >
                          <img src={artwork.sipStats} alt="" />
                        </Link>
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
                              type="button"
                              className="session-explore"
                              aria-label="Explore the Reward Shop"
                              data-tooltip="Explore"
                              data-cursor-tooltip
                              disabled={openingTasks || room.busy}
                              onClick={() => void navigateFromSession("/menu")}
                            >
                              <img
                                src={artwork.explore}
                                alt=""
                                width={64}
                                height={64}
                              />
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
                          </div>
                          {corner && (
                            <div className="room-music-controls">
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
                            </div>
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
                      disabled={room.busy}
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
                      disabled={room.busy}
                      onClick={() => room.browse(room.viewIndex + 1)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                  <SessionFinish
                    key={id}
                    room={room}
                    onExplore={() => void navigateFromSession("/menu")}
                  />
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

export { FocusHistoryPage, AnalyticsPage } from "./ProfileActivityPages";

export function SipStatsPage() {
  const location = useLocation();
  const fromSession =
    typeof location.state?.returnTo === "string" &&
    /^\/focus\/[a-f\d]{24}$/i.test(location.state.returnTo)
      ? location.state.returnTo
      : "";
  const { user } = useCafe();
  const userId = user?._id || "";
  const stats = useApi(async () => {
    if (!userId) return { sessions: [], tasks: [] };
    const [sessions, tasks] = await Promise.all([
      cafeApi.sessions(userId),
      cafeApi.tasks(userId),
    ]);
    return {
      sessions: sessions.filter((session) => session.user === userId),
      tasks: tasks.filter((task) => task.user === userId),
    };
  }, [userId]);
  const current =
    stats.data?.sessions.find((session) =>
      ["planned", "active", "paused"].includes(session.status),
    ) || null;
  const timer = useFocusTimer(current);
  const completed =
    stats.data?.sessions.filter((session) => session.status === "completed") ||
    [];
  const visibleSessions = current ? [current, ...completed] : completed;
  const backSession = current || completed[0];
  const drinkName =
    current?.drinkName || completed[0]?.drinkName || "Cafe Latte";
  const drinks = [
    ...new Set(completed.map((session) => session.drinkName || "Cafe Latte")),
  ];
  return (
    <section className="page sip-stats-page">
      <BackLink
        className="text-link sip-back"
        fallbackTo={
          fromSession ||
          (backSession ? `/focus/${backSession._id}` : "/study/drink")
        }
        fallbackLabel="Back to Session"
      />
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
            </div>
          </div>
        )}
      </LoadState>
    </section>
  );
}
