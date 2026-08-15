import Link from 'next/link';
import styles from './DayTabs.module.css';

export type DayTabValue = 'materials' | 'report';

type DayTabsProps = {
  streamId: string;
  dayNumber: number;
  activeTab: DayTabValue;
};

export default function DayTabs({ streamId, dayNumber, activeTab }: DayTabsProps) {
  const basePath = `/dashboard/marathon/${streamId}/day/${dayNumber}`;

  return (
    <nav className={styles.tabs} aria-label="Вкладки дня">
      <Link
        href={`${basePath}?tab=materials`}
        className={`${styles.tab} ${activeTab === 'materials' ? styles.active : ''}`}
        aria-current={activeTab === 'materials' ? 'page' : undefined}
      >
        Материалы
      </Link>
      <Link
        href={`${basePath}?tab=report`}
        className={`${styles.tab} ${activeTab === 'report' ? styles.active : ''}`}
        aria-current={activeTab === 'report' ? 'page' : undefined}
      >
        Отчёт
      </Link>
    </nav>
  );
}
