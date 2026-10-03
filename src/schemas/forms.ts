import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Enter a task title.').max(120, 'Keep the title within 120 characters.'),
  description: z.string().max(1000, 'Keep the description within 1000 characters.'),
  deadline: z.string().min(1, 'Choose a deadline.').refine(value => Number.isFinite(new Date(value).getTime()), 'Choose a valid date.'),
  difficulty: z.enum(['low', 'medium', 'high']),
  estimatedMinutes: z.number().int('Use whole minutes.').min(15, 'Minimum 15 minutes.').max(480, 'Maximum 480 minutes.'),
  status: z.enum(['todo', 'in_progress', 'completed']),
});
export type TaskFormValues = z.infer<typeof taskSchema>;

export const reservationSchema = z.object({
  startsAt: z.string().min(1, 'Choose a start time.'),
  durationMinutes: z.number().int().min(15).max(120),
}).refine(values => new Date(values.startsAt).getTime() > Date.now(), { path: ['startsAt'], message: 'Choose a future start time.' });
export type ReservationValues = z.infer<typeof reservationSchema>;

export const focusSchema = z.object({
  task: z.string().min(1, 'Choose an unfinished task.'),
  area: z.string().min(1, 'Choose a cafe area.'),
  energyLevel: z.enum(['low', 'medium', 'high']),
});
export type FocusValues = z.infer<typeof focusSchema>;
export const completionSchema = z.object({ completedMinutes: z.number().int().min(1, 'Enter at least one minute.').max(120, 'Maximum 120 minutes.') });
export type CompletionValues = z.infer<typeof completionSchema>;

export const studyLabelSchema = z.object({ label: z.string().trim().min(1, 'Add a name or label.').max(80, 'Use up to 80 characters.') });
export type StudyLabelValues = z.infer<typeof studyLabelSchema>;
export const studyTaskSchema = taskSchema.extend({ energyLevel: z.enum(['low', 'medium', 'high']) });
export type StudyTaskValues = z.infer<typeof studyTaskSchema>;
