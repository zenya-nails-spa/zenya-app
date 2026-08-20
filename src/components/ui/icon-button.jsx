import { useState } from 'react';

const VARIANT_STYLES = {
  ghost: { background: 'transparent', color: 'var(--text-secondary)', border: 'none', hoverBg: 'var(--ink-50)' },
  soft: {
    background: 'var(--brand-primary-soft)',
    color: 'var(--brand-primary)',
    border: 'none',
    hoverBg: 'var(--rose-200)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    hoverBg: 'var(--ink-50)',
  },
};

const SIZE_MAP = {
  sm: { size: 28, iconSize: 14 },
  md: { size: 36, iconSize: 16 },
  lg: { size: 44, iconSize: 20 },
};

const IconButton = ({
  variant = 'ghost',
  size = 'md',
  shape = 'rounded',
  icon: Icon,
  onClick,
  disabled = false,
  title,
  style,
}) => {
  const [hovered, setHovered] = useState(false);
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.ghost;
  const s = SIZE_MAP[size] || SIZE_MAP.md;
  const radius = shape === 'circle' ? '50%' : 'var(--radius-xs)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s.size,
        height: s.size,
        borderRadius: radius,
        border: v.border || 'none',
        background: hovered && !disabled ? v.hoverBg : v.background,
        color: v.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background var(--dur-fast) var(--ease-soft)',
        outline: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {Icon && <Icon size={s.iconSize} strokeWidth={1.8} />}
    </button>
  );
};

export default IconButton;
