import D from '../mocks/data';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import StaffCard from '../components/widgets/staff-card';
import RankRow from '../components/widgets/rank-row';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';

const maxRev = Math.max(...D.staff.map((s) => s.rev));
const totalRev = D.staff.reduce((s, m) => s + m.rev, 0);
const avgRating = (D.staff.reduce((s, m) => s + m.rating, 0) / D.staff.length).toFixed(1);
const totalAppts = D.staff.reduce((s, m) => s + m.appts, 0);

const COLUMNS = [
  { key: 'name', label: 'Empleada' },
  { key: 'role', label: 'Rol' },
  { key: 'appts', label: 'Citas', align: 'right' },
  { key: 'clients', label: 'Clientas', align: 'right' },
  { key: 'rev', label: 'Ingresos', align: 'right' },
  { key: 'rating', label: 'Rating', align: 'right' },
  { key: 'utilization', label: 'Utilización', align: 'right' },
];

const Staff = () => {
  const topStaff = D.staff[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Top empleada"
          value={topStaff.name.split(' ')[0]}
          caption={`${D.money(topStaff.rev)} este mes`}
          icon="Award"
          numeralStyle="sans"
        />
        <StatCard
          label="Ingresos equipo"
          value={D.money(totalRev)}
          delta={5.8}
          caption="vs mes anterior"
          icon="TrendingUp"
          spark={D.series(61, 12, 70000, 10000, 500)}
          sparkColor="var(--chart-1)"
        />
        <StatCard label="Rating promedio" value={`★ ${avgRating}`} delta={0.1} caption="satisfacción" icon="Star" />
        <StatCard
          label="Total citas"
          value={totalAppts.toLocaleString('es-MX')}
          delta={8.1}
          caption="vs mes anterior"
          icon="Calendar"
        />
      </div>

      <div className="z-staff-grid">
        {D.staff.map((s, i) => (
          <StaffCard key={s.name} s={s} rank={i + 1} maxRev={maxRev} money={D.money} />
        ))}
      </div>

      <div className="z-2col">
        <Card eyebrow="Distribución" title="Ingresos por empleada">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Donut
              data={D.staff.map((s) => ({ value: s.rev, color: s.color }))}
              size={150}
              thickness={20}
              centerValue={D.moneyK(totalRev)}
              centerLabel="total"
            />
            <div style={{ flex: 1, minWidth: 120 }}>
              {D.staff.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: i < D.staff.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <span
                      style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}
                    >
                      {s.name.split(' ')[0]}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--fw-semibold)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {Math.round((s.rev / totalRev) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card eyebrow="Comparativa" title="Citas por empleada">
          <BarChart
            data={D.staff.map((s) => ({ label: s.name.split(' ')[0], value: s.appts, color: s.color }))}
            height={200}
            yFormat={(v) => v}
          />
        </Card>
      </div>

      <Card eyebrow="Ranking" title="Por ingresos del mes">
        {D.staff.map((s, i) => (
          <RankRow
            key={s.name}
            rank={i + 1}
            label={s.name}
            sublabel={`${s.appts} citas · ${s.clients} clientas`}
            value={D.money(s.rev)}
            ratio={s.rev / maxRev}
            color={s.color}
            last={i === D.staff.length - 1}
          />
        ))}
      </Card>

      <Card eyebrow="Detalle" title="Tabla de personal">
        <DataTable
          columns={COLUMNS}
          rows={D.staff}
          renderCell={(row, key) => {
            if (key === 'name')
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={row.name} size="sm" />
                  <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-heading)' }}>{row.name}</span>
                </div>
              );
            if (key === 'rev') return D.money(row.rev);
            if (key === 'rating') return `★ ${row.rating}`;
            if (key === 'utilization')
              return (
                <Badge tone={row.utilization > 0.8 ? 'positive' : row.utilization > 0.6 ? 'caution' : 'neutral'}>
                  {Math.round(row.utilization * 100)}%
                </Badge>
              );
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Staff;
