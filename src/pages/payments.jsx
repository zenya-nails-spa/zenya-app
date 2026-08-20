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

// Same "cash"/"debit_card"/... AgendaPro payment method codes used in
// pages/revenue.jsx's breakdown and the sale-detail modal.
const METHOD_LABELS = {
  cash: 'Efectivo',
  debit_card: 'Tarjeta débito',
  credit_card: 'Tarjeta crédito',
  pos: 'Terminal (POS)',
  wire_transfer: 'Transferencia',
};

function methodLabel(method) {
  if (!method) return '—';
  return METHOD_LABELS[method] ?? method;
}

// Distinct payment methods used across a sale's transactions -- a ticket
// paid partly in cash and partly by card has one entry per method, which is
// exactly what marks it as split.
function saleMethods(sale) {
  return [...new Set((sale.transactions ?? []).map((t) => t.payment_method).filter(Boolean))];
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

function methodCell(methods) {
  if (!methods.length) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  if (methods.length > 1)
    return (
      <Badge tone="lavender" size="sm" dot>
        Dividido
      </Badge>
    );
  return methodLabel(methods[0]);
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'paid', label: 'Pagadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'canceled', label: 'Canceladas' },
];

const METHOD_OPTIONS = [
  { value: 'all', label: 'Todos los métodos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'non_cash', label: 'Todos menos efectivo' },
  ...Object.entries(METHOD_LABELS)
    .filter(([value]) => value !== 'cash')
    .map(([value, label]) => ({ value, label })),
  { value: 'split', label: 'Pago dividido' },
];

const COLUMNS = [
  { key: 'ticket', label: 'Ticket' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
  { key: 'clienta', label: 'Clienta' },
  { key: 'monto', label: 'Monto', align: 'right' },
  { key: 'metodo', label: 'Método' },
  { key: 'estado', label: 'Estado' },
];

const Payments = ({ dateRange }) => {
  const deps = [dateRange.from_date, dateRange.to_date];
  const { data: sales, loading } = useApi(() => api.sales({ ...dateRange, limit: FETCH_LIMIT }), deps);
  const { data: summary } = useApi(() => api.salesSummary(dateRange), deps);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState(null);

  const truncated = (sales?.length ?? 0) >= FETCH_LIMIT && (summary?.total_sales ?? 0) > FETCH_LIMIT;

  const rows = useMemo(() => {
    // Accept the ticket ID with or without its leading "#" (internal_id comes
    // back from AgendaPro as e.g. "#3013"), plus the underlying numeric id.
    const term = search.trim().toLowerCase().replace(/^#/, '');
    return (sales ?? [])
      .map((s) => {
        const methods = saleMethods(s);
        return {
          ...s,
          clienta: [s.client_first_name, s.client_last_name].filter(Boolean).join(' ').trim() || '—',
          _status: saleStatus(s),
          _methods: methods,
          _isSplit: methods.length > 1,
        };
      })
      .filter((s) => (statusFilter === 'all' ? true : s._status === statusFilter))
      .filter((s) => {
        if (methodFilter === 'all') return true;
        if (methodFilter === 'split') return s._isSplit;
        // "Todos menos efectivo": any ticket with at least one non-cash method
        // -- a split cash+card ticket still had a non-cash component, so it
        // shows here too, same as it does under "Efectivo".
        if (methodFilter === 'non_cash') return s._methods.some((m) => m !== 'cash');
        return s._methods.includes(methodFilter);
      })
      .filter((s) => {
        if (!term) return true;
        const ticketId = (s.internal_id || '').toLowerCase().replace(/^#/, '');
        return s.clienta.toLowerCase().includes(term) || ticketId.includes(term) || String(s.id).includes(term);
      });
  }, [sales, search, statusFilter, methodFilter]);

  const pagination = usePagination(rows.length, 25, `${statusFilter}|${methodFilter}|${search}`);

  // Sum of exactly what the filters mean, across every filtered row (not just
  // the current page) -- responds live to search/estado/método, unlike the
  // KPI cards above which always reflect the whole period. Two things the
  // naive "sum of total_amount" got wrong:
  //   1. Canceled tickets never count toward a total -- unless you've
  //      filtered estado to "Canceladas" specifically to look at them.
  //   2. Filtering by one método (or "Todos menos efectivo") on a split
  //      ticket must only count that method's own transaction amount, not
  //      the ticket's whole total -- otherwise a $300 cash + $200 card
  //      ticket would add $500 to the "Efectivo" total instead of $300.
  const filteredTotal = useMemo(
    () =>
      rows.reduce((sum, r) => {
        if (r._status === 'canceled' && statusFilter !== 'canceled') return sum;
        if (methodFilter === 'all' || methodFilter === 'split') return sum + (r.total_amount ?? 0);
        const matching = (r.transactions ?? []).filter((t) =>
          methodFilter === 'non_cash' ? t.payment_method !== 'cash' : t.payment_method === methodFilter
        );
        return sum + matching.reduce((s, t) => s + (t.total ?? 0), 0);
      }, 0),
    [rows, methodFilter, statusFilter]
  );

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
            <Select size="sm" value={methodFilter} onChange={setMethodFilter} options={METHOD_OPTIONS} />
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 10,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Total de {rows.length.toLocaleString('es-MX')} ticket{rows.length === 1 ? '' : 's'} mostrado
                {rows.length === 1 ? '' : 's'}:
              </span>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-display)' }}>
                {money(filteredTotal)}
              </span>
            </div>
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
                if (key === 'metodo') return methodCell(row._methods);
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
