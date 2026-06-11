import ProgressBar from '../charts/progress-bar';

const RankRow = ({ rank, label, sublabel, value, ratio = 0, color = 'var(--chart-1)', last = false, style }) => (
  <div
    className="z-row"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      ...style,
    }}
  >
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: rank === 1 ? 'var(--rose-100)' : 'var(--ink-100)',
        color: rank === 1 ? 'var(--rose-700)' : 'var(--ink-600)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--fw-bold)',
        fontFamily: 'var(--font-sans)',
        flexShrink: 0,
      }}
    >
      {rank}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--fw-medium)',
          color: 'var(--text-heading)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {sublabel}
        </div>
      )}
      <ProgressBar ratio={ratio} color={color} height={4} style={{ marginTop: 6 }} />
    </div>
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--fw-semibold)',
        color: 'var(--text-heading)',
        flexShrink: 0,
      }}
    >
      {value}
    </div>
  </div>
);

export default RankRow;
