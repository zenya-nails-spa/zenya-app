const SIZE_STYLES = {
  sm: { height: 28, fontSize: 'var(--text-xs)', padding: '0 10px', gap: 2 },
  md: { height: 34, fontSize: 'var(--text-sm)', padding: '0 14px', gap: 3 },
  lg: { height: 40, fontSize: 'var(--text-base)', padding: '0 18px', gap: 4 },
};

const SegmentedControl = ({ options = [], value, onChange, size = 'md', style }) => {
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;
  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-sm)',
        padding: 3,
        gap: s.gap,
        ...style,
      }}
    >
      {normalized.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange && onChange(opt.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: s.height,
              padding: s.padding,
              fontSize: s.fontSize,
              fontFamily: 'var(--font-sans)',
              fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              color: active ? 'var(--text-heading)' : 'var(--text-muted)',
              background: active ? 'var(--surface-card)' : 'transparent',
              border: 'none',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              cursor: 'pointer',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--dur-fast) var(--ease-soft)',
              whiteSpace: 'nowrap',
              outline: 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
