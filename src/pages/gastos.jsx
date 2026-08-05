import { useState, useEffect, Fragment } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Button from '../components/ui/button';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import RankRow from '../components/widgets/rank-row';
import Badge from '../components/ui/badge';

const money = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-MX');
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const WEEKDAY_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const fmtFechaPago = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return `${WEEKDAY_ES[d.getDay()]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
};

const FUENTE_TONE = {
  Debito: 'lavender',
  Credito: 'rose',
  Efectivo: 'positive',
  Carlos: 'caution',
  Bety: 'caution',
};

const EGRESOS_COLS = [
  { key: 'semana', label: 'Semana' },
  { key: 'fecha_pago', label: 'Fecha de pago', sortable: true, sortValue: (r) => r.fecha_pago || '' },
  { key: 'concepto', label: 'Concepto' },
  { key: 'tipo_gasto', label: 'Tipo' },
  { key: 'colaborador', label: 'Colaborador' },
  { key: 'fuente_pago', label: 'Fuente de pago' },
  { key: 'total', label: 'Total', align: 'right', sortable: true, sortValue: (r) => r.total },
];

const INSUMOS_COLS = [
  { key: 'semana', label: 'Semana' },
  { key: 'fecha', label: 'Fecha', sortable: true, sortValue: (r) => r.fecha },
  { key: 'insumo', label: 'Insumo' },
  { key: 'tipo', label: 'Fuente de pago' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'precio', label: 'Precio', align: 'right', sortable: true, sortValue: (r) => r.precio },
];

const MAYOREO_COLS = [
  { key: 'insumo', label: 'Insumo' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'meses', label: 'Meses con compra', align: 'right', sortable: true, sortValue: (r) => r.meses_con_compra },
  {
    key: 'veces_mismo_mes',
    label: 'Máx. en un mes',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.veces_mismo_mes,
  },
  {
    key: 'veces_este_anio',
    label: 'Compras este año',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.veces_este_anio,
  },
  {
    key: 'veces_comprado',
    label: 'Veces comprado',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.veces_comprado,
  },
  { key: 'ultima_compra', label: 'Última compra', sortable: true, sortValue: (r) => r.ultima_compra },
];

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CIERRE_TH_GROUP = {
  textAlign: 'center',
  padding: '8px 14px 2px',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--fw-semibold)',
  letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  background: 'var(--surface-sunken)',
  whiteSpace: 'nowrap',
};

const CIERRE_TH_SUB = {
  textAlign: 'right',
  padding: '2px 14px 8px',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--fw-regular)',
  color: 'var(--text-muted)',
  background: 'var(--surface-sunken)',
  borderBottom: '1px solid var(--border-subtle)',
  whiteSpace: 'nowrap',
};

const CIERRE_SEP = { borderLeft: '1px solid var(--border-subtle)' };

const cierreNum = (v, tone) =>
  !v ? (
    <span style={{ color: 'var(--text-muted)' }}>—</span>
  ) : tone === 'negative' ? (
    <span style={{ color: 'var(--negative)' }}>−{money(v)}</span>
  ) : (
    money(v)
  );

const calcRows = (w, tipo) => {
  const ef = tipo === 'efectivo';
  const rows = [
    [w.base_origen, money(ef ? w.base_efectivo : w.base_tarjeta)],
    [`+ Ingresos ${tipo}`, money(ef ? w.ingresos.efectivo : w.ingresos.tarjeta)],
    [ef ? '− Gastos efectivo' : '− Gastos débito', money(ef ? w.gastos.efectivo : w.gastos.tarjeta)],
  ];
  if (w.transferencias) rows.push([`${ef ? '−' : '+'} Transferencias C y B`, money(w.transferencias)]);
  return rows;
};

/** Bold esperado value that reveals the calculation breakdown on hover. */
const CalcTip = ({ value, rows, drop = false }) => {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        style={{
          all: 'unset',
          fontWeight: 700,
          color: value >= 0 ? 'var(--positive)' : 'var(--negative)',
          borderBottom: '1px dashed var(--border-strong)',
          cursor: 'help',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {money(value)}
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...(drop ? { top: 'calc(100% + 8px)' } : { bottom: 'calc(100% + 8px)' }),
            right: -8,
            zIndex: 50,
            width: 250,
            padding: '12px 14px',
            background: 'var(--text-heading)',
            color: 'var(--surface-card)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            fontWeight: 400,
            lineHeight: 1.7,
            display: 'block',
            textAlign: 'left',
            whiteSpace: 'normal',
          }}
        >
          {rows.map(([label, amount], i) => (
            <span key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ opacity: 0.8 }}>{label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{amount}</span>
            </span>
          ))}
          <span style={{ display: 'block', borderTop: '1px solid rgba(255, 255, 255, 0.3)', margin: '6px 0' }} />
          <span style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontWeight: 600 }}>
            <span>= Deberíamos tener</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{money(value)}</span>
          </span>
        </span>
      )}
    </span>
  );
};

/** Sheet-counted amount plus a small delta against the computed esperado. */
const TieneCell = ({ value, esperado }) => {
  if (value == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const diff = Math.round(value - esperado);
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
      <span style={{ fontWeight: 600, color: 'var(--text-heading)', fontVariantNumeric: 'tabular-nums' }}>
        {money(value)}
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: diff === 0 ? 'var(--positive)' : diff > 0 ? 'var(--positive)' : 'var(--negative)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {diff === 0 ? '✓ cuadra' : `${diff > 0 ? '+' : '−'}${money(Math.abs(diff))}`}
      </span>
    </span>
  );
};

const Gastos = () => {
  const [month, setMonth] = useState(currentMonthValue());
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const { data } = useApi(() => api.gastos({ month: `${month}-01` }), [month, refreshKey]);
  const { data: cierre } = useApi(() => api.cierreSemanal({ month: `${month}-01` }), [month, refreshKey]);
  const { data: mayoreo } = useApi(() => api.mayoreoGastos(), [refreshKey]);
  const { data: revenueGoal } = useApi(() => api.revenueGoal({ month: `${month}-01` }), [month, refreshKey]);
  const { data: anomalies } = useApi(() => api.commissionAnomalies({ month: `${month}-01` }), [month, refreshKey]);
  const [expandedAnomalyKey, setExpandedAnomalyKey] = useState(null);

  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  useEffect(() => {
    if (revenueGoal) setGoalInput(String(revenueGoal.weekly_goal || ''));
  }, [revenueGoal]);

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      await api.updateRevenueGoal({ weekly_goal: Number(goalInput) || 0 }, { month: `${month}-01` });
      setRefreshKey((k) => k + 1);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await api.syncGastos({ month: `${month}-01` });
      setSyncMsg(
        res.status === 'ok'
          ? `Hoja sincronizada: ${res.egresos_count} egresos y ${res.insumos_count} insumos`
          : `Sin cambios: ${res.reason ?? res.status}`
      );
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setSyncMsg('No se pudo sincronizar la hoja, intenta de nuevo');
    } finally {
      setSyncing(false);
    }
  };

  const byFuente = data?.by_fuente ?? [];
  const bySemana = data?.by_semana ?? [];
  const byColaborador = data?.by_colaborador ?? [];
  const maxColab = byColaborador.length ? Math.max(...byColaborador.map((c) => c.total)) : 1;

  const weeks = cierre?.weeks ?? [];
  const weekPivot = (key) => {
    const labels = [...new Set(weeks.flatMap((w) => w[key].map((b) => b.label)))];
    return {
      columns: [
        { key: 'semana', label: 'Semana' },
        ...labels.map((l) => ({ key: l, label: l, align: 'right' })),
        { key: '__total', label: 'Total', align: 'right' },
      ],
      rows: weeks.map((w) => ({
        semana: `${w.semana} (${w.from_date.slice(8)} – ${w.to_date.slice(8)})`,
        ...Object.fromEntries(w[key].map((b) => [b.label, b.total])),
        __total: w[key].reduce((s, b) => s + b.total, 0),
      })),
      hasData: weeks.some((w) => w[key].length > 0),
    };
  };
  const egresosSemana = weekPivot('egresos_por_fuente');
  const insumosSemana = weekPivot('insumos_por_tipo');

  const renderPivotCell = (row, key) => {
    if (key === 'semana') return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.semana}</span>;
    if (row[key] == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    if (key === '__total')
      return <span style={{ fontWeight: 700, color: 'var(--text-display)' }}>{money(row[key])}</span>;
    return money(row[key]);
  };

  const anomalyRowKey = (r) => `${r.colaborador}-${r.window_from}-${r.egreso_id ?? 'missing'}`;
  const anomalyRows = anomalies?.rows ?? [];
  const sortedAnomalyRows = [...anomalyRows].sort((a, b) =>
    a.status === b.status ? 0 : a.status === 'anomaly' ? -1 : 1
  );
  const anomalyCount = anomalyRows.filter((r) => r.status === 'anomaly').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {syncMsg && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            {syncMsg}
          </span>
        )}
        <Button variant="secondary" size="sm" iconLeft={RefreshCw} onClick={handleSync} disabled={syncing}>
          {syncing ? 'Actualizando…' : 'Actualizar desde la hoja'}
        </Button>
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            background: 'var(--surface-card)',
            color: 'var(--text-body)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
          }}
        />
      </div>

      <div className="z-kpi-grid">
        <StatCard
          label="Total gastos"
          value={data ? money(data.total) : '—'}
          caption="egresos + insumos del mes"
          icon="Wallet"
          info="Suma de todo lo registrado en la hoja de gastos para el mes: pagos de servicios, pagos a personal e insumos. Se sincroniza cada noche desde tu Google Sheet."
        />
        <StatCard
          label="Servicios"
          value={data ? money(data.total_servicios) : '—'}
          caption="agua, luz, internet, renta…"
          icon="Settings"
          info="Egresos sin semana ni colaborador en la hoja: pagos fijos del local como agua, luz, internet, renta o suscripciones."
        />
        <StatCard
          label="Personal"
          value={data ? money(data.total_personal) : '—'}
          caption="salarios y comisiones"
          icon="Users"
          info="Egresos asociados a una colaboradora: salarios, comisiones, bonos e inyecciones registrados por semana."
        />
        <StatCard
          label="Insumos"
          value={data ? money(data.total_insumos) : '—'}
          caption="materiales y compras"
          icon="Sparkles"
          info="Compras de la sección INSUMOS de la hoja: materiales, productos y otros gastos operativos."
        />
      </div>

      <div className="z-2col">
        <Card
          eyebrow="Fuente"
          title="Por fuente de pago"
          info="De dónde salió el dinero: Débito, Crédito, Efectivo, o pagos personales de Carlos y Bety. Incluye egresos e insumos."
        >
          {byFuente.length > 0 ? (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <Donut
                data={byFuente.map((b, i) => ({ value: b.total, color: CHART[i % CHART.length] }))}
                size={150}
                thickness={20}
                centerValue={data ? money(data.total) : '—'}
                centerLabel="total"
              />
              <div style={{ flex: 1, minWidth: 140 }}>
                {byFuente.map((b, i) => (
                  <div
                    key={b.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: i < byFuente.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: CHART[i % CHART.length],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-body)',
                        }}
                      >
                        {b.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--fw-semibold)',
                        color: 'var(--text-heading)',
                      }}
                    >
                      {money(b.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </Card>

        <Card
          eyebrow="Ritmo"
          title="Gasto por semana"
          info="Egresos e insumos que tienen semana asignada en la hoja. Los pagos de servicios fijos no llevan semana, por eso no aparecen aquí."
        >
          {bySemana.length > 0 ? (
            <BarChart
              data={bySemana.map((b, i) => ({ label: b.label, value: b.total, color: CHART[i % CHART.length] }))}
              height={200}
              yFormat={(v) => money(v)}
            />
          ) : (
            <EmptyState />
          )}
        </Card>
      </div>

      <Card
        eyebrow="Objetivo"
        title="Objetivo semanal de ingresos"
        info="Cada semana debe llegar mínimo al objetivo. Si una semana no llega, lo que faltó se suma al objetivo de la siguiente semana; si la supera, lo que sobró se resta. El objetivo aplica solo dentro del mes — no se acarrea al mes siguiente."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
            >
              $
            </span>
            <input
              type="number"
              min="0"
              step="100"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="0"
              style={{
                width: 110,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-body)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            />
            <Button variant="secondary" size="sm" onClick={handleSaveGoal} disabled={savingGoal}>
              {savingGoal ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        }
      >
        {revenueGoal?.weekly_goal > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <thead>
                <tr>
                  {['Semana', 'Objetivo', 'Real', 'Estado', 'Ajuste siguiente semana'].map((label, i) => (
                    <th
                      key={label}
                      style={{
                        textAlign: i === 0 ? 'left' : 'right',
                        padding: '8px 12px',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--fw-semibold)',
                        letterSpacing: 'var(--ls-label)',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--surface-sunken)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(revenueGoal.weeks ?? []).map((w, i) => (
                  <tr key={w.semana} className="z-row">
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: i < revenueGoal.weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{w.semana}</span>
                      <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {w.from_date.slice(8)} – {w.to_date.slice(8)}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        color: 'var(--text-body)',
                        borderBottom: i < revenueGoal.weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      {money(w.target)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        fontWeight: 600,
                        color: 'var(--text-display)',
                        borderBottom: i < revenueGoal.weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      {money(w.actual)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        borderBottom: i < revenueGoal.weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      <Badge tone={w.met ? 'positive' : 'negative'} size="sm" dot>
                        {w.met ? 'Cumplida' : 'No cumplida'}
                      </Badge>
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        color:
                          w.carry_to_next > 0
                            ? 'var(--negative)'
                            : w.carry_to_next < 0
                              ? 'var(--positive)'
                              : 'var(--text-muted)',
                        borderBottom: i < revenueGoal.weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      {w.carry_to_next === 0
                        ? '—'
                        : w.carry_to_next > 0
                          ? `+${money(w.carry_to_next)}`
                          : `−${money(Math.abs(w.carry_to_next))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            Establece un objetivo semanal para ver el seguimiento de cada semana.
          </div>
        )}
      </Card>

      <Card
        eyebrow="Comisiones"
        title="Anomalías de pago de comisión"
        info="Compara cada pago de comisión contra lo que debería ser según el % (y el mínimo garantizado, si aplica) configurado para el período de esa colaboradora en Ajustes → Personal."
        action={
          anomalyRows.length > 0 && (
            <Badge tone={anomalyCount > 0 ? 'negative' : 'positive'} size="sm" dot>
              {anomalyCount > 0 ? `${anomalyCount} anomalía${anomalyCount === 1 ? '' : 's'}` : 'Todo cuadra'}
            </Badge>
          )
        }
      >
        {(anomalies?.config_warnings ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {anomalies.config_warnings.map((w) => (
              <Badge key={w.colaborador} tone="caution" size="sm">
                {w.colaborador}: {w.reason}
              </Badge>
            ))}
          </div>
        )}
        {sortedAnomalyRows.length === 0 ? (
          <div
            style={{
              padding: '20px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
            }}
          >
            No hay pagos de comisión que revisar este mes.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <thead>
                <tr>
                  {[
                    'Colaboradora',
                    'Fecha de pago',
                    'Concepto',
                    'Generado en su período',
                    'Esperado',
                    'Pagado',
                    'Estado',
                  ].map((label, i) => (
                    <th
                      key={label}
                      style={{
                        textAlign: i === 0 || i === 2 ? 'left' : 'right',
                        padding: '8px 12px',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--fw-semibold)',
                        letterSpacing: 'var(--ls-label)',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--surface-sunken)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedAnomalyRows.map((r, i) => {
                  const borderBottom = i < sortedAnomalyRows.length - 1 ? '1px solid var(--border-subtle)' : 'none';
                  const rowKey = anomalyRowKey(r);
                  const isMissing = r.egreso_id == null;
                  const isExpanded = expandedAnomalyKey === rowKey;
                  return (
                    <Fragment key={rowKey}>
                      <tr
                        className="z-row"
                        onClick={() => r.status === 'anomaly' && setExpandedAnomalyKey(isExpanded ? null : rowKey)}
                        style={{ cursor: r.status === 'anomaly' ? 'pointer' : 'default' }}
                      >
                        <td style={{ padding: '12px', borderBottom, fontWeight: 600, color: 'var(--text-heading)' }}>
                          {r.colaborador}
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px', borderBottom, whiteSpace: 'nowrap' }}>
                          {r.fecha_pago ? (
                            fmtFechaPago(r.fecha_pago)
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>
                              {isMissing ? '—' : r.semana ? `${r.semana} (sin fecha)` : 'Sin fecha'}
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            borderBottom,
                            color: isMissing ? 'var(--text-muted)' : 'var(--text-secondary)',
                            fontStyle: isMissing ? 'italic' : 'normal',
                          }}
                        >
                          {r.concepto}
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px', borderBottom }}>{money(r.generated)}</td>
                        <td style={{ textAlign: 'right', padding: '12px', borderBottom, fontWeight: 600 }}>
                          {money(r.expected)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '12px',
                            borderBottom,
                            fontWeight: 600,
                            color: r.status === 'anomaly' ? 'var(--negative)' : 'var(--text-display)',
                          }}
                        >
                          {money(r.actual)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px', borderBottom }}>
                          <Badge tone={r.status === 'anomaly' ? 'negative' : 'positive'} size="sm" dot>
                            {r.status === 'anomaly' ? 'Anomalía' : 'Correcto'}
                          </Badge>
                          {r.issues.length > 0 && (
                            <div
                              style={{
                                marginTop: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                alignItems: 'flex-end',
                              }}
                            >
                              {r.issues.map((issue, ix) => (
                                <span
                                  key={ix}
                                  style={{ fontSize: 'var(--text-xs)', color: 'var(--negative)', textAlign: 'right' }}
                                >
                                  {issue}
                                </span>
                              ))}
                            </div>
                          )}
                          {r.status === 'anomaly' && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-brand)',
                                fontWeight: 600,
                              }}
                            >
                              {isExpanded ? 'Ocultar detalle ▲' : 'Ver detalle ▼'}
                            </div>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${rowKey}-detail`}>
                          <td colSpan={7} style={{ padding: 0, borderBottom, background: 'var(--surface-sunken)' }}>
                            <div style={{ padding: '14px 16px' }}>
                              <div
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  color: 'var(--text-secondary)',
                                  marginBottom: 10,
                                }}
                              >
                                Período considerado:{' '}
                                <strong style={{ color: 'var(--text-heading)' }}>
                                  {r.window_from} a {r.window_to}
                                </strong>{' '}
                                (ambos días incluidos)
                              </div>
                              {r.services.length === 0 ? (
                                <div
                                  style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-muted)',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  No hay servicios registrados para esta colaboradora en este período.
                                </div>
                              ) : (
                                <table
                                  style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}
                                >
                                  <thead>
                                    <tr>
                                      {['Fecha', 'Hora', 'Servicio', 'Monto'].map((label, li) => (
                                        <th
                                          key={label}
                                          style={{
                                            textAlign: li === 3 ? 'right' : 'left',
                                            padding: '4px 10px',
                                            color: 'var(--text-muted)',
                                            fontWeight: 'var(--fw-semibold)',
                                            textTransform: 'uppercase',
                                            letterSpacing: 'var(--ls-label)',
                                          }}
                                        >
                                          {label}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.services.map((s, si) => (
                                      <tr key={si}>
                                        <td style={{ padding: '4px 10px', color: 'var(--text-body)' }}>{s.date}</td>
                                        <td style={{ padding: '4px 10px', color: 'var(--text-body)' }}>
                                          {s.time.slice(0, 5)}
                                        </td>
                                        <td style={{ padding: '4px 10px', color: 'var(--text-body)' }}>{s.name}</td>
                                        <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600 }}>
                                          {money(s.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(cierre?.weeks ?? []).length > 0 && (
        <Card
          eyebrow="Corte"
          title="Cierre de caja semanal"
          info="El mes se divide en 4 semanas: la semana 1 va del día 1 al primer domingo (si el mes empieza después de miércoles, se extiende al segundo domingo); las siguientes van de lunes a domingo y la semana 4 termina el último día del mes. La semana 1 arranca con la base de inicio de mes; las siguientes arrancan con el LO QUE SE TIENE que contaron al corte de la semana anterior (si aún no está en la hoja, se usa el esperado calculado). Ingresos vienen de las ventas: efectivo = pagos en cash; tarjeta = todo lo demás (débito, terminal, crédito, transferencias, online). Se restan los gastos de esa semana según su fuente: Efectivo sale de caja, Débito de la cuenta; lo pagado con Crédito, Carlos o Bety no sale de caja y no se resta. Las Transferencias de Carlos y Bety mueven efectivo de la caja a la cuenta: se restan de efectivo y se suman a tarjeta en la semana de su fecha. LO QUE SE TIENE es lo que ustedes contaron en la hoja, solo de referencia."
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <thead>
                <tr>
                  <th rowSpan={2} style={{ ...CIERRE_TH_GROUP, textAlign: 'left', verticalAlign: 'bottom' }}>
                    Semana
                  </th>
                  <th colSpan={2} style={CIERRE_TH_GROUP}>
                    Ingresos
                  </th>
                  <th colSpan={2} style={{ ...CIERRE_TH_GROUP, ...CIERRE_SEP }}>
                    Gastos
                  </th>
                  <th
                    rowSpan={2}
                    style={{ ...CIERRE_TH_GROUP, ...CIERRE_SEP, textAlign: 'right', verticalAlign: 'bottom' }}
                  >
                    Transf.
                    <br />C y B
                  </th>
                  <th colSpan={2} style={{ ...CIERRE_TH_GROUP, ...CIERRE_SEP, color: 'var(--text-brand)' }}>
                    Deberíamos tener
                  </th>
                  <th colSpan={2} style={{ ...CIERRE_TH_GROUP, ...CIERRE_SEP }}>
                    Lo que se tiene
                  </th>
                </tr>
                <tr>
                  {['Efectivo', 'Tarjeta', 'Efectivo', 'Débito', 'Efectivo', 'Tarjeta', 'Efectivo', 'Tarjeta'].map(
                    (label, i) => (
                      <th key={i} style={{ ...CIERRE_TH_SUB, ...(i % 2 === 0 && i > 0 ? CIERRE_SEP : {}) }}>
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {cierre.weeks.map((w, i) => {
                  const td = (extra = {}) => ({
                    textAlign: 'right',
                    padding: '12px 14px',
                    color: 'var(--text-body)',
                    verticalAlign: 'middle',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    borderBottom: i < cierre.weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    ...extra,
                  });
                  return (
                    <tr key={w.semana} className="z-row">
                      <td style={td({ textAlign: 'left' })}>
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{w.semana}</span>
                        <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {w.from_date.slice(8)} – {w.to_date.slice(8)}
                        </span>
                      </td>
                      <td style={td()}>{cierreNum(w.ingresos.efectivo)}</td>
                      <td style={td()}>{cierreNum(w.ingresos.tarjeta)}</td>
                      <td style={td(CIERRE_SEP)}>{cierreNum(w.gastos.efectivo, 'negative')}</td>
                      <td style={td()}>{cierreNum(w.gastos.tarjeta, 'negative')}</td>
                      <td style={td(CIERRE_SEP)}>{cierreNum(w.transferencias)}</td>
                      <td style={td(CIERRE_SEP)}>
                        <CalcTip value={w.esperado_efectivo} rows={calcRows(w, 'efectivo')} drop={i < 2} />
                      </td>
                      <td style={td()}>
                        <CalcTip value={w.esperado_tarjeta} rows={calcRows(w, 'tarjeta')} drop={i < 2} />
                      </td>
                      <td style={td(CIERRE_SEP)}>
                        <TieneCell value={w.lo_que_se_tiene_efectivo} esperado={w.esperado_efectivo} />
                      </td>
                      <td style={td()}>
                        <TieneCell value={w.lo_que_se_tiene_tarjeta} esperado={w.esperado_tarjeta} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 12,
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              Base de inicio de mes (sumada en Semana 1): efectivo{' '}
              <strong style={{ color: 'var(--text-display)' }}>{money(cierre.base_efectivo)}</strong> · tarjeta{' '}
              <strong style={{ color: 'var(--text-display)' }}>{money(cierre.base_tarjeta)}</strong>
            </span>
            <span>
              Ingresos del mes:{' '}
              <strong style={{ color: 'var(--text-display)' }}>{money(cierre.total_ingresos.total)}</strong> (efectivo{' '}
              {money(cierre.total_ingresos.efectivo)} · tarjeta {money(cierre.total_ingresos.tarjeta)})
            </span>
            <span>
              Gastos con Crédito/Carlos/Bety (no salen de caja):{' '}
              <strong style={{ color: 'var(--text-display)' }}>{money(cierre.total_gastos.otros)}</strong>
            </span>
          </div>
        </Card>
      )}

      {(egresosSemana.hasData || insumosSemana.hasData) && (
        <div className="z-2col">
          <Card
            eyebrow="Semanal"
            title="Egresos por fuente de pago"
            info="Total de egresos de cada semana desglosado por fuente de pago. Los pagos de servicios fijos (sin semana en la hoja) no aparecen aquí."
          >
            {egresosSemana.hasData ? (
              <DataTable columns={egresosSemana.columns} rows={egresosSemana.rows} renderCell={renderPivotCell} />
            ) : (
              <EmptyState />
            )}
          </Card>
          <Card
            eyebrow="Semanal"
            title="Insumos por tipo"
            info="Total de insumos de cada semana desglosado por fuente de pago (columna Tipo de la hoja)."
          >
            {insumosSemana.hasData ? (
              <DataTable columns={insumosSemana.columns} rows={insumosSemana.rows} renderCell={renderPivotCell} />
            ) : (
              <EmptyState />
            )}
          </Card>
        </div>
      )}

      {byColaborador.length > 0 && (
        <Card
          eyebrow="Personal"
          title="Pagos por colaboradora"
          info="Total pagado a cada colaboradora en el mes (salarios, comisiones y bonos de la hoja de gastos)."
        >
          {byColaborador.map((c, i) => (
            <RankRow
              key={c.label}
              rank={i + 1}
              label={c.label}
              sublabel={c.count + ' pagos'}
              value={money(c.total)}
              ratio={c.total / maxColab}
              color={CHART[i % CHART.length]}
              last={i === byColaborador.length - 1}
            />
          ))}
        </Card>
      )}

      <Card
        eyebrow="Detalle"
        title="Egresos del mes"
        info="Sección 'EGRESOS POR SERVICIO + PAGOS A PERSONAL' de la hoja. Tipo Servicio = sin semana ni colaborador (agua, luz, internet…). Haz clic en Total para ordenar."
      >
        {(data?.egresos ?? []).length > 0 ? (
          <DataTable
            columns={EGRESOS_COLS}
            rows={data.egresos}
            renderCell={(row, key) => {
              if (key === 'semana') return <span style={{ color: 'var(--text-secondary)' }}>{row.semana ?? '—'}</span>;
              if (key === 'fecha_pago')
                return row.fecha_pago ? (
                  fmtFechaPago(row.fecha_pago)
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                );
              if (key === 'concepto')
                return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.concepto}</span>;
              if (key === 'tipo_gasto')
                return row.es_servicio ? (
                  <Badge tone="lavender" size="sm">
                    Servicio
                  </Badge>
                ) : (
                  <Badge tone="rose" size="sm">
                    Personal
                  </Badge>
                );
              if (key === 'fuente_pago')
                return row.fuente_pago ? (
                  <Badge tone={FUENTE_TONE[row.fuente_pago] ?? 'neutral'} size="sm">
                    {row.fuente_pago}
                  </Badge>
                ) : (
                  '—'
                );
              if (key === 'total')
                return <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{money(row.total)}</span>;
              return row[key] ?? '—';
            }}
          />
        ) : (
          <EmptyState />
        )}
      </Card>

      <Card
        eyebrow="Detalle"
        title="Insumos del mes"
        info="Sección 'INSUMOS' de la hoja: materiales y compras con su semana, fecha, fuente de pago y prioridad. Haz clic en Fecha o Precio para ordenar."
      >
        {(data?.insumos ?? []).length > 0 ? (
          <DataTable
            columns={INSUMOS_COLS}
            rows={data.insumos}
            renderCell={(row, key) => {
              if (key === 'semana') return <span style={{ color: 'var(--text-secondary)' }}>{row.semana ?? '—'}</span>;
              if (key === 'fecha') return <span style={{ color: 'var(--text-secondary)' }}>{row.fecha ?? '—'}</span>;
              if (key === 'insumo')
                return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.insumo}</span>;
              if (key === 'tipo')
                return row.tipo ? (
                  <Badge tone={FUENTE_TONE[row.tipo] ?? 'neutral'} size="sm">
                    {row.tipo}
                  </Badge>
                ) : (
                  '—'
                );
              if (key === 'prioridad')
                return row.prioridad ? (
                  <Badge tone={row.prioridad === 'Alta' ? 'negative' : 'neutral'} size="sm">
                    {row.prioridad}
                  </Badge>
                ) : (
                  '—'
                );
              if (key === 'precio')
                return <span style={{ fontWeight: 600, color: 'var(--text-display)' }}>{money(row.precio)}</span>;
              return row[key] ?? '—';
            }}
          />
        ) : (
          <EmptyState />
        )}
      </Card>

      <Card
        eyebrow="Insumos"
        title="Oportunidades de compra a mayoreo"
        info="Insumos candidatos a comprar por mayoreo: aparecen en más de la mitad de los meses del historial, o se compraron más de una vez en un mismo mes, o se compraron 3 veces o más desde que empezó el año."
      >
        {(mayoreo?.oportunidades ?? []).length > 0 ? (
          <DataTable
            columns={MAYOREO_COLS}
            rows={mayoreo.oportunidades}
            renderCell={(row, key) => {
              if (key === 'insumo')
                return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.insumo}</span>;
              if (key === 'tipo')
                return row.tipo ? (
                  <Badge tone={FUENTE_TONE[row.tipo] ?? 'neutral'} size="sm">
                    {row.tipo}
                  </Badge>
                ) : (
                  '—'
                );
              if (key === 'meses') return `${row.meses_con_compra} / ${row.meses_totales}`;
              if (key === 'ultima_compra') return row.ultima_compra ?? '—';
              return row[key] ?? '—';
            }}
          />
        ) : (
          <EmptyState />
        )}
      </Card>
    </div>
  );
};

const EmptyState = () => (
  <div
    style={{
      padding: '20px 0',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
    }}
  >
    Sin datos para este mes
  </div>
);

export default Gastos;
