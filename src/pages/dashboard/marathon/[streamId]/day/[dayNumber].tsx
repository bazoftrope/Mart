import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { useParticipantDayStore } from '@/stores/participantDayStore';
import DayHeader from '@/components/day/DayHeader';
import DayTabs, { type DayTabValue } from '@/components/day/DayTabs';
import DayMaterials from '@/components/day/DayMaterials';
import DayReport from '@/components/day/DayReport';
import styles from './Day.module.css';

const VALID_TABS: DayTabValue[] = ['materials', 'report'];

function resolveTab(raw: unknown): DayTabValue {
  return VALID_TABS.includes(raw as DayTabValue) ? (raw as DayTabValue) : 'materials';
}

export default function DayPage() {
  const router = useRouter();
  const { streamId, dayNumber, tab } = router.query;

  const { data, loading, error, loadDay, resetState } = useParticipantDayStore();

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'participant') {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!streamId || !dayNumber) return;

    const sid = Array.isArray(streamId) ? streamId[0] : streamId;
    const dnum = Array.isArray(dayNumber)
      ? parseInt(dayNumber[0], 10)
      : parseInt(dayNumber as string, 10);

    if (!sid || Number.isNaN(dnum)) return;

    loadDay(sid, dnum);

    return () => {
      resetState();
    };
  }, [streamId, dayNumber, loadDay, resetState]);

  const activeTab = resolveTab(tab);

  if (loading) {
    return (
      <main className={styles.main}>
        <p>Загрузка...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error || 'Не удалось загрузить день'}</p>
      </main>
    );
  }

  const sid = Array.isArray(streamId) ? streamId[0] : (streamId as string);

  return (
    <main className={styles.main}>
      <DayHeader streamId={sid} data={data} />
      <DayTabs streamId={sid} dayNumber={data.dayNumber} activeTab={activeTab} />

      {activeTab === 'materials' && <DayMaterials materials={data.day} />}
      {activeTab === 'report' && (
        <DayReport
          streamId={sid}
          dayNumber={data.dayNumber}
          isEditable={data.isEditable}
        />
      )}
    </main>
  );
}
