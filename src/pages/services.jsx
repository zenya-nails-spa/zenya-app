import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import RankRow from '../components/widgets/rank-row';
import BarChart from '../components/charts/bar-chart';
import MultiLine from '../components/charts/multi-line';
import DataTable from '../components/widgets/data-table';
import Badge from '../components/ui/badge';
import Sparkline from '../components/charts/sparkline';
import DeltaBadge from '../components/ui/delta-badge';
import LegendRow from '../components/ui/legend-row';
import SegmentedControl from '../components/ui/segmented-control';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const MONTHS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const COLUMNS = [
  { key: 'name', label: 'Servicio' },
  { key: 'cat', label: 'Categoría' },
  { key: 'provider', label: 'Proveedor' },
  { key: 'count', label: 'Citas', align: 'right' },
  { key: 'avg', label: 'Ticket', align: 'right' },
  { key: 'rev', label: 'Ingresos', align: 'right' },
  { key: 'trend', label: 'Tendencia', align: 'right' },
  { key: 'spark', label: 'Últimos 12m', align: 'right' },
];

const Services = ({ dateRange }) => {
  const [catFilter, setCatFilter] = useState('Todos');

  const deps = [dateRange.from_date, dateRange.to_date];
  const { data: rawTopServices } = useApi(() => api.topServices({ ...dateRange, limit: 20 }), deps);

  const services = useMemo(
    () =>
      (rawTopServices ?? []).map((s) => ({
        name: s.name ?? s.service_name ?? '—',
        cat: s.category ?? '—',
        provider: s.provider ?? '—',
        rev: s.revenue ?? 0,
        count: s.count ?? s.bookings_count ?? 0,
        avg: s.count ? Math.round((s.revenue ?? 0) / s.count) : 0,
        trend: s.trend ?? 0,
        spark: [],
      })),
    [rawTopServices]
  );

  const maxRev = services.length ? Math.max(...services.map((s) => s.rev)) : 1;
  const maxCount = services.length ? Math.max(...services.map((s) => s.count)) : 1;
  const cats = ['Todos', ...Array.from(new Set(services.map((s) => s.cat).filter((c) => c !== '—')))];
  const filtered = catFilter === 'Todos' ? services : services.filter((s) => s.cat === catFilter);

  const topRev = services.length ? services.reduce((a, b) => (a.rev > b.rev ? a : b)) : null;
  const topCount = services.length ? services.reduce((a, b) => (a.count > b.count ? a : b)) : null;
  const topAvg = services.length ? services.reduce((a, b) => (a.avg > b.avg ? a : b)) : null;
  const topTrend = services.length ? services.reduce((a, b) => (a.trend > b.trend ? a : b)) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Servicio top"
          value={topRev?.name ?? '—'}
          delta={topRev?.trend ?? 0}
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
          delta={topAvg?.trend ?? 0}
          caption={topAvg?.name ?? '—'}
          icon="DollarSign"
        />
        <StatCard
          label="Mayor crecimiento"
          value={topTrend ? `+${topTrend.trend}%` : '—'}
          delta={topTrend?.trend ?? 0}
          caption={topTrend?.name ?? '—'}
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

        <Card
          eyebrow="Evolución"
          title="Top servicios"
          action={
            <LegendRow
              items={services.slice(0, 3).map((s, i) => ({ label: s.name.split(' ')[0], color: CHART[i], line: true }))}
            />
          }
        >
          <MultiLine
            series={services.slice(0, 3).map((s, i) => ({ data: s.spark, color: CHART[i] }))}
            labels={MONTHS}
            height={220}
            yFormat={moneyK}
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
              sublabel={s.cat}
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
                sublabel={`${s.count} citas · ${money(s.avg)} avg`}
                value={`${s.count}`}
                ratio={s.count / maxCount}
                color={CHART[i % CHART.length]}
                last={i === services.length - 1}
              />
            ))}
        </Card>
      </div>

      <Card
        eyebrow="Catálogo"
        title="Todos los servicios"
        action={
          <SegmentedControl
            options={cats.map((c) => ({ value: c, label: c }))}
            value={catFilter}
            onChange={setCatFilter}
            size="sm"
          />
        }
      >
        <DataTable
          columns={COLUMNS}
          rows={filtered}
          renderCell={(row, key) => {
            if (key === 'rev') return money(row.rev);
            if (key === 'avg') return money(row.avg);
            if (key === 'cat') return <Badge tone="lavender">{row.cat}</Badge>;
            if (key === 'trend') return <DeltaBadge value={row.trend} format="percent" size="sm" />;
            if (key === 'spark') return <Sparkline data={row.spark} width={72} height={24} color="var(--chart-1)" />;
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Services;
