import { useState } from 'react';
import D from '../mocks/data';
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

const revDelta = ((D.totals.revMonth - D.totals.revPrevMonth) / D.totals.revPrevMonth) * 100;
const ticketDelta = ((D.totals.avgTicket - D.totals.avgTicketPrev) / D.totals.avgTicketPrev) * 100;

const COLUMNS = [
  { key: 'label', label: 'Día' },
  { key: 'cur', label: 'Este mes', align: 'right' },
  { key: 'prev', label: 'Mes ant.', align: 'right' },
  { key: 'delta', label: 'Var.', align: 'right' },
  { key: 'appts', label: 'Citas', align: 'right' },
];

const Revenue = () => {
  const [period, setPeriod] = useState('mes');

  const rows = D.dayRows.map((r) => ({ ...r, delta: ((r.cur - r.prev) / r.prev) * 100 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Ingresos del mes"
          value={D.money(D.totals.revMonth)}
          delta={revDelta}
          caption="vs mes anterior"
          icon="TrendingUp"
          spark={D.series(51, 12, 60000, 20000, 1400)}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Ticket promedio"
          value={D.money(D.totals.avgTicket)}
          delta={ticketDelta}
          caption="vs mes anterior"
          icon="DollarSign"
          spark={D.series(52, 12, 120, 20, 1)}
          sparkColor="var(--chart-2)"
        />
        <StatCard
          label="Mejor día"
          value={D.money(9200)}
          delta={9.5}
          caption="Sábado"
          icon="Star"
          spark={D.series(53, 12, 7000, 2000, 100)}
          sparkColor="var(--chart-3)"
        />
        <StatCard label="Meta mensual" value="87%" delta={4.2} caption="$78.5k de $90k" icon="Target" />
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
          <AreaChart
            data={D.revToday}
            compare={D.revPrev}
            labels={D.revToday.map((_, i) => `Día ${i + 1}`)}
            yFormat={D.moneyK}
            height={220}
          />
        </Card>

        <Card eyebrow="Distribución" title="Por categoría">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Donut
              data={D.categories}
              size={160}
              thickness={22}
              centerValue={D.moneyK(D.totals.revMonth)}
              centerLabel="total"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {D.categories.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: cat.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}
                    >
                      {cat.name}
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
                    {D.money(cat.rev)}
                  </span>
                </div>
                <ProgressBar ratio={cat.pct} color={cat.color} height={5} />
              </div>
            ))}
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
          <GroupedBars data={D.weekCompare} height={200} yFormat={D.moneyK} />
        </Card>

        <Card eyebrow="Pagos" title="Métodos de pago">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Donut data={D.payments.map((p) => ({ value: p.pct, color: p.color }))} size={130} thickness={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {D.payments.map((p) => (
              <div key={p.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: p.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}
                    >
                      {p.name}
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
                <ProgressBar ratio={p.pct} color={p.color} height={5} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card eyebrow="Detalle" title="Ingresos por día de la semana">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          renderCell={(row, key) => {
            if (key === 'cur' || key === 'prev') return D.money(row[key]);
            if (key === 'delta') return <DeltaBadge value={row.delta} format="percent" size="sm" />;
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Revenue;
