import { useState } from 'react';
import D from '../mocks/data';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import ProgressBar from '../components/charts/progress-bar';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');

const CLIENT_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
];

const Clients = () => {
  const [search, setSearch] = useState('');
  const { data: kpis } = useApi(() => api.kpis(), []);
  const { data: clients, loading } = useApi(
    () => api.clients({ search: search || undefined, limit: 100 }),
    [search],
  );

  const totalClients = kpis?.new_clients ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Total clientes"
          value={totalClients.toLocaleString('es-MX')}
          caption="en base de datos"
          icon="Users"
          spark={D.series(71, 12, 350, 50, 4)}
          sparkColor="var(--chart-1)"
        />
        <StatCard label="Clientas VIP" value={D.loyaltySegments.find((s) => s.name === 'VIP').count} delta={5.3} caption="41% del ingreso" icon="Star" />
        <StatCard label="Retención" value="73%" delta={2.1} caption="vs mes anterior" icon="TrendingUp" />
        <StatCard label="Ticket promedio" value={kpis ? money(kpis.avg_ticket) : '—'} caption="este mes" icon="DollarSign" />
      </div>

      <div className="z-2col">
        <Card eyebrow="Segmentación" title="Lealtad de clientas">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Donut data={D.loyaltySegments} size={150} thickness={20} centerValue={totalClients || D.totals.activeClients} centerLabel="clientes" />
            <div style={{ flex: 1, minWidth: 120 }}>
              {D.loyaltySegments.map((seg, i) => (
                <div key={seg.name} style={{ padding: '7px 0', borderBottom: i < D.loyaltySegments.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>{seg.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-heading)' }}>{seg.count}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{Math.round(seg.pct * 100)}%</span>
                    </div>
                  </div>
                  <ProgressBar ratio={seg.pct} color={seg.color} height={4} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card eyebrow="Frecuencia" title="Visitas por clienta">
          <BarChart data={D.visitFreq.map((f, i) => ({ label: f.label, value: f.value, color: D.CHART[i % D.CHART.length] }))} height={200} yFormat={(v) => v} />
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
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', background: 'var(--bg-surface)', color: 'var(--text-body)' }}
          />
        }
      >
        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)' }}>Cargando...</div>
        ) : (
          <DataTable
            columns={CLIENT_COLS}
            rows={(clients ?? []).map((c) => ({ ...c, name: [c.first_name, c.last_name].filter(Boolean).join(' ') || '—' }))}
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
