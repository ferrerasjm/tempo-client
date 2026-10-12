import type { FocusSession } from "../types";

export function sessionReturn(sessions: FocusSession[], now = Date.now()) {
  const unfinished = sessions.find((session) =>
    ["planned", "active", "paused"].includes(session.status),
  );
  if (unfinished) return { session: unfinished, label: "Return to Timer" };

  const activeBreak = sessions.find((session) => {
    if (
      session.status !== "completed" ||
      session.completedMinutes < session.plannedMinutes
    )
      return false;
    const started = session.breakStartedAt || session.endedAt;
    return Boolean(
      started &&
      new Date(started).getTime() + session.breakMinutes * 60000 > now,
    );
  });
  if (activeBreak) return { session: activeBreak, label: "Return to Break" };

  const latest = sessions.find((session) => session.status !== "cancelled");
  return latest ? { session: latest, label: "Return to Session" } : null;
}
