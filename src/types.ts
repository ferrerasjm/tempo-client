export interface User { _id: string; displayName: string; email: string }
export interface Task {
  _id: string; user: string; title: string; description: string; deadline: string;
  difficulty: 'low' | 'medium' | 'high'; estimatedMinutes: number;
  status: 'todo' | 'in_progress' | 'completed'; priorityScore?: number; daysUntilDue?: number;
}
export interface Area { _id: string; name: string; theme: string; capacity: number; suggestedFocusMinutes: number; active: boolean }
export interface Availability { areaId: string; capacity: number; reservedSeats: number; remainingSeats: number; available: boolean }
export interface Reservation { _id: string; user: string; area: string; startsAt: string; endsAt: string; status: 'active' | 'cancelled' | 'completed' }
export interface Recommendation { plannedMinutes: number; breakMinutes: number; daysUntilDue: number }
export interface FocusSession {
  _id: string; user: string; task: string; area: string; energyLevel: string;
  plannedMinutes: number; completedMinutes: number; breakMinutes: number;
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'; startedAt: string | null; endedAt: string | null; focusScore: number | null;
  drink?: string | null; drinkName?: string; drinkSize?: string; sessionLabel?: string;
  pausedAt?: string | null; pausedMilliseconds?: number; elapsedSeconds?: number; serverTime?: string;
}
export interface MenuItem { _id: string; name: string; category: 'drink' | 'snack'; priceCredits: number; available: boolean }
export interface Selection { menuItem: string; quantity: number }
export interface OrderItem extends Selection { name: string; unitPriceCredits: number }
export interface OrderPreview { user: string; items: OrderItem[]; subtotalCredits: number; discountCredits: number; totalCredits: number; focusDiscountApplied?: boolean }
export interface Order extends OrderPreview { _id: string; status: 'placed' | 'fulfilled' | 'cancelled'; createdAt: string }
export interface Statistics {
  totalFocusMinutes: number; averageSessionMinutes: number; completedSessions: number; completedTasks: number;
  currentStreak: number; longestStreak: number;
  mostProductiveDay: { date: string; totalMinutes: number } | null;
  favoriteCafeArea: { name: string; totalMinutes: number } | null;
  mostOrderedDrink: { name: string; quantity: number } | null;
}
