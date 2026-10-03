import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useCafe } from './CafeContext';

export const drinkSizes = [
  { value: 'tall', label: 'Tall', minutes: 25 },
  { value: 'grande', label: 'Grande', minutes: 45 },
  { value: 'venti', label: 'Venti', minutes: 60 },
] as const;
export type DrinkSize = typeof drinkSizes[number]['value'];
interface StudyDraft { areaId: string; drink: string; size: DrinkSize; label: string; taskId: string }
interface StudyDraftState { draft: StudyDraft; update: (values: Partial<StudyDraft>) => void; reset: () => void }
const Context = createContext<StudyDraftState | null>(null);
const empty: StudyDraft = { areaId: '', drink: '', size: 'tall', label: '', taskId: '' };

function DraftStore({ userId, children }: { userId: string; children: ReactNode }) {
  const storageKey = 'tempo-study-' + userId;
  const [draft, setDraft] = useState<StudyDraft>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return {
        areaId: typeof saved.areaId === 'string' ? saved.areaId : '',
        drink: typeof saved.drink === 'string' ? saved.drink : '',
        label: typeof saved.label === 'string' ? saved.label : '',
        taskId: typeof saved.taskId === 'string' ? saved.taskId : '',
        size: drinkSizes.some(item => item.value === saved.size) ? saved.size : 'tall',
      };
    } catch { return empty; }
  });
  useEffect(() => { if (userId) sessionStorage.setItem(storageKey, JSON.stringify(draft)); }, [draft, storageKey, userId]);
  return <Context.Provider value={{ draft, update: values => setDraft(current => ({ ...current, ...values })), reset: () => setDraft(empty) }}>{children}</Context.Provider>;
}
export function StudyDraftProvider({ children }: { children: ReactNode }) {
  const { user } = useCafe();
  return <DraftStore key={user?._id || ''} userId={user?._id || ''}>{children}</DraftStore>;
}
export function useStudyDraft() {
  const state = useContext(Context);
  if (!state) throw new Error('Study draft provider is missing');
  return state;
}
