import { http } from '../api/http';
import type { Area, Availability, FocusSession, MenuItem, Order, OrderPreview, Recommendation, Reservation, Selection, Statistics, Task, User } from '../types';

// Screens call these functions instead of building HTTP requests themselves.
export const cafeApi = {
  users: async () => (await http.get<User[]>('/users')).data,
  tasks: async (user: string) => (await http.get<Task[]>('/tasks', { params: { user } })).data,
  task: async (id: string) => (await http.get<Task>(`/tasks/${id}`)).data,
  priorities: async (user: string) => (await http.get<{ tasks: Task[] }>('/tasks/priorities', { params: { user } })).data.tasks,
  createTask: async (body: object) => (await http.post<Task>('/tasks', body)).data,
  updateTask: async (id: string, body: object) => (await http.patch<Task>(`/tasks/${id}`, body)).data,
  deleteTask: async (id: string) => { await http.delete(`/tasks/${id}`); },
  areas: async () => (await http.get<Area[]>('/cafe-areas')).data,
  area: async (id: string) => (await http.get<Area>(`/cafe-areas/${id}`)).data,
  availability: async (id: string, startsAt: string, endsAt: string) => (await http.get<Availability>(`/cafe-areas/${id}/availability`, { params: { startsAt, endsAt } })).data,
  reservations: async (user: string) => (await http.get<Reservation[]>('/reservations', { params: { user } })).data,
  reserve: async (body: object) => (await http.post<Reservation>('/reservations', body)).data,
  cancelReservation: async (id: string) => (await http.patch<Reservation>(`/reservations/${id}`, { status: 'cancelled' })).data,
  recommendation: async (task: string, energyLevel: string) => (await http.post<Recommendation>('/focus/recommendation', { task, energyLevel })).data,
  sessions: async (user: string) => (await http.get<FocusSession[]>('/focus-sessions', { params: { user } })).data,
  session: async (id: string) => (await http.get<FocusSession>(`/focus-sessions/${id}`)).data,
  startSession: async (body: object) => (await http.post<FocusSession>('/focus-sessions', body)).data,
  finishSession: async (id: string, body: object) => (await http.patch<FocusSession>(`/focus-sessions/${id}`, body)).data,
  statistics: async (user: string) => (await http.get<Statistics>('/focus/statistics', { params: { user } })).data,
  menu: async () => (await http.get<MenuItem[]>('/menu-items')).data,
  preview: async (user: string, items: Selection[]) => (await http.post<OrderPreview>('/orders/calculate', { user, items })).data,
  placeOrder: async (user: string, items: Selection[]) => (await http.post<Order>('/orders', { user, items })).data,
  orders: async (user: string) => (await http.get<Order[]>('/orders', { params: { user } })).data,
  order: async (id: string) => (await http.get<Order>(`/orders/${id}`)).data,
  cancelOrder: async (id: string) => (await http.patch<Order>(`/orders/${id}`, { status: 'cancelled' })).data,
};
