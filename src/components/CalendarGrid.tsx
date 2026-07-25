import Link from 'next/link';

type CalendarDay = {
  dayNumber: number;
  totalCalories?: number;
  filled?: boolean;
};

type CalendarGridProps = {
  streamId: string;
  durationDays: number;
  currentDayNumber: number;
  reports?: Array<{ dayNumber: number; totalCalories: number }>;
};

export default function CalendarGrid({
  streamId,
  durationDays,
  currentDayNumber,
  reports = [],
}: CalendarGridProps) {
  const reportMap = new Map(reports.map((r) => [r.dayNumber, r.totalCalories]));
  const days: CalendarDay[] = Array.from({ length: durationDays }, (_, i) => {
    const dayNumber = i + 1;
    return {
      dayNumber,
      filled: reportMap.has(dayNumber),
      totalCalories: reportMap.get(dayNumber),
    };
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
      }}
    >
      {days.map((day) => {
        const isAccessible = day.dayNumber <= currentDayNumber;
        const baseStyle: React.CSSProperties = {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 64,
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '0.5rem',
          backgroundColor: day.filled ? '#d4edda' : isAccessible ? '#f8f9fa' : '#e9ecef',
          color: isAccessible ? '#1a1a2e' : '#6c757d',
          cursor: isAccessible ? 'pointer' : 'not-allowed',
          textDecoration: 'none',
        };

        const content = (
          <>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {day.dayNumber}
            </span>
            {day.filled && (
              <span style={{ fontSize: '0.75rem', color: '#155724' }}>
                {day.totalCalories?.toFixed(0)} kcal
              </span>
            )}
          </>
        );

        if (isAccessible) {
          return (
            <Link
              key={day.dayNumber}
              href={`/dashboard/marathon/${streamId}/day/${day.dayNumber}`}
              style={baseStyle}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={day.dayNumber} style={baseStyle}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
