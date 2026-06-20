import { useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');

const CLIENT_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
];

const Clients = () => {
  const [search, setSearch] = useState('');
  const { data: kpis } = useApi(() => api.kpis(), []);
  const { data: clients, loading } = useApi(() => api.clients({ search: search || undefined, limit: 100 }), [search]);

  const totalClients = kpis?.new_clients ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Total clientes"
          value={totalClients.toLocaleString('es-MX')}
          caption="en base de datos"
          icon="Users"
          spark={[]}
          sparkColor="var(--chart-1)"
        />
        <StatCard label="Clientas VIP" value="—" caption="sin datos" icon="Star" />
        <StatCard label="Retención" value="—" caption="sin datos" icon="TrendingUp" />
        <StatCard
          label="Ticket promedio"
          value={kpis ? money(kpis.avg_ticket) : '—'}
          caption="este mes"
          icon="DollarSign"
        />
      </div>

      <div className="z-2col">
        <Card eyebrow="Segmentación" title="Lealtad de clientas">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Donut
              data={[]}
              size={150}
              thickness={20}
              centerValue={totalClients || 0}
              centerLabel="clientes"
            />
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
          </div>
        </Card>

        <Card eyebrow="Frecuencia" title="Visitas por clienta">
          <BarChart data={[]} height={200} yFormat={(v) => v} />
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
