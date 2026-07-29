import { useMemo, useState } from 'react';
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
import SegmentedControl from '../components/ui/segmented-control';
import StaffHoursPanel from '../components/widgets/staff-hours-panel';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const COLUMNS = [
  { key: 'rank', label: '#', align: 'center' },
  { key: 'name', label: 'Empleada' },
  { key: 'appts', label: 'Citas', align: 'right' },
  { key: 'recurring', label: 'Clientas recurrentes', align: 'right' },
  { key: 'avg', label: 'Ticket prom.', align: 'right' },
  { key: 'rev', label: 'Ingresos', align: 'right' },
];

const UNASSIGNED_COLUMNS = [
  { key: 'folio', label: 'Venta' },
  { key: 'date', label: 'Fecha', sortable: true, sortValue: (r) => r.date },
  { key: 'service_name', label: 'Servicio' },
  { key: 'amount', label: 'Monto', align: 'right', sortable: true, sortValue: (r) => r.amount },
];

const Staff = ({ dateRange }) => {
  const [tab, setTab] = useState('performance');
  const deps = [dateRange.from_date, dateRange.to_date];
  const { data: staffData } = useApi(() => api.staffPerformance(dateRange), deps);
  const { data: repeatData } = useApi(() => api.staffRepeatRate(dateRange), deps);
  const { data: unassigned } = useApi(() => api.unassignedServices(dateRange), deps);
  const { data: sharedBreakdown } = useApi(() => api.sharedProviderBreakdown(dateRange), deps);

  const repeatMap = useMemo(() => {
    if (!repeatData?.length) return {};
    return Object.fromEntries(repeatData.map((r) => [r.professional_id, r.repeat_clients ?? 0]));
  }, [repeatData]);

  const staff = useMemo(
    () =>
      (staffData ?? []).map((s, i) => ({
        ...s,
        name: [s.first_name, s.last_name].filter(Boolean).join(' ') || `Profesional ${s.professional_id}`,
        rev: s.revenue ?? 0,
        appts: s.services_count ?? 0,
        clients: s.clients_count ?? 0,
        avg: s.avg_ticket ?? 0,
        color: CHART[i % CHART.length],
        recurringClients: repeatMap[s.professional_id] ?? null,
      })),
    [staffData, repeatMap]
  );

  const maxRev = staff.length ? Math.max(...staff.map((s) => s.rev)) : 1;
  const totalRev = staff.reduce((acc, s) => acc + s.rev, 0);
  const totalAppts = staff.reduce((acc, s) => acc + s.appts, 0);
  const topStaff = staff[0] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'performance', label: 'Desempeño' },
          { value: 'hours', label: 'Horas' },
        ]}
      />

      {tab === 'hours' && <StaffHoursPanel />}

      {tab === 'performance' && (
        <>
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
              caption="en el periodo"
              icon="TrendingUp"
              spark={[]}
              sparkColor="var(--chart-1)"
            />
            <StatCard
              label="Total citas"
              value={totalAppts ? totalAppts.toLocaleString('es-MX') : '—'}
              caption="en el periodo"
              icon="Calendar"
            />
            <StatCard
              label="Empleadas activas"
              value={staff.length ? String(staff.length) : '—'}
              caption="con ventas en el periodo"
              icon="Users"
            />
          </div>

          <div className="z-staff-grid">
            {staff.map((s, i) => (
              <StaffCard key={s.name} s={s} rank={i + 1} maxRev={maxRev} money={money} />
            ))}
          </div>

          <div className="z-2col">
            <Card eyebrow="Ranking" title="Ingresos por persona">
              {staff.map((s, i) => (
                <RankRow
                  key={s.name}
                  rank={i + 1}
                  label={s.name}
                  sublabel={s.appts + ' citas'}
                  value={money(s.rev)}
                  ratio={s.rev / maxRev}
                  color={s.color}
                  last={i === staff.length - 1 && !(unassigned?.count > 0)}
                />
              ))}
              {unassigned?.count > 0 && (
                <RankRow
                  rank={staff.length + 1}
                  label="No asignados"
                  sublabel={unassigned.count + ' servicios'}
                  value={money(unassigned.revenue)}
                  ratio={unassigned.revenue / maxRev}
                  color="var(--chart-compare)"
                  last
                />
              )}
            </Card>

            <Card eyebrow="Carga" title="Distribución de trabajo">
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <Donut
                  data={staff.map((s) => ({ value: s.appts, color: s.color }))}
                  size={150}
                  thickness={20}
                  centerValue={totalAppts}
                  centerLabel="citas"
                />
                <div style={{ flex: 1, minWidth: 140 }}>
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
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-body)',
                          }}
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
                        {totalAppts ? `${Math.round((s.appts / totalAppts) * 100)}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {(sharedBreakdown ?? []).some((g) => g.total_count > 0) && (
            <div className="z-2col">
              {(sharedBreakdown ?? [])
                .filter((g) => g.total_count > 0)
                .map((group) => {
                  const maxPersonRev = Math.max(...group.people.map((p) => p.revenue), 1);
                  return (
                    <Card
                      key={group.provider_id}
                      eyebrow="¿Quién atendió?"
                      title={group.category}
                      info="Estas cuentas las comparten varias personas; quién atendió se identifica por el nombre escrito en la nota de la cita (ej. 'Atiende Chio'). Los servicios cuya nota no menciona a nadie conocido quedan como No asignados."
                    >
                      {group.people.map((p, i) => (
                        <RankRow
                          key={p.name}
                          rank={i + 1}
                          label={p.name}
                          sublabel={p.count + ' servicios'}
                          value={money(p.revenue)}
                          ratio={p.revenue / maxPersonRev}
                          color={p.name === 'No asignados' ? 'var(--chart-compare)' : CHART[i % CHART.length]}
                          last={i === group.people.length - 1}
                        />
                      ))}
                    </Card>
                  );
                })}
            </div>
          )}

          <Card eyebrow="Servicios" title="Volumen por persona">
            <BarChart
              data={staff.map((s) => ({ label: s.name.split(' ')[0], value: s.appts, color: s.color }))}
              height={200}
              yFormat={(v) => String(Math.round(v))}
            />
          </Card>

          <Card eyebrow="Detalle" title="Ranking del equipo">
            <DataTable
              columns={COLUMNS}
              rows={staff}
              renderCell={(row, key, ri) => {
                if (key === 'rank')
                  return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{(ri ?? 0) + 1}</span>;
                if (key === 'name')
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={row.name} size="sm" tone={ri === 0 ? 'rose' : ri === 1 ? 'lavender' : 'ink'} />
                      <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-heading)' }}>{row.name}</span>
                    </div>
                  );
                if (key === 'appts') return row.appts;
                if (key === 'recurring')
                  return row.recurringClients != null ? (
                    <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{row.recurringClients}</span>
                  ) : (
                    '—'
                  );
                if (key === 'avg') return money(row.avg);
                if (key === 'rev')
                  return <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{money(row.rev)}</span>;
                return row[key] ?? '—';
              }}
            />
          </Card>

          {unassigned?.count > 0 && (
            <Card
              eyebrow="Sin profesional"
              title="Servicios no asignados"
              info="Servicios cobrados sin profesional asignado en AgendaPro (diseños, cejas, extras de walk-in). Cuentan en los ingresos totales pero no aparecen en el ranking del equipo porque no hay a quién atribuirlos."
            >
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  marginBottom: 12,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>
                  Total: <strong style={{ color: 'var(--text-display)' }}>{money(unassigned.revenue)}</strong>
                </span>
                <span>
                  Servicios: <strong style={{ color: 'var(--text-display)' }}>{unassigned.count}</strong>
                </span>
              </div>
              <DataTable
                columns={UNASSIGNED_COLUMNS}
                rows={unassigned.items}
                renderCell={(row, key) => {
                  if (key === 'folio')
                    return (
                      <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.folio ?? row.sale_id}</span>
                    );
                  if (key === 'date') return <span style={{ color: 'var(--text-secondary)' }}>{row.date}</span>;
                  if (key === 'amount')
                    return <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{money(row.amount)}</span>;
                  return row[key] ?? '—';
                }}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Staff;
