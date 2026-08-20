import { TrendingUp, TrendingDown } from 'lucide-react';

const SIZE_MAP = {
  sm: { fontSize: 'var(--text-xs)', iconSize: 12, gap: 4 },
  md: { fontSize: 'var(--text-sm)', iconSize: 14, gap: 5 },
  lg: { fontSize: 'var(--text-base)', iconSize: 16, gap: 6 },
};

const DeltaBadge = ({ value = 0, format = 'percent', direction, size = 'sm', style }) => {
  const s = SIZE_MAP[size] || SIZE_MAP.sm;
  const isPositive = direction !== undefined ? direction === 'up' : value >= 0;
  const color = isPositive ? 'var(--positive)' : 'var(--negative)';
  const bg = isPositive ? 'var(--positive-soft)' : 'var(--negative-soft)';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  const formatted =
    format === 'percent'
      ? `${Math.abs(value).toFixed(1)}%`
      : format === 'currency'
        ? `$${Math.abs(Math.round(value)).toLocaleString('es-MX')}`
        : `${Math.abs(value)}`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        background: bg,
        color,
        fontSize: s.fontSize,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-semibold)',
        ...style,
      }}
    >
      <Icon size={s.iconSize} strokeWidth={2} />
      {formatted}
    </span>
  );
};

export default DeltaBadge;
