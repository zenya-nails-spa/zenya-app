const Donut = ({ data = [], size = 140, thickness = 20, centerValue, centerLabel }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let offset = 0;
  const slices = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const dashOffset = -offset * circ;
    offset += pct;
    return { ...d, dash, gap, dashOffset };
  });

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={thickness} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color || 'var(--chart-1)'}
            strokeWidth={thickness}
            strokeLinecap="butt"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
      </svg>
      {(centerValue !== undefined || centerLabel) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerValue !== undefined && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: size > 120 ? 'var(--text-xl)' : 'var(--text-lg)',
                fontWeight: 'var(--fw-medium)',
                color: 'var(--text-heading)',
                lineHeight: 1,
              }}
            >
              {centerValue}
            </div>
          )}
          {centerLabel && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-2xs)',
                color: 'var(--text-muted)',
                marginTop: 3,
                textAlign: 'center',
              }}
            >
              {centerLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Donut;
