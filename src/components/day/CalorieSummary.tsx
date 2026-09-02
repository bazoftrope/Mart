import Link from 'next/link';
import { GOAL_LABELS } from '@/lib/calorieCalculator';
import type { Goal } from '@/types/participantDay';
import styles from './CalorieSummary.module.css';

type CalorieSummaryProps = {
  targetCalories: number | null;
  actualCalories: number;
  goal: Goal | null;
  isTargetMissed: boolean;
  profileCompleted: boolean;
};

export default function CalorieSummary({
  targetCalories,
  actualCalories,
  goal,
  isTargetMissed,
  profileCompleted,
}: CalorieSummaryProps) {
  if (targetCalories === null) {
    if (profileCompleted) {
      return null;
    }

    return (
      <div className={styles.calorieSummary}>
        <p>
          Для расчёта дневной нормы заполните анкету участника:{' '}
          <Link href="/onboarding">перейти к анкете</Link>
        </p>
      </div>
    );
  }

  const isGain = goal === 'gain';
  const calorieDifference = Math.round(actualCalories - targetCalories);

  const statusTitle = isTargetMissed
    ? isGain
      ? 'Недостаточно калорий'
      : 'Превышение лимита'
    : isGain
      ? 'Норма / профицит'
      : 'Норма / дефицит';

  let statusText = '';
  if (calorieDifference === 0) {
    statusText = 'Цель достигнута';
  } else if (isTargetMissed) {
    statusText = `${isGain ? 'Не хватает' : 'Превышение'}: ${Math.abs(calorieDifference)} ккал`;
  } else {
    statusText = `${isGain ? 'Профицит' : 'Остаток'}: ${Math.abs(calorieDifference)} ккал`;
  }

  return (
    <div
      className={`${styles.calorieSummary} ${
        isTargetMissed ? styles.statusOver : styles.statusOk
      }`}
    >
      <div className={styles.calorieSummaryHeader}>
        <span className={styles.calorieStatusIcon}>
          {isTargetMissed ? '✕' : '✓'}
        </span>
        <span>{statusTitle}</span>
      </div>
      <div className={styles.calorieSummaryValues}>
        <span>
          Цель: <strong>{targetCalories} ккал</strong>
        </span>
        <span>
          Факт: <strong>{Math.round(actualCalories)} ккал</strong>
        </span>
        <span>{statusText}</span>
      </div>
      {goal && (
        <div className={styles.calorieGoal}>Цель потока: {GOAL_LABELS[goal]}</div>
      )}
    </div>
  );
}
