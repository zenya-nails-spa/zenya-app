import { useEffect } from 'react';
import { X, MapPin, User, StickyNote, Gift } from 'lucide-react';
import Avatar from '../ui/avatar';
import Badge from '../ui/badge';
import IconButton from '../ui/icon-button';
import DataTable from './data-table';

const money = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-MX');

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// Same "cash"/"debit_card"/... AgendaPro payment method codes used in
// pages/revenue.jsx's breakdown — kept local since it's a small, page-specific label map.
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

// Same rule as pages/clients.jsx's client-detail-modal: canceled first, then
// whether anything is still owed, otherwise fully paid.
function saleStatusBadge(sale) {
  if (sale.status === 'canceled')
    return (
      <Badge tone="neutral" size="sm">
        Cancelada
      </Badge>
    );
  if ((sale.pending_amount ?? 0) > 0)
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

const MiniStat = ({ label, value, tone }) => (
  <div
    style={{
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--font-label)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 'var(--ls-label)',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--fw-medium)',
        color: tone === 'caution' ? 'var(--caution)' : 'var(--text-display)',
        lineHeight: 'var(--lh-tight)',
      }}
    >
      {value}
    </div>
  </div>
);

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontFamily: 'var(--font-label)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-brand)',
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

const EmptyState = ({ text }) => (
  <div
    style={{
      padding: '12px 0',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
    }}
  >
    {text}
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) =>
  value ? (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <Icon size={14} strokeWidth={1.8} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
          {value}
        </div>
      </div>
    </div>
  ) : null;

const ITEM_COLS = [
  { key: 'name', label: 'Servicio / producto' },
  { key: 'provider_name', label: 'Atendió' },
  { key: 'quantity', label: 'Cant.', align: 'right' },
  { key: 'total', label: 'Total', align: 'right' },
];

const TX_COLS = [
  { key: 'paid_at', label: 'Fecha y hora' },
  { key: 'payment_method', label: 'Método' },
  { key: 'total', label: 'Monto', align: 'right' },
];

const SaleDetailModal = ({ sale, onClose }) => {
  useEffect(() => {
    if (!sale) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sale, onClose]);

  if (!sale) return null;

  const clienta = [sale.client_first_name, sale.client_last_name].filter(Boolean).join(' ').trim() || 'Clienta';
  const vendedora = [sale.user_first_name, sale.user_last_name].filter(Boolean).join(' ').trim();
  const methods = [...new Set((sale.transactions ?? []).map((t) => t.payment_method).filter(Boolean))];
  const ticketLabel = sale.internal_id || `#${sale.id}`;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click-to-close; Escape key and the header close button already cover keyboard access
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 22, 25, 0.5)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '4vh 16px',
        overflowY: 'auto',
        animation: 'zFade 0.2s var(--ease-out)',
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- stops the backdrop's close-on-click from firing when clicking inside the dialog */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: 760,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <Avatar name={clienta} size="lg" tone="rose" />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--fw-medium)',
                  color: 'var(--text-heading)',
                }}
              >
                Ticket {ticketLabel}
                {saleStatusBadge(sale)}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  marginTop: 2,
                }}
              >
                {clienta} · {fmtDate(sale.paid_at)} {fmtTime(sale.paid_at)}
              </div>
            </div>
          </div>
          <IconButton icon={X} size="md" variant="ghost" title="Cerrar" onClick={onClose} />
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            <MiniStat label="Total del ticket" value={money(sale.total_amount)} />
            <MiniStat label="Total pagado" value={money(sale.paid_amount)} />
            {(sale.pending_amount ?? 0) > 0 && (
              <MiniStat label="Pendiente" value={money(sale.pending_amount)} tone="caution" />
            )}
            {(sale.giftcard_amount ?? 0) > 0 && <MiniStat label="Con giftcard" value={money(sale.giftcard_amount)} />}
          </div>

          <div>
            <SectionLabel>Servicios y productos</SectionLabel>
            {sale.items?.length ? (
              <DataTable
                columns={ITEM_COLS}
                rows={sale.items}
                renderCell={(row, key) => {
                  if (key === 'name') return row.name ?? '—';
                  if (key === 'provider_name') return row.provider_name ?? '—';
                  if (key === 'quantity') return row.quantity ?? 1;
                  if (key === 'total') return money(row.total);
                  return row[key] ?? '—';
                }}
              />
            ) : (
              <EmptyState text="Sin servicios ni productos registrados en este ticket." />
            )}
          </div>

          <div>
            <SectionLabel>Pagos registrados</SectionLabel>
            {sale.transactions?.length ? (
              <DataTable
                columns={TX_COLS}
                rows={sale.transactions}
                renderCell={(row, key) => {
                  if (key === 'paid_at') return `${fmtDate(row.paid_at)} ${fmtTime(row.paid_at)}`;
                  if (key === 'payment_method') return methodLabel(row.payment_method);
                  if (key === 'total') return money(row.total);
                  return row[key] ?? '—';
                }}
              />
            ) : (
              <EmptyState text="Sin pagos registrados." />
            )}
          </div>

          <div>
            <SectionLabel>Otros detalles</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <DetailRow icon={User} label="Atendió / vendió" value={vendedora || null} />
              <DetailRow icon={MapPin} label="Sucursal" value={sale.location_name} />
              <DetailRow
                icon={Gift}
                label="Método(s) de pago"
                value={methods.length ? methods.map(methodLabel).join(', ') : null}
              />
              <DetailRow icon={StickyNote} label="Nota" value={sale.note} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;
