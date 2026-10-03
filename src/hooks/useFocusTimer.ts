import { useEffect, useMemo, useState } from 'react';
import type { FocusSession } from '../types';

export function useFocusTimer(session: FocusSession | null) {
  const [now, setNow] = useState(Date.now());
  const offset = useMemo(() => session?.serverTime ? new Date(session.serverTime).getTime() - Date.now() : 0, [session]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const until = session?.pausedAt || session?.endedAt;
  const clock = until ? new Date(until).getTime() : now + offset;
  const elapsedSeconds = session?.startedAt ? Math.max(0, Math.floor((clock - new Date(session.startedAt).getTime() - (session.pausedMilliseconds || 0)) / 1000)) : 0;
  const remainingSeconds = Math.max(0, (session?.plannedMinutes || 0) * 60 - elapsedSeconds);
  const breakRemainingSeconds = session?.endedAt ? Math.max(0, session.breakMinutes * 60 - Math.floor((now + offset - new Date(session.endedAt).getTime()) / 1000)) : 0;
  const rewardBreakRemainingSeconds = session?.rewardBreakEndsAt ? Math.max(0, Math.ceil((new Date(session.rewardBreakEndsAt).getTime() - (now + offset)) / 1000)) : 0;
  return { rewardBreakRemainingSeconds, remainingSeconds, breakRemainingSeconds, elapsedSeconds, elapsedMinutes: Math.min(120, Math.floor(elapsedSeconds / 60)) };
}
