import { useEffect, type ReactNode } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCafe } from "../state/CafeContext";
import { drinkSizes, useStudyDraft } from "../state/StudyDraftContext";
import { useStudyEntry } from "../hooks/useStudyEntry";
import { useApi } from "../hooks/useApi";
import { cafeApi } from "../services/cafeApi";
import { localInput } from "../utils/dates";
import {
  studyLabelSchema,
  studyTaskSchema,
  type StudyLabelValues,
  type StudyTaskValues,
} from "../schemas/forms";
import { EmptyState, Feedback, Field, LoadState } from "../components/ui";
import { MenuArtwork } from "../components/MenuArtwork";
import { useSfx } from "../hooks/useSfx";
import { PageNavigation } from "../state/SessionNavigation";

function EntryPaper({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const parents: Record<string, [string, string]> = {
    "/study/size": ["/study/drink", "Back to Drinks"],
    "/study/label": ["/study/size", "Back to Drink Size"],
    "/study/task": ["/study/label", "Back to Drink Label"],
  };
  const [to, label] = parents[pathname] || ["/welcome", "Back to Welcome"];
  return (
    <section className="page narrow centered entry-page">
      <div className="entry-paper">
        <PageNavigation to={to} label={label} />
        {title && <h1>{title}</h1>}
        <div className="entry-content">{children}</div>
      </div>
    </section>
  );
}

export function StudyDrinkPage() {
  const { user } = useCafe();
  const { draft, update } = useStudyDraft();
  const [params] = useSearchParams();
  const { play } = useSfx();
  const state = useApi(async () => {
    const [items, sessions] = await Promise.all([
      cafeApi.menu(),
      cafeApi.sessions(user!._id),
    ]);
    return {
      drinks: items.filter((item) => item.category === "drink"),
      unfinished: sessions.find((item) =>
        ["planned", "active", "paused"].includes(item.status),
      ),
    };
  }, [user!._id]);
  useEffect(() => {
    const requestedTask = params.get("task");
    const requestedArea = params.get("area");
    if (requestedArea && requestedArea !== draft.areaId)
      update({ areaId: requestedArea });
    if (
      requestedTask &&
      state.data?.unfinished === undefined &&
      requestedTask !== draft.taskId
    )
      update({ taskId: requestedTask });
  }, [params, state.data?.unfinished, draft.taskId, update]);
  const chosen = state.data?.drinks.find(
    (item) => item._id === draft.drink && item.available,
  );
  if (state.data?.unfinished)
    return <Navigate to={"/focus/" + state.data.unfinished._id} replace />;
  return (
    <EntryPaper title="What would you like to drink?">
      <LoadState {...state} retry={state.reload}>
        {!state.data?.drinks.length ? (
          <EmptyState title="The drinks aren’t ready yet." />
        ) : (
          <>
            <div className="study-drinks">
              {state.data.drinks.map((item) => (
                <button
                  key={item._id}
                  className={
                    draft.drink === item._id
                      ? "drink-choice chosen"
                      : "drink-choice"
                  }
                  disabled={!item.available}
                  aria-pressed={draft.drink === item._id}
                  aria-label={"Choose " + item.name}
                  onClick={() => {
                    play("click");
                    update({ drink: item._id });
                  }}
                >
                  <MenuArtwork name={item.name} />
                  <span>{item.name}</span>
                  {!item.available && <small>Unavailable</small>}
                </button>
              ))}
            </div>
            {chosen ? (
              <Link className="button entry-next" to="/study/size">
                Next
              </Link>
            ) : (
              <button className="button" disabled>
                Choose A Drink First
              </button>
            )}
          </>
        )}
      </LoadState>
    </EntryPaper>
  );
}

function useSelectedDrink() {
  const { draft } = useStudyDraft();
  const state = useApi(
    async () =>
      (await cafeApi.menu()).find(
        (item) =>
          item._id === draft.drink &&
          item.category === "drink" &&
          item.available,
      ) || null,
    [draft.drink],
  );
  return { draft, state };
}

export function StudySizePage() {
  const { draft, state } = useSelectedDrink();
  const { update } = useStudyDraft();
  const { play } = useSfx();
  if (!draft.drink) return <Navigate to="/study/drink" replace />;
  return (
    <EntryPaper title="Find your rhythm.">
      <LoadState {...state} retry={state.reload}>
        {state.data ? (
          <>
            <div className="entry-drink">
              <MenuArtwork name={state.data.name} />
            </div>
            <fieldset className="size-choices">
              <legend className="sr-only">Drink size and timer duration</legend>
              {drinkSizes.map((size) => (
                <label
                  className={draft.size === size.value ? "selected" : ""}
                  key={size.value}
                >
                  <input
                    type="radio"
                    name="drinkSize"
                    value={size.value}
                    checked={draft.size === size.value}
                    onChange={() => {
                      play("click");
                      update({ size: size.value });
                    }}
                  />
                  <span>{size.label}</span>
                  <span className="dotted-line" />
                  <span>{size.minutes} minutes</span>
                </label>
              ))}
            </fieldset>
            <Link className="button entry-next" to="/study/label">
              Next
            </Link>
          </>
        ) : (
          <EmptyState
            title="Choose another drink."
            to="/study/drink"
            label="Back To Drinks"
          />
        )}
      </LoadState>
    </EntryPaper>
  );
}

export function StudyLabelPage() {
  const { user } = useCafe();
  const { draft, state } = useSelectedDrink();
  const { update } = useStudyDraft();
  const navigate = useNavigate();
  const form = useForm<StudyLabelValues>({
    resolver: zodResolver(studyLabelSchema),
    defaultValues: {
      label: draft.label || user!.displayName.trim().split(/\s+/)[0],
    },
  });
  if (!draft.drink) return <Navigate to="/study/drink" replace />;
  return (
    <EntryPaper>
      <LoadState {...state} retry={state.reload}>
        {state.data ? (
          <form
            onSubmit={form.handleSubmit((values) => {
              update(values);
              navigate("/study/task");
            })}
            noValidate
          >
            <div className="drink-ticket">
              <MenuArtwork name={state.data.name} />
              <Field
                label="DRINK FOR"
                error={form.formState.errors.label?.message}
              >
                <input
                  maxLength={80}
                  {...form.register("label")}
                  autoComplete="off"
                />
              </Field>
              <div className="drink-ticket-footer">
                <span>
                  1x {draft.size} {state.data.name}
                </span>
                <span className="drink-ticket-order">
                  Order #{draft.orderNumber}
                </span>
              </div>
            </div>
            <button className="button entry-next">Next</button>
          </form>
        ) : (
          <EmptyState
            title="Choose another drink."
            to="/study/drink"
            label="Back To Drinks"
          />
        )}
      </LoadState>
    </EntryPaper>
  );
}

export function StudyTaskPage() {
  const entry = useStudyEntry();
  const { user } = useCafe();
  const state = useApi(
    () =>
      entry.draft.taskId
        ? cafeApi.task(entry.draft.taskId)
        : Promise.resolve(null),
    [entry.draft.taskId],
  );
  const tasks = useApi(() => cafeApi.tasks(user!._id), [user!._id]);
  const form = useForm<StudyTaskValues>({
    resolver: zodResolver(studyTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: localInput(new Date(Date.now() + 86400000)),
      difficulty: "medium",
      estimatedMinutes: entry.minutes,
      status: "todo",
      energyLevel: "medium",
    },
  });
  useEffect(() => {
    if (
      tasks.data &&
      entry.draft.taskId &&
      !tasks.data.some(
        (item) =>
          item._id === entry.draft.taskId && item.status !== "completed",
      )
    ) {
      entry.update({ taskId: "" });
      form.reset({
        title: "",
        description: "",
        deadline: localInput(new Date(Date.now() + 86400000)),
        difficulty: "medium",
        estimatedMinutes: entry.minutes,
        status: "todo",
        energyLevel: form.getValues("energyLevel"),
      });
    }
  }, [tasks.data]);
  useEffect(() => {
    if (
      state.data &&
      state.data.user === user!._id &&
      state.data.status !== "completed"
    )
      form.reset({
        ...state.data,
        deadline: localInput(state.data.deadline),
        energyLevel: form.getValues("energyLevel"),
      });
  }, [state.data, form]);
  if (!entry.draft.drink) return <Navigate to="/study/drink" replace />;
  if (!entry.draft.label.trim()) return <Navigate to="/study/label" replace />;
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  return (
    <EntryPaper title="One thing at a time.">
      <LoadState {...state} retry={state.reload}>
        <form onSubmit={form.handleSubmit(entry.prepare)} noValidate>
          <LoadState {...tasks} retry={tasks.reload}>
            <p className="eyebrow">What are you working on?</p>
          </LoadState>
          <div className="task-notepad">
            <p className="eyebrow">I WILL...</p>
            <Field label="Task to accomplish" error={errors.title?.message}>
              <textarea
                rows={4}
                placeholder={"build a cool\nnew thing..."}
                {...register("title")}
                autoFocus
              />
            </Field>
          </div>
          <p className="note">{entry.minutes} minutes of focus.</p>
          <Feedback error={entry.error} />
          <button
            className="button"
            disabled={
              isSubmitting ||
              tasks.loading ||
              Boolean(tasks.error) ||
              (Boolean(entry.draft.taskId) &&
                (!state.data ||
                  state.data.user !== user!._id ||
                  state.data.status === "completed"))
            }
          >
            {isSubmitting ? "Preparing…" : "Start"}
          </button>
        </form>
      </LoadState>
    </EntryPaper>
  );
}
