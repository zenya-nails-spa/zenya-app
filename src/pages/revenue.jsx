import { useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import AreaChart from '../components/charts/area-chart';
import Donut from '../components/charts/donut';
import ProgressBar from '../components/charts/progress-bar';
import GroupedBars from '../components/charts/grouped-bars';
import DataTable from '../components/widgets/data-table';
import LegendRow from '../components/ui/legend-row';
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

const COLUMNS = [
  { key: 'label', label: 'Día' },
  { key: 'cur', label: 'Este período', align: 'right' },
  { key: 'prev', label: 'Per. anterior', align: 'right' },
  { key: 'delta', label: 'Var.', align: 'right' },
  { key: 'appts', label: 'Ventas', align: 'right' },
];

const Revenue = ({ dateRange, prevDateRange }) => {
  const deps = [dateRange.from_date, dateRange.to_date];
  const prevDeps = [prevDateRange.from_date, prevDateRange.to_date];

  const { data: kpis } = useApi(() => api.kpis(dateRange), deps);
  const { data: kpisPrev } = useApi(() => api.kpis(prevDateRange), prevDeps);
  const { data: revByDay } = useApi(() => api.revenueByDay(dateRange), deps);
  const { data: revByDayPrev } = useApi(() => api.revenueByDay(prevDateRange), prevDeps);
  const { data: paymentsData } = useApi(() => api.paymentMethodsBreakdown(dateRange), deps);

  const revDelta = kpis && kpisPrev?.revenue ? ((kpis.revenue - kpisPrev.revenue) / kpisPrev.revenue) * 100 : 0;
  const ticketDelta =
    kpis && kpisPrev?.avg_ticket ? ((kpis.avg_ticket - kpisPrev.avg_ticket) / kpisPrev.avg_ticket) * 100 : 0;

  const chartData = useMemo(() => revByDay?.map((r) => r.revenue) ?? [], [revByDay]);
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
        <StatCard label="Meta mensual" value="—" caption="sin configurar" icon="Target" />
      </div>

      <div className="z-2col-wide">
        <Card eyebrow="Ingresos" title="Evolución de ingresos">
          <LegendRow
            items={[
              { label: 'Este período', color: 'var(--chart-1)', line: true },
              { label: 'Período anterior', color: 'var(--chart-compare)', line: true, dashed: true },
            ]}
            style={{ marginBottom: 14 }}
          />
          <AreaChart data={chartData} labels={chartLabels} yFormat={moneyK} height={220} />
        </Card>

        <Card eyebrow="Distribución" title="Por categoría">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Donut
              data={[]}
              size={160}
              thickness={22}
              centerValue={kpis ? moneyK(kpis.revenue) : '—'}
              centerLabel="total"
            />
          </div>
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
        </Card>
      </div>

      <div className="z-2col">
        <Card eyebrow="Comparativa" title="Ingresos por día">
          <LegendRow
            items={[
              { label: 'Este período', color: 'var(--chart-1)' },
              { label: 'Período anterior', color: 'var(--chart-compare)' },
            ]}
            style={{ marginBottom: 14 }}
          />
          <GroupedBars data={dailyRows} height={200} yFormat={moneyK} />
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
