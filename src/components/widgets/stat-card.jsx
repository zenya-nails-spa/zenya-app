import DeltaBadge from '../ui/delta-badge';
import Sparkline from '../charts/sparkline';
import InfoTip from '../ui/info-tip';
import { getIcon } from '../../lib/icons';

const StatCard = ({
  label,
  value,
  delta,
  deltaFormat = 'percent',
  caption,
  icon,
  info,
  spark,
  sparkColor = 'var(--chart-1)',
  numeralStyle = 'display',
  accent = false,
  style,
}) => {
  const Icon = getIcon(icon);

  return (
    <div
      style={{
        background: accent ? 'var(--surface-blush)' : 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        padding: '18px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--fw-semibold)',
            letterSpacing: 'var(--ls-label)',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {label}
          {info && <InfoTip text={info} />}
        </span>
        {Icon && (
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-xs)',
              background: 'var(--brand-primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
            }}
          >
            <Icon size={14} strokeWidth={1.8} />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div
          style={{
            fontFamily: numeralStyle === 'display' ? 'var(--font-display)' : 'var(--font-sans)',
            fontSize: numeralStyle === 'display' ? 'var(--text-3xl)' : 'var(--text-2xl)',
            fontWeight: numeralStyle === 'display' ? 'var(--fw-medium)' : 'var(--fw-bold)',
            color: 'var(--text-display)',
            lineHeight: 'var(--lh-tight)',
            letterSpacing: 'var(--ls-tight)',
          }}
        >
          {value}
        </div>
        {spark && (
          <div className="z-spark">
            <Sparkline data={spark} width={72} height={36} color={sparkColor} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {delta !== undefined && delta !== null && <DeltaBadge value={delta} format={deltaFormat} size="sm" />}
        {caption && (
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {caption}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
