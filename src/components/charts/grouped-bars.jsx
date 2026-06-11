import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
        <div key={i} style={{ color: p.fill, fontWeight: 600 }}>
          {p.name === 'cur' ? 'Este mes' : 'Mes anterior'}: {yFormat ? yFormat(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const GroupedBars = ({ data = [], height = 200, yFormat }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%" barGap={3}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
        axisLine={false}
        tickLine={false}
        tickFormatter={yFormat}
      />
      <Tooltip content={<CustomTooltip yFormat={yFormat} />} cursor={{ fill: 'var(--ink-50)' }} />
      <Bar dataKey="prev" name="prev" fill="var(--chart-compare)" radius={[3, 3, 0, 0]} />
      <Bar dataKey="cur" name="cur" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default GroupedBars;
