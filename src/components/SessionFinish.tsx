import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cafeApi } from '../services/cafeApi';
import { errorMessage } from '../api/http';
import { useApi } from '../hooks/useApi';
import type { useFocusRoom } from '../hooks/useFocusRoom';
import { nextTaskSchema, type NextTaskValues } from '../schemas/forms';
import { drinkSizes, useStudyDraft, type DrinkSize } from '../state/StudyDraftContext';
import { pendingRequest, clearPendingRequest } from '../utils/pendingRequests';
import { Modal } from './Modal';
import { MenuArtwork } from './MenuArtwork';
import { Feedback, Field, LoadState } from './ui';

export function SessionFinish({ room }: { room: ReturnType<typeof useFocusRoom> }) {
  const session = room.session!;
  const navigate = useNavigate();
  const { update } = useStudyDraft();
  const storageKey = 'tempo-next-' + session._id;
  const [pending] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  const [step, setStep] = useState<'confirm' | 'next' | null>(pending.step === 'next' && session.taskConfirmed ? 'next' : null);
  const [drinkId, setDrinkId] = useState(pending.drinkId || session.drink || '');
  const [size, setSize] = useState<DrinkSize>(drinkSizes.find(item => item.value === (pending.size || session.drinkSize))?.value || 'tall');
  const [nextTaskId, setNextTaskId] = useState(pending.nextTaskId || '');
  const [continueTask, setContinueTask] = useState(Boolean(pending.continueTask));
  const [taskFinished, setTaskFinished] = useState(session.taskConfirmed ? session.taskCompleted ?? room.state.data?.task.status === 'completed' : false);
  const [error, setError] = useState('');
  const form = useForm<NextTaskValues>({ resolver: zodResolver(nextTaskSchema), defaultValues: { title: pending.title || '' } });
  const menu = useApi(async () => step === 'next' ? (await cafeApi.menu()).filter(item => item.category === 'drink' && item.available) : [], [step]);
  const drinks = menu.data || [];
  const drink = drinks.find(item => item._id === drinkId) || drinks[0];
  const selectedSize = drinkSizes.find(item => item.value === size)!;
  const busy = room.busy || form.formState.isSubmitting;

  const title = form.watch('title');
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ step, drinkId, size, nextTaskId, continueTask, title }));
  }, [storageKey, step, drinkId, size, nextTaskId, continueTask, title]);
  useEffect(() => {
    if ((session.status === 'active' && room.timer.remainingSeconds === 0) || (session.status === 'completed' && !session.taskConfirmed)) setStep('confirm');
  }, [session.status, session.taskConfirmed, room.timer.remainingSeconds]);

  async function confirm(taskCompleted: boolean) {
    const confirmed = await room.finish(taskCompleted);
    if (confirmed) {
      const complete = confirmed.taskCompleted ?? taskCompleted;
      setTaskFinished(complete);
      setContinueTask(!complete);
      form.setValue('title', complete ? '' : room.state.data?.task.title || '');
      setStep('next');
    }
  }
  function changeDrink(direction: number) {
    if (!drink || !drinks.length) return;
    const index = drinks.findIndex(item => item._id === drink._id);
    setDrinkId(drinks[(index + direction + drinks.length) % drinks.length]._id);
  }
  function changeSize(direction: number) {
    const index = drinkSizes.findIndex(item => item.value === size);
    setSize(drinkSizes[(index + direction + drinkSizes.length) % drinkSizes.length].value);
  }
  async function startNext(values: { title: string }) {
    if (!drink || !room.area) return;
    setError('');
    try {
      const body = { user: session.user, title: values.title, description: '', deadline: new Date(Date.now() + 86400000).toISOString(), difficulty: 'medium', estimatedMinutes: selectedSize.minutes, status: 'todo' };
      const task = continueTask ? await cafeApi.task(session.task) : nextTaskId ? await cafeApi.updateTask(nextTaskId, body) : await cafeApi.createTask({ ...body, requestKey: pendingRequest(session._id + '-next-task') });
      if (!continueTask) setNextTaskId(task._id);
      const next = await cafeApi.startSession({ requestKey: pendingRequest(session._id + '-next-session'), user: session.user, task: task._id, area: room.area._id, energyLevel: session.energyLevel, drink: drink._id, drinkSize: size, sessionLabel: session.sessionLabel, status: 'active' });
      update({ drink: drink._id, size, label: session.sessionLabel || '', taskId: task._id });
      sessionStorage.removeItem(storageKey); clearPendingRequest(session._id + '-next-task'); clearPendingRequest(session._id + '-next-session');
      setStep(null);
      navigate('/focus/' + next._id);
    } catch (reason) { setError('The session could not start. Any saved task remains on the Task Board; select Go to retry. ' + errorMessage(reason)); }
  }
  return <>
    {step === null && !session.taskConfirmed && ((session.status === 'active' && room.timer.remainingSeconds === 0) || session.status === 'completed') && <button className="button finish-reopen" onClick={() => setStep('confirm')}>Confirm Completed Task</button>}
    {step === null && session.status === 'completed' && session.taskConfirmed && <button className="button secondary finish-reopen" onClick={() => setStep('next')}>Choose Next Cuppa</button>}
    <Modal open={step !== null} title={step === 'confirm' ? 'Was this the task you completed?' : 'Good job! Next cuppa?'} className="session-finish" busy={busy} onClose={() => setStep(null)}>
    {step === 'confirm' ? <>
      <div className="finished-drink"><MenuArtwork name={session.drinkName || 'Cafe Latte'} /></div>
      <p className="finished-task">{session.taskTitle || room.state.data?.task.title}</p>
      <Feedback error={room.error} />
      <button className="button" disabled={busy} onClick={() => void confirm(true)}>{busy ? 'Saving…' : 'Submit'}</button>
      <button className="text-link finish-later" disabled={busy} onClick={() => void confirm(false)}>Task isn’t finished yet</button>
    </> : step === 'next' && <LoadState {...menu} retry={menu.reload}>
      {drink ? <form onSubmit={form.handleSubmit(startNext)} noValidate>
        <div className="next-drink-picker"><button type="button" className="icon-button" aria-label="Previous drink" disabled={busy || drinks.length < 2} onClick={() => changeDrink(-1)}>←</button><div><MenuArtwork name={drink.name} /><p>{drink.name}</p></div><button type="button" className="icon-button" aria-label="Next drink" disabled={busy || drinks.length < 2} onClick={() => changeDrink(1)}>→</button></div>
        <div className="next-size-picker"><button type="button" className="icon-button" aria-label="Previous size" disabled={busy} onClick={() => changeSize(-1)}>←</button><p>{selectedSize.label} · {selectedSize.minutes} min</p><button type="button" className="icon-button" aria-label="Next size" disabled={busy} onClick={() => changeSize(1)}>→</button></div>
        {!taskFinished && <fieldset className="entry-task-choice"><legend>Next Task</legend><label><input type="radio" checked={continueTask} disabled={busy} onChange={() => { setContinueTask(true); form.setValue('title', room.state.data?.task.title || ''); }} />Continue This Task</label><label><input type="radio" checked={!continueTask} disabled={busy} onChange={() => { setContinueTask(false); form.setValue('title', ''); }} />New Task</label></fieldset>}
        <Field label="What are you going to do next?" error={form.formState.errors.title?.message}><input {...form.register('title')} maxLength={120} placeholder="e.g. finish the report…" readOnly={continueTask} disabled={busy} autoComplete="off" /></Field>
        <Feedback error={error} />
        <button className="button" disabled={busy}>{busy ? 'Preparing…' : 'Go'}</button>
      </form> : <p>No drinks are available right now.</p>}
    </LoadState>}
  </Modal></>;
}
