import { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { Download } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import MultiLine from '../components/charts/multi-line';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';
import Button from '../components/ui/button';
import Select from '../components/ui/select';
import SegmentedControl from '../components/ui/segmented-control';
import InfoTip from '../components/ui/info-tip';
import Pagination from '../components/ui/pagination';
import { usePagination } from '../hooks/use-pagination';
import ReactivationPanel from '../components/widgets/reactivation-panel';
import ClientDetailModal from '../components/widgets/client-detail-modal';
import ClientComplaintsPanel from '../components/widgets/client-complaints-panel';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v));
const pct = (v) => (v != null ? Math.round(v * 100) + '%' : '—');

const TREND_MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const TABS = [
  { value: 'directorio', label: 'Directorio' },
  { value: 'retencion', label: 'Retención' },
  { value: 'reactivacion', label: 'Reactivación' },
  { value: 'clv', label: 'CLV & Segmentos' },
  { value: 'quejas', label: 'Quejas' },
];

const ESTADO_RANK = { active: 0, activa: 0, at_risk: 1, en_riesgo: 1, churned: 2, perdida: 2, lost: 2 };
const ESTADO_LABEL = {
  active: 'Activa',
  activa: 'Activa',
  at_risk: 'En riesgo',
  en_riesgo: 'En riesgo',
  churned: 'Perdida',
  perdida: 'Perdida',
  lost: 'Perdida',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activa' },
  { value: 'at_risk', label: 'En riesgo' },
  { value: 'churned', label: 'Perdida' },
];

const RETENTION_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'last_visit', label: 'Última visita' },
  {
    key: 'days_since',
    label: 'Días sin visitar',
    align: 'right',
    sortable: true,
    sortValue: (row) => row.days_since_last,
  },
  { key: 'avg_frequency', label: 'Frecuencia' },
  {
    key: 'churn_status',
    label: 'Estado',
    sortable: true,
    sortValue: (row) => ESTADO_RANK[row.churn_status] ?? 3,
  },
  {
    key: 'lifetime_revenue',
    label: 'Ingresos totales',
    align: 'right',
    sortable: true,
    sortValue: (row) => row.lifetime_revenue ?? 0,
  },
  {
    key: 'estimated_lost',
    label: 'Ingreso perdido',
    align: 'right',
    sortable: true,
    sortValue: (row) => row.estimated_lost,
  },
];

const SEGMENT_RANK = { VIP: 0, Leal: 1, Ocasional: 2, 'En riesgo': 3, Perdida: 4 };

const VIP_COLS = [
  {
    key: 'name',
    label: 'Clienta',
    sortable: true,
    sortValue: (r) => [r.first_name, r.last_name].filter(Boolean).join(' '),
  },
  {
    key: 'segment',
    label: 'Segmento',
    sortable: true,
    sortValue: (r) => SEGMENT_RANK[r.segment] ?? 5,
  },
  {
    key: 'total_visits',
    label: 'Visitas',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.total_visits ?? 0,
  },
  {
    key: 'lifetime_revenue',
    label: 'Ingresos totales',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.lifetime_revenue ?? 0,
  },
  {
    key: 'avg_ticket',
    label: 'Ticket prom.',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.avg_ticket ?? 0,
  },
  {
    key: 'last_visit',
    label: 'Última visita',
    sortable: true,
    sortValue: (r) => r.last_visit ?? '',
  },
  {
    key: 'days_since',
    label: 'Días desde',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.days_since_last,
  },
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [retentionSearch, setRetentionSearch] = useState('');
  const [retentionSortedRows, setRetentionSortedRows] = useState([]);
  const [clvSegmentFilter, setClvSegmentFilter] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [flaggedVersion, setFlaggedVersion] = useState(0);
  const deps = [dateRange.from_date, dateRange.to_date];

  const { data: kpis } = useApi(() => api.kpis(dateRange), deps);
  // "Con queja" tag in the directory -- independent of the selected period,
  // refetched whenever the Quejas tab adds/edits/voids a complaint.
  const { data: flaggedData } = useApi(() => api.clientComplaintsFlaggedIds(), [flaggedVersion]);
  const flaggedClientIds = new Set(flaggedData?.client_ids ?? []);
  const { data: retention } = useApi(() => api.clientRetention(dateRange), deps);
  const { data: stats } = useApi(() => api.clientStats(dateRange), deps);

  // Directorio paginates server-side — the API enforces its own limit/offset
  // and the full client list is too large to fetch all at once. The total
  // count comes from a separate lightweight endpoint (same search filter)
  // so "página X de Y" and the "1–25 de N" range match the other tables.
  const [directorioPage, setDirectorioPage] = useState(1);
  const [directorioPageSize, setDirectorioPageSize] = useState(25);
  const directorioOffset = (directorioPage - 1) * directorioPageSize;
  const { data: clients, loading } = useApi(
    () => api.clients({ search: search || undefined, limit: directorioPageSize, offset: directorioOffset }),
    [search, directorioPage, directorioPageSize]
  );
  const { data: directorioCountData } = useApi(() => api.clientsCount({ search: search || undefined }), [search]);
  const directorioTotal = directorioCountData?.count ?? null;
  const directorioTotalPages =
    directorioTotal != null ? Math.max(1, Math.ceil(directorioTotal / directorioPageSize)) : null;
  const directorioHasNext =
    directorioTotal != null
      ? directorioOffset + directorioPageSize < directorioTotal
      : (clients?.length ?? 0) === directorioPageSize;
  const directorioRangeLabel =
    directorioTotal != null && (clients?.length ?? 0) > 0
      ? `${directorioOffset + 1}–${Math.min(directorioOffset + directorioPageSize, directorioTotal)} de ${directorioTotal}`
      : null;

  const { data: profilesData } = useApi(() => api.clientProfiles(dateRange), deps);
  const { data: clvData } = useApi(() => api.clvSegments(dateRange), deps);
  const { data: retentionTrendData } = useApi(() => api.retentionTrend(dateRange), deps);

  const visitsData = (stats?.visits_distribution ?? []).map((b) => ({
    label: b.label,
    value: b.count,
  }));
  const totalActive = retention?.active_clients ?? 0;
  const recurringClients = retention?.recurring_clients ?? 0;
  // First-time buyers this period = active clients minus those who'd bought before —
  // keeps the donut slices summing exactly to the "Total clientes" figure above.
  const newClients = Math.max(totalActive - recurringClients, 0);

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
      activas: all.filter((p) => p.churn_status === 'active' || p.churn_status === 'activa').length,
      enRiesgo: all.filter((p) => p.churn_status === 'at_risk').length,
      perdidas: all.filter((p) => p.churn_status === 'churned' || p.churn_status === 'lost').length,
      reactivadas: retention?.reactivated_clients ?? 0,
      retencionPct: retention?.retention_rate ?? null,
      recurrentesPct: retention?.recurring_clients_pct ?? null,
      nuevasPct: retention?.new_clients_pct ?? null,
      retencionHistoricaPct: retention?.historical_retention_rate ?? null,
    };
  }, [profilesData, retention]);

  const retentionTrend = useMemo(() => {
    const points = retentionTrendData ?? [];
    const fmt = (d) => {
      const [, m, day] = (d ?? '').split('-');
      return m && day ? `${parseInt(day, 10)} ${TREND_MONTHS_ES[parseInt(m, 10) - 1]}` : d;
    };
    return {
      labels: points.map((p) => fmt(p.date)),
      series: [
        { label: 'Activas', data: points.map((p) => p.active), color: 'var(--positive)' },
        { label: 'En riesgo', data: points.map((p) => p.at_risk), color: 'var(--caution)', dashed: true },
        { label: 'Perdidas', data: points.map((p) => p.churned), color: 'var(--negative)' },
      ],
    };
  }, [retentionTrendData]);

  const filteredRetentionProfiles = useMemo(() => {
    let rows = retentionProfiles;
    if (statusFilter !== 'all') {
      rows = rows.filter((p) => p.churn_status === statusFilter);
    }
    const q = retentionSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ').toLowerCase();
        return name.includes(q) || (p.phone ?? '').toLowerCase().includes(q);
      });
    }
    return rows;
  }, [retentionProfiles, statusFilter, retentionSearch]);

  const retentionPagination = usePagination(filteredRetentionProfiles.length, 25, `${statusFilter}|${retentionSearch}`);

  const exportRetentionToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Retención');
    sheet.columns = [
      { header: 'Clienta', key: 'name', width: 28 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'Última visita', key: 'last_visit', width: 14 },
      { header: 'Días sin visitar', key: 'days_since_last', width: 16 },
      { header: 'Frecuencia (días)', key: 'avg_frequency', width: 16 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Ingresos totales', key: 'lifetime_revenue', width: 16 },
      { header: 'Ingreso perdido', key: 'estimated_lost', width: 16 },
    ];
    // retentionSortedRows mirrors the table's current sort, but DataTable unmounts
    // when the filtered set is empty, so it can go stale — the length check catches that.
    const rows =
      retentionSortedRows.length === filteredRetentionProfiles.length ? retentionSortedRows : filteredRetentionProfiles;
    rows.forEach((r) => {
      sheet.addRow({
        name: [r.first_name, r.last_name].filter(Boolean).join(' ') || '—',
        phone: r.phone || '—',
        last_visit: r.last_visit || '—',
        days_since_last: r.days_since_last ?? null,
        avg_frequency: r.avg_frequency ?? null,
        estado: ESTADO_LABEL[r.churn_status] ?? r.churn_status,
        lifetime_revenue: r.lifetime_revenue ?? 0,
        estimated_lost: r.estimated_lost ?? 0,
      });
    });
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retencion-clientas-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
  const filteredVipClients = useMemo(
    () => (clvSegmentFilter ? vipClients.filter((c) => c.segment === clvSegmentFilter) : vipClients),
    [vipClients, clvSegmentFilter]
  );
  const clvPagination = usePagination(filteredVipClients.length, 25, clvSegmentFilter);

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
              info="Clientas con al menos una compra en el periodo seleccionado. No incluye clientas registradas que nunca han comprado (esas aparecen abajo en el directorio)."
              spark={[]}
              sparkColor="var(--chart-1)"
            />
            <StatCard
              label="Clientas VIP"
              value={stats ? stats.vip_count.toLocaleString('es-MX') : '—'}
              caption="4+ visitas históricas"
              icon="Star"
              info="Clientas con 4 o más compras en toda su historia. Este número no cambia con el periodo seleccionado."
            />
            <StatCard
              label="Retención"
              value={retention ? pct(retention.retention_rate) : '—'}
              caption="clientas que regresaron"
              icon="TrendingUp"
              info="De las clientas que compraron en el periodo anterior (mismo número de días), porcentaje que volvió a comprar en este periodo."
            />
            <StatCard
              label="Ticket promedio"
              value={kpis ? '$' + Math.round(kpis.avg_ticket).toLocaleString('es-MX') : '—'}
              caption="este periodo"
              icon="DollarSign"
              info="Ingresos del periodo divididos entre el número de ventas. Es el gasto promedio por visita."
            />
          </div>

          <div className="z-2col">
            <Card
              eyebrow="Segmentación"
              title="Lealtad de clientas"
              info="Nuevas: su primera compra registrada fue en este periodo. Recurrentes: compraron en el periodo y ya habían comprado antes. El centro muestra el total de clientas activas del periodo (nuevas + recurrentes)."
            >
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

            <Card
              eyebrow="Frecuencia"
              title="Visitas por clienta"
              info="Distribución de las clientas que compraron en el periodo, según cuántas visitas hicieron dentro del mismo periodo."
            >
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
            info="Todas las clientas registradas en AgendaPro, hayan comprado o no. Este directorio no depende del periodo seleccionado. Usa el buscador para encontrar a alguien o navega con la paginación."
            action={
              <input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setDirectorioPage(1);
                }}
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
                        <button
                          type="button"
                          className="z-client-name"
                          title="Ver detalle de la clienta"
                          onClick={() => setSelectedClientId(row.id)}
                        >
                          {row.name}
                        </button>
                        {flaggedClientIds.has(row.id) && (
                          <Badge tone="caution" size="sm" dot>
                            Con queja
                          </Badge>
                        )}
                      </div>
                    );
                  return row[key] ?? '—';
                }}
              />
            )}
            {!loading && (clients?.length ?? 0) > 0 && (
              <Pagination
                page={directorioPage}
                totalPages={directorioTotalPages}
                pageSize={directorioPageSize}
                hasPrev={directorioPage > 1}
                hasNext={directorioHasNext}
                rangeLabel={directorioRangeLabel}
                onPageChange={setDirectorioPage}
                onPageSizeChange={(v) => {
                  setDirectorioPageSize(v);
                  setDirectorioPage(1);
                }}
              />
            )}
          </Card>
        </>
      )}

      {/* ── RETENCIÓN TAB ── */}
      {tab === 'retencion' && (
        <>
          <div className="z-kpi-grid-5">
            <StatCard
              label="Activas"
              value={String(retentionKpis.activas)}
              caption="clientas"
              icon="Heart"
              info="Clientas cuya última compra fue hace menos de 45 días. Son tu base saludable de clientas frecuentes."
              numeralStyle="sans"
            />
            <StatCard
              label="En riesgo"
              value={String(retentionKpis.enRiesgo)}
              caption="clientas"
              icon="AlertTriangle"
              info="Clientas cuya última compra fue hace 45 a 89 días. Todavía es buen momento para invitarlas a regresar."
              numeralStyle="sans"
            />
            <StatCard
              label="Perdidas"
              value={String(retentionKpis.perdidas)}
              caption="sin volver +90d"
              icon="UserX"
              info="Clientas cuya última compra fue hace 90 días o más. Se consideran perdidas mientras no vuelvan a comprar."
              numeralStyle="sans"
            />
            <StatCard
              label="Reactivadas"
              value={String(retentionKpis.reactivadas)}
              caption="este mes"
              icon="UserCheck"
              info="Clientas que estaban perdidas (90+ días sin venir) y volvieron a comprar en este periodo."
              numeralStyle="sans"
            />
            <StatCard
              label="Retención"
              value={retentionKpis.retencionPct != null ? pct(retentionKpis.retencionPct) : '—'}
              caption="vs mes anterior"
              icon="Repeat"
              info="De las clientas que compraron en el periodo anterior, porcentaje que volvió a comprar en este periodo."
              numeralStyle="sans"
            />
          </div>

          <div className="z-status-row">
            <StatCard
              label="Retención histórica"
              value={retentionKpis.retencionHistoricaPct != null ? pct(retentionKpis.retencionHistoricaPct) : '—'}
              caption="promedio mes a mes"
              icon="BarChart2"
              info="Promedio de la retención mes contra mes anterior a lo largo de todo tu historial, no solo el mes en curso. Da una idea de tu retención típica de largo plazo."
              numeralStyle="sans"
            />
            <StatCard
              label="Recurrentes"
              value={retentionKpis.recurrentesPct != null ? pct(retentionKpis.recurrentesPct) : '—'}
              caption="del periodo"
              icon="CheckCircle"
              info="De las clientas que compraron en el periodo seleccionado, porcentaje que ya era clienta antes (había comprado previamente)."
              numeralStyle="sans"
            />
            <StatCard
              label="Nuevas"
              value={retentionKpis.nuevasPct != null ? pct(retentionKpis.nuevasPct) : '—'}
              caption="del periodo"
              icon="Sparkles"
              info="De las clientas que compraron en el periodo seleccionado, porcentaje cuya primera compra registrada fue dentro de este periodo."
              numeralStyle="sans"
            />
          </div>

          <Card
            eyebrow="Tendencia"
            title="Activas vs. en riesgo vs. perdidas"
            info="Para cada punto del periodo seleccionado, clasifica a todas las clientas según su última visita hasta esa fecha (mismos criterios que arriba: Activa < 45 días, En riesgo 45–89, Perdida 90+). Así puedes ver qué número se mueve más rápido: si las perdidas crecen más rápido de lo que las activas caen, es una señal de alerta temprana."
          >
            {retentionTrend.labels.length > 0 ? (
              <MultiLine
                series={retentionTrend.series}
                labels={retentionTrend.labels}
                height={240}
                yFormat={(v) => String(v)}
              />
            ) : (
              <div
                style={{
                  padding: '30px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin datos para este periodo
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {retentionTrend.series.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: s.color,
                      display: 'inline-block',
                    }}
                  />
                  {s.label}
                </div>
              ))}
            </div>
          </Card>

          <Card
            eyebrow="Riesgo de fuga"
            title="Clasificación de clientas"
            info="Toda clienta que ha comprado alguna vez, clasificada solo por su última visita: Activa (menos de 45 días), En riesgo (45–89) o Perdida (90+). Ingreso perdido estima cuánto dejó de gastar según su ticket promedio y el tiempo ausente. Haz clic en los encabezados para ordenar. Nota: esta clasificación es distinta a la de CLV & Segmentos, que prioriza el valor histórico (VIP/Leal) sobre la antigüedad — una clienta puede aparecer 'En riesgo' o 'Perdida' aquí y como 'VIP'/'Leal' allá."
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <input
                  placeholder="Buscar por nombre o teléfono..."
                  value={retentionSearch}
                  onChange={(e) => setRetentionSearch(e.target.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-sans)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-body)',
                    height: 30,
                  }}
                />
                <Select size="sm" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTER_OPTIONS} />
                <Button variant="secondary" size="sm" iconLeft={Download} onClick={exportRetentionToExcel}>
                  Exportar
                </Button>
              </div>
            }
          >
            {filteredRetentionProfiles.length > 0 ? (
              <>
                <DataTable
                  columns={RETENTION_COLS}
                  rows={filteredRetentionProfiles}
                  onSortedRowsChange={setRetentionSortedRows}
                  page={retentionPagination.page}
                  pageSize={retentionPagination.pageSize}
                  renderCell={(row, key) => {
                    if (key === 'name') {
                      const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || '—';
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={name} size="sm" tone="ink" />
                          <button
                            type="button"
                            className="z-client-name"
                            title="Ver detalle de la clienta"
                            onClick={() => setSelectedClientId(row.client_id)}
                          >
                            {name}
                          </button>
                        </div>
                      );
                    }
                    if (key === 'phone')
                      return <span style={{ color: 'var(--text-secondary)' }}>{row.phone ?? '—'}</span>;
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
                <Pagination
                  page={retentionPagination.page}
                  totalPages={retentionPagination.totalPages}
                  pageSize={retentionPagination.pageSize}
                  hasPrev={retentionPagination.hasPrev}
                  hasNext={retentionPagination.hasNext}
                  rangeLabel={retentionPagination.rangeLabel}
                  onPageChange={retentionPagination.setPage}
                  onPageSizeChange={retentionPagination.setPageSize}
                />
              </>
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
                {retentionProfiles.length > 0 ? 'Sin resultados para estos filtros' : 'Sin datos de retención'}
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
              <InfoTip text="Cuántas clientas llevan más de 30, 60, 90, 180 o 365 días sin comprar. Cada clienta cuenta en todos los rangos que supera: una con 100 días aparece en +30, +60 y +90." />
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

      {/* ── REACTIVACIÓN TAB ── */}
      {tab === 'reactivacion' && <ReactivationPanel profiles={profilesData} onSelectClient={setSelectedClientId} />}

      {/* ── CLV & SEGMENTOS TAB ── */}
      {tab === 'clv' && (
        <>
          <Card
            eyebrow="Valor"
            title="Ingresos por segmento"
            info="Ingresos históricos totales agrupados por tipo de clienta. El valor histórico manda sobre la antigüedad: primero se evalúa VIP ($3,000+ y 6+ visitas) y Leal ($1,200+ y 3+ visitas); solo si no califica para ninguno se clasifica por días sin venir — En riesgo (45–89) o Perdida (90+). Ocasional: el resto. Por eso una clienta valiosa que no ha vuelto en 90+ días puede aparecer como VIP o Leal aquí, aunque en Retención cuente como 'Perdida'."
          >
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
                    <button
                      key={i}
                      type="button"
                      onClick={() => setClvSegmentFilter((prev) => (prev === s.segment ? null : s.segment))}
                      title="Clic para filtrar la tabla de abajo por este segmento"
                      style={{
                        all: 'unset',
                        boxSizing: 'border-box',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 8px',
                        margin: '0 -8px',
                        borderRadius: 'var(--radius-xs)',
                        borderBottom: i < clvSegments.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        cursor: 'pointer',
                        background: clvSegmentFilter === s.segment ? 'var(--rose-50)' : 'transparent',
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
                    </button>
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

          <Card
            eyebrow="Valor de vida"
            title={clvSegmentFilter ? `Clientas · ${clvSegmentFilter}` : 'Todas las clientas'}
            info="Todas las clientas con al menos una compra, ordenadas por ingresos históricos. Da clic en un segmento de la izquierda para filtrar esta tabla, o en los encabezados para ordenar por cualquier columna."
            action={
              clvSegmentFilter && (
                <Button variant="ghost" size="sm" onClick={() => setClvSegmentFilter(null)}>
                  Ver todas ({vipClients.length})
                </Button>
              )
            }
          >
            {filteredVipClients.length > 0 ? (
              <>
                <DataTable
                  columns={VIP_COLS}
                  rows={filteredVipClients}
                  page={clvPagination.page}
                  pageSize={clvPagination.pageSize}
                  renderCell={(row, key) => {
                    if (key === 'name') {
                      const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.name || '—';
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={name} size="sm" tone="rose" />
                          <button
                            type="button"
                            className="z-client-name"
                            title="Ver detalle de la clienta"
                            onClick={() => setSelectedClientId(row.client_id)}
                          >
                            {name}
                          </button>
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
                <Pagination
                  page={clvPagination.page}
                  totalPages={clvPagination.totalPages}
                  pageSize={clvPagination.pageSize}
                  hasPrev={clvPagination.hasPrev}
                  hasNext={clvPagination.hasNext}
                  rangeLabel={clvPagination.rangeLabel}
                  onPageChange={clvPagination.setPage}
                  onPageSizeChange={clvPagination.setPageSize}
                />
              </>
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
                {clvSegmentFilter ? `Sin clientas en el segmento ${clvSegmentFilter}` : 'Sin datos de clientas'}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── QUEJAS TAB ── */}
      {tab === 'quejas' && (
        <ClientComplaintsPanel dateRange={dateRange} onChangeFlagged={() => setFlaggedVersion((v) => v + 1)} />
      )}

      <ClientDetailModal clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />
    </div>
  );
};

export default Clients;
