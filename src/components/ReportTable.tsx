export type ReportLineItem = {
  id?: string;
  productId: string;
  name: string;
  calories: number;
  weightGrams: number;
  lineCalories: number;
};

type ReportTableProps = {
  lines: ReportLineItem[];
  onChange: (lines: ReportLineItem[]) => void;
  readOnly?: boolean;
};

export function computeLineCalories(
  weightGrams: number,
  calories: number
): number {
  return Math.round(weightGrams * calories) / 100;
}

export default function ReportTable({
  lines,
  onChange,
  readOnly,
}: ReportTableProps) {
  function updateWeight(index: number, value: string) {
    const weight = parseFloat(value);
    if (Number.isNaN(weight) || weight <= 0) return;

    const next = lines.map((line, i) => {
      if (i !== index) return line;
      return {
        ...line,
        weightGrams: weight,
        lineCalories: computeLineCalories(weight, line.calories),
      };
    });
    onChange(next);
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  const total = lines.reduce((sum, line) => sum + line.lineCalories, 0);

  return (
    <div>
      {lines.length === 0 ? (
        <p style={{ color: '#666' }}>No products added yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>kcal/100g</th>
              <th style={thStyle}>Weight (g)</th>
              <th style={thStyle}>kcal</th>
              {!readOnly && <th style={thStyle}></th>}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.productId}-${index}`}>
                <td style={tdStyle}>{line.name}</td>
                <td style={tdStyle}>{line.calories}</td>
                <td style={tdStyle}>
                  {readOnly ? (
                    line.weightGrams
                  ) : (
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={line.weightGrams}
                      onChange={(e) => updateWeight(index, e.target.value)}
                      style={{
                        width: 80,
                        padding: '0.35rem 0.5rem',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    />
                  )}
                </td>
                <td style={tdStyle}>{line.lineCalories.toFixed(2)}</td>
                {!readOnly && (
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c0392b',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
        Total: {total.toFixed(2)} kcal
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.6rem 0.5rem',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
  fontSize: '0.9rem',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.5rem',
  borderBottom: '1px solid #eee',
  fontSize: '0.95rem',
};
