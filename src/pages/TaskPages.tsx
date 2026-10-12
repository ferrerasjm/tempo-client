import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cafeApi } from "../services/cafeApi";
import { useApi } from "../hooks/useApi";
import { useCafe } from "../state/CafeContext";
import { errorMessage } from "../api/http";
import { taskEditorSchema, type TaskEditorValues } from "../schemas/forms";
import {
  EmptyState,
  Feedback,
  Field,
  LoadState,
  PageHeading,
} from "../components/ui";
import type { Task } from "../types";
import { pendingRequest, clearPendingRequest } from "../utils/pendingRequests";
import { useConfirmation } from "../state/ConfirmationContext";
import { useStudyDraft } from "../state/StudyDraftContext";
import { PageNavigation } from "../state/SessionNavigation";
import { Pagination } from "../components/Pagination";

function TaskActionIcon({
  action,
}: {
  action: "focus" | "timer" | "history" | "edit" | "delete";
}) {
  const paths = {
    focus: "m9 5 10 7-10 7z",
    timer: "M9 2h6M12 6v6l3 2M19 5l-2 2M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    history: "M3 4v5h5M3 9a9 9 0 1 1 0 6M12 7v5l3 2",
    edit: "m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z",
    delete: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[action]} />
    </svg>
  );
}

export function TaskListPage() {
  const confirm = useConfirmation();
  const { user, notify } = useCafe();
  const navigate = useNavigate();
  const { update } = useStudyDraft();
  const state = useApi(async () => {
    const [tasks, sessions] = await Promise.all([
      cafeApi.tasks(user!._id),
      cafeApi.sessions(user!._id),
    ]);
    return { tasks, sessions };
  }, [user!._id]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const sessions = state.data?.sessions || [];
  const unfinished = sessions.find((session) =>
    ["planned", "active", "paused"].includes(session.status),
  );
  const backToSession = unfinished || null;
  const taskStatus = (task: Task) =>
    unfinished?.task === task._id &&
    ["active", "paused"].includes(unfinished.status) &&
    task.status !== "completed"
      ? "in_progress"
      : task.status;
  const statusRank = { in_progress: 0, todo: 1, completed: 2 };
  const tasks = (state.data?.tasks || [])
    .filter((task) => filter === "all" || taskStatus(task) === filter)
    .sort(
      (a, b) =>
        statusRank[taskStatus(a)] - statusRank[taskStatus(b)] ||
        new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime(),
    );
  const pageCount = Math.max(1, Math.ceil(tasks.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstItem = (currentPage - 1) * pageSize;
  const visibleTasks = tasks.slice(firstItem, firstItem + pageSize);
  useEffect(() => {
    if (!state.loading && page > pageCount) setPage(pageCount);
  }, [state.loading, page, pageCount]);

  async function remove(task: Task) {
    if (
      busy ||
      sessions.some(
        (session) =>
          session.task === task._id &&
          ["planned", "active", "paused"].includes(session.status),
      )
    )
      return;
    if (
      !(await confirm({
        title: "Delete this task?",
        message: `Delete “${task.title}” from your board? Your past sessions and saved focus minutes will remain in your history. This cannot be undone.`,
        confirmLabel: "Delete Task",
        destructive: true,
      }))
    )
      return;
    setBusy(task._id);
    setError("");
    try {
      await cafeApi.deleteTask(task._id);
      notify("Task deleted.");
      state.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy("");
    }
  }

  async function focusTask(task: Task) {
    if (busy) return;
    setError("");
    setBusy(task._id);
    try {
      // Recheck before switching: the timer may have changed in another tab.
      const current = (await cafeApi.sessions(user!._id)).find((session) =>
        ["planned", "active", "paused"].includes(session.status),
      );
      if (current?.task === task._id) {
        navigate(`/focus/${current._id}`);
        return;
      }
      if (current) {
        const title =
          state.data?.tasks.find((item) => item._id === current.task)?.title ||
          current.taskTitle ||
          "your current task";
        if (
          !(await confirm({
            title: "Switch to another task?",
            message: `Your session for “${title}” will end and its focused minutes will be saved. Sessions under one minute will be cancelled. The task will remain on your board.`,
            confirmLabel: "End Session & Switch",
            cancelLabel: "Keep Current Session",
          }))
        )
          return;
        await cafeApi.sessionAction(current._id, "stop");
        notify(
          "Your previous session has ended. Choose a drink for this task.",
        );
      }
      clearPendingRequest(user!._id + "-prepare-task");
      clearPendingRequest(user!._id + "-prepare-session");
      update({ taskId: task._id });
      navigate(`/study/drink?task=${task._id}`);
    } catch (reason) {
      setError(errorMessage(reason));
      state.reload();
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="page task-board">
      <PageNavigation
        to={backToSession ? `/focus/${backToSession._id}` : "/welcome"}
        label={backToSession ? "Back to Session" : "Back to Welcome"}
        className="task-board-navigation"
      />
      <PageHeading
        eyebrow="Your Task Board"
        title="Your Tasks"
        description="Keep your work in one place. Pick up an unfinished task or plan something new."
        action={
          <Link className="button" to="/tasks/new">
            Add Task
          </Link>
        }
      />
      <Feedback error={error} />
      <LoadState {...state} retry={state.reload}>
        <div className="task-filters">
          <div className="task-filter-field">
            <label htmlFor="task-status">Task Status</label>
            <div className="task-filter-control">
              <select
                id="task-status"
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <span className="task-filter-chevron" aria-hidden="true" />
            </div>
          </div>
          <p role="status">
            {tasks.length
              ? `${firstItem + 1}–${Math.min(firstItem + pageSize, tasks.length)} of ${tasks.length}`
              : "0"}{" "}
            {tasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
        {tasks.length === 0 ? (
          <EmptyState
            title={
              filter === "all"
                ? "A clear board."
                : "No tasks match this filter."
            }
          >
            {filter === "all" ? (
              "Use Add Task above to plan your next thing."
            ) : (
              <button
                className="text-link"
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
              >
                Clear Filter
              </button>
            )}
          </EmptyState>
        ) : (
          <div className="record-list">
            {visibleTasks.map((task) => {
              const history = sessions.filter(
                (session) => session.task === task._id,
              );
              const hasTimer = history.some((session) =>
                ["planned", "active", "paused"].includes(session.status),
              );
              const savedMinutes = history.reduce(
                (sum, session) => sum + session.completedMinutes,
                0,
              );
              const status = taskStatus(task);
              return (
                <article className="task-row" key={task._id}>
                  <div className="record-main">
                    <h2>{task.title}</h2>
                    <div className="metadata">
                      <span className={`status status-${status}`}>
                        {status === "todo"
                          ? "To Do"
                          : status === "in_progress"
                            ? "In Progress"
                            : "Completed"}
                      </span>
                      {history.length > 0 && (
                        <span>
                          {history.length} focus{" "}
                          {history.length === 1 ? "session" : "sessions"} ·{" "}
                          {savedMinutes} focused min
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="row-actions"
                    role="group"
                    aria-label={`Actions for ${task.title}`}
                  >
                    {unfinished?.task === task._id ? (
                      <Link
                        className="task-icon-action primary"
                        aria-label="Return to Timer"
                        data-tooltip="Return to Timer"
                        to={`/focus/${unfinished._id}`}
                      >
                        <TaskActionIcon action="timer" />
                      </Link>
                    ) : task.status !== "completed" ? (
                      <button
                        className="task-icon-action primary"
                        aria-label="Focus on Task"
                        data-tooltip="Focus on Task"
                        disabled={Boolean(busy)}
                        onClick={() => void focusTask(task)}
                      >
                        <TaskActionIcon action="focus" />
                      </button>
                    ) : (
                      history[0] && (
                        <Link
                          className="task-icon-action"
                          aria-label="View Session"
                          data-tooltip="View Session"
                          to={`/focus/${history[0]._id}`}
                        >
                          <TaskActionIcon action="history" />
                        </Link>
                      )
                    )}
                    <Link
                      className="task-icon-action"
                      aria-label="Edit"
                      data-tooltip="Edit Task"
                      to={`/tasks/${task._id}/edit`}
                    >
                      <TaskActionIcon action="edit" />
                    </Link>
                    <button
                      className="task-icon-action danger"
                      aria-label="Delete"
                      data-tooltip={
                        hasTimer
                          ? "End this task’s current timer before deleting it"
                          : "Delete Task"
                      }
                      disabled={Boolean(busy) || hasTimer}
                      onClick={() => remove(task)}
                    >
                      <TaskActionIcon action="delete" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {tasks.length > 5 && (
          <Pagination
            currentPage={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            label="Task pages"
            itemLabel="Tasks per page"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </LoadState>
    </section>
  );
}

export function TaskFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user, notify } = useCafe();
  const navigate = useNavigate();
  const state = useApi<Task | null>(async () => {
    if (!id) return null;
    const [task, sessions] = await Promise.all([
      cafeApi.task(id),
      cafeApi.sessions(user!._id),
    ]);
    const working = sessions.some(
      (session) =>
        session.task === id && ["active", "paused"].includes(session.status),
    );
    return {
      ...task,
      status: working && task.status === "todo" ? "in_progress" : task.status,
    };
  }, [id, user!._id]);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskEditorValues>({
    resolver: zodResolver(taskEditorSchema),
    defaultValues: { title: "", status: "todo" },
  });
  useEffect(() => {
    if (state.data)
      reset({ title: state.data.title, status: state.data.status });
  }, [state.data, reset]);

  async function submit(values: TaskEditorValues) {
    setError("");
    try {
      const task = id
        ? await cafeApi.updateTask(id, values)
        : await cafeApi.createTask({
            title: values.title,
            status: "todo",
            user: user!._id,
            description: "",
            deadline: new Date(Date.now() + 86400000).toISOString(),
            difficulty: "medium",
            estimatedMinutes: 25,
            requestKey: pendingRequest(user!._id + "-task-form"),
          });
      if (!id) clearPendingRequest(user!._id + "-task-form");
      notify(id ? "Task updated." : "Task added to the task board.");
      navigate(
        params.get("next") === "focus"
          ? `/study/drink?task=${task._id}`
          : "/tasks",
      );
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  return (
    <section className="page narrow task-editor">
      <PageNavigation to="/tasks" label="Back to Task Board" />
      <PageHeading
        eyebrow="Your task board"
        title={id ? "Edit Task" : "Add Task"}
        description={
          id
            ? "Update what you are working on and where it stands."
            : "One thing you want to work on. You can choose your drink and focus time when you begin."
        }
      />
      <LoadState {...state} retry={state.reload}>
        {state.data && state.data.user !== user!._id ? (
          <EmptyState
            title="This task belongs to another profile."
            to="/tasks"
            label="Back to your tasks"
          />
        ) : (
          <form
            className="paper-form"
            onSubmit={handleSubmit(submit)}
            noValidate
          >
            <Field label="I will…" error={errors.title?.message}>
              <textarea
                {...register("title")}
                rows={4}
                placeholder="build a cool new thing…"
                autoFocus
              />
            </Field>
            {id && (
              <Field
                label="Task Status"
                error={errors.status?.message}
                hint="Track the task itself. Changing this does not pause or stop a focus timer."
              >
                <select {...register("status")}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
            )}
            <Feedback error={error} />
            <div className="form-actions">
              <Link className="button secondary" to="/tasks">
                Cancel
              </Link>
              <button className="button" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : id ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </form>
        )}
      </LoadState>
    </section>
  );
}
