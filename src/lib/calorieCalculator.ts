import type { Goal } from '@db/models/StreamEnrollment';

export type CalorieProfile = {
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  age: number;
};

export const ACTIVITY_FACTOR = 1.2;

const GOAL_FACTOR: Record<Goal, number> = {
  lose: 0.85,
  maintain: 1,
  gain: 1.15,
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Сброс веса',
  maintain: 'Поддержание веса',
  gain: 'Набор веса',
};

/**
 * Базовая дневная норма по формуле Миффлина-Сан Жеора
 * с фиксированным коэффициентом активности 1.2.
 */
export function calculateBaseCalories(profile: CalorieProfile): number {
  const { sex, heightCm, weightKg, age } = profile;
  const genderOffset = sex === 'male' ? 5 : -161;
  return (6.25 * heightCm + 10 * weightKg - 5 * age + genderOffset) * ACTIVITY_FACTOR;
}

/**
 * Итоговая целевая калорийность с учётом цели.
 * Округляется до целого числа (Math.round).
 */
export function calculateTargetCalories(
  profile: CalorieProfile,
  goal: Goal
): number {
  const base = calculateBaseCalories(profile);
  return Math.round(base * GOAL_FACTOR[goal]);
}

/**
 * Проверяет, нарушена ли целевая калорийность за день.
 *
 * Для цели `lose`/`maintain` целевая калорийность работает как лимит сверху —
 * нарушением является перебор.
 * Для цели `gain` целевая калорийность работает как необходимый минимум —
 * нарушением является недобор.
 */
export function isCalorieTargetMissed(
  goal: Goal | null | undefined,
  actualCalories: number,
  targetCalories: number
): boolean {
  return goal === 'gain'
    ? actualCalories < targetCalories
    : actualCalories > targetCalories;
}

export function isProfileComplete(
  user: {
    sex: 'male' | 'female' | null;
    heightCm: number | null;
    weightKg: number | null;
    age: number | null;
  } | null
): boolean {
  if (!user) return false;
  return (
    user.sex === 'male' ||
    user.sex === 'female'
  ) && (
    typeof user.heightCm === 'number' &&
    Number.isFinite(user.heightCm) &&
    user.heightCm > 0
  ) && (
    typeof user.weightKg === 'number' &&
    Number.isFinite(user.weightKg) &&
    user.weightKg > 0
  ) && (
    typeof user.age === 'number' &&
    Number.isFinite(user.age) &&
    user.age > 0
  );
}
