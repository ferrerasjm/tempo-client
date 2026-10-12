import { z } from "zod";

export const loginSchema = z.object({
  name: z.string(),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(254, "Email must be 254 characters or fewer.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Please enter your password.")
    .max(1024, "Password must be 1024 characters or fewer."),
  confirmPassword: z.string(),
});

export const signupSchema = loginSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(1, "Please enter your full name.")
      .max(100, "Name must be 100 characters or fewer."),
    password: z
      .string()
      .min(1, "Please enter your password.")
      .min(8, "Password must contain at least 8 characters.")
      .max(1024, "Password must be 1024 characters or fewer."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type AccountValues = z.infer<typeof loginSchema>;

export const profileNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name of up to 100 characters.")
    .max(100, "Enter a name of up to 100 characters."),
});
export type ProfileNameValues = z.infer<typeof profileNameSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task title."),
  description: z
    .string()
    .max(1000, "Keep the description within 1000 characters."),
  deadline: z
    .string()
    .min(1, "Choose a deadline.")
    .refine(
      (value) => Number.isFinite(new Date(value).getTime()),
      "Choose a valid date.",
    ),
  difficulty: z.enum(["low", "medium", "high"]),
  estimatedMinutes: z
    .number()
    .int("Use whole minutes.")
    .min(15, "Minimum 15 minutes.")
    .max(480, "Maximum 480 minutes."),
  status: z.enum(["todo", "in_progress", "completed"]),
});
export const taskEditorSchema = taskSchema.pick({ title: true, status: true });
export type TaskEditorValues = z.infer<typeof taskEditorSchema>;

export const reservationSchema = z
  .object({
    startsAt: z.string().min(1, "Choose a start time."),
    durationMinutes: z.number().int().min(15).max(120),
  })
  .refine((values) => new Date(values.startsAt).getTime() > Date.now(), {
    path: ["startsAt"],
    message: "Choose a future start time.",
  });
export type ReservationValues = z.infer<typeof reservationSchema>;

export const studyLabelSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Add a name or label.")
    .max(80, "Use up to 80 characters."),
});
export type StudyLabelValues = z.infer<typeof studyLabelSchema>;
export const studyTaskSchema = taskSchema.extend({
  energyLevel: z.enum(["low", "medium", "high"]),
});
export type StudyTaskValues = z.infer<typeof studyTaskSchema>;

export const nextTaskSchema = taskSchema.pick({ title: true });
export type NextTaskValues = z.infer<typeof nextTaskSchema>;
