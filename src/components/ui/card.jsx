import { useState } from 'react';
import InfoTip from './info-tip';

const Card = ({ title, eyebrow, action, info, children, padding = 20, interactive = false, style }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: hovered && interactive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)',
        transition: 'box-shadow var(--dur-base) var(--ease-soft)',
        cursor: interactive ? 'pointer' : undefined,
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || eyebrow || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: `${padding}px ${padding}px 14px`,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            {eyebrow && (
              <div
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--fw-semibold)',
                  letterSpacing: 'var(--ls-label)',
                  color: 'var(--text-brand)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {eyebrow}
              </div>
            )}
            {title && (
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--fw-medium)',
                  color: 'var(--text-heading)',
                  lineHeight: 'var(--lh-tight)',
                }}
              >
                {title}
                {info && <InfoTip text={info} />}
              </div>
            )}
          </div>
          {action && <div style={{ flexShrink: 0, marginLeft: 12 }}>{action}</div>}
        </div>
      )}
      <div style={{ padding: `${padding}px` }}>{children}</div>
    </div>
  );
};

export default Card;
