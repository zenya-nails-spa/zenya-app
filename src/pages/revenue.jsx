import { useState, useMemo } from 'react';
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
import SegmentedControl from '../components/ui/segmented-control';
import DeltaBadge from '../components/ui/delta-badge';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));

const COLUMNS = [
  { key: 'label', label: 'Día' },
  { key: 'cur', label: 'Este mes', align: 'right' },
  { key: 'prev', label: 'Mes ant.', align: 'right' },
  { key: 'delta', label: 'Var.', align: 'right' },
  { key: 'appts', label: 'Citas', align: 'right' },
];

const Revenue = ({ dateRange, prevDateRange }) => {
  const [period, setPeriod] = useState('mes');

  const deps = [dateRange.from_date, dateRange.to_date];
  const prevDeps = [prevDateRange.from_date, prevDateRange.to_date];

  const { data: kpis } = useApi(() => api.kpis(dateRange), deps);
  const { data: kpisPrev } = useApi(() => api.kpis(prevDateRange), prevDeps);
  const { data: revByDay } = useApi(() => api.revenueByDay(dateRange), deps);
  const { data: paymentsData } = useApi(() => api.paymentMethodsBreakdown(dateRange), deps);

  const revDelta = kpis && kpisPrev?.revenue ? ((kpis.revenue - kpisPrev.revenue) / kpisPrev.revenue) * 100 : 0;
  const ticketDelta =
    kpis && kpisPrev?.avg_ticket ? ((kpis.avg_ticket - kpisPrev.avg_ticket) / kpisPrev.avg_ticket) * 100 : 0;

  const chartData = useMemo(() => revByDay?.map((r) => r.revenue) ?? [], [revByDay]);
  const chartLabels = useMemo(() => revByDay?.map((r) => `Día ${new Date(r.date).getDate()}`) ?? [], [revByDay]);
  const payments = paymentsData ?? [];

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
          label="Ticket promedio"
          value={kpis ? money(kpis.avg_ticket) : '—'}
          delta={ticketDelta}
          caption="vs mes anterior"
          icon="DollarSign"
          spark={[]}
          sparkColor="var(--chart-2)"
        />
        <StatCard label="Mejor día" value="—" caption="sin datos" icon="Star" />
        <StatCard label="Meta mensual" value="—" caption="sin configurar" icon="Target" />
      </div>

      <div className="z-2col-wide">
        <Card
          eyebrow="Ingresos"
          title="Evolución de ingresos"
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
            items={[
              { label: 'Este mes', color: 'var(--chart-1)', line: true },
              { label: 'Mes anterior', color: 'var(--chart-compare)', line: true, dashed: true },
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
              { label: 'Este mes', color: 'var(--chart-1)' },
              { label: 'Mes anterior', color: 'var(--chart-compare)' },
            ]}
            style={{ marginBottom: 14 }}
          />
          <GroupedBars data={[]} height={200} yFormat={moneyK} />
        </Card>

        <Card eyebrow="Pagos" title="Métodos de pago">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Donut
              data={payments.map((p, i) => ({
                value: p.percentage ?? p.pct ?? 0,
                color: `var(--chart-${(i % 5) + 1})`,
              }))}
              size={130}
              thickness={18}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payments.length ? (
              payments.map((p, i) => (
                <div key={p.method_name ?? p.name ?? i}>
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
                        {p.method_name ?? p.name ?? '—'}
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
                      {Math.round((p.percentage ?? p.pct ?? 0) * 100)}%
                    </span>
                  </div>
                  <ProgressBar ratio={p.percentage ?? p.pct ?? 0} color={`var(--chart-${(i % 5) + 1})`} height={5} />
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

      <Card eyebrow="Detalle" title="Ingresos por día de la semana">
        <DataTable
          columns={COLUMNS}
          rows={[]}
          renderCell={(row, key) => {
            if (key === 'cur' || key === 'prev') return money(row[key]);
            if (key === 'delta') return <DeltaBadge value={row.delta} format="percent" size="sm" />;
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Revenue;
