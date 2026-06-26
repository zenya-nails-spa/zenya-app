import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';
import SegmentedControl from '../components/ui/segmented-control';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const pct = (v) => (v != null ? Math.round(v * 100) + '%' : '—');

const TABS = [
  { value: 'directorio', label: 'Directorio' },
  { value: 'retencion', label: 'Retención' },
  { value: 'clv', label: 'CLV & Segmentos' },
];

const RETENTION_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'last_visit', label: 'Última visita' },
  { key: 'days_since', label: 'Días sin visitar', align: 'right' },
  { key: 'avg_frequency', label: 'Frecuencia' },
  { key: 'churn_status', label: 'Estado' },
  { key: 'lifetime_revenue', label: 'Ingresos totales', align: 'right' },
  { key: 'estimated_lost', label: 'Ingreso perdido', align: 'right' },
];

const VIP_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'segment', label: 'Segmento' },
  { key: 'total_visits', label: 'Visitas', align: 'right' },
  { key: 'lifetime_revenue', label: 'Ingresos totales', align: 'right' },
  { key: 'avg_ticket', label: 'Ticket prom.', align: 'right' },
  { key: 'last_visit', label: 'Última visita' },
  { key: 'days_since', label: 'Días desde', align: 'right' },
];

const SEG_TONE = { VIP: 'rose', Leal: 'lavender', Ocasional: 'caution', 'En riesgo': 'negative', Perdida: 'neutral' };

function estadoBadge(e) {
  if (e === 'active' || e === 'activa')
    return (
      <Badge tone="positive" size="sm" dot>
        Activa
      </Badge>
    );
  if (e === 'at_risk' || e === 'en_riesgo')
    return (
      <Badge tone="caution" size="sm" dot>
        En riesgo
      </Badge>
    );
  if (e === 'churned' || e === 'perdida')
    return (
      <Badge tone="negative" size="sm" dot>
        Perdida
      </Badge>
    );
  return (
    <Badge tone="neutral" size="sm" dot>
      Inactiva
    </Badge>
  );
}

const Clients = ({ dateRange }) => {
  const [tab, setTab] = useState('directorio');
  const [search, setSearch] = useState('');
  const deps = [dateRange.from_date, dateRange.to_date];

  const { data: kpis } = useApi(() => api.kpis(dateRange), deps);
  const { data: retention } = useApi(() => api.clientRetention(dateRange), deps);
  const { data: stats } = useApi(() => api.clientStats(dateRange), deps);
  const { data: clients, loading } = useApi(() => api.clients({ search: search || undefined, limit: 100 }), [search]);
  const { data: profilesData } = useApi(() => api.clientProfiles(dateRange), deps);
  const { data: clvData } = useApi(() => api.clvSegments(dateRange), deps);

  const visitsData = (stats?.visits_distribution ?? []).map((b) => ({
    label: b.label,
    value: b.count,
  }));
  const totalActive = retention?.active_clients ?? 0;
  const newClients = retention?.new_clients ?? kpis?.new_clients ?? 0;
  const recurringClients = retention?.recurring_clients ?? kpis?.recurring_clients ?? 0;

  const donutData = [
    { label: 'Nuevas', value: newClients, color: 'var(--chart-1)' },
    { label: 'Recurrentes', value: recurringClients, color: 'var(--chart-2)' },
  ].filter((d) => d.value > 0);

  // Retention tab data
  const retentionProfiles = useMemo(
    () => [...(profilesData ?? [])].sort((a, b) => (b.days_since_last ?? 0) - (a.days_since_last ?? 0)),
    [profilesData]
  );
  const retentionKpis = useMemo(() => {
    const all = profilesData ?? [];
    return {
      enRiesgo: all.filter((p) => p.churn_status === 'at_risk').length,
      perdidas: all.filter((p) => p.churn_status === 'churned' || p.churn_status === 'lost').length,
      reactivadas: retention?.reactivated_clients ?? 0,
      retencionPct: retention?.retention_rate ?? null,
    };
  }, [profilesData, retention]);

  const churnBuckets = useMemo(() => {
    const all = profilesData ?? [];
    return [30, 60, 90, 180, 365].map((d) => ({
      label: `+${d} días`,
      count: all.filter((p) => (p.days_since_last ?? 0) >= d).length,
    }));
  }, [profilesData]);

  // CLV tab data
  const clvSegments = useMemo(() => {
    if (!clvData?.segments?.length) return [];
    return clvData.segments.map((s, i) => ({
      ...s,
      color: `var(--chart-${(i % 5) + 1})`,
    }));
  }, [clvData]);
  const clvTotal = clvSegments.reduce((s, c) => s + (c.revenue ?? 0), 0);
  const vipClients = clvData?.top_clients ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <SegmentedControl value={tab} onChange={setTab} options={TABS} />

      {/* ── DIRECTORIO TAB ── */}
      {tab === 'directorio' && (
        <>
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
                <Donut
                  data={donutData}
                  size={150}
                  thickness={20}
                  centerValue={totalActive || 0}
                  centerLabel="activas"
                />
                {donutData.length > 0 ? (
                  <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {donutData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                          {d.label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            color: 'var(--text-display)',
                          }}
                        >
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
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
                  background: 'var(--surface-card)',
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
                columns={[
                  { key: 'name', label: 'Clienta' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Teléfono' },
                ]}
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
        </>
      )}

      {/* ── RETENCIÓN TAB ── */}
      {tab === 'retencion' && (
        <>
          <div className="z-kpi-grid">
            <StatCard
              label="En riesgo"
              value={String(retentionKpis.enRiesgo)}
              caption="clientas"
              icon="AlertTriangle"
              numeralStyle="sans"
            />
            <StatCard
              label="Perdidas"
              value={String(retentionKpis.perdidas)}
              caption="sin volver +90d"
              icon="UserX"
              numeralStyle="sans"
            />
            <StatCard
              label="Reactivadas"
              value={String(retentionKpis.reactivadas)}
              caption="este mes"
              icon="UserCheck"
              numeralStyle="sans"
            />
            <StatCard
              label="Retención"
              value={retentionKpis.retencionPct != null ? pct(retentionKpis.retencionPct) : '—'}
              caption="vs mes anterior"
              icon="Repeat"
              numeralStyle="sans"
            />
          </div>

          <Card eyebrow="Riesgo de fuga" title="Clasificación de clientas">
            {retentionProfiles.length > 0 ? (
              <DataTable
                columns={RETENTION_COLS}
                rows={retentionProfiles}
                renderCell={(row, key) => {
                  if (key === 'name') {
                    const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || '—';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={name} size="sm" tone="ink" />
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{name}</span>
                      </div>
                    );
                  }
                  if (key === 'last_visit')
                    return <span style={{ color: 'var(--text-secondary)' }}>{row.last_visit ?? '—'}</span>;
                  if (key === 'days_since') {
                    const d = row.days_since_last ?? 0;
                    return (
                      <span
                        style={{
                          fontWeight: 600,
                          color: d > 90 ? 'var(--negative)' : d > 45 ? 'var(--caution)' : 'var(--text-body)',
                        }}
                      >
                        {d} d
                      </span>
                    );
                  }
                  if (key === 'avg_frequency')
                    return <span style={{ color: 'var(--text-secondary)' }}>{row.avg_frequency ?? '—'}</span>;
                  if (key === 'churn_status') return estadoBadge(row.churn_status);
                  if (key === 'lifetime_revenue') return money(row.lifetime_revenue ?? 0);
                  if (key === 'estimated_lost')
                    return row.estimated_lost ? (
                      <span style={{ fontWeight: 600, color: 'var(--negative)' }}>{money(row.estimated_lost)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    );
                  return row[key] ?? '—';
                }}
              />
            ) : (
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin datos de retención
              </div>
            )}
          </Card>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 'var(--ls-label)',
                textTransform: 'uppercase',
                color: 'var(--text-brand)',
                marginBottom: 14,
              }}
            >
              Tiempo sin regresar
            </div>
            <div className="z-bucket-grid">
              {churnBuckets.map((b, i) => (
                <Card key={i} padding="var(--space-5)" interactive>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 600,
                      color: 'var(--text-display)',
                      lineHeight: 1,
                    }}
                  >
                    {b.count}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-muted)',
                      marginTop: 6,
                    }}
                  >
                    {b.label}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── CLV & SEGMENTOS TAB ── */}
      {tab === 'clv' && (
        <>
          <Card eyebrow="Valor" title="Ingresos por segmento">
            {clvSegments.length > 0 ? (
              <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <Donut
                  data={clvSegments.map((s) => ({ value: s.revenue ?? 0, color: s.color }))}
                  size={190}
                  thickness={24}
                  centerValue={clvTotal ? moneyK(clvTotal) : '—'}
                  centerLabel="ingresos"
                />
                <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {clvSegments.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 0',
                        borderBottom: i < clvSegments.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 600,
                            color: 'var(--text-heading)',
                          }}
                        >
                          {s.segment ?? s.name}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {s.count} clientas
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 600,
                            color: 'var(--text-display)',
                          }}
                        >
                          {money(s.revenue ?? 0)}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {clvTotal ? Math.round(((s.revenue ?? 0) / clvTotal) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin datos de segmentación
              </div>
            )}
          </Card>

          <Card eyebrow="Valor de vida" title="Top 10 clientas VIP">
            {vipClients.length > 0 ? (
              <DataTable
                columns={VIP_COLS}
                rows={vipClients}
                renderCell={(row, key) => {
                  if (key === 'name') {
                    const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.name || '—';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={name} size="sm" tone="rose" />
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{name}</span>
                      </div>
                    );
                  }
                  if (key === 'segment') {
                    const seg = row.segment ?? '—';
                    return (
                      <Badge tone={SEG_TONE[seg] ?? 'neutral'} size="sm" dot>
                        {seg}
                      </Badge>
                    );
                  }
                  if (key === 'lifetime_revenue')
                    return (
                      <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>
                        {money(row.lifetime_revenue ?? 0)}
                      </span>
                    );
                  if (key === 'avg_ticket') return money(row.avg_ticket ?? 0);
                  if (key === 'last_visit')
                    return <span style={{ color: 'var(--text-secondary)' }}>{row.last_visit ?? '—'}</span>;
                  if (key === 'days_since')
                    return <span style={{ color: 'var(--text-secondary)' }}>{row.days_since_last ?? '—'} d</span>;
                  return row[key] ?? '—';
                }}
              />
            ) : (
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin datos de clientas VIP
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Clients;
