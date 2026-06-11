const SectionTitle = ({ eyebrow, title, subtitle, style }) => (
  <div style={{ ...style }}>
    {eyebrow && (
      <div
        style={{
          fontFamily: 'var(--font-label)',
          fontSize: 'var(--text-2xs)',
          fontWeight: 'var(--fw-semibold)',
          letterSpacing: 'var(--ls-label)',
          textTransform: 'uppercase',
          color: 'var(--text-brand)',
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
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--fw-medium)',
          color: 'var(--text-display)',
          lineHeight: 'var(--lh-tight)',
          letterSpacing: 'var(--ls-tight)',
        }}
      >
        {title}
      </div>
    )}
    {subtitle && (
      <div
        style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 3 }}
      >
        {subtitle}
      </div>
    )}
  </div>
);

export default SectionTitle;
