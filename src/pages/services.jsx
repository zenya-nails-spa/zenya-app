import { useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import RankRow from '../components/widgets/rank-row';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const COLUMNS = [
  { key: 'name', label: 'Servicio' },
  { key: 'count', label: 'Citas', align: 'right' },
  { key: 'avg', label: 'Ticket prom.', align: 'right' },
  { key: 'rev', label: 'Ingresos', align: 'right' },
];

const Services = ({ dateRange }) => {
  const deps = [dateRange.from_date, dateRange.to_date];
  const { data: rawTopServices } = useApi(() => api.topServices({ ...dateRange, limit: 20 }), deps);

  const services = useMemo(
    () =>
      (rawTopServices ?? []).map((s) => ({
        name: s.name ?? '—',
        rev: s.revenue ?? 0,
        count: s.count ?? 0,
        avg: s.count ? Math.round((s.revenue ?? 0) / s.count) : 0,
      })),
    [rawTopServices]
  );

  const maxRev = services.length ? Math.max(...services.map((s) => s.rev)) : 1;
  const maxCount = services.length ? Math.max(...services.map((s) => s.count)) : 1;
  const totalCitas = services.reduce((sum, s) => sum + s.count, 0);

  const topRev = services.length ? services.reduce((a, b) => (a.rev > b.rev ? a : b)) : null;
  const topCount = services.length ? services.reduce((a, b) => (a.count > b.count ? a : b)) : null;
  const topAvg = services.length ? services.reduce((a, b) => (a.avg > b.avg ? a : b)) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Servicio top"
          value={topRev?.name ?? '—'}
          caption={topRev ? money(topRev.rev) : '—'}
          icon="Sparkles"
          numeralStyle="sans"
        />
        <StatCard
          label="Más demandado"
          value={topCount ? `${topCount.count} citas` : '—'}
          caption={topCount?.name ?? '—'}
          icon="Calendar"
        />
        <StatCard
          label="Mayor ticket"
          value={topAvg ? money(topAvg.avg) : '—'}
          caption={topAvg?.name ?? '—'}
          icon="DollarSign"
        />
        <StatCard
          label="Total citas"
          value={totalCitas ? totalCitas.toLocaleString('es-MX') : '—'}
          caption="en el periodo"
          icon="TrendingUp"
        />
      </div>

      <div className="z-2col">
        <Card eyebrow="Ingresos" title="Por servicio">
          <BarChart
            data={services.map((s, i) => ({
              label: s.name.split(' ')[0],
              value: s.rev,
              color: CHART[i % CHART.length],
            }))}
            height={220}
            yFormat={moneyK}
          />
        </Card>

        <Card eyebrow="Demanda" title="Citas por servicio">
          <BarChart
            data={services.map((s, i) => ({
              label: s.name.split(' ')[0],
              value: s.count,
              color: CHART[i % CHART.length],
            }))}
            height={220}
            yFormat={(v) => String(Math.round(v))}
          />
        </Card>
      </div>

      <div className="z-2col">
        <Card eyebrow="Ranking" title="Por ingresos">
          {services.map((s, i) => (
            <RankRow
              key={s.name}
              rank={i + 1}
              label={s.name}
              value={money(s.rev)}
              ratio={s.rev / maxRev}
              color={CHART[i % CHART.length]}
              last={i === services.length - 1}
            />
          ))}
        </Card>

        <Card eyebrow="Ranking" title="Por cantidad">
          {[...services]
            .sort((a, b) => b.count - a.count)
            .map((s, i) => (
              <RankRow
                key={s.name}
                rank={i + 1}
                label={s.name}
                sublabel={`${money(s.avg)} ticket prom.`}
                value={`${s.count} citas`}
                ratio={s.count / maxCount}
                color={CHART[i % CHART.length]}
                last={i === services.length - 1}
              />
            ))}
        </Card>
      </div>

      <Card eyebrow="Catálogo" title="Todos los servicios">
        <DataTable
          columns={COLUMNS}
          rows={services}
          renderCell={(row, key) => {
            if (key === 'rev') return money(row.rev);
            if (key === 'avg') return money(row.avg);
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Services;
