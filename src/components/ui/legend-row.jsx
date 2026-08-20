const LegendRow = ({ items = [], style }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', ...style }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {item.line ? (
          <svg width={20} height={10}>
            <line
              x1={0}
              y1={5}
              x2={20}
              y2={5}
              stroke={item.color || 'var(--chart-1)'}
              strokeWidth={2}
              strokeDasharray={item.dashed ? '4 2' : undefined}
            />
          </svg>
        ) : (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: item.color || 'var(--chart-1)',
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            fontWeight: 'var(--fw-medium)',
          }}
        >
          {item.label}
        </span>
        {item.value !== undefined && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              marginLeft: 2,
            }}
          >
            {item.value}
          </span>
        )}
      </div>
    ))}
  </div>
);

export default LegendRow;
