const ProgressBar = ({ ratio = 0, color = 'var(--chart-1)', track = 'var(--ink-100)', height = 6, radius, style }) => {
  const r = radius !== undefined ? radius : height / 2;
  const clamped = Math.min(1, Math.max(0, ratio));

  return (
    <div style={{ width: '100%', height, background: track, borderRadius: r, overflow: 'hidden', ...style }}>
      <div
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          background: color,
          borderRadius: r,
          transition: 'width var(--dur-base) var(--ease-out)',
        }}
      />
    </div>
  );
};

export default ProgressBar;
