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
    if (!areas.some(area => area._id === session.area)) throw new Error('This session’s cafe space is no longer available.');
    return { session, task, areas: areas.filter(area => area.active || area._id === session.area) };
  }, [id]);
  const [updated, setUpdated] = useState<FocusSession | null>(null);
  const [viewIndex, setViewIndex] = useState(-1);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [pollError, setPollError] = useState('');
  useEffect(() => { setUpdated(null); setError(''); setPollError(''); }, [id]);
  const session = updated || state.data?.session || null;
  const timer = useFocusTimer(session);
  const autoResumeAttempt = useRef('');
  const area = viewIndex >= 0 ? state.data?.areas[viewIndex] : state.data?.areas.find(item => item._id === session?.area);
  useEffect(() => {
    let current = true;
    const interval = window.setInterval(() => {
      if (!busy && session && ['planned', 'active', 'paused'].includes(session.status)) cafeApi.session(id).then(saved => { if (current) { setUpdated(saved); setPollError(''); } }).catch(reason => { if (current) setPollError(errorMessage(reason)); });
    }, 15000);
    return () => { current = false; window.clearInterval(interval); };
  }, [session?.status, id, busy]);
  async function action(value: 'start' | 'pause' | 'resume' | 'move' | 'stop', reward?: RewardItem, targetArea?: string) {
    if (!session || !area || busy) return;
    if (value === 'stop' && !window.confirm('Stop this session and save your focused minutes? Sessions under one minute will be cancelled.')) return;
    setBusy(true); setError('');
    try {
      const result = await cafeApi.sessionAction(id, value, targetArea || session.area, reward);
      setUpdated(result);
      if (value === 'stop') notify(result.status === 'completed' ? 'Your focus time is saved.' : 'Session ended without completed focus minutes.');
    } catch (reason) {
      if (value === 'resume') {
        try {
          const saved = await cafeApi.session(id);
          if (saved.status === 'active') { setUpdated(saved); return; }
        } catch { /* Keep the original action error. */ }
      }
      setError(errorMessage(reason));
    }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const key = session?.rewardBreakEndsAt || '';
    if (session?.status === 'paused' && key && timer.rewardBreakRemainingSeconds === 0 && !busy && autoResumeAttempt.current !== key) {
      autoResumeAttempt.current = key;
      void action('resume');
    }
  }, [session?.status, session?.rewardBreakEndsAt, timer.rewardBreakRemainingSeconds, busy]);
  async function finish(taskCompleted: boolean) {
    if (!session || busy) return false;
    setBusy(true); setError('');
    try {
      // Saving first lets the existing task route award completion credits.
      const saved = session.status === 'completed' ? session : await cafeApi.sessionAction(id, 'stop');
      setUpdated(saved);
      const confirmed = await cafeApi.confirmSessionTask(id, taskCompleted);
      setUpdated(confirmed);
      notify('Your focus time is saved.');
      return confirmed;
    } catch (reason) {
      setError(errorMessage(reason));
      // If the save succeeded but its response was lost, a retry must not stop twice.
      try { setUpdated(await cafeApi.session(id)); } catch { /* Keep the save error visible. */ }
      return false;
    } finally { setBusy(false); }
  }
  async function browse(index: number) {
    if (busy) return;
    if (index === -1) { setViewIndex(index); return; }
    const target = state.data?.areas[index];
    if (!target || !session) return;
    if (target._id === session.area || ['completed', 'cancelled'].includes(session.status)) { setViewIndex(index); return; }
    setBusy(true); setError('');
    try {
      setUpdated(await cafeApi.sessionAction(id, 'move', target._id));
      setViewIndex(index);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  return { state, session, area, timer, busy, error: error || pollError, action, finish, viewIndex, browse };
}
