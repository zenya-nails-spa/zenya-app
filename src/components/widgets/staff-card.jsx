import Avatar from '../ui/avatar';
import Badge from '../ui/badge';

const StaffCard = ({ s, rank, money }) => (
  <div
    style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar name={s.name} size="md" tone={rank === 1 ? 'rose' : rank === 2 ? 'lavender' : 'ink'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-heading)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {s.name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {s.clients} clientas · {s.appts} citas
        </div>
      </div>
      <Badge tone={rank === 1 ? 'rose' : 'neutral'} solid={rank === 1}>
        #{rank}
      </Badge>
    </div>

    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--fw-medium)',
            color: 'var(--text-heading)',
            lineHeight: 1,
          }}
        >
          {money(s.rev)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-2xs)',
            color: 'var(--text-muted)',
            marginTop: 3,
          }}
        >
          Ingresos
        </div>
      </div>
      <div style={{ width: 1, background: 'var(--border-subtle)' }} />
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-heading)',
            lineHeight: 1,
          }}
        >
          {money(s.avg)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-2xs)',
            color: 'var(--text-muted)',
            marginTop: 3,
          }}
        >
          Ticket prom.
        </div>
      </div>
    </div>
  </div>
);

export default StaffCard;
