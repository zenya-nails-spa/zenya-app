import { useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import StaffCard from '../components/widgets/staff-card';
import RankRow from '../components/widgets/rank-row';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const COLUMNS = [
  { key: 'name', label: 'Empleada' },
  { key: 'role', label: 'Rol' },
  { key: 'appts', label: 'Citas', align: 'right' },
  { key: 'clients', label: 'Clientas', align: 'right' },
  { key: 'rev', label: 'Ingresos', align: 'right' },
  { key: 'rating', label: 'Rating', align: 'right' },
  { key: 'utilization', label: 'Utilización', align: 'right' },
];

const Staff = ({ dateRange }) => {
  const deps = [dateRange.from_date, dateRange.to_date];
  const { data: staffData } = useApi(() => api.staffPerformance(dateRange), deps);

  const staff = useMemo(
    () =>
      (staffData ?? []).map((s, i) => ({
        ...s,
        name: [s.first_name, s.last_name].filter(Boolean).join(' ') || `Profesional ${s.professional_id}`,
        role: s.role ?? '—',
        rev: s.revenue ?? 0,
        appts: s.services_count ?? 0,
        clients: s.clients_count ?? null,
        rating: s.rating ?? '—',
        utilization: s.utilization ?? 0,
        color: CHART[i % CHART.length],
      })),
    [staffData]
  );

  const maxRev = staff.length ? Math.max(...staff.map((s) => s.rev)) : 1;
  const totalRev = staff.reduce((acc, s) => acc + s.rev, 0);
  const totalAppts = staff.reduce((acc, s) => acc + s.appts, 0);
  const topStaff = staff[0] ?? null;

  const ratedStaff = staff.filter((s) => s.rating !== '—' && !isNaN(Number(s.rating)));
  const avgRating = ratedStaff.length
    ? (ratedStaff.reduce((acc, s) => acc + Number(s.rating), 0) / ratedStaff.length).toFixed(1)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Top empleada"
          value={topStaff?.name.split(' ')[0] ?? '—'}
          caption={topStaff ? `${money(topStaff.rev)} este mes` : '—'}
          icon="Award"
          numeralStyle="sans"
        />
        <StatCard
          label="Ingresos equipo"
          value={totalRev ? money(totalRev) : '—'}
          caption="este mes"
          icon="TrendingUp"
          spark={[]}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Rating promedio"
          value={avgRating ? `★ ${avgRating}` : '—'}
          caption={avgRating ? 'promedio del equipo' : 'sin datos'}
          icon="Star"
        />
        <StatCard
          label="Total citas"
          value={totalAppts ? totalAppts.toLocaleString('es-MX') : '—'}
          caption="este mes"
          icon="Calendar"
        />
      </div>

      <div className="z-staff-grid">
        {staff.map((s, i) => (
          <StaffCard key={s.name} s={s} rank={i + 1} maxRev={maxRev} money={money} />
        ))}
      </div>

      <div className="z-2col">
        <Card eyebrow="Distribución" title="Ingresos por empleada">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Donut
              data={staff.map((s) => ({ value: s.rev, color: s.color }))}
              size={150}
              thickness={20}
              centerValue={moneyK(totalRev)}
              centerLabel="total"
            />
            <div style={{ flex: 1, minWidth: 120 }}>
              {staff.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: i < staff.length - 1 ? '1px solid var(--border-subtle)' : 'none',
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
                    {totalRev ? `${Math.round((s.rev / totalRev) * 100)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card eyebrow="Comparativa" title="Citas por empleada">
          <BarChart
            data={staff.map((s) => ({ label: s.name.split(' ')[0], value: s.appts, color: s.color }))}
            height={200}
            yFormat={(v) => v}
          />
        </Card>
      </div>

      <Card eyebrow="Ranking" title="Por ingresos del mes">
        {staff.map((s, i) => (
          <RankRow
            key={s.name}
            rank={i + 1}
            label={s.name}
            sublabel={`${s.appts} citas`}
            value={money(s.rev)}
            ratio={s.rev / maxRev}
            color={s.color}
            last={i === staff.length - 1}
          />
        ))}
      </Card>

      <Card eyebrow="Detalle" title="Tabla de personal">
        <DataTable
          columns={COLUMNS}
          rows={staff}
          renderCell={(row, key) => {
            if (key === 'name')
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={row.name} size="sm" />
                  <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-heading)' }}>{row.name}</span>
                </div>
              );
            if (key === 'rev') return money(row.rev);
            if (key === 'rating') return row.rating !== '—' ? `★ ${row.rating}` : '—';
            if (key === 'utilization')
              return (
                <Badge tone={row.utilization > 0.8 ? 'positive' : row.utilization > 0.6 ? 'caution' : 'neutral'}>
                  {row.utilization ? `${Math.round(row.utilization * 100)}%` : '—'}
                </Badge>
              );
            return row[key] ?? '—';
          }}
        />
      </Card>
    </div>
  );
};

export default Staff;
