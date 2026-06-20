import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import AreaChart from '../components/charts/area-chart';
import RankRow from '../components/widgets/rank-row';
import Avatar from '../components/ui/avatar';
import LegendRow from '../components/ui/legend-row';
import SegmentedControl from '../components/ui/segmented-control';
import { Clock } from 'lucide-react';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

function thisMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from_date: from, to_date: to };
}

function prevMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  return { from_date: from, to_date: to };
}

const Overview = () => {
  const [period, setPeriod] = useState('mes');
  const thisMonth = thisMonthRange();
  const prevMonth = prevMonthRange();

  const { data: kpis } = useApi(() => api.kpis(thisMonth), []);
  const { data: kpisPrev } = useApi(() => api.kpis(prevMonth), []);
  const { data: revByDay } = useApi(() => api.revenueByDay(thisMonth), []);
  const { data: topServices } = useApi(() => api.topServices({ ...thisMonth, limit: 5 }), []);
  const { data: staffData } = useApi(() => api.staffPerformance(thisMonth), []);
  const { data: recentBookings } = useApi(() => api.bookings({ ...thisMonth, limit: 6 }), []);

  const revDelta =
    kpis && kpisPrev?.revenue ? ((kpis.revenue - kpisPrev.revenue) / kpisPrev.revenue) * 100 : 0;
  const apptDelta =
    kpis && kpisPrev?.bookings_count
      ? ((kpis.bookings_count - kpisPrev.bookings_count) / kpisPrev.bookings_count) * 100
      : 0;
  const ticketDelta =
    kpis && kpisPrev?.avg_ticket ? ((kpis.avg_ticket - kpisPrev.avg_ticket) / kpisPrev.avg_ticket) * 100 : 0;

  const chartData = useMemo(() => revByDay?.map((r) => r.revenue) ?? [], [revByDay]);
  const chartLabels = useMemo(() => revByDay?.map((r) => `Día ${new Date(r.date).getDate()}`) ?? [], [revByDay]);
  const maxServiceRev = topServices?.length ? Math.max(...topServices.map((s) => s.revenue)) : 1;
  const bookings = recentBookings ?? [];
  const staff = staffData ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Ingresos del mes"
          value={kpis ? money(kpis.revenue) : '—'}
          delta={revDelta}
          caption="vs mes anterior"
          icon="TrendingUp"
          spark={chartData}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Citas completadas"
          value={kpis ? kpis.bookings_count.toLocaleString('es-MX') : '—'}
          delta={apptDelta}
          caption="vs mes anterior"
          icon="Calendar"
          spark={[]}
          sparkColor="var(--chart-2)"
        />
        <StatCard
          label="Ticket promedio"
          value={kpis ? money(kpis.avg_ticket) : '—'}
          delta={ticketDelta}
          caption="vs mes anterior"
          icon="DollarSign"
          spark={[]}
          sparkColor="var(--chart-3)"
        />
        <StatCard
          label="Total clientes"
          value={kpis ? kpis.new_clients.toLocaleString('es-MX') : '—'}
          caption="en base de datos"
          icon="Heart"
          spark={[]}
          sparkColor="var(--chart-4)"
        />
      </div>

      <div className="z-2col-wide">
        <Card
          eyebrow="Ingresos"
          title="Tendencia del mes"
          action={
            <SegmentedControl
              options={[
                { value: 'semana', label: 'Sem' },
                { value: 'mes', label: 'Mes' },
                { value: 'año', label: 'Año' },
              ]}
              value={period}
              onChange={setPeriod}
              size="sm"
            />
          }
        >
          <LegendRow
            items={[{ label: 'Este mes', color: 'var(--chart-1)', line: true }]}
            style={{ marginBottom: 14 }}
          />
          <AreaChart data={chartData} labels={chartLabels} yFormat={moneyK} height={210} />
        </Card>

        <Card eyebrow="Servicios" title="Top servicios">
          {(topServices ?? []).map((s, i) => (
            <RankRow
              key={s.name}
              rank={i + 1}
              label={s.name}
              value={money(s.revenue)}
              ratio={s.revenue / maxServiceRev}
              color={CHART[i % CHART.length]}
              last={i === topServices.length - 1}
            />
          ))}
        </Card>
      </div>

      <div className="z-2col">
        <Card eyebrow="Hoy" title="Actividad reciente">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {bookings.map((b, i) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < bookings.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: b.payment_status === 'paid' ? 'var(--green-500)' : 'var(--amber-500)',
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}
                  >
                    {b.service_name ?? 'Cita'} — {money(b.amount ?? 0)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 3,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Clock size={11} strokeWidth={1.5} />
                    {b.start
                      ? new Date(b.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </div>
                </div>
              </div>
            ))}
            {!bookings.length && (
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin actividad reciente
              </div>
            )}
          </div>
        </Card>

        <Card eyebrow="Análisis" title="Insights">
          <div
            style={{
              padding: '20px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Sin insights disponibles
          </div>
        </Card>
      </div>

      <Card eyebrow="Personal" title="Rendimiento del equipo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {staff.map((s, i) => {
            const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || `Profesional ${s.professional_id}`;
            return (
              <div
                key={s.professional_id}
                className="z-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: i < staff.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <Avatar name={name} size="sm" tone={i === 0 ? 'rose' : i === 1 ? 'lavender' : 'ink'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--fw-medium)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--fw-semibold)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {money(s.revenue)}
                  </div>
                  <div
                    style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
                  >
                    {s.bookings} citas
                  </div>
                </div>
              </div>
            );
          })}
          {!staff.length && (
            <div
              style={{
                padding: '20px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Sin datos de personal
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Overview;
