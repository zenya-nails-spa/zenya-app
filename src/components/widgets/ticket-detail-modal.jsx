import { useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/use-api';
import Badge from '../ui/badge';
import DataTable from './data-table';

const money = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-MX');

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ITEM_COLS = [
  { key: 'name', label: 'Servicio' },
  { key: 'provider_name', label: 'Atendió' },
  { key: 'origen', label: 'Origen' },
  { key: 'total', label: 'Total', align: 'right' },
];

// Full breakdown of a single sale (ticket), opened by clicking a ticket row in
// the Citas day view. `agendaBookingIds` is the set of booking ids scheduled
// for the day this ticket belongs to — an item whose booking_reference_id
// isn't in that set was added at checkout (extra service, walk-in add-on),
// not something that was ever on the agenda.
const TicketDetailModal = ({ saleId, agendaBookingIds, onClose }) => {
  const { data: sale, loading } = useApi(() => (saleId ? api.sale(saleId) : Promise.resolve(null)), [saleId]);

  useEffect(() => {
    if (!saleId) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saleId, onClose]);

  if (!saleId) return null;

  const items = (sale?.items ?? []).map((it) => ({
    ...it,
    inAgenda: it.booking_reference_id != null && (agendaBookingIds?.has(it.booking_reference_id) ?? false),
  }));

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
          maxWidth: 640,
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
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--fw-medium)',
                color: 'var(--text-heading)',
              }}
            >
              {loading ? 'Cargando…' : `Ticket ${sale?.internal_id ?? sale?.id ?? ''}`}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                marginTop: 2,
              }}
            >
              {sale ? fmtDateTime(sale.paid_at) : ''}
              {sale?.client_first_name && (
                <> · {[sale.client_first_name, sale.client_last_name].filter(Boolean).join(' ')}</>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0' }}>Cargando…</div>
          ) : !sale ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0' }}>
              No se pudo cargar este ticket.
            </div>
          ) : (
            <>
              <DataTable
                columns={ITEM_COLS}
                rows={items}
                renderCell={(row, key) => {
                  if (key === 'provider_name') return row.provider_name ?? '—';
                  if (key === 'origen')
                    return row.inAgenda ? (
                      <Badge tone="positive" size="sm" dot>
                        Agenda
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        Agregado en caja
                      </Badge>
                    );
                  if (key === 'total') return money(row.total);
                  return row[key] ?? '—';
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  alignItems: 'baseline',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
                >
                  Total del ticket
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 600,
                    color: 'var(--text-display)',
                  }}
                >
                  {money(sale.total_amount)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
