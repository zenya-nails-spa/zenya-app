import { useState } from 'react';
import D from '../mocks/data';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';
import ProgressBar from '../components/charts/progress-bar';
import SegmentedControl from '../components/ui/segmented-control';

const CLIENT_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'visits', label: 'Visitas', align: 'right' },
  { key: 'spent', label: 'Gasto total', align: 'right' },
  { key: 'last', label: 'Última visita' },
  { key: 'loyalty', label: 'Segmento' },
];

const LOYALTY_TONE = { VIP: 'rose', Frecuente: 'lavender', Regular: 'neutral', Nueva: 'caution' };
const totalClients = D.totals.activeClients;
const vipCount = D.loyaltySegments.find((s) => s.name === 'VIP').count;

const Clients = () => {
  const [segment, setSegment] = useState('Todos');
  const segments = ['Todos', 'VIP', 'Frecuente', 'Regular', 'Nueva'];
  const filtered = segment === 'Todos' ? D.clients : D.clients.filter((c) => c.loyalty === segment);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Total clientas"
          value={totalClients.toLocaleString('es-MX')}
          delta={(D.totals.newClients / totalClients) * 100}
          caption="activas este mes"
          icon="Users"
          spark={D.series(71, 12, 350, 50, 4)}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Nuevas este mes"
          value={D.totals.newClients}
          delta={((D.totals.newClients - D.totals.newClientsPrev) / D.totals.newClientsPrev) * 100}
          caption="vs mes anterior"
          icon="Heart"
          spark={D.series(72, 12, 35, 15, 1)}
          sparkColor="var(--chart-2)"
        />
        <StatCard label="Clientas VIP" value={vipCount} delta={5.3} caption="41% del ingreso" icon="Star" />
        <StatCard label="Retención" value="73%" delta={2.1} caption="vs mes anterior" icon="TrendingUp" />
      </div>

      <div className="z-2col">
        <Card eyebrow="Segmentación" title="Lealtad de clientas">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Donut
              data={D.loyaltySegments}
              size={150}
              thickness={20}
              centerValue={totalClients}
              centerLabel="clientas"
            />
            <div style={{ flex: 1, minWidth: 120 }}>
              {D.loyaltySegments.map((seg, i) => (
                <div
                  key={seg.name}
                  style={{
                    padding: '7px 0',
                    borderBottom: i < D.loyaltySegments.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-body)',
                        }}
                      >
                        {seg.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--fw-semibold)',
                          color: 'var(--text-heading)',
                        }}
                      >
                        {seg.count}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {Math.round(seg.pct * 100)}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar ratio={seg.pct} color={seg.color} height={4} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card eyebrow="Frecuencia" title="Visitas por clienta">
          <BarChart
            data={D.visitFreq.map((f, i) => ({ label: f.label, value: f.value, color: D.CHART[i % D.CHART.length] }))}
            height={200}
            yFormat={(v) => v}
          />
        </Card>
      </div>

      <Card eyebrow="Gasto" title="Distribución de gasto acumulado">
        <BarChart
          data={D.spendDist.map((f, i) => ({ label: f.label, value: f.value, color: D.CHART[i % D.CHART.length] }))}
          height={180}
          yFormat={(v) => v}
        />
      </Card>

      <Card
        eyebrow="Directorio"
        title="Clientas"
        action={
          <SegmentedControl
            options={segments.map((s) => ({ value: s, label: s }))}
            value={segment}
            onChange={setSegment}
            size="sm"
          />
        }
      >
        <DataTable
          columns={CLIENT_COLS}
          rows={filtered}
          renderCell={(row, key) => {
            if (key === 'name')
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={row.name} size="sm" tone={row.tone} />
                  <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-heading)' }}>{row.name}</span>
                </div>
              );
            if (key === 'spent') return D.money(row.spent);
            if (key === 'loyalty')
              return (
                <Badge tone={LOYALTY_TONE[row.loyalty] || 'neutral'} dot={row.loyalty === 'VIP'}>
                  {row.loyalty}
                </Badge>
              );
            return row[key];
          }}
        />
      </Card>
    </div>
  );
};

export default Clients;
