import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCafe } from "../state/CafeContext";
import { drinkSizes, useStudyDraft } from "../state/StudyDraftContext";
import { cafeApi } from "../services/cafeApi";
import { errorMessage } from "../api/http";
import { pendingRequest, clearPendingRequest } from "../utils/pendingRequests";
import type { StudyTaskValues } from "../schemas/forms";

export function useStudyEntry() {
  const { user, notify } = useCafe();
  const { draft, update } = useStudyDraft();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  async function prepare(values: StudyTaskValues) {
    setError("");
    let taskSaved = false;
    try {
      const areas = await cafeApi.areas();
      const area =
        areas.find((item) => item.active && item._id === draft.areaId) ||
        areas.find((item) => item.active && item.name === "Quiet Corner") ||
        areas.find((item) => item.active);
      if (!area) {
        setError("No cafe spaces are open right now. Please try again later.");
        return;
      }
      const taskBody = {
        ...values,
        user: user!._id,
        deadline: new Date(values.deadline).toISOString(),
      };
      const task = draft.taskId
        ? await cafeApi.updateTask(draft.taskId, taskBody)
        : await cafeApi.createTask({
            ...taskBody,
            requestKey: pendingRequest(user!._id + "-prepare-task"),
          });
      taskSaved = true;
      update({ taskId: task._id });
      const session = await cafeApi.startSession({
        requestKey: pendingRequest(user!._id + "-prepare-session"),
        user: user!._id,
        task: task._id,
        area: area._id,
        energyLevel: values.energyLevel,
        drink: draft.drink,
        drinkSize: draft.size,
        sessionLabel: draft.label,
        status: "planned",
      });
      clearPendingRequest(user!._id + "-prepare-task");
      clearPendingRequest(user!._id + "-prepare-session");
      notify("Your session is ready. Choose a space, then start your timer.");
      navigate("/focus/" + session._id);
    } catch (reason) {
      setError(
        (taskSaved
          ? "Your task is saved on the Task Board, but the session could not be prepared. Select Start to retry. "
          : "") + errorMessage(reason),
      );
    }
  }
  return {
    draft,
    update,
    error,
    prepare,
    minutes: drinkSizes.find((item) => item.value === draft.size)!.minutes,
  };
}
