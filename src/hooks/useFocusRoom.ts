import { useEffect, useRef, useState } from "react";
import { cafeApi } from "../services/cafeApi";
import { useApi } from "./useApi";
import { useFocusTimer } from "./useFocusTimer";
import { errorMessage } from "../api/http";
import { useCafe } from "../state/CafeContext";
import { useConfirmation } from "../state/ConfirmationContext";
import type { FocusSession, RewardItem } from "../types";
import { REWARDS_UPDATED_EVENT } from "../utils/rewardsEvents";

export function useFocusRoom(id: string) {
  const { notify } = useCafe();
  const confirm = useConfirmation();
  const state = useApi(async () => {
    const session = await cafeApi.session(id);
    const [task, areas, rewards] = await Promise.all([
      cafeApi.task(session.task),
      cafeApi.areas(),
      cafeApi.rewards(session.user),
    ]);
    if (!areas.some((area) => area._id === session.area))
      throw new Error("This session’s cafe space is no longer available.");
    return {
      session,
      task,
      areas: areas.filter((area) => area.active || area._id === session.area),
      rewards,
    };
  }, [id]);
  const [updated, setUpdated] = useState<FocusSession | null>(null);
  const viewKey = `tempo-focus-view-${id}`;
  const [viewedAreaId, setViewedAreaId] = useState(
    () => sessionStorage.getItem(viewKey) || "",
  );
  const viewIndex =
    state.data?.areas.findIndex((area) => area._id === viewedAreaId) ?? -1;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  useEffect(() => {
    setUpdated(null);
    setError("");
    setPollError("");
  }, [id]);
  useEffect(() => {
    setViewedAreaId(sessionStorage.getItem(viewKey) || "");
  }, [viewKey]);
  function rememberView(areaId: string) {
    if (areaId) sessionStorage.setItem(viewKey, areaId);
    else sessionStorage.removeItem(viewKey);
    setViewedAreaId(areaId);
  }
  const session = updated || state.data?.session || null;
  const timer = useFocusTimer(session);
  const autoResumeAttempt = useRef("");
  useEffect(() => {
    let current = true;
    async function refreshRewards() {
      if (!session?.user) return;
      try {
        const rewards = await cafeApi.rewards(session.user);
        if (current) state.update((saved) => saved && { ...saved, rewards });
      } catch (reason) {
        console.error("Could not refresh rewards after order update.", reason);
      }
    }
    window.addEventListener(REWARDS_UPDATED_EVENT, refreshRewards);
    return () => {
      current = false;
      window.removeEventListener(REWARDS_UPDATED_EVENT, refreshRewards);
    };
  }, [session?.user, state.update]);
  const area =
    viewIndex >= 0
      ? state.data?.areas[viewIndex]
      : state.data?.areas.find((item) => item._id === session?.area);
  useEffect(() => {
    let current = true;
    const interval = window.setInterval(() => {
      if (
        !busy &&
        session &&
        ["planned", "active", "paused"].includes(session.status)
      )
        cafeApi
          .session(id)
          .then((saved) => {
            if (current) {
              setUpdated(saved);
              setPollError("");
            }
          })
          .catch((reason) => {
            if (current) setPollError(errorMessage(reason));
          });
    }, 15000);
    return () => {
      current = false;
      window.clearInterval(interval);
    };
  }, [session?.status, id, busy]);
  async function action(
    value: "start" | "pause" | "resume" | "move" | "stop",
    reward?: RewardItem,
    targetArea?: string,
  ) {
    if (!session || !area || busy) return;
    if (
      value === "stop" &&
      !(await confirm({
        title: "Stop this session?",
        message:
          "Your focused minutes will be saved. Sessions under one minute will be cancelled.",
        confirmLabel: "Stop Session",
        cancelLabel: "Keep Focusing",
      }))
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await cafeApi.sessionAction(
        id,
        value,
        targetArea || session.area,
        reward,
      );
      setUpdated(result);
      if (value === "stop")
        notify(
          result.status === "completed"
            ? "Your focus time is saved."
            : "Session ended without completed focus minutes.",
        );
    } catch (reason) {
      if (value === "resume") {
        try {
          const saved = await cafeApi.session(id);
          if (saved.status === "active") {
            setUpdated(saved);
            return;
          }
        } catch {
        }
      }
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const key = session?.rewardBreakEndsAt || "";
    if (
      session?.status === "paused" &&
      key &&
      timer.rewardBreakRemainingSeconds === 0 &&
      !busy &&
      autoResumeAttempt.current !== key
    ) {
      autoResumeAttempt.current = key;
      void action("resume");
    }
  }, [
    session?.status,
    session?.rewardBreakEndsAt,
    timer.rewardBreakRemainingSeconds,
    busy,
  ]);
  async function finish(taskCompleted: boolean) {
    if (!session || busy) return false;
    setBusy(true);
    setError("");
    try {
      const saved =
        session.status === "completed"
          ? session
          : await cafeApi.sessionAction(id, "stop");
      setUpdated(saved);
      const confirmed = await cafeApi.confirmSessionTask(id, taskCompleted);
      setUpdated(confirmed);
      notify("Your focus time is saved.");
      return confirmed;
    } catch (reason) {
      setError(errorMessage(reason));
      try {
        setUpdated(await cafeApi.session(id));
      } catch {
      }
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function browse(index: number) {
    if (busy) return;
    const areaCount = state.data?.areas.length || 0;
    if (index < -1) index = areaCount - 1;
    else if (index >= areaCount) index = -1;
    if (index === -1) {
      rememberView("");
      return;
    }
    const target = state.data?.areas[index];
    if (!target || !session) return;
    if (
      target._id === session.area ||
      ["completed", "cancelled"].includes(session.status)
    ) {
      rememberView(target._id);
      return;
    }
    setBusy(true);
    setError("");
    try {
      setUpdated(await cafeApi.sessionAction(id, "move", target._id));
      rememberView(target._id);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return {
    state,
    session,
    area,
    timer,
    busy,
    error: error || pollError,
    action,
    finish,
    viewIndex,
    browse,
  };
}
