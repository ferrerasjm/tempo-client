import { useState } from "react";
import { Link } from "react-router-dom";
import { cafeApi } from "../services/cafeApi";
import { useApi } from "../hooks/useApi";
import { useCafe } from "../state/CafeContext";
import { dateTime } from "../utils/dates";
import { EmptyState, LoadState, PageHeading, Status } from "../components/ui";
import { Pagination } from "../components/Pagination";
import { PageNavigation } from "../state/SessionNavigation";
import type { Statistics } from "../types";
import { MenuArtwork } from "../components/MenuArtwork";
import { displayAreaName } from "../assets";

export function FocusHistoryPage({ embedded = false }: {
  embedded?: boolean;
} = {}) {
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
    <section className={embedded ? "focus-history-page profile-embedded-page" : "page focus-history-page"}>
      {!embedded && <PageNavigation to="/tasks" label="Back to Task Board" />}
      <PageHeading
        eyebrow="Your Time, Well Spent"
        title="Focus History"
        description="Every little session counts. Here’s a look at yours."
        action={!embedded &&
          <Link className="button" to="/focus">
            Start A Session
          </Link>
        }
      />
      <LoadState {...state} retry={state.reload}>
        {!sessions.length ? (
          <EmptyState
            title="Your First Session Is Waiting"
            to="/focus"
            label="Start Focusing"
          />
        ) : (
          <>
            <div className="record-list">
              {visibleSessions.map((session) => {
                return (
                  <article className="record-row" key={session._id}>
                    {embedded && <div className="focus-history-art" aria-hidden="true"><MenuArtwork name={session.drinkName || "Cafe Latte"} /></div>}
                    <div className="focus-history-details">
                      <h2>
                        {session.taskTitle ||
                          state.data!.tasks.find(
                            (task) => task._id === session.task,
                          )?.title ||
                          "Focus Session"}
                      </h2>
                      <p>
                        {
                          displayAreaName(state.data!.areas.find(
                            (area) => area._id === session.area,
                          )?.name || "Cafe Session")
                        }{" "}
                        · {session.startedAt ? dateTime(session.startedAt) : "Not Started Yet"}
                      </p>
                      <div className="metadata">
                        <Status value={session.status} />
                        <span>
                          {session.completedMinutes} / {session.plannedMinutes}{" "}
                          min
                        </span>
                        {session.focusScore !== null && (
                          <span>Focus Score {session.focusScore}%</span>
                        )}
                      </div>
                    </div>
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

export function AnalyticsPage({ embedded = false }: {
  embedded?: boolean;
} = {}) {
  const { user } = useCafe();
  const state = useApi(() => cafeApi.statistics(user!._id), [user!._id]);
  const statistics = state.data;
  if (embedded) return <section className="cafe-productivity" aria-label="Productivity Stats">
    <header className="cafe-productivity-heading">
      <h3>Productivity Stats</h3>
      <p>Your focus progress, all in one place.</p>
    </header>
    <LoadState {...state} retry={state.reload}>
      {statistics && <ProductivityOverview statistics={statistics} />}
    </LoadState>
  </section>;
  return (
    <section className={embedded ? "analytics-page profile-embedded-page" : "page analytics-page"}>
      {!embedded && <PageNavigation to="/tasks" label="Back to Task Board" />}
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
                    {displayAreaName(statistics.favoriteCafeArea?.name || "") ||
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

function ProductivityOverview({ statistics }: {
  statistics: Statistics;
}) {
  const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;
  return <>
    <section className="cafe-productivity-section" aria-label="Focus overview">
      <h4>Focus Overview</h4>
      <dl className="cafe-productivity-totals">
        <div><dt>Total Focus Time</dt><dd>{statistics.totalFocusMinutes} <small>min</small></dd></div>
        <div><dt>Sessions Completed</dt><dd>{statistics.completedSessions}</dd></div>
        <div><dt>Tasks Completed</dt><dd>{statistics.completedTasks}</dd></div>
        <div><dt>Average Session</dt><dd>{statistics.averageSessionMinutes} <small>min</small></dd></div>
      </dl>
      {statistics.completedSessions === 0 && <p className="cafe-productivity-empty" role="status">
        Complete a focus session to start tracking your progress.
      </p>}
    </section>
    <section className="cafe-productivity-section" aria-label="Focus streaks">
      <h4>Focus Streaks</h4>
      <dl className="cafe-productivity-streaks">
        <div><dt>Current Streak</dt><dd>{days(statistics.currentStreak)}</dd></div>
        <div><dt>Longest Streak</dt><dd>{days(statistics.longestStreak)}</dd></div>
      </dl>
    </section>
    <section className="cafe-productivity-section" aria-label="Cafe habits">
      <h4>Cafe Habits</h4>
      <dl className="cafe-productivity-habits">
        <div><dt>Most Productive Day</dt><dd>{statistics.mostProductiveDay
          ? <>{statistics.mostProductiveDay.date}<span>{statistics.mostProductiveDay.totalMinutes} min of focus</span></>
          : "No completed sessions yet"}</dd></div>
        <div><dt>Favorite Corner</dt><dd>{displayAreaName(statistics.favoriteCafeArea?.name || "") || "Still finding your corner"}</dd></div>
        <div><dt>Most Ordered Drink</dt><dd>{statistics.mostOrderedDrink?.name || "No drinks ordered yet"}</dd></div>
      </dl>
    </section>
    <footer className="cafe-productivity-footer">
      <p>Focus days and streaks follow Philippine time.</p>
    </footer>
  </>;
}
