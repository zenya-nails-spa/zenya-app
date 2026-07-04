import { useState } from 'react';

/**
 * Small ⓘ icon that reveals an explanation on hover, keyboard focus, or tap.
 * Usage: <InfoTip text="Qué significa este número" />
 */
const InfoTip = ({ text, align = 'left' }) => {
  const [open, setOpen] = useState(false);

  if (!text) return null;

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={text}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          all: 'unset',
          cursor: 'help',
          width: 15,
          height: 15,
          borderRadius: '50%',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-muted)',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          fontStyle: 'italic',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            [align === 'right' ? 'right' : 'left']: -8,
            zIndex: 50,
            width: 230,
            padding: '10px 12px',
            background: 'var(--text-heading)',
            color: 'var(--surface-card)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            fontWeight: 400,
            fontStyle: 'normal',
            letterSpacing: 'normal',
            textTransform: 'none',
            lineHeight: 1.5,
            whiteSpace: 'normal',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

export default InfoTip;
