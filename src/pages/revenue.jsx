import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import AreaChart from '../components/charts/area-chart';
import Donut from '../components/charts/donut';
import ProgressBar from '../components/charts/progress-bar';
import DataTable from '../components/widgets/data-table';
import LegendRow from '../components/ui/legend-row';
import SegmentedControl from '../components/ui/segmented-control';
import DeltaBadge from '../components/ui/delta-badge';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));

const METHOD_LABELS = {
  cash: 'Efectivo',
  debit_card: 'Tarjeta débito',
  credit_card: 'Tarjeta crédito',
  pos: 'Terminal (POS)',
  wire_transfer: 'Transferencia',
};

const LOW_TONE_COLOR = { amber: 'var(--amber-500)', red: 'var(--red-500)' };

const COLUMNS = [
  { key: 'label', label: 'Día' },
  { key: 'cur', label: 'Este período', align: 'right' },
  { key: 'prev', label: 'Per. anterior', align: 'right' },
  { key: 'delta', label: 'Var.', align: 'right' },
  { key: 'appts', label: 'Ventas', align: 'right' },
];

const Revenue = ({ dateRange, prevDateRange }) => {
  const [cmp, setCmp] = useState('prev');
  const deps = [dateRange.from_date, dateRange.to_date];
  const prevDeps = [prevDateRange.from_date, prevDateRange.to_date];

  const { data: kpis } = useApi(() => api.kpis(dateRange), deps);
  const { data: kpisPrev } = useApi(() => api.kpis(prevDateRange), prevDeps);
  const { data: revByDay } = useApi(() => api.revenueByDay(dateRange), deps);
  const { data: revByDayPrev } = useApi(() => api.revenueByDay(prevDateRange), prevDeps);
  const { data: paymentsData } = useApi(() => api.paymentMethodsBreakdown(dateRange), deps);
  const { data: categoriesData } = useApi(() => api.serviceCategories(dateRange), deps);
  const { data: lowDemandData } = useApi(() => api.lowDemandServices(dateRange), deps);

  const revDelta = kpis && kpisPrev?.revenue ? ((kpis.revenue - kpisPrev.revenue) / kpisPrev.revenue) * 100 : 0;
  const ticketDelta =
    kpis && kpisPrev?.avg_ticket ? ((kpis.avg_ticket - kpisPrev.avg_ticket) / kpisPrev.avg_ticket) * 100 : 0;

  const revenuePerAppt = kpis?.revenue && kpis?.bookings_count ? Math.round(kpis.revenue / kpis.bookings_count) : null;
  const revenuePerApptPrev =
    kpisPrev?.revenue && kpisPrev?.bookings_count ? Math.round(kpisPrev.revenue / kpisPrev.bookings_count) : null;
  const revenuePerApptDelta =
    revenuePerAppt && revenuePerApptPrev ? ((revenuePerAppt - revenuePerApptPrev) / revenuePerApptPrev) * 100 : null;

  const chartData = useMemo(() => revByDay?.map((r) => r.revenue) ?? [], [revByDay]);
  const chartCompare = useMemo(() => revByDayPrev?.map((r) => r.revenue) ?? [], [revByDayPrev]);
  const chartLabels = useMemo(
    () => revByDay?.map((r) => `Día ${new Date(r.date + 'T00:00:00').getDate()}`) ?? [],
    [revByDay]
  );

  const bestDay = useMemo(() => {
    if (!revByDay?.length) return null;
    return revByDay.reduce((a, b) => (a.revenue >= b.revenue ? a : b));
  }, [revByDay]);

  const payments = useMemo(() => {
    if (!paymentsData?.length) return [];
    const total = paymentsData.reduce((s, p) => s + p.total, 0);
    if (!total) return [];
    return paymentsData.map((p) => ({ ...p, pct: p.total / total }));
  }, [paymentsData]);

  const categories = useMemo(() => {
    if (!categoriesData?.length) return [];
    const total = categoriesData.reduce((s, c) => s + c.revenue, 0);
    return categoriesData.map((c, i) => ({
      ...c,
      color: `var(--chart-${(i % 5) + 1})`,
      pct: total ? c.revenue / total : 0,
    }));
  }, [categoriesData]);
  const catTotal = categories.reduce((s, c) => s + c.revenue, 0);

  const lowDemand = lowDemandData ?? [];

  const dailyRows = useMemo(() => {
    if (!revByDay?.length) return [];
    const prevMap = Object.fromEntries((revByDayPrev ?? []).map((r, i) => [i, r]));
    return revByDay.map((r, i) => {
      const prev = prevMap[i]?.revenue ?? 0;
      const delta = prev ? ((r.revenue - prev) / prev) * 100 : null;
      const d = new Date(r.date + 'T00:00:00');
      return {
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        cur: r.revenue,
        prev,
        delta,
        appts: r.sales_count,
      };
    });
  }, [revByDay, revByDayPrev]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Ingresos del período"
          value={kpis ? money(kpis.revenue) : '—'}
          delta={revDelta}
          caption="vs período anterior"
          icon="TrendingUp"
          spark={chartData}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Ticket promedio"
          value={kpis ? money(kpis.avg_ticket) : '—'}
          delta={ticketDelta}
          caption="vs período anterior"
          icon="DollarSign"
          spark={[]}
          sparkColor="var(--chart-2)"
        />
        <StatCard
          label="Mejor día"
          value={bestDay ? money(bestDay.revenue) : '—'}
          caption={
            bestDay
              ? (() => {
                  const d = new Date(bestDay.date + 'T00:00:00');
                  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                })()
              : 'sin datos'
          }
          icon="Star"
        />
        <StatCard
          label="Ingresos por cita"
          value={revenuePerAppt ? money(revenuePerAppt) : '—'}
          delta={revenuePerApptDelta}
          caption="vs período anterior"
          icon="Receipt"
          numeralStyle="sans"
        />
      </div>

      <Card
        eyebrow="Tendencia"
        title="Evolución de ingresos"
        action={
          <SegmentedControl
            size="sm"
            value={cmp}
            onChange={setCmp}
            options={[
              { value: 'prev', label: 'Mes anterior' },
              { value: 'yoy', label: 'Año anterior' },
            ]}
          />
        }
      >
        <LegendRow
          style={{ marginBottom: 10 }}
          items={[
            { label: 'Actual', color: 'var(--chart-1)', line: true },
            {
              label: cmp === 'prev' ? 'Mes anterior' : 'Mismo mes año pasado',
              color: 'var(--chart-compare)',
              line: true,
              dashed: true,
            },
          ]}
        />
        <AreaChart data={chartData} compare={chartCompare} labels={chartLabels} yFormat={moneyK} height={220} />
      </Card>

      <div className="z-2col">
        <Card eyebrow="Distribución" title="Por categoría de servicio">
          {categories.length > 0 ? (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <Donut
                data={categories.map((c) => ({ value: c.revenue, color: c.color }))}
                size={150}
                thickness={20}
                centerValue={catTotal ? moneyK(catTotal) : '—'}
                centerLabel="total"
              />
              <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: c.color,
                            flexShrink: 0,
                          }}
                        />
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 600,
                          color: 'var(--text-display)',
                        }}
                      >
                        {Math.round(c.pct * 100)}%
                      </span>
                    </div>
                    <ProgressBar ratio={c.pct} color={c.color} height={6} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '12px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Sin datos por categoría
            </div>
          )}
        </Card>

        <Card eyebrow="Pagos" title="Métodos de pago">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Donut
              data={payments.map((p, i) => ({
                value: p.pct,
                color: `var(--chart-${(i % 5) + 1})`,
              }))}
              size={130}
              thickness={18}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payments.length ? (
              payments.map((p, i) => (
                <div key={p.method ?? i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: `var(--chart-${(i % 5) + 1})`,
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-body)',
                        }}
                      >
                        {METHOD_LABELS[p.method] ?? p.method}
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
                      {Math.round(p.pct * 100)}%
                    </span>
                  </div>
                  <ProgressBar ratio={p.pct} color={`var(--chart-${(i % 5) + 1})`} height={5} />
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '12px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin datos de pagos
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Low demand services */}
      {lowDemand.length > 0 && (
        <Card eyebrow="Atención" title="Servicios con baja demanda">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lowDemand.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-sunken)',
                  borderLeft: `3px solid ${LOW_TONE_COLOR[s.tone] ?? LOW_TONE_COLOR.amber}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      color: 'var(--text-heading)',
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
                    {s.count} citas · {s.days_idle} días sin reserva
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: 'var(--text-display)',
                  }}
                >
                  {money(s.revenue)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card eyebrow="Detalle" title="Ingresos por día">
        <DataTable
          columns={COLUMNS}
          rows={dailyRows}
          renderCell={(row, key) => {
            if (key === 'cur' || key === 'prev') return money(row[key]);
            if (key === 'delta')
              return row.delta != null ? <DeltaBadge value={row.delta} format="percent" size="sm" /> : '—';
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Revenue;
