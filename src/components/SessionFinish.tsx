import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cafeApi } from "../services/cafeApi";
import { errorMessage } from "../api/http";
import { useApi } from "../hooks/useApi";
import type { useFocusRoom } from "../hooks/useFocusRoom";
import { nextTaskSchema, type NextTaskValues } from "../schemas/forms";
import {
  drinkSizes,
  useStudyDraft,
  type DrinkSize,
} from "../state/StudyDraftContext";
import { pendingRequest, clearPendingRequest } from "../utils/pendingRequests";
import { Modal } from "./Modal";
import { MenuArtwork } from "./MenuArtwork";
import { Feedback, Field, LoadState } from "./ui";

export function SessionFinish({
  room,
  onExplore,
}: {
  room: ReturnType<typeof useFocusRoom>;
  onExplore: () => void;
}) {
  const session = room.session!;
  const navigate = useNavigate();
  const { update } = useStudyDraft();
  const storageKey = "tempo-next-" + session._id;
  const [pending] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  });
  const taskDeleted = Boolean(room.state.data?.task.deletedAt);
  const currentTaskTitle =
    session.taskTitle || room.state.data?.task.title || "";
  const initialContinueTask =
    !taskDeleted &&
    (typeof pending.continueTask === "boolean"
      ? pending.continueTask
      : Boolean(session.taskConfirmed && session.taskCompleted === false));
  const [step, setStep] = useState<"confirm" | "next" | null>(
    pending.step === "next" && session.taskConfirmed ? "next" : null,
  );
  const [drinkId, setDrinkId] = useState(
    pending.drinkId || session.drink || "",
  );
  const [size, setSize] = useState<DrinkSize>(
    drinkSizes.find(
      (item) => item.value === (pending.size || session.drinkSize),
    )?.value || "tall",
  );
  const [nextTaskId, setNextTaskId] = useState(pending.nextTaskId || "");
  const [continueTask, setContinueTask] = useState(initialContinueTask);
  const [taskFinished, setTaskFinished] = useState(
    taskDeleted ||
      (session.taskConfirmed
        ? (session.taskCompleted ??
          room.state.data?.task.status === "completed")
        : false),
  );
  const [error, setError] = useState("");
  const form = useForm<NextTaskValues>({
    resolver: zodResolver(nextTaskSchema),
    defaultValues: {
      title: initialContinueTask ? currentTaskTitle : pending.title || "",
    },
  });
  const menu = useApi(
    async () =>
      step === "next"
        ? (await cafeApi.menu()).filter(
            (item) => item.category === "drink" && item.available,
          )
        : [],
    [step],
  );
  const drinks = menu.data || [];
  const drink = drinks.find((item) => item._id === drinkId) || drinks[0];
  const selectedSize = drinkSizes.find((item) => item.value === size)!;
  const busy = room.busy || form.formState.isSubmitting;

  const title = form.watch("title");
  useEffect(() => {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ step, drinkId, size, nextTaskId, continueTask, title }),
    );
  }, [storageKey, step, drinkId, size, nextTaskId, continueTask, title]);
  useEffect(() => {
    if (
      (session.status === "active" && room.timer.remainingSeconds === 0) ||
      (session.status === "completed" && !session.taskConfirmed)
    )
      setStep("confirm");
  }, [session.status, session.taskConfirmed, room.timer.remainingSeconds]);

  async function confirm(taskCompleted: boolean) {
    const confirmed = await room.finish(taskCompleted);
    if (confirmed) {
      const complete =
        taskDeleted || (confirmed.taskCompleted ?? taskCompleted);
      setTaskFinished(complete);
      setContinueTask(!complete);
      form.setValue("title", complete ? "" : currentTaskTitle);
      setStep("next");
    }
  }
  function changeDrink(direction: number) {
    if (!drink || !drinks.length) return;
    const index = drinks.findIndex((item) => item._id === drink._id);
    setDrinkId(drinks[(index + direction + drinks.length) % drinks.length]._id);
  }
  function changeSize(direction: number) {
    const index = drinkSizes.findIndex((item) => item.value === size);
    setSize(
      drinkSizes[(index + direction + drinkSizes.length) % drinkSizes.length]
        .value,
    );
  }
  async function startNext(values: { title: string }) {
    if (!drink || !room.area) return;
    setError("");
    try {
      const body = {
        user: session.user,
        title: values.title,
        description: "",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        difficulty: "medium",
        estimatedMinutes: selectedSize.minutes,
        status: "todo",
      };
      const task = continueTask
        ? await cafeApi.task(session.task)
        : nextTaskId
          ? await cafeApi.updateTask(nextTaskId, body)
          : await cafeApi.createTask({
              ...body,
              requestKey: pendingRequest(session._id + "-next-task"),
            });
      if (!continueTask) setNextTaskId(task._id);
      const next = await cafeApi.startSession({
        requestKey: pendingRequest(session._id + "-next-session"),
        user: session.user,
        task: task._id,
        area: room.area._id,
        energyLevel: session.energyLevel,
        drink: drink._id,
        drinkSize: size,
        sessionLabel: session.sessionLabel,
        status: "active",
      });
      update({
        drink: drink._id,
        size,
        label: session.sessionLabel || "",
        taskId: task._id,
      });
      sessionStorage.removeItem(storageKey);
      clearPendingRequest(session._id + "-next-task");
      clearPendingRequest(session._id + "-next-session");
      setStep(null);
      navigate("/focus/" + next._id);
    } catch (reason) {
      setError(
        "The session could not start. Any saved task remains on the Task Board; select Go to retry. " +
          errorMessage(reason),
      );
    }
  }
  return (
    <>
      {step === null &&
        !session.taskConfirmed &&
        ((session.status === "active" && room.timer.remainingSeconds === 0) ||
          session.status === "completed") && (
          <button
            className="button finish-reopen"
            onClick={() => setStep("confirm")}
          >
            Review Task Status
          </button>
        )}
      {step === null &&
        session.status === "completed" &&
        session.taskConfirmed && (
          <div className="break-actions">
            <button className="button secondary" onClick={onExplore}>
              Explore
            </button>
            <button className="button" onClick={() => setStep("next")}>
              Choose Next Cup
            </button>
          </div>
        )}
      <Modal
        open={step !== null}
        title={
          step === "confirm"
            ? "Did you complete this task?"
            : taskFinished
              ? "Good job! Next cup?"
              : "Continue with another cup?"
        }
        className="session-finish"
        busy={busy}
        onClose={() => setStep(null)}
      >
        {step === "confirm" ? (
          <>
            <div className="finished-drink">
              <MenuArtwork name={session.drinkName || "Cafe Latte"} />
            </div>
            <p className="finished-task">
              {session.taskTitle || room.state.data?.task.title}
            </p>
            <p className="finish-note">
              Your focus time will be saved either way. If the task is still in
              progress, you can continue it in another session.
            </p>
            <Feedback error={room.error} />
            <div className="finish-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void confirm(false)}
              >
                Keep Task In Progress
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={() => void confirm(true)}
              >
                {busy ? "Saving…" : "Mark Task Complete"}
              </button>
            </div>
          </>
        ) : (
          step === "next" && (
            <LoadState {...menu} retry={menu.reload}>
              {drink ? (
                <form onSubmit={form.handleSubmit(startNext)} noValidate>
                  <div className="next-drink-picker">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Previous drink"
                      disabled={busy || drinks.length < 2}
                      onClick={() => changeDrink(-1)}
                    >
                      ←
                    </button>
                    <div>
                      <MenuArtwork name={drink.name} />
                      <p>{drink.name}</p>
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Next drink"
                      disabled={busy || drinks.length < 2}
                      onClick={() => changeDrink(1)}
                    >
                      →
                    </button>
                  </div>
                  <div className="next-size-picker">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Previous size"
                      disabled={busy}
                      onClick={() => changeSize(-1)}
                    >
                      ←
                    </button>
                    <p>
                      {selectedSize.label} · {selectedSize.minutes} min
                    </p>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Next size"
                      disabled={busy}
                      onClick={() => changeSize(1)}
                    >
                      →
                    </button>
                  </div>
                  {!taskFinished && (
                    <div className="next-task-section">
                      <p className="next-task-status">
                        Your task is still in progress.
                      </p>
                      <fieldset className="entry-task-choice">
                        <legend className="sr-only">
                          Choose the task for your next session
                        </legend>
                        <label>
                          <input
                            type="radio"
                            name="nextTaskChoice"
                            checked={continueTask}
                            disabled={busy}
                            onChange={() => {
                              setContinueTask(true);
                              form.setValue("title", currentTaskTitle);
                            }}
                          />
                          <span>Continue Current Task</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="nextTaskChoice"
                            checked={!continueTask}
                            disabled={busy}
                            onChange={() => {
                              setContinueTask(false);
                              form.setValue("title", "");
                            }}
                          />
                          <span>New Task</span>
                        </label>
                      </fieldset>
                    </div>
                  )}
                  {continueTask && !taskFinished ? (
                    <p
                      className="continuing-task"
                      aria-label="Task for the next session"
                    >
                      {currentTaskTitle}
                    </p>
                  ) : (
                    <Field
                      label={
                        taskFinished
                          ? "What will you work on next?"
                          : "New task"
                      }
                      error={form.formState.errors.title?.message}
                    >
                      <input
                        {...form.register("title")}
                        placeholder="e.g. finish the report…"
                        disabled={busy}
                        autoComplete="off"
                      />
                    </Field>
                  )}
                  <Feedback error={error} />
                  <button className="button" disabled={busy}>
                    {busy ? "Preparing…" : "Go"}
                  </button>
                </form>
              ) : (
                <p>No drinks are available right now.</p>
              )}
            </LoadState>
          )
        )}
      </Modal>
    </>
  );
}
