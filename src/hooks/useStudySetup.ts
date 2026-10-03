import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cafeApi } from '../services/cafeApi';
import { useApi } from './useApi';
import { useCafe } from '../state/CafeContext';
import { errorMessage } from '../api/http';
import { focusSchema, type FocusValues } from '../schemas/forms';
import type { Recommendation } from '../types';

export function useStudySetup() {
  const { user, notify } = useCafe(); const navigate = useNavigate(); const [params] = useSearchParams();
  const state = useApi(async () => {
    const [tasks, areas, sessions] = await Promise.all([cafeApi.tasks(user!._id), cafeApi.areas(), cafeApi.sessions(user!._id)]);
    return { tasks: tasks.filter(task => task.status !== 'completed'), areas: areas.filter(area => area.active), active: sessions.find(session => session.status === 'active') };
  }, [user!._id]);
  const form = useForm<FocusValues>({ resolver: zodResolver(focusSchema), defaultValues: { task: params.get('task') || '', area: params.get('area') || '', energyLevel: 'medium' } });
  const [step, setStep] = useState(0); const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const task = form.watch('task'); const area = form.watch('area'); const energyLevel = form.watch('energyLevel');
  useEffect(() => {
    if (!state.data) return;
    if (!state.data.tasks.some(item => item._id === task)) form.setValue('task', state.data.tasks[0]?._id || '');
    if (!state.data.areas.some(item => item._id === area)) form.setValue('area', state.data.areas[0]?._id || '');
  }, [state.data, task, area, form]);
  useEffect(() => { setRecommendation(null); setError(''); }, [task, area, energyLevel]);
  async function next() {
    if (step < 2) {
      if (await form.trigger(step === 0 ? 'task' : 'area')) setStep(step + 1);
      return;
    }
    await form.handleSubmit(async values => {
      setBusy(true); setError('');
      try { setRecommendation(await cafeApi.recommendation(values.task, values.energyLevel)); setStep(3); }
      catch (reason) { setError(errorMessage(reason)); }
      finally { setBusy(false); }
    })();
  }
  async function start() {
    if (!recommendation) return;
    setBusy(true); setError('');
    try {
      const session = await cafeApi.startSession({ user: user!._id, ...form.getValues() });
      notify('Your focus session has started.'); navigate('/focus/' + session._id);
    } catch (reason) { setError(errorMessage(reason)); state.reload(); }
    finally { setBusy(false); }
  }
  return { state, form, step, recommendation, error, busy, next, start, back: () => { setError(''); setStep(Math.max(0, step - 1)); } };
}
