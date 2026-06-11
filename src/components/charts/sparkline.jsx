const Sparkline = ({
  data = [],
  width = 80,
  height = 32,
  color = 'var(--chart-1)',
  fill = true,
  strokeWidth = 1.8,
}) => {
  if (!data || data.length < 2) return <svg width={width} height={height} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const xStep = width / (data.length - 1);
  const points = data.map((v, i) => ({ x: i * xStep, y: height - ((v - min) / range) * (height - 4) - 2 }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = fill ? `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z` : null;
  const fillId = `spark-${color.replace(/[^a-z0-9]/gi, '')}-${data.length}`;

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {fill && (
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && fillPath && <path d={fillPath} fill={`url(#${fillId})`} />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
