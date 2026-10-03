import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import type { Selection, User } from '../types';

interface CafeState {
  user: User | null; users: User[]; loading: boolean; error: string; retry: () => void;
  enter: (id: string) => void; leave: () => void;
  basket: Selection[]; setQuantity: (id: string, quantity: number) => void; clearBasket: () => void;
  notice: string; notify: (message: string) => void;
  exploreOpen: boolean; openExplore: () => void; closeExplore: () => void;
}
const CafeContext = createContext<CafeState | null>(null);

function savedBasket(): Selection[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem('tempo-basket') || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter(item => typeof item?.menuItem === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20);
  } catch { return []; }
}

export function CafeProvider({ children }: { children: ReactNode }) {
  const profiles = useApi(cafeApi.users);
  const [userId, setUserId] = useState(() => localStorage.getItem('tempo-profile') || '');
  const [basket, setBasket] = useState<Selection[]>(savedBasket);
  const [notice, setNotice] = useState('');
  const [exploreOpen, setExploreOpen] = useState(false);
  useEffect(() => { sessionStorage.setItem('tempo-basket', JSON.stringify(basket)); }, [basket]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function enter(id: string) {
    if (id !== userId) setBasket([]);
    localStorage.setItem('tempo-profile', id);
    setUserId(id);
  }
  function leave() {
    localStorage.removeItem('tempo-profile');
    setUserId('');
    setBasket([]);
  }
  function setQuantity(menuItem: string, quantity: number) {
    setBasket(current => {
      const rest = current.filter(item => item.menuItem !== menuItem);
      return quantity > 0 ? [...rest, { menuItem, quantity: Math.min(20, quantity) }] : rest;
    });
  }

  return <CafeContext.Provider value={{
    user: profiles.data?.find(profile => profile._id === userId) || null,
    users: profiles.data || [], loading: profiles.loading, error: profiles.error, retry: profiles.reload,
    enter, leave, basket, setQuantity, clearBasket: () => setBasket([]), notice, notify: setNotice,
    exploreOpen, openExplore: () => setExploreOpen(true), closeExplore: () => setExploreOpen(false),
  }}>{children}</CafeContext.Provider>;
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (!context) throw new Error('useCafe must be used inside CafeProvider');
  return context;
}
