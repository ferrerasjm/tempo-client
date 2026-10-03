import { useEffect, useState } from 'react';
import type { FocusSession } from '../types';

export function useFocusTimer(session: FocusSession | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const elapsedSeconds = session?.startedAt ? Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000)) : 0;
  const remainingSeconds = Math.max(0, (session?.plannedMinutes || 0) * 60 - elapsedSeconds);
  const breakRemainingSeconds = session?.endedAt ? Math.max(0, session.breakMinutes * 60 - Math.floor((now - new Date(session.endedAt).getTime()) / 1000)) : 0;
  return { remainingSeconds, breakRemainingSeconds, elapsedMinutes: Math.min(120, Math.floor(elapsedSeconds / 60)) };
}
