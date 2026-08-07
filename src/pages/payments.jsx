import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import Card from '../components/ui/card';
import Badge from '../components/ui/badge';
import Select from '../components/ui/select';
import StatCard from '../components/widgets/stat-card';
import DataTable from '../components/widgets/data-table';
import Pagination from '../components/ui/pagination';
import { usePagination } from '../hooks/use-pagination';
import SaleDetailModal from '../components/widgets/sale-detail-modal';

const money = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-MX');

// Sales in a given range rarely exceed a few hundred for this salon, but a
// wide preset (e.g. "Este año") can climb into the low thousands — fetch
// generously and warn if we still hit the ceiling (see truncated below).
const FETCH_LIMIT = 2000;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function saleStatus(sale) {
  if (sale.status === 'canceled') return 'canceled';
  if ((sale.pending_amount ?? 0) > 0) return 'pending';
  return 'paid';
}

function statusBadge(status) {
  if (status === 'canceled')
    return (
      <Badge tone="neutral" size="sm">
        Cancelada
      </Badge>
    );
  if (status === 'pending')
    return (
      <Badge tone="caution" size="sm" dot>
        Pendiente
      </Badge>
    );
  return (
    <Badge tone="positive" size="sm" dot>
      Pagada
    </Badge>
  );
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'paid', label: 'Pagadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'canceled', label: 'Canceladas' },
];

const COLUMNS = [
  { key: 'ticket', label: 'Ticket' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
  { key: 'clienta', label: 'Clienta' },
  { key: 'monto', label: 'Monto', align: 'right' },
  { key: 'estado', label: 'Estado' },
];

const Payments = ({ dateRange }) => {
  const deps = [dateRange.from_date, dateRange.to_date];
  const { data: sales, loading } = useApi(() => api.sales({ ...dateRange, limit: FETCH_LIMIT }), deps);
  const { data: summary } = useApi(() => api.salesSummary(dateRange), deps);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState(null);

  const truncated = (sales?.length ?? 0) >= FETCH_LIMIT && (summary?.total_sales ?? 0) > FETCH_LIMIT;

  const rows = useMemo(() => {
    // Accept the ticket ID with or without its leading "#" (internal_id comes
    // back from AgendaPro as e.g. "#3013"), plus the underlying numeric id.
    const term = search.trim().toLowerCase().replace(/^#/, '');
    return (sales ?? [])
      .map((s) => ({
        ...s,
        clienta: [s.client_first_name, s.client_last_name].filter(Boolean).join(' ').trim() || '—',
        _status: saleStatus(s),
      }))
      .filter((s) => (statusFilter === 'all' ? true : s._status === statusFilter))
      .filter((s) => {
        if (!term) return true;
        const ticketId = (s.internal_id || '').toLowerCase().replace(/^#/, '');
        return s.clienta.toLowerCase().includes(term) || ticketId.includes(term) || String(s.id).includes(term);
      });
  }, [sales, search, statusFilter]);

  const pagination = usePagination(rows.length, 25, `${statusFilter}|${search}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard label="Tickets del período" value={summary ? summary.total_sales : '—'} icon="Receipt" />
        <StatCard label="Facturado" value={summary ? money(summary.total_revenue) : '—'} icon="DollarSign" />
        <StatCard label="Cobrado" value={summary ? money(summary.total_paid) : '—'} icon="CheckCircle" />
        <StatCard label="Pendiente de cobro" value={summary ? money(summary.total_pending) : '—'} icon="AlertCircle" />
      </div>

      <Card
        eyebrow="Historial"
        title="Ventas y tickets"
        info="Cada renglón es un ticket de venta cerrado en el punto de venta. Haz clic en el ticket o la clienta para ver el desglose de servicios y pagos."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <input
              placeholder="Buscar por clienta o ID de ticket..."
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
                height: 30,
              }}
            />
            <Select size="sm" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          </div>
        }
      >
        {truncated && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--caution-soft)',
              color: 'var(--caution)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-xs)',
            }}
          >
            Mostrando los primeros {FETCH_LIMIT.toLocaleString('es-MX')} de{' '}
            {summary.total_sales.toLocaleString('es-MX')} tickets. Acota el rango de fechas para ver el resto.
          </div>
        )}
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
        ) : rows.length ? (
          <>
            <DataTable
              columns={COLUMNS}
              rows={rows}
              page={pagination.page}
              pageSize={pagination.pageSize}
              renderCell={(row, key) => {
                if (key === 'ticket')
                  return (
                    <button
                      type="button"
                      className="z-client-name"
                      title="Ver detalle del ticket"
                      onClick={() => setSelectedSale(row)}
                    >
                      {row.internal_id || `#${row.id}`}
                    </button>
                  );
                if (key === 'fecha') return fmtDate(row.paid_at);
                if (key === 'hora') return fmtTime(row.paid_at);
                if (key === 'clienta')
                  return (
                    <button
                      type="button"
                      className="z-client-name"
                      title="Ver detalle del ticket"
                      onClick={() => setSelectedSale(row)}
                    >
                      {row.clienta}
                    </button>
                  );
                if (key === 'monto') return <span style={{ fontWeight: 600 }}>{money(row.total_amount)}</span>;
                if (key === 'estado') return statusBadge(row._status);
                return row[key] ?? '—';
              }}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              rangeLabel={pagination.rangeLabel}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
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
            Sin tickets en este período.
          </div>
        )}
      </Card>

      <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  );
};

export default Payments;
