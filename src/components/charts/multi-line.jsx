import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload, label, yFormat }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.stroke, fontWeight: 600 }}>
          {yFormat ? yFormat(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const MultiLine = ({ series = [], labels = [], height = 200, yFormat }) => {
  const maxLen = Math.max(...series.map((s) => s.data.length), labels.length);
  const chartData = Array.from({ length: maxLen }, (_, i) => {
    const row = { label: labels[i] !== undefined ? labels[i] : i };
    series.forEach((s, si) => {
      row[`s${si}`] = s.data[i] !== undefined ? s.data[i] : null;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFormat}
        />
        <Tooltip content={<CustomTooltip yFormat={yFormat} />} />
        {series.map((s, i) => (
          <Line
            key={i}
            type="monotone"
            dataKey={`s${i}`}
            stroke={s.color || 'var(--chart-1)'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: s.color || 'var(--chart-1)', stroke: 'var(--surface-card)', strokeWidth: 2 }}
            strokeDasharray={s.dashed ? '5 3' : undefined}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MultiLine;
