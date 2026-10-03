import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCafe } from '../state/CafeContext';
import { drinkSizes, useStudyDraft } from '../state/StudyDraftContext';
import { cafeApi } from '../services/cafeApi';
import { errorMessage } from '../api/http';
import type { StudyTaskValues } from '../schemas/forms';

export function useStudyEntry() {
  const { user, notify } = useCafe();
  const { draft, update } = useStudyDraft();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  async function prepare(values: StudyTaskValues) {
    setError('');
    try {
      const areas = await cafeApi.areas();
      const area = areas.find(item => item.active && item.name === 'Quiet Corner') || areas.find(item => item.active);
      if (!area) { setError('No cafe spaces are open right now. Please try again later.'); return; }
      const taskBody = { ...values, user: user!._id, deadline: new Date(values.deadline).toISOString() };
      const task = draft.taskId ? await cafeApi.updateTask(draft.taskId, taskBody) : await cafeApi.createTask(taskBody);
      update({ taskId: task._id });
      const session = await cafeApi.startSession({
        user: user!._id, task: task._id, area: area._id, energyLevel: values.energyLevel,
        drink: draft.drink, drinkSize: draft.size, sessionLabel: draft.label, status: 'planned',
      });
      notify('Your session is ready. Choose a space, then start your timer.');
      navigate('/focus/' + session._id);
    } catch (reason) { setError(errorMessage(reason)); }
  }
  return { draft, update, error, prepare, minutes: drinkSizes.find(item => item.value === draft.size)!.minutes };
}
