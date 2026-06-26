import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import AreaChart from '../components/charts/area-chart';
import RankRow from '../components/widgets/rank-row';
import StaffCard from '../components/widgets/staff-card';
import LegendRow from '../components/ui/legend-row';
import SegmentedControl from '../components/ui/segmented-control';
import { Clock, TrendingUp, TrendingDown, Sparkles, Award, Calendar, Heart } from 'lucide-react';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const INSIGHT_COLORS = {
  positive: { bg: 'var(--lavender-50)', fg: 'var(--green-600)' },
  caution: { bg: 'var(--lavender-50)', fg: 'var(--amber-600)' },
  neutral: { bg: 'var(--lavender-50)', fg: 'var(--lavender-500)' },
};

const HEALTH_COLORS = {
  green: { dot: 'var(--green-500)', soft: 'var(--positive-soft)' },
  amber: { dot: 'var(--amber-500)', soft: 'var(--caution-soft)' },
  red: { dot: 'var(--red-500)', soft: 'var(--negative-soft)' },
};

function computeInsights({ kpis, kpisPrev, topServices, staffData, revByDay }) {
  const list = [];

  if (kpis && kpisPrev?.revenue > 0) {
    const delta = ((kpis.revenue - kpisPrev.revenue) / kpisPrev.revenue) * 100;
    const up = delta >= 0;
    list.push({
      Icon: up ? TrendingUp : TrendingDown,
      tone: up ? 'positive' : 'caution',
      text: `Los ingresos ${up ? 'subieron' : 'bajaron'} ${Math.abs(delta).toFixed(1)}% vs el periodo anterior`,
    });
  }

  if (topServices?.length) {
    const top = topServices[0];
    list.push({
      Icon: Sparkles,
      tone: 'neutral',
      text: `"${top.name}" fue el servicio top — ${money(top.revenue)} en ${top.count} citas`,
    });
  }

  if (staffData?.length) {
    const top = staffData[0];
    const name = [top.first_name, top.last_name].filter(Boolean).join(' ') || `Profesional ${top.professional_id}`;
    list.push({
      Icon: Award,
      tone: 'neutral',
      text: `${name} lideró el equipo con ${money(top.revenue)} en el periodo`,
    });
  }

  if (revByDay?.length) {
    const best = revByDay.reduce((a, b) => (a.revenue > b.revenue ? a : b));
    const weekday = WEEKDAYS[new Date(best.date + 'T12:00:00').getDay()];
    list.push({
      Icon: Calendar,
      tone: 'neutral',
      text: `Mejor día: ${weekday} ${best.date.slice(8)} con ${money(best.revenue)} en ventas`,
    });
  }

  if (kpis?.distinct_clients > 0) {
    const pct = Math.round((kpis.recurring_clients / kpis.distinct_clients) * 100);
    list.push({
      Icon: Heart,
      tone: pct >= 50 ? 'positive' : 'neutral',
      text: `${pct}% de las clientas del periodo son recurrentes (${kpis.recurring_clients} de ${kpis.distinct_clients})`,
    });
  }

  return list;
}

const Overview = ({ dateRange, prevDateRange }) => {
  const [period, setPeriod] = useState('mes');

  const deps = [dateRange.from_date, dateRange.to_date];
  const prevDeps = [prevDateRange.from_date, prevDateRange.to_date];

  const { data: kpis } = useApi(() => api.kpis(dateRange), deps);
  const { data: kpisPrev } = useApi(() => api.kpis(prevDateRange), prevDeps);
  const { data: revByDay } = useApi(() => api.revenueByDay(dateRange), deps);
  const { data: topServices } = useApi(() => api.topServices({ ...dateRange, limit: 5 }), deps);
  const { data: staffData } = useApi(() => api.staffPerformance(dateRange), deps);
  const { data: recentBookings } = useApi(() => api.bookings({ ...dateRange, limit: 6 }), deps);
  const { data: healthData } = useApi(() => api.healthScore(dateRange), deps);

  const revDelta = kpis && kpisPrev?.revenue ? ((kpis.revenue - kpisPrev.revenue) / kpisPrev.revenue) * 100 : 0;
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
      })),
    [staffData]
  );

  const insights = useMemo(
    () => computeInsights({ kpis, kpisPrev, topServices, staffData, revByDay }),
    [kpis, kpisPrev, topServices, staffData, revByDay]
  );

  const healthMetrics = healthData?.metrics ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Ingresos"
          value={kpis ? money(kpis.revenue) : '—'}
          delta={revDelta}
          caption="vs periodo anterior"
          icon="TrendingUp"
          spark={chartData}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Citas completadas"
          value={kpis ? kpis.bookings_count.toLocaleString('es-MX') : '—'}
          delta={apptDelta}
          caption="vs periodo anterior"
          icon="Calendar"
          spark={[]}
          sparkColor="var(--chart-2)"
        />
        <StatCard
          label="Ticket promedio"
          value={kpis ? money(kpis.avg_ticket) : '—'}
          delta={ticketDelta}
          caption="vs periodo anterior"
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
          title="Tendencia del periodo"
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
            items={[{ label: 'Periodo seleccionado', color: 'var(--chart-1)', line: true }]}
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
          {insights.length ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {insights.map((ins, i) => {
                const colors = INSIGHT_COLORS[ins.tone];
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: i < insights.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-sm)',
                        background: colors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <ins.Icon size={14} strokeWidth={1.8} color={colors.fg} />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-body)',
                        lineHeight: 1.5,
                      }}
                    >
                      {ins.text}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '20px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Sin datos suficientes para generar insights
            </div>
          )}
        </Card>
      </div>

      {/* Business health scorecard */}
      {healthMetrics.length > 0 && (
        <Card eyebrow="Diagnóstico" title="Salud del negocio">
          <div className="z-health-grid">
            {healthMetrics.map((m, i) => {
              const c = HEALTH_COLORS[m.status] ?? HEALTH_COLORS.amber;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '13px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: c.soft,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: c.dot,
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--fw-semibold)',
                          color: 'var(--text-heading)',
                        }}
                      >
                        {m.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--fw-medium)',
                          color: 'var(--text-body)',
                        }}
                      >
                        {m.value}
                      </span>
                    </div>
                    {m.note && (
                      <div
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        {m.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Staff performance grid */}
      {staff.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 'var(--ls-label)',
              textTransform: 'uppercase',
              color: 'var(--text-brand)',
              marginBottom: 14,
            }}
          >
            Rendimiento del equipo
          </div>
          <div className="z-staff-grid">
            {staff.map((s, i) => (
              <StaffCard key={s.name} s={s} rank={i + 1} maxRev={Math.max(...staff.map((x) => x.rev))} money={money} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
