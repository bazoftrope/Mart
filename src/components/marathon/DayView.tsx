import { useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/router';
import { useParticipantDayStore } from '@/stores/participantDayStore';
import DayHeader from '@/components/day/DayHeader';
import DayTabs, { type DayTabValue } from '@/components/day/DayTabs';
import DayMaterials from '@/components/day/DayMaterials';
import DayReport from '@/components/day/DayReport';
import styles from './Marathon.module.css';

const VALID_TABS: DayTabValue[] = ['materials', 'report'];

function resolveTab(raw: unknown): DayTabValue {
  return VALID_TABS.includes(raw as DayTabValue) ? (raw as DayTabValue) : 'materials';
}

type DayViewProps = {
  streamId: string;
  dayNumber: number;
};

export default function DayView({ streamId, dayNumber }: DayViewProps) {
  const router = useRouter();
  const { data, loading, error, daysCache, loadAllDays, selectDay, resetState } =
    useParticipantDayStore();

  const day = daysCache[streamId]?.[dayNumber];

  useEffect(() => {
    loadAllDays(streamId);
  }, [streamId, loadAllDays]);

  useLayoutEffect(() => {
    if (day) {
      selectDay(day);
    }
  }, [day, selectDay]);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  const activeTab = resolveTab(router.query.tab);

  if (error && !data) {
    return (
      <div className={styles.dayLoading}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (loading || !data || data.dayNumber !== dayNumber) {
    return (
      <div className={styles.dayLoading}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <section className={styles.day}>
      <DayHeader data={data} />
      <DayTabs
        streamId={streamId}
        dayNumber={data.dayNumber}
        activeTab={activeTab}
      />

      {activeTab === 'materials' && <DayMaterials materials={data.day} />}
      {activeTab === 'report' && (
        <DayReport
          streamId={streamId}
          dayNumber={data.dayNumber}
          isEditable={data.isEditable}
        />
      )}
    </section>
  );
}