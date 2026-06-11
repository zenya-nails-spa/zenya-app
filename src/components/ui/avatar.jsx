const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 52, xl: 68 };
const FONT_MAP = {
  xs: 'var(--text-2xs)',
  sm: 'var(--text-xs)',
  md: 'var(--text-sm)',
  lg: 'var(--text-base)',
  xl: 'var(--text-lg)',
};
const TONE_BG = { rose: 'var(--rose-200)', lavender: 'var(--lavender-200)', ink: 'var(--ink-200)' };
const TONE_COLOR = { rose: 'var(--rose-800)', lavender: 'var(--lavender-700)', ink: 'var(--ink-700)' };
const TONES = ['rose', 'lavender', 'ink'];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const autoTone = (name) => {
  if (!name) return 'ink';
  let code = 0;
  for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
  return TONES[code % TONES.length];
};

const Avatar = ({ name, initials, src, size = 'md', tone, ring = false, style }) => {
  const px = SIZE_MAP[size] || 40;
  const fs = FONT_MAP[size] || 'var(--text-sm)';
  const resolvedTone = tone || autoTone(name);
  const bg = TONE_BG[resolvedTone] || TONE_BG.ink;
  const color = TONE_COLOR[resolvedTone] || TONE_COLOR.ink;
  const label = initials || getInitials(name);

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: src ? 'transparent' : bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fs,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-semibold)',
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: ring ? '0 0 0 2px var(--surface-card), 0 0 0 4px var(--border-brand)' : undefined,
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={name || label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        label
      )}
    </div>
  );
};

export default Avatar;
