import { useEffect, useMemo, useState } from "react";
import type { FocusSession } from "../types";

export function useFocusTimer(session: FocusSession | null) {
  const [now, setNow] = useState(Date.now());
  const offset = useMemo(
    () =>
      session?.serverTime
        ? new Date(session.serverTime).getTime() - Date.now()
        : 0,
    [session],
  );
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);
  const until = session?.pausedAt || session?.endedAt;
  const clock = until ? new Date(until).getTime() : now + offset;
  const elapsedSeconds = session?.startedAt
    ? Math.max(
        0,
        Math.floor(
          (clock -
            new Date(session.startedAt).getTime() -
            (session.pausedMilliseconds || 0)) /
            1000,
        ),
      )
    : 0;
  const remainingSeconds = Math.max(
    0,
    (session?.plannedMinutes || 0) * 60 - elapsedSeconds,
  );
  const fullFocus = Boolean(
    session?.startedAt &&
      (session.status === "completed"
        ? session.completedMinutes >= session.plannedMinutes
        : session.status === "active" && remainingSeconds === 0),
  );
  const scheduledEnd = session?.startedAt
    ? new Date(session.startedAt).getTime() +
      session.plannedMinutes * 60000 +
      (session.pausedMilliseconds || 0)
    : 0;
  const breakStart = session?.breakStartedAt
    ? new Date(session.breakStartedAt).getTime()
    : fullFocus
      ? scheduledEnd
      : 0;
  const breakRemainingSeconds = breakStart
    ? Math.max(
        0,
        session!.breakMinutes * 60 -
          Math.floor((now + offset - breakStart) / 1000),
      )
    : 0;
  const rewardBreakRemainingSeconds = session?.rewardBreakEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(session.rewardBreakEndsAt).getTime() - (now + offset)) /
            1000,
        ),
      )
    : 0;
  return {
    rewardBreakRemainingSeconds,
    remainingSeconds,
    breakRemainingSeconds,
    elapsedSeconds,
    elapsedMinutes: Math.min(120, Math.floor(elapsedSeconds / 60)),
  };
}
