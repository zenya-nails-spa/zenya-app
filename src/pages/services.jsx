import { useState } from 'react';
import D from '../mocks/data';
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

const maxRev = Math.max(...D.services.map((s) => s.rev));
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

const Services = () => {
  const [catFilter, setCatFilter] = useState('Todos');
  const cats = ['Todos', ...Array.from(new Set(D.services.map((s) => s.cat)))];
  const filtered = catFilter === 'Todos' ? D.services : D.services.filter((s) => s.cat === catFilter);

  const topRev = D.services.reduce((a, b) => (a.rev > b.rev ? a : b));
  const topCount = D.services.reduce((a, b) => (a.count > b.count ? a : b));
  const topAvg = D.services.reduce((a, b) => (a.avg > b.avg ? a : b));
  const topTrend = D.services.reduce((a, b) => (a.trend > b.trend ? a : b));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Servicio top"
          value={topRev.name}
          delta={topRev.trend}
          caption={D.money(topRev.rev)}
          icon="Sparkles"
          numeralStyle="sans"
        />
        <StatCard label="Más demandado" value={`${topCount.count} citas`} caption={topCount.name} icon="Calendar" />
        <StatCard
          label="Mayor ticket"
          value={D.money(topAvg.avg)}
          delta={topAvg.trend}
          caption={topAvg.name}
          icon="DollarSign"
        />
        <StatCard
          label="Mayor crecimiento"
          value={`+${topTrend.trend}%`}
          delta={topTrend.trend}
          caption={topTrend.name}
          icon="TrendingUp"
        />
      </div>

      <div className="z-2col">
        <Card eyebrow="Ingresos" title="Por servicio">
          <BarChart
            data={D.services.map((s, i) => ({
              label: s.name.split(' ')[0],
              value: s.rev,
              color: D.CHART[i % D.CHART.length],
            }))}
            height={220}
            yFormat={D.moneyK}
          />
        </Card>

        <Card
          eyebrow="Evolución"
          title="Top servicios"
          action={
            <LegendRow
              items={D.services
                .slice(0, 3)
                .map((s, i) => ({ label: s.name.split(' ')[0], color: D.CHART[i], line: true }))}
            />
          }
        >
          <MultiLine
            series={D.services.slice(0, 3).map((s, i) => ({ data: s.spark, color: D.CHART[i] }))}
            labels={MONTHS}
            height={220}
            yFormat={D.moneyK}
          />
        </Card>
      </div>

      <div className="z-2col">
        <Card eyebrow="Ranking" title="Por ingresos">
          {D.services.map((s, i) => (
            <RankRow
              key={s.name}
              rank={i + 1}
              label={s.name}
              sublabel={s.cat}
              value={D.money(s.rev)}
              ratio={s.rev / maxRev}
              color={D.CHART[i % D.CHART.length]}
              last={i === D.services.length - 1}
            />
          ))}
        </Card>

        <Card eyebrow="Ranking" title="Por cantidad">
          {[...D.services]
            .sort((a, b) => b.count - a.count)
            .map((s, i) => (
              <RankRow
                key={s.name}
                rank={i + 1}
                label={s.name}
                sublabel={`${s.count} citas · ${D.money(s.avg)} avg`}
                value={`${s.count}`}
                ratio={s.count / Math.max(...D.services.map((x) => x.count))}
                color={D.CHART[i % D.CHART.length]}
                last={i === D.services.length - 1}
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
            if (key === 'rev') return D.money(row.rev);
            if (key === 'avg') return D.money(row.avg);
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
