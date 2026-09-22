import { useEffect } from 'react';
import { X } from 'lucide-react';
import Avatar from '../ui/avatar';
import Badge from '../ui/badge';
import IconButton from '../ui/icon-button';
import DataTable from './data-table';

const money = (v) => '$' + (v ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v) => (v != null ? `${v}%` : '—');

const COLUMNS = [
  { key: 'date', label: 'Fecha', sortable: true, sortValue: (r) => r.date + r.time },
  { key: 'time', label: 'Hora' },
  { key: 'client_name', label: 'Clienta' },
  { key: 'service_name', label: 'Servicio' },
  { key: 'amount', label: 'Monto', align: 'right', sortable: true, sortValue: (r) => r.amount },
];

// Shown when a collaborator has questions about her pay: every service she's
// credited with in the selected period (by DATE OF SERVICE — see the
// staff-commissions endpoint docstring for why that's not the same as date
// of payment), so she can check it line by line instead of just trusting a
// total.
const StaffCommissionDetailModal = ({ staffMember, periodLabel, onClose }) => {
  useEffect(() => {
    if (!staffMember) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [staffMember, onClose]);

  if (!staffMember) return null;

  const name = [staffMember.first_name, staffMember.last_name].filter(Boolean).join(' ').trim() || '—';
  const rows = staffMember.services ?? [];

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
                {name}
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
                <span>{periodLabel}</span>
                <Badge tone="neutral" size="sm">
                  {pct(staffMember.commission_pct)} de comisión
                </Badge>
              </div>
            </div>
          </div>
          <IconButton icon={X} size="md" variant="ghost" title="Cerrar" onClick={onClose} />
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            {[
              ['Generado', money(staffMember.generated)],
              ['Servicios', staffMember.services_count],
              [
                staffMember.commission_min_guarantee != null ? 'Comisión a pagar (con mínimo)' : 'Comisión a pagar',
                money(staffMember.commission_amount),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: 'var(--surface-muted)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--fw-medium)',
                    color: 'var(--text-heading)',
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {staffMember.commission_min_guarantee != null && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              Tiene un mínimo garantizado de {money(staffMember.commission_min_guarantee)} — se le paga lo que sea mayor
              entre eso y {pct(staffMember.commission_pct)} de lo generado ({money(staffMember.generated)} ×{' '}
              {pct(staffMember.commission_pct)} ={' '}
              {money(round2((staffMember.generated * (staffMember.commission_pct ?? 0)) / 100))}).
            </div>
          )}

          {rows.length > 0 ? (
            <DataTable
              columns={COLUMNS}
              rows={rows}
              renderCell={(row, key) => {
                if (key === 'client_name')
                  return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.client_name}</span>;
                if (key === 'service_name')
                  return (
                    <span>
                      {row.service_name}
                      {row.commission_excluded && (
                        <Badge tone="neutral" size="sm" style={{ marginLeft: 8 }}>
                          Sin comisión
                        </Badge>
                      )}
                    </span>
                  );
                if (key === 'amount') return money(row.amount);
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
              Sin servicios registrados en este periodo.
            </div>
          )}

          {staffMember.generated_excluded > 0 && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              Incluye {money(staffMember.generated_excluded)} en servicios marcados “Sin comisión” en su perfil (
              Ajustes → Personal) — se muestran arriba pero no cuentan para el cálculo de comisión.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function round2(v) {
  return Math.round(v * 100) / 100;
}

export default StaffCommissionDetailModal;
