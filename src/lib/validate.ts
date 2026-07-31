import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Неверный email')
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен быть не менее 6 символов');

export const nameSchema = z
  .string()
  .min(1, 'Имя обязательно')
  .max(255, 'Имя слишком длинное');

export const roleSchema = z
  .enum(['participant', 'mentor'])
  .default('participant');

export const idSchema = z.coerce.number().int().positive('Неверный id');

export const uuidSchema = z.string().uuid('Неверный uuid');

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
  title: z.string().min(1, 'Название обязательно').max(255, 'Название слишком длинное'),
  description: z.string().max(5000, 'Описание слишком длинное').optional(),
  durationDays: z.number().int().min(1, 'Длительность должна быть не менее 1 дня').max(365, 'Длительность слишком большая'),
});

export const templateDaySchema = z.object({
  dayNumber: z.number().int().min(1, 'Номер дня должен быть не менее 1'),
  textContent: z.string().max(20000, 'Содержимое слишком длинное').optional(),
  audioUrl: z.string().max(2048, 'Ссылка на аудио слишком длинная').optional(),
  videoUrl: z.string().max(2048, 'Ссылка на видео слишком длинная').optional(),
});

export const updateTemplateDaysSchema = z.object({
  days: z.array(templateDaySchema).min(1, 'Необходим хотя бы один день'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MarathonTemplateInput = z.infer<typeof marathonTemplateSchema>;
export type TemplateDayInput = z.infer<typeof templateDaySchema>;
export const createStreamSchema = z.object({
  templateId: z.string().uuid('Неверный id шаблона'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата начала должна быть в формате ГГГГ-ММ-ДД'),
});

export const reportLineSchema = z.object({
  productId: z.string().uuid('Неверный id продукта'),
  weightGrams: z
    .number()
    .positive('Вес должен быть положительным')
    .max(999999, 'Вес слишком большой'),
});

export const pulseReadingSchema = z.object({
  measuredAt: z.string().datetime('Неверный формат даты измерения'),
  pulse: z.number().int().min(30, 'Пульс должен быть не менее 30').max(250, 'Пульс должен быть не более 250'),
});

export const saveReportSchema = z
  .object({
    lines: z.array(reportLineSchema).optional(),
    waterLiters: z.number().int().min(0).max(50, 'Объём воды не может превышать 50 литров').optional(),
    steps: z.number().int().min(0).max(100000, 'Количество шагов не может превышать 100000').optional(),
    sleepHours: z.number().int().min(0).max(24, 'Сон не может превышать 24 часа').optional(),
    activityMinutes: z.number().int().min(0).max(1440, 'Активность не может превышать 1440 минут').optional(),
    weightKg: z.number().int().min(20, 'Вес должен быть не менее 20 кг').max(300, 'Вес должен быть не более 300 кг').optional(),
    pulseReadings: z.array(pulseReadingSchema).optional(),
  })
  .refine(
    (data) => {
      const hasLines = Array.isArray(data.lines) && data.lines.length > 0;
      const hasMetrics =
        data.waterLiters !== undefined ||
        data.steps !== undefined ||
        data.sleepHours !== undefined ||
        data.activityMinutes !== undefined ||
        data.weightKg !== undefined;
      const hasPulse = Array.isArray(data.pulseReadings) && data.pulseReadings.length > 0;
      return hasLines || hasMetrics || hasPulse;
    },
    {
      message: 'Необходимо указать хотя бы одно из: строки еды, метрики или замеры пульса',
      path: ['root'],
    }
  );

export const updateUserRoleSchema = z.object({
  role: z.enum(['mentor', 'participant']),
});

export type CreateStreamInput = z.infer<typeof createStreamSchema>;
export type UpdateTemplateDaysInput = z.infer<typeof updateTemplateDaysSchema>;
export type ReportLineInput = z.infer<typeof reportLineSchema>;
export type PulseReadingInput = z.infer<typeof pulseReadingSchema>;
export type SaveReportInput = z.infer<typeof saveReportSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
