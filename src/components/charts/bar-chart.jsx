import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, yFormat }) => {
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
        color: 'var(--text-heading)',
        fontWeight: 600,
      }}
    >
      {yFormat ? yFormat(payload[0].value) : payload[0].value}
    </div>
  );
};

const BarChart = ({ data = [], height = 200, yFormat, color = 'var(--chart-1)' }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ReBarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
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
      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
        {data.map((entry, i) => (
          <Cell key={i} fill={entry.color || color} />
        ))}
      </Bar>
    </ReBarChart>
  </ResponsiveContainer>
);

export default BarChart;
