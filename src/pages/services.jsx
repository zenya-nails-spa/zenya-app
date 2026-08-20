import { useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import RankRow from '../components/widgets/rank-row';
import BarChart from '../components/charts/bar-chart';
import Donut from '../components/charts/donut';
import DataTable from '../components/widgets/data-table';
import Badge from '../components/ui/badge';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const COLUMNS = [
  { key: 'name', label: 'Servicio' },
  { key: 'count', label: 'Citas', align: 'right' },
  { key: 'unique', label: 'Clientas únicas', align: 'right' },
  { key: 'repeat', label: 'Tasa de repetición', align: 'right' },
  { key: 'avg', label: 'Ticket prom.', align: 'right' },
  { key: 'rev', label: 'Ingresos', align: 'right' },
];

const CROSSSELL_COLUMNS = [
  { key: 'service_a', label: 'Servicio A' },
  { key: 'service_b', label: 'Servicio B' },
  { key: 'co_purchases', label: 'Comprados juntos', align: 'right' },
  { key: 'tag', label: 'Oportunidad', align: 'right' },
];

const PRODUCT_COLUMNS = [
  { key: 'name', label: 'Producto' },
  { key: 'quantity', label: 'Vendidos', align: 'right' },
  { key: 'avg', label: 'Precio prom.', align: 'right' },
  { key: 'revenue', label: 'Ingresos', align: 'right' },
];

const Services = ({ dateRange }) => {
  const deps = [dateRange.from_date, dateRange.to_date];
  // High limit on purpose: this feeds both the "Todos los servicios" table (which should
  // really show all of them) and the "Servicio top"/"Más demandado" KPI cards below, which
  // reduce over this same list. Capping it low silently drops rare, high-revenue-or-count
  // services from those KPI computations even though their data is correct — they just
  // never rank in a small top N by revenue (the backend's sort key).
  const { data: rawTopServices } = useApi(() => api.topServices({ ...dateRange, limit: 500 }), deps);
  const { data: categoriesData } = useApi(() => api.serviceCategories(dateRange), deps);
  const { data: crossSellData } = useApi(() => api.crossSell(dateRange), deps);
  const { data: repeatData } = useApi(() => api.serviceRepeatRate(dateRange), deps);
  const { data: rawTopProducts } = useApi(() => api.topProducts({ ...dateRange, limit: 20 }), deps);
  // "Mayor ticket" means the biggest single checkout (one whole sale), not the highest
  // per-service-name average — a client's visit is often several different services/
  // products in one sale, and no individual service's own average reflects that total.
  const { data: salesSummary } = useApi(() => api.salesSummary(dateRange), deps);

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

  const repeatMap = useMemo(() => {
    if (!repeatData?.length) return {};
    return Object.fromEntries(repeatData.map((r) => [r.service_name, r]));
  }, [repeatData]);

  const tableRows = useMemo(
    () =>
      services.map((s) => ({
        ...s,
        unique: repeatMap[s.name]?.total_clients ?? '—',
        repeatRate: repeatMap[s.name]?.repeat_rate ?? null,
      })),
    [services, repeatMap]
  );

  const maxRev = services.length ? Math.max(...services.map((s) => s.rev)) : 1;
  const maxCount = services.length ? Math.max(...services.map((s) => s.count)) : 1;
  const totalCitas = services.reduce((sum, s) => sum + s.count, 0);

  const topRev = services.length ? services.reduce((a, b) => (a.rev > b.rev ? a : b)) : null;
  const topCount = services.length ? services.reduce((a, b) => (a.count > b.count ? a : b)) : null;

  const categories = useMemo(() => {
    if (!categoriesData?.length) return [];
    return categoriesData.map((c, i) => ({
      ...c,
      color: `var(--chart-${(i % 5) + 1})`,
    }));
  }, [categoriesData]);
  const catTotal = categories.reduce((s, c) => s + (c.revenue ?? 0), 0);

  const crossSell = crossSellData ?? [];

  const products = rawTopProducts ?? [];
  const maxProductQty = products.length ? Math.max(...products.map((p) => p.quantity)) : 1;

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
          value={salesSummary?.max_ticket != null ? money(salesSummary.max_ticket) : '—'}
          caption={salesSummary?.max_ticket_client ?? '—'}
          icon="DollarSign"
        />
        <StatCard
          label="Total citas"
          value={totalCitas ? totalCitas.toLocaleString('es-MX') : '—'}
          caption="en el periodo"
          icon="TrendingUp"
        />
      </div>

      {/* Category breakdown donut */}
      {categories.length > 0 && (
        <Card eyebrow="Categorías" title="Ingresos por categoría">
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <Donut
              data={categories.map((c) => ({ value: c.revenue ?? 0, color: c.color }))}
              size={180}
              thickness={22}
              centerValue={catTotal ? moneyK(catTotal) : '—'}
              centerLabel="total"
            />
            <div
              style={{
                flex: 1,
                minWidth: 240,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 20px',
              }}
            >
              {categories.map((c, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                      minWidth: 0,
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
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </span>
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--text-display)',
                      flexShrink: 0,
                    }}
                  >
                    {money(c.revenue ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="z-2col">
        <Card eyebrow="Ingresos" title="Por servicio">
          <BarChart
            data={services.slice(0, 8).map((s, i) => ({
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
            data={[...services]
              .sort((a, b) => b.count - a.count)
              .slice(0, 8)
              .map((s, i) => ({
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
          {services.slice(0, 6).map((s, i) => (
            <RankRow
              key={s.name}
              rank={i + 1}
              label={s.name}
              value={money(s.rev)}
              ratio={s.rev / maxRev}
              color={CHART[i % CHART.length]}
              last={i === Math.min(5, services.length - 1)}
            />
          ))}
        </Card>

        <Card eyebrow="Ranking" title="Por cantidad">
          {[...services]
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map((s, i) => (
              <RankRow
                key={s.name}
                rank={i + 1}
                label={s.name}
                sublabel={`${money(s.avg)} ticket prom.`}
                value={`${s.count} citas`}
                ratio={s.count / maxCount}
                color={CHART[i % CHART.length]}
                last={i === Math.min(5, services.length - 1)}
              />
            ))}
        </Card>
      </div>

      {/* Cross-sell opportunities */}
      {crossSell.length > 0 && (
        <Card eyebrow="Venta cruzada" title="Oportunidades de venta cruzada">
          <DataTable
            columns={CROSSSELL_COLUMNS}
            rows={crossSell}
            renderCell={(row, key) => {
              if (key === 'service_a')
                return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.service_a}</span>;
              if (key === 'service_b')
                return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.service_b}</span>;
              if (key === 'co_purchases')
                return <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{row.co_purchases}</span>;
              if (key === 'tag')
                return (
                  <Badge tone="lavender" size="sm">
                    Recomendar juntos
                  </Badge>
                );
              return row[key];
            }}
          />
        </Card>
      )}

      {/* Products sold */}
      {products.length > 0 && (
        <div className="z-2col">
          <Card eyebrow="Productos" title="Ranking por unidades vendidas">
            {products
              .slice()
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 6)
              .map((p, i) => (
                <RankRow
                  key={p.name}
                  rank={i + 1}
                  label={p.name}
                  sublabel={`${money(p.avg)} c/u`}
                  value={`${p.quantity} vendidos`}
                  ratio={p.quantity / maxProductQty}
                  color={CHART[i % CHART.length]}
                  last={i === Math.min(5, products.length - 1)}
                />
              ))}
          </Card>

          <Card eyebrow="Productos" title="Todos los productos vendidos">
            <DataTable
              columns={PRODUCT_COLUMNS}
              rows={products}
              renderCell={(row, key) => {
                if (key === 'name')
                  return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.name}</span>;
                if (key === 'quantity') return row.quantity;
                if (key === 'avg') return money(row.avg);
                if (key === 'revenue') return money(row.revenue);
                return row[key];
              }}
            />
          </Card>
        </div>
      )}

      {/* Full catalogue with repeat rate */}
      <Card eyebrow="Catálogo" title="Todos los servicios">
        <DataTable
          columns={COLUMNS}
          rows={tableRows}
          renderCell={(row, key) => {
            if (key === 'name')
              return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.name}</span>;
            if (key === 'rev') return money(row.rev);
            if (key === 'avg') return money(row.avg);
            if (key === 'unique') return row.unique ?? '—';
            if (key === 'repeat') {
              if (row.repeatRate == null) return '—';
              const pct = Math.round(row.repeatRate * 100);
              return (
                <span
                  style={{
                    fontWeight: 600,
                    color: pct >= 60 ? 'var(--positive)' : pct >= 40 ? 'var(--caution)' : 'var(--text-secondary)',
                  }}
                >
                  {pct}%
                </span>
              );
            }
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Services;
