import { getIcon } from '../../lib/icons';

const TONE_STYLES = {
  positive: { bg: 'var(--green-soft)', iconColor: 'var(--green-600)' },
  caution: { bg: 'var(--amber-soft)', iconColor: 'var(--caution)' },
  negative: { bg: 'var(--red-soft)', iconColor: 'var(--negative)' },
  rose: { bg: 'var(--rose-100)', iconColor: 'var(--rose-700)' },
  lavender: { bg: 'var(--lavender-100)', iconColor: 'var(--lavender-700)' },
  neutral: { bg: 'var(--ink-100)', iconColor: 'var(--ink-600)' },
};

const InsightCard = ({ icon, tone = 'neutral', title, body, style }) => {
  const t = TONE_STYLES[tone] || TONE_STYLES.neutral;
  const Icon = getIcon(icon);

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: '14px 16px',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        ...style,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          background: t.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: t.iconColor,
        }}
      >
        {Icon && <Icon size={16} strokeWidth={1.8} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-heading)',
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--lh-normal)',
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
