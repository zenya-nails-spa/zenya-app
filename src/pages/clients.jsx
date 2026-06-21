import { useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import LegendRow from '../components/ui/legend-row';

const pct = (v) => (v != null ? Math.round(v * 100) + '%' : '—');

const CLIENT_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
];

const Clients = ({ dateRange }) => {
  const [search, setSearch] = useState('');
  const deps = [dateRange.from_date, dateRange.to_date];

  const { data: kpis } = useApi(() => api.kpis(dateRange), deps);
  const { data: retention } = useApi(() => api.clientRetention(dateRange), deps);
  const { data: stats } = useApi(() => api.clientStats(dateRange), deps);
  const { data: clients, loading } = useApi(() => api.clients({ search: search || undefined, limit: 100 }), [search]);

  const newClients = retention?.new_clients ?? kpis?.new_clients ?? 0;
  const recurringClients = retention?.recurring_clients ?? kpis?.recurring_clients ?? 0;

  const donutData = [
    { label: 'Nuevas', value: newClients, color: 'var(--chart-1)' },
    { label: 'Recurrentes', value: recurringClients, color: 'var(--chart-2)' },
  ].filter((d) => d.value > 0);

  const visitsData = (stats?.visits_distribution ?? []).map((b) => ({
    label: b.label,
    value: b.count,
  }));

  const totalActive = retention?.active_clients ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Total clientes"
          value={(kpis?.distinct_clients ?? 0).toLocaleString('es-MX')}
          caption="activas en el periodo"
          icon="Users"
          spark={[]}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Clientas VIP"
          value={stats ? stats.vip_count.toLocaleString('es-MX') : '—'}
          caption="4+ visitas históricas"
          icon="Star"
        />
        <StatCard
          label="Retención"
          value={retention ? pct(retention.retention_rate) : '—'}
          caption="clientas que regresaron"
          icon="TrendingUp"
        />
        <StatCard
          label="Ticket promedio"
          value={kpis ? '$' + Math.round(kpis.avg_ticket).toLocaleString('es-MX') : '—'}
          caption="este periodo"
          icon="DollarSign"
        />
      </div>

      <div className="z-2col">
        <Card eyebrow="Segmentación" title="Lealtad de clientas">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Donut data={donutData} size={150} thickness={20} centerValue={totalActive || 0} centerLabel="activas" />
            {donutData.length > 0 ? (
              <LegendRow
                style={{ flexDirection: 'column', gap: 10 }}
                items={donutData.map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: d.color,
                }))}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: '12px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin datos de segmentación
              </div>
            )}
          </div>
        </Card>

        <Card eyebrow="Frecuencia" title="Visitas por clienta">
          {visitsData.length > 0 ? (
            <BarChart data={visitsData} height={200} yFormat={(v) => v} />
          ) : (
            <div
              style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Sin datos en el periodo
            </div>
          )}
        </Card>
      </div>

      <Card
        eyebrow="Directorio"
        title="Clientes"
        action={
          <input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              background: 'var(--bg-surface)',
              color: 'var(--text-body)',
            }}
          />
        }
      >
        {loading ? (
          <div
            style={{
              padding: '20px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Cargando...
          </div>
        ) : (
          <DataTable
            columns={CLIENT_COLS}
            rows={(clients ?? []).map((c) => ({
              ...c,
              name: [c.first_name, c.last_name].filter(Boolean).join(' ') || '—',
            }))}
            renderCell={(row, key) => {
              if (key === 'name')
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={row.name} size="sm" tone="ink" />
                    <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-heading)' }}>{row.name}</span>
                  </div>
                );
              return row[key] ?? '—';
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Clients;
