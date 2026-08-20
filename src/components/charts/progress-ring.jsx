const ProgressRing = ({
  value = 0,
  size = 64,
  thickness = 6,
  color = 'var(--chart-1)',
  track = 'var(--ink-100)',
  label,
  sublabel,
}) => {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value));
  const dash = clamped * circ;
  const gap = circ - dash;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray var(--dur-slow) var(--ease-out)' }}
        />
      </svg>
      {(label || sublabel) && (
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
          {label && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: size < 50 ? 'var(--text-2xs)' : 'var(--text-xs)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--text-heading)',
                lineHeight: 1.1,
              }}
            >
              {label}
            </div>
          )}
          {sublabel && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-2xs)',
                color: 'var(--text-muted)',
                marginTop: 1,
              }}
            >
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
