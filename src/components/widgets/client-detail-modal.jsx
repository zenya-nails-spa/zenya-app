import { useEffect } from 'react';
import { X, DollarSign, Repeat, Clock, CalendarClock, Ban } from 'lucide-react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/use-api';
import Avatar from '../ui/avatar';
import Badge from '../ui/badge';
import IconButton from '../ui/icon-button';
import DataTable from './data-table';

const money = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-MX');

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// AgendaPro's raw payment_status values — same mapping used in pages/appointments.jsx
// so a booking's payment badge reads consistently across the whole app.
function paymentBadge(paymentStatus) {
  if (paymentStatus === 'ASSOCIATED')
    return (
      <Badge tone="positive" size="sm" dot>
        Pagada
      </Badge>
    );
  if (!paymentStatus || paymentStatus === 'UNPAID')
    return (
      <Badge tone="negative" size="sm" dot>
        Sin pagar
      </Badge>
    );
  return (
    <Badge tone="caution" size="sm" dot>
      Pendiente
    </Badge>
  );
}

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

const CHURN_BADGE = {
  active: { tone: 'positive', label: 'Activa' },
  at_risk: { tone: 'caution', label: 'En riesgo' },
  churned: { tone: 'negative', label: 'Perdida' },
};

const MiniStat = ({ icon: Icon, label, value, caption }) => (
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
      {Icon && <Icon size={13} strokeWidth={1.8} />}
      <span
        style={{
          fontFamily: 'var(--font-label)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 'var(--ls-label)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--fw-medium)',
        color: 'var(--text-display)',
        lineHeight: 'var(--lh-tight)',
      }}
    >
      {value}
    </div>
    {caption && (
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
        {caption}
      </div>
    )}
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
      padding: '16px 0',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
    }}
  >
    {text}
  </div>
);

const APPT_COLS = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
  { key: 'servicio', label: 'Servicio' },
  { key: 'personal', label: 'Personal' },
  { key: 'estado', label: 'Estado' },
  { key: 'nota', label: 'Nota interna' },
];

const SALE_COLS = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'estado', label: 'Estado' },
  { key: 'metodo', label: 'Método de pago' },
];

const ClientDetailModal = ({ clientId, onClose }) => {
  const { data, loading } = useApi(() => (clientId ? api.clientHistory(clientId) : Promise.resolve(null)), [clientId]);

  useEffect(() => {
    if (!clientId) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clientId, onClose]);

  if (!clientId) return null;

  const client = data?.client;
  const stats = data?.stats;
  const name = client ? [client.first_name, client.last_name].filter(Boolean).join(' ') || '—' : '';
  const churn = stats?.churn_status ? CHURN_BADGE[stats.churn_status] : null;

  const appointmentRows = (data?.appointments ?? []).map((a) => ({
    ...a,
    fecha: fmtDate(a.start),
    hora: fmtTime(a.start),
    servicio: a.service_name ?? '—',
    personal: a.professional_name ?? '—',
  }));

  const saleRows = data?.sales ?? [];

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
          maxWidth: 860,
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
            <Avatar name={name} size="lg" tone="rose" />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--fw-medium)',
                  color: 'var(--text-heading)',
                }}
              >
                {loading ? 'Cargando…' : name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  marginTop: 2,
                }}
              >
                {client?.phone && <span>{client.phone}</span>}
                {client?.email && <span>{client.email}</span>}
                {churn && (
                  <Badge tone={churn.tone} size="sm" dot>
                    {churn.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <IconButton icon={X} size="md" variant="ghost" title="Cerrar" onClick={onClose} />
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {loading ? (
            <EmptyState text="Cargando historial…" />
          ) : !data ? (
            <EmptyState text="No se pudo cargar el historial de esta clienta." />
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 10,
                }}
              >
                <MiniStat icon={Repeat} label="Visitas" value={stats.total_visits} caption="compras completadas" />
                <MiniStat icon={DollarSign} label="Ingresos" value={money(stats.lifetime_revenue)} caption="histórico" />
                <MiniStat icon={DollarSign} label="Ticket prom." value={money(stats.avg_ticket)} />
                <MiniStat
                  icon={Clock}
                  label="Última visita"
                  value={stats.last_visit ? fmtDate(stats.last_visit) : '—'}
                  caption={stats.days_since_last != null ? `${stats.days_since_last} días sin volver` : undefined}
                />
                <MiniStat icon={CalendarClock} label="Próximas reservas" value={stats.upcoming_bookings_count} />
                <MiniStat icon={Ban} label="Cancelaciones" value={stats.cancelled_sales_count} />
              </div>

              <div>
                <SectionLabel>Historial de citas</SectionLabel>
                {appointmentRows.length > 0 ? (
                  <DataTable
                    columns={APPT_COLS}
                    rows={appointmentRows}
                    style={{ maxHeight: 320, overflowY: 'auto' }}
                    renderCell={(row, key) => {
                      if (key === 'estado') return paymentBadge(row.payment_status);
                      if (key === 'fecha')
                        return (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {row.fecha}
                            {row.is_upcoming && (
                              <Badge tone="lavender" size="sm">
                                Próxima
                              </Badge>
                            )}
                          </span>
                        );
                      if (key === 'nota') {
                        const note = [row.client_notes, row.comment].filter(Boolean).join(' · ');
                        return note ? (
                          <span title={note} style={{ color: 'var(--text-secondary)' }}>
                            {note.length > 40 ? note.slice(0, 40) + '…' : note}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        );
                      }
                      return row[key] ?? '—';
                    }}
                  />
                ) : (
                  <EmptyState text="Sin citas registradas." />
                )}
              </div>

              <div>
                <SectionLabel>Pagos y compras</SectionLabel>
                {saleRows.length > 0 ? (
                  <DataTable
                    columns={SALE_COLS}
                    rows={saleRows}
                    style={{ maxHeight: 320, overflowY: 'auto' }}
                    renderCell={(row, key) => {
                      if (key === 'fecha') return fmtDate(row.paid_at);
                      if (key === 'total') return <span style={{ fontWeight: 600 }}>{money(row.total_amount)}</span>;
                      if (key === 'estado') return saleStatusBadge(row);
                      if (key === 'metodo') {
                        const methods = [
                          ...new Set((row.transactions ?? []).map((t) => t.payment_method).filter(Boolean)),
                        ];
                        return methods.length ? (
                          methods.join(', ')
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        );
                      }
                      return row[key] ?? '—';
                    }}
                  />
                ) : (
                  <EmptyState text="Sin pagos ni compras registradas." />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
