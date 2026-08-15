import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from './ParticipantDetail.module.css';

type ReportLineItem = {
  id: string;
  productId: string;
  name: string;
  calories: number;
  weightGrams: number;
  lineCalories: number;
};

type PulseReadingItem = {
  id: string;
  measuredAt: string;
  pulse: number;
};

type DayReport = {
  id: string;
  dayNumber: number;
  totalCalories: number;
  filledAt: string;
  updatedAt: string;
  waterLiters: number | null;
  steps: number | null;
  sleepHours: number | null;
  activityMinutes: number | null;
  weightKg: number | null;
  lines: ReportLineItem[];
  pulseReadings: PulseReadingItem[];
};

type ParticipantDetailData = {
  streamId: string;
  participant: {
    id: string;
    name: string;
    email: string;
  };
  stream: {
    status: string;
    startDate: string;
    template: {
      title: string;
      durationDays: number;
    };
  };
  reports: DayReport[];
};

function formatActivity(totalMinutes: number | null): string {
  if (totalMinutes === null || totalMinutes === undefined) return '—';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`;
  if (hours > 0) return `${hours} ч`;
  return `${minutes} мин`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ParticipantDetailPage() {
  const router = useRouter();
  const { id, participantId } = router.query;

  const [data, setData] = useState<ParticipantDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }
    if (!id || !participantId) return;

    const sid = Array.isArray(id) ? id[0] : id;
    const pid = Array.isArray(participantId) ? participantId[0] : participantId;

    async function load() {
      try {
        const res = await fetch(`/api/streams/${sid}/participants/${pid}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            json.message || json.error || 'Не удалось загрузить данные участника'
          );
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, participantId, router]);

  if (loading) {
    return <main className={styles.main}><p>Загрузка...</p></main>;
  }

  if (error || !data) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error || 'Данные не найдены'}</p>
      </main>
    );
  }

  const sid = Array.isArray(id) ? id[0] : (id as string);
  const { durationDays } = data.stream.template;
  const allDays = Array.from({ length: durationDays }, (_, i) => i + 1);
  const reportByDay = new Map(data.reports.map((r) => [r.dayNumber, r]));

  const filledDays = data.reports.length;
  const filledCalories = data.reports.filter((r) => r.totalCalories > 0);
  const avgCalories =
    filledCalories.length > 0
      ? (
          filledCalories.reduce((sum, r) => sum + r.totalCalories, 0) /
          filledCalories.length
        ).toFixed(1)
      : '—';

  const lastUpdated = data.reports.reduce<string | null>((latest, r) => {
    if (!latest || r.updatedAt > latest) return r.updatedAt;
    return latest;
  }, null);

  return (
    <main className={styles.main}>
      <Link href={`/mentor/streams/${sid}`} className={styles.backLink}>
        ← Назад к потоку
      </Link>

      <h1 className={styles.title}>{data.participant.name}</h1>
      <p className={styles.email}>{data.participant.email}</p>
      <p className={styles.description}>
        {data.stream.template.title} · день {filledDays} из {durationDays}
      </p>

      <div className={styles.infoBlock}>
        <p><strong>Заполнено дней:</strong> {filledDays} из {durationDays}</p>
        <p><strong>Средние калории:</strong> {avgCalories} ккал</p>
        <p>
          <strong>Последнее обновление:</strong>{' '}
          {lastUpdated
            ? new Date(lastUpdated).toLocaleString()
            : 'Отчётов пока нет'}
        </p>
        <p>
          <strong>Дата начала:</strong>{' '}
          {new Date(data.stream.startDate).toLocaleDateString()}
        </p>
        <p><strong>Статус:</strong> {data.stream.status}</p>
      </div>

      <section className={styles.section}>
        <h2>Рацион</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>День</th>
                <th>Состав</th>
                <th className={styles.numCol}>Итого ккал</th>
              </tr>
            </thead>
            <tbody>
              {allDays.map((day) => {
                const report = reportByDay.get(day);
                if (!report || report.lines.length === 0) {
                  return (
                    <tr key={day} className={styles.emptyRow}>
                      <td>{day}</td>
                      <td>—</td>
                      <td className={styles.numCol}>—</td>
                    </tr>
                  );
                }
                return (
                  <tr key={day}>
                    <td>{day}</td>
                    <td>
                      <ul className={styles.foodList}>
                        {report.lines.map((line) => (
                          <li key={line.id}>
                            {line.name} — {line.weightGrams} г ({line.lineCalories} ккал)
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className={styles.numCol}>{report.totalCalories}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Метрики</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>День</th>
                <th className={styles.numCol}>Вода (л)</th>
                <th className={styles.numCol}>Шаги</th>
                <th className={styles.numCol}>Сон (ч)</th>
                <th>Активность</th>
                <th className={styles.numCol}>Вес (кг)</th>
              </tr>
            </thead>
            <tbody>
              {allDays.map((day) => {
                const report = reportByDay.get(day);
                const filled = report && (
                  report.waterLiters !== null ||
                  report.steps !== null ||
                  report.sleepHours !== null ||
                  report.activityMinutes !== null ||
                  report.weightKg !== null
                );
                return (
                  <tr key={day} className={filled ? '' : styles.emptyRow}>
                    <td>{day}</td>
                    <td className={styles.numCol}>{report?.waterLiters ?? '—'}</td>
                    <td className={styles.numCol}>{report?.steps ?? '—'}</td>
                    <td className={styles.numCol}>{report?.sleepHours ?? '—'}</td>
                    <td>{formatActivity(report?.activityMinutes ?? null)}</td>
                    <td className={styles.numCol}>{report?.weightKg ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Пульс</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>День</th>
                <th>Время</th>
                <th className={styles.numCol}>Пульс (уд/мин)</th>
              </tr>
            </thead>
            <tbody>
              {allDays.map((day) => {
                const report = reportByDay.get(day);
                const readings = report?.pulseReadings || [];
                if (readings.length === 0) {
                  return (
                    <tr key={day} className={styles.emptyRow}>
                      <td>{day}</td>
                      <td>—</td>
                      <td className={styles.numCol}>—</td>
                    </tr>
                  );
                }
                return readings.map((reading, index) => (
                  <tr key={reading.id}>
                    {index === 0 ? (
                      <td rowSpan={readings.length}>{day}</td>
                    ) : null}
                    <td>{formatTime(reading.measuredAt)}</td>
                    <td className={styles.numCol}>{reading.pulse}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
