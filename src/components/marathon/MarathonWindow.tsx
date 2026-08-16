import MarathonHeader from './MarathonHeader';
import DayNavbar from './DayNavbar';
import DayView from './DayView';
import styles from './Marathon.module.css';

export type MarathonStream = {
  id: string;
  startDate: string;
  status: string;
  template: {
    id: string;
    title: string;
    description?: string;
    durationDays: number;
  };
};

export type MarathonRating = {
  rank: number | null;
  totalParticipants: number;
  weightLossPercent: number;
};

export type MarathonReport = {
  id: string;
  dayNumber: number;
  totalCalories: number;
  filledAt: Date | string;
};

type MarathonWindowProps = {
  stream: MarathonStream;
  currentDayNumber: number;
  rating: MarathonRating;
  reports: MarathonReport[];
  activeDay: number | null;
  onDayChange: (dayNumber: number) => void;
};

export default function MarathonWindow({
  stream,
  currentDayNumber,
  rating,
  reports,
  activeDay,
  onDayChange,
}: MarathonWindowProps) {
  return (
    <div className={styles.window}>
      <MarathonHeader
        stream={stream}
        currentDayNumber={currentDayNumber}
        rating={rating}
      />

      <DayNavbar
        durationDays={stream.template.durationDays}
        currentDayNumber={currentDayNumber}
        reports={reports}
        activeDay={activeDay}
        onDayChange={onDayChange}
      />

      {activeDay === null ? (
        <p className={styles.placeholder}>Марафон ещё не начат.</p>
      ) : (
        <DayView streamId={stream.id} dayNumber={activeDay} />
      )}
    </div>
  );
}