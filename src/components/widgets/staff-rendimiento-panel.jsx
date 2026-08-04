import { useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/use-api';
import Card from '../ui/card';
import SegmentedControl from '../ui/segmented-control';
import StatCard from './stat-card';
import DataTable from './data-table';

const money = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-MX');
const pct = (v) => (v != null ? Math.round(v * 100) + '%' : '—');

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const PERIOD_OPTIONS = [
  { value: 'sem1', label: 'Sem 1' },
  { value: 'sem2', label: 'Sem 2' },
  { value: 'sem3', label: 'Sem 3' },
  { value: 'sem4', label: 'Sem 4' },
  { value: 'mes', label: 'Mes completo' },
];

const RENDIMIENTO_COLS = [
  { key: 'name', label: 'Empleada' },
  { key: 'generated', label: 'Generado', align: 'right', sortable: true, sortValue: (r) => r.generated },
  { key: 'paid', label: 'Pagado', align: 'right', sortable: true, sortValue: (r) => r.paid },
  { key: 'margin', label: 'Te queda', align: 'right', sortable: true, sortValue: (r) => r.margin },
  {
    key: 'rendimiento_pct',
    label: 'Rendimiento',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.rendimiento_pct ?? -1,
  },
];

const PureProfitCallout = ({ title, note, amount }) =>
  amount > 0 && (
    <div
      style={{
        marginTop: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--positive-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
        {title}
        <br />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{note}</span>
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          color: 'var(--positive)',
        }}
      >
        {money(amount)}
      </span>
    </div>
  );

const StaffRendimientoPanel = () => {
  const [month, setMonth] = useState(currentMonthValue());
  const [period, setPeriod] = useState('mes');

  const { data, loading } = useApi(() => api.staffRendimiento({ month: `${month}-01` }), [month]);

  const selected = useMemo(() => {
    if (!data) return null;
    if (period === 'mes') {
      return {
        label: 'Mes completo',
        entries: data.monthly,
        total_generated: data.monthly_total_generated,
        total_paid: data.monthly_total_paid,
        total_margin: data.monthly_total_margin,
        total_rendimiento_pct: data.monthly_total_rendimiento_pct,
        unassigned_generated: data.unassigned_generated,
      };
    }
    const idx = Number(period.replace('sem', '')) - 1;
    const week = data.weeks?.[idx];
    if (!week) return null;
    return {
      label: `${week.semana} (${week.from_date.slice(8)} – ${week.to_date.slice(8)})`,
      entries: week.entries,
      total_generated: week.total_generated,
      total_paid: week.total_paid,
      total_margin: week.total_margin,
      total_rendimiento_pct: week.total_rendimiento_pct,
      unassigned_generated: week.unassigned_generated,
    };
  }, [data, period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
      >
        <SegmentedControl value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid var(--border-subtle)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            background: 'var(--surface-card)',
            color: 'var(--text-body)',
          }}
        />
      </div>

      {loading || !selected ? (
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
      ) : (
        <>
          <div className="z-kpi-grid">
            <StatCard
              label="Total generado"
              value={money(selected.total_generated)}
              caption={selected.label}
              icon="TrendingUp"
              numeralStyle="sans"
              info="Ingresos de servicios y productos de todo el personal en el periodo elegido, incluyendo ventas sin nombre identificado en Lashes/Cosmetología y servicios o productos sin ninguna colaboradora asignada en AgendaPro."
            />
            <StatCard
              label="Total pagado"
              value={money(selected.total_paid)}
              caption={selected.label}
              icon="DollarSign"
              numeralStyle="sans"
              info="Suma de los pagos por colaboradora registrados en la hoja de Gastos para el periodo elegido."
            />
            <StatCard
              label="Te queda"
              value={money(selected.total_margin)}
              caption="generado − pagado"
              icon="Wallet"
              numeralStyle="sans"
              info="Margen sobre lo generado, en pesos: generado − pagado."
            />
            <StatCard
              label="Rendimiento"
              value={pct(selected.total_rendimiento_pct)}
              caption="te queda / generado"
              icon="Target"
              numeralStyle="sans"
              info="El margen de arriba, como porcentaje de lo generado por el equipo."
            />
          </div>

          <Card
            eyebrow="Rendimiento"
            title={`Por empleada — ${selected.label}`}
            info="Rendimiento = (generado − pagado) / generado — el margen que te queda de lo que generó cada empleada. '—' significa que no generó ventas propias en este periodo (ej. recepción), pero su pago sigue contando en el total del equipo. 'No asignado' y 'Productos no asignados' son servicios y productos sin ninguna colaboradora asignada en AgendaPro (los servicios son los mismos que 'Servicios no asignados' en Desempeño) — no pagan comisión, así que son 100% ganancia."
          >
            {selected.entries.length > 0 ? (
              <DataTable
                columns={RENDIMIENTO_COLS}
                rows={selected.entries}
                renderCell={(row, key) => {
                  const isUnassigned = row.name === 'No asignado' || row.name === 'Productos no asignados';
                  if (key === 'name')
                    return (
                      <span
                        style={{
                          fontWeight: isUnassigned ? 500 : 600,
                          fontStyle: isUnassigned ? 'italic' : 'normal',
                          color: isUnassigned ? 'var(--text-muted)' : 'var(--text-heading)',
                        }}
                      >
                        {row.name}
                      </span>
                    );
                  if (key === 'generated') return money(row.generated);
                  if (key === 'paid') return money(row.paid);
                  if (key === 'margin')
                    return (
                      <span
                        style={{ fontWeight: 600, color: row.margin < 0 ? 'var(--negative)' : 'var(--text-display)' }}
                      >
                        {money(row.margin)}
                      </span>
                    );
                  if (key === 'rendimiento_pct')
                    return row.rendimiento_pct != null ? (
                      <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{pct(row.rendimiento_pct)}</span>
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
                Sin datos para este periodo
              </div>
            )}

            <PureProfitCallout
              title={`No asignados en Lashes/Cosmetología — ${selected.label}`}
              note="Ventas sin un nombre identificado en la nota de la cita: no se les paga comisión, así que es ganancia pura para ti. Estas no aparecen como fila propia porque no se puede saber si son de Lashes o Cosmetología."
              amount={selected.unassigned_generated}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default StaffRendimientoPanel;
