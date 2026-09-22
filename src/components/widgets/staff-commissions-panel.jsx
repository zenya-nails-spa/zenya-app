import { useState } from 'react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/use-api';
import Card from '../ui/card';
import DataTable from './data-table';
import StaffCommissionDetailModal from './staff-commission-detail-modal';

const money = (v) => '$' + (v ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v) => (v != null ? `${v}%` : 'Sin configurar');

const COLUMNS = [
  { key: 'name', label: 'Empleada' },
  { key: 'commission_pct', label: '% Comisión', align: 'right' },
  { key: 'generated', label: 'Generado', align: 'right', sortable: true, sortValue: (r) => r.generated },
  { key: 'services_count', label: 'Servicios', align: 'right', sortable: true, sortValue: (r) => r.services_count },
  {
    key: 'commission_amount',
    label: 'Comisión a pagar',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.commission_amount,
  },
];

function fmtRangeLabel(dateRange) {
  if (!dateRange?.from_date || !dateRange?.to_date) return '';
  const opts = { day: 'numeric', month: 'short' };
  const from = new Date(`${dateRange.from_date}T00:00:00`).toLocaleDateString('es-MX', opts);
  const to = new Date(`${dateRange.to_date}T00:00:00`).toLocaleDateString('es-MX', opts);
  return `${from} – ${to}`;
}

// Per-employee commission breakdown for the selected period, by DATE OF
// SERVICE (not date of payment — see the staff-commissions endpoint on the
// backend for why). Every row is a full audit trail, not just a total:
// clicking it opens every service she's credited with, so when a
// collaborator asks "¿de dónde sale esto?" the answer is one click away
// instead of a manual reconciliation.
const StaffCommissionsPanel = ({ dateRange }) => {
  const [selected, setSelected] = useState(null);
  const { data, loading } = useApi(() => api.staffCommissions(dateRange), [dateRange.from_date, dateRange.to_date]);

  const rows = (data ?? []).map((s) => ({
    ...s,
    name: [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || `Profesional ${s.professional_id}`,
  }));

  const totalGenerated = rows.reduce((acc, r) => acc + r.generated, 0);
  const totalCommission = rows.reduce((acc, r) => acc + r.commission_amount, 0);
  const periodLabel = fmtRangeLabel(dateRange);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card
        eyebrow="Comisiones"
        title={`Por empleada — ${periodLabel}`}
        info="Calculado por la fecha en que se hizo el servicio (no la fecha en que se pagó la cita) — así una cita cobrada el sábado para el lunes cuenta el lunes, que es cuando se realizó el trabajo. Haz clic en una fila para ver el detalle servicio por servicio, útil cuando una empleada tiene dudas sobre su pago. El % y el mínimo garantizado se configuran en Ajustes → Personal."
      >
        {loading ? (
          <div
            style={{
              padding: '30px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Cargando...
          </div>
        ) : rows.length > 0 ? (
          <DataTable
            columns={COLUMNS}
            rows={rows}
            renderCell={(row, key) => {
              if (key === 'name')
                return (
                  <button
                    type="button"
                    className="z-client-name"
                    title="Ver detalle de servicios y comisión"
                    onClick={() => setSelected(row)}
                  >
                    {row.name}
                  </button>
                );
              if (key === 'commission_pct')
                return row.commission_pct != null ? (
                  pct(row.commission_pct)
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>{pct(row.commission_pct)}</span>
                );
              if (key === 'generated') return money(row.generated);
              if (key === 'services_count') return row.services_count;
              if (key === 'commission_amount')
                return (
                  <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{money(row.commission_amount)}</span>
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
            Sin datos para este periodo
          </div>
        )}

        {rows.length > 0 && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 24,
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              Generado total: <strong style={{ color: 'var(--text-heading)' }}>{money(totalGenerated)}</strong>
            </span>
            <span>
              Comisiones a pagar: <strong style={{ color: 'var(--text-heading)' }}>{money(totalCommission)}</strong>
            </span>
          </div>
        )}
      </Card>

      <StaffCommissionDetailModal staffMember={selected} periodLabel={periodLabel} onClose={() => setSelected(null)} />
    </div>
  );
};

export default StaffCommissionsPanel;
