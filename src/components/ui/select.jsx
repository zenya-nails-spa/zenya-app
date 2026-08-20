import { ChevronDown } from 'lucide-react';

const SIZE_STYLES = {
  sm: { height: 30, fontSize: 'var(--text-xs)', padding: '0 28px 0 10px' },
  md: { height: 36, fontSize: 'var(--text-sm)', padding: '0 32px 0 12px' },
  lg: { height: 42, fontSize: 'var(--text-base)', padding: '0 36px 0 14px' },
};

const Select = ({ label, value, onChange, options = [], placeholder, size = 'md', icon: Icon, style }) => {
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;
  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && (
        <label
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--fw-medium)',
            color: 'var(--text-secondary)',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {Icon && (
          <span
            style={{
              position: 'absolute',
              left: 10,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Icon size={14} strokeWidth={1.8} />
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          style={{
            height: s.height,
            padding: Icon ? '0 32px 0 30px' : s.padding,
            fontSize: s.fontSize,
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-medium)',
            color: 'var(--text-body)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            appearance: 'none',
            cursor: 'pointer',
            outline: 'none',
            minWidth: 120,
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalized.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: 8,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <ChevronDown size={14} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
};

export default Select;
