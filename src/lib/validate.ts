import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Invalid email')
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name is too long');

export const roleSchema = z
  .enum(['participant', 'mentor'])
  .default('participant');

export const idSchema = z.coerce.number().int().positive('Invalid id');

export const uuidSchema = z.string().uuid('Invalid uuid');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: roleSchema,
});

export const marathonTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long').optional(),
  durationDays: z.number().int().min(1, 'Duration must be at least 1 day').max(365, 'Duration is too long'),
});

export const templateDaySchema = z.object({
  dayNumber: z.number().int().min(1, 'Day number must be at least 1'),
  textContent: z.string().max(20000, 'Content is too long').optional(),
  audioUrl: z.string().max(2048, 'Audio URL is too long').optional(),
  videoUrl: z.string().max(2048, 'Video URL is too long').optional(),
});

export const updateTemplateDaysSchema = z.object({
  days: z.array(templateDaySchema).min(1, 'At least one day is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MarathonTemplateInput = z.infer<typeof marathonTemplateSchema>;
export type TemplateDayInput = z.infer<typeof templateDaySchema>;
export const createStreamSchema = z.object({
  templateId: z.string().uuid('Invalid template id'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
});

export const reportLineSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  weightGrams: z
    .number()
    .positive('Weight must be positive')
    .max(999999, 'Weight is too large'),
});

export const saveReportSchema = z.object({
  lines: z.array(reportLineSchema).min(1, 'At least one line is required'),
});

export type CreateStreamInput = z.infer<typeof createStreamSchema>;
export type UpdateTemplateDaysInput = z.infer<typeof updateTemplateDaysSchema>;
export type ReportLineInput = z.infer<typeof reportLineSchema>;
export type SaveReportInput = z.infer<typeof saveReportSchema>;
