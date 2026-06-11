const TONE_STYLES = {
  neutral: {
    bg: 'var(--ink-100)',
    color: 'var(--ink-700)',
    solidBg: 'var(--ink-600)',
    solidColor: 'var(--white)',
    dot: 'var(--ink-500)',
  },
  rose: {
    bg: 'var(--rose-100)',
    color: 'var(--rose-700)',
    solidBg: 'var(--rose-700)',
    solidColor: 'var(--white)',
    dot: 'var(--rose-500)',
  },
  lavender: {
    bg: 'var(--lavender-100)',
    color: 'var(--lavender-700)',
    solidBg: 'var(--lavender-700)',
    solidColor: 'var(--white)',
    dot: 'var(--lavender-500)',
  },
  positive: {
    bg: 'var(--green-soft)',
    color: 'var(--green-600)',
    solidBg: 'var(--green-600)',
    solidColor: 'var(--white)',
    dot: 'var(--green-500)',
  },
  negative: {
    bg: 'var(--red-soft)',
    color: 'var(--red-600)',
    solidBg: 'var(--red-600)',
    solidColor: 'var(--white)',
    dot: 'var(--red-500)',
  },
  caution: {
    bg: 'var(--amber-soft)',
    color: 'var(--caution)',
    solidBg: 'var(--caution)',
    solidColor: 'var(--white)',
    dot: 'var(--amber-500)',
  },
};

const SIZE_STYLES = {
  sm: { fontSize: 'var(--text-2xs)', padding: '2px 7px', gap: 4, dotSize: 5 },
  md: { fontSize: 'var(--text-xs)', padding: '3px 9px', gap: 5, dotSize: 6 },
};

const Badge = ({ tone = 'neutral', solid = false, dot = false, size = 'sm', children, style }) => {
  const t = TONE_STYLES[tone] || TONE_STYLES.neutral;
  const s = SIZE_STYLES[size] || SIZE_STYLES.sm;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-medium)',
        letterSpacing: '0.01em',
        borderRadius: 'var(--radius-pill)',
        background: solid ? t.solidBg : t.bg,
        color: solid ? t.solidColor : t.color,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: '50%',
            background: solid ? 'rgba(255,255,255,0.7)' : t.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
