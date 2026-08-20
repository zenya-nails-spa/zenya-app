import { useState } from 'react';

const VARIANT_STYLES = {
  primary: {
    background: 'var(--brand-primary)',
    color: 'var(--text-on-rose)',
    border: 'none',
    hoverBg: 'var(--brand-primary-hover)',
  },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
    border: '1px solid var(--border-default)',
    hoverBg: 'var(--ink-50)',
  },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', border: 'none', hoverBg: 'var(--ink-50)' },
  soft: {
    background: 'var(--brand-primary-soft)',
    color: 'var(--brand-primary)',
    border: 'none',
    hoverBg: 'var(--rose-200)',
  },
};

const SIZE_STYLES = {
  sm: {
    height: 32,
    padding: '0 12px',
    fontSize: 'var(--text-sm)',
    gap: 6,
    iconSize: 14,
    borderRadius: 'var(--radius-xs)',
  },
  md: {
    height: 38,
    padding: '0 16px',
    fontSize: 'var(--text-sm)',
    gap: 8,
    iconSize: 16,
    borderRadius: 'var(--radius-sm)',
  },
  lg: {
    height: 44,
    padding: '0 20px',
    fontSize: 'var(--text-base)',
    gap: 8,
    iconSize: 18,
    borderRadius: 'var(--radius-sm)',
  },
};

const Button = ({
  variant = 'primary',
  size = 'md',
  iconLeft: IconLeft,
  iconRight: IconRight,
  fullWidth = false,
  disabled = false,
  onClick,
  children,
  style,
  type = 'button',
}) => {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-medium)',
        letterSpacing: '0.01em',
        borderRadius: s.borderRadius,
        border: v.border || 'none',
        background: hovered && !disabled ? v.hoverBg : v.background,
        color: v.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'background var(--dur-fast) var(--ease-soft), opacity var(--dur-fast)',
        whiteSpace: 'nowrap',
        outline: 'none',
        ...style,
      }}
    >
      {IconLeft && <IconLeft size={s.iconSize} strokeWidth={1.8} />}
      {children}
      {IconRight && <IconRight size={s.iconSize} strokeWidth={1.8} />}
    </button>
  );
};

export default Button;
