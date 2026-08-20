import { ResponsiveContainer, AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload, labels, yFormat }) => {
  if (!active || !payload || !payload.length) return null;
  const idx = payload[0]?.payload?._idx;
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
      {labels && idx !== undefined && <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{labels[idx]}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-body)', fontWeight: 600 }}>
          {yFormat ? yFormat(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const AreaChart = ({ data = [], compare = null, labels, yFormat, height = 200 }) => {
  const chartData = data.map((v, i) => ({
    _idx: i,
    value: typeof v === 'object' ? v.value : v,
    compare: compare ? (typeof compare[i] === 'number' ? compare[i] : null) : null,
    label: labels ? labels[i] : i,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="area-fill-rose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="area-fill-compare" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-compare)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--chart-compare)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Tooltip content={<CustomTooltip labels={labels} yFormat={yFormat} />} />
        {compare && (
          <Area
            type="monotone"
            dataKey="compare"
            stroke="var(--chart-compare)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="url(#area-fill-compare)"
            dot={false}
            activeDot={false}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#area-fill-rose)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--surface-card)', strokeWidth: 2 }}
        />
      </ReAreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChart;
