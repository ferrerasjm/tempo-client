import { useEffect, useRef, useState } from 'react';
import { cafeApi } from '../services/cafeApi';
import { useApi } from './useApi';
import { useFocusTimer } from './useFocusTimer';
import { errorMessage } from '../api/http';
import { useCafe } from '../state/CafeContext';
import type { FocusSession, RewardItem } from '../types';

export function useFocusRoom(id: string) {
  const { notify } = useCafe();
  const state = useApi(async () => {
    const session = await cafeApi.session(id);
    const [task, areas] = await Promise.all([cafeApi.task(session.task), cafeApi.areas()]);
    return { session, task, areas };
  }, [id]);
  const [updated, setUpdated] = useState<FocusSession | null>(null);
  const [viewIndex, setViewIndex] = useState(-1);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { setUpdated(null); setViewIndex(-1); setError(''); }, [id]);
  const session = updated || state.data?.session || null;
  const timer = useFocusTimer(session);
  const rewards = useApi(() => session ? cafeApi.rewards(session.user) : Promise.resolve(null), [session?.user, session?.status]);
  const autoResumeAttempt = useRef('');
  const area = viewIndex >= 0 ? state.data?.areas[viewIndex] : state.data?.areas.find(item => item._id === session?.area);
  const seats = useApi(async () => {
    if (!session || !area) return null;
    const start = new Date();
    const end = new Date(start.getTime() + Math.max(60, timer.remainingSeconds) * 1000);
    return cafeApi.availability(area._id, start.toISOString(), end.toISOString());
  }, [area?._id, session?.status, session?.area, id]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      seats.reload(); rewards.reload();
      if (session && ['planned', 'active', 'paused'].includes(session.status)) cafeApi.session(id).then(setUpdated).catch(() => {});
    }, 15000);
    return () => window.clearInterval(interval);
  }, [area?._id, session?.status, id]);
  const holdsSeat = session?.status === 'active' && area?._id === session.area && timer.remainingSeconds > 0;
  const canTakeSeat = !seats.loading && !seats.error && Boolean(area?.active && (holdsSeat || seats.data?.available));
  async function action(value: 'start' | 'pause' | 'resume' | 'move' | 'stop', reward?: RewardItem) {
    if (!session || !area || busy) return;
    if (value === 'stop' && !window.confirm('Stop this session and save your focused minutes? Sessions under one minute will be cancelled.')) return;
    setBusy(true); setError('');
    try {
      const result = await cafeApi.sessionAction(id, value, area._id, reward);
      setUpdated(result); seats.reload(); rewards.reload();
      if (value === 'stop') notify(result.status === 'completed' ? 'Your focus time is saved.' : 'Session ended without completed focus minutes.');
    } catch (reason) {
      if (value === 'resume') {
        try {
          const saved = await cafeApi.session(id);
          if (saved.status === 'active') { setUpdated(saved); seats.reload(); return; }
        } catch { /* Keep the original action error. */ }
      }
      setError(errorMessage(reason)); seats.reload();
    }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const key = session?.rewardBreakEndsAt || '';
    if (session?.status === 'paused' && key && timer.rewardBreakRemainingSeconds === 0 && !busy && !seats.loading && autoResumeAttempt.current !== key) {
      autoResumeAttempt.current = key;
      void action('resume');
    }
  }, [session?.status, session?.rewardBreakEndsAt, timer.rewardBreakRemainingSeconds, busy, seats.loading]);
  function browse(index: number) {
    setViewIndex(index); setError('');
  }
  return { state, session, area, timer, seats, rewards, holdsSeat, canTakeSeat, busy, error, action, viewIndex, browse };
}
