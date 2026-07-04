import { useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import Donut from '../components/charts/donut';
import BarChart from '../components/charts/bar-chart';
import DataTable from '../components/widgets/data-table';
import RankRow from '../components/widgets/rank-row';
import Badge from '../components/ui/badge';

const money = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-MX');
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const FUENTE_TONE = {
  Debito: 'lavender',
  Credito: 'rose',
  Efectivo: 'positive',
  Carlos: 'caution',
  Bety: 'caution',
};

const EGRESOS_COLS = [
  { key: 'semana', label: 'Semana' },
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

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CIERRE_COLS = [
  { key: 'semana', label: 'Semana' },
  { key: 'ing_efectivo', label: 'Ingresos efectivo', align: 'right' },
  { key: 'ing_tarjeta', label: 'Ingresos tarjeta', align: 'right' },
  { key: 'gas_efectivo', label: 'Gastos efectivo', align: 'right' },
  { key: 'gas_tarjeta', label: 'Gastos débito', align: 'right' },
  { key: 'esp_efectivo', label: 'Deberíamos tener (efectivo)', align: 'right' },
  { key: 'esp_tarjeta', label: 'Deberíamos tener (tarjeta)', align: 'right' },
];

const Gastos = () => {
  const [month, setMonth] = useState(currentMonthValue());
  const { data } = useApi(() => api.gastos({ month: `${month}-01` }), [month]);
  const { data: cierre } = useApi(() => api.cierreSemanal({ month: `${month}-01` }), [month]);

  const byFuente = data?.by_fuente ?? [];
  const bySemana = data?.by_semana ?? [];
  const byColaborador = data?.by_colaborador ?? [];
  const maxColab = byColaborador.length ? Math.max(...byColaborador.map((c) => c.total)) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

      {(cierre?.weeks ?? []).length > 0 && (
        <Card
          eyebrow="Corte"
          title="Cierre de caja semanal"
          info="El mes se divide en 4 semanas (lunes a domingo; la semana 1 absorbe los días sueltos del inicio y la 4 los del final). Ingresos vienen de las ventas: efectivo = pagos en cash; tarjeta = todo lo demás (débito, terminal, crédito, transferencias, online). Se restan los gastos de esa semana según su fuente: Efectivo sale de caja, Débito de la cuenta. Lo pagado con Crédito, Carlos o Bety no sale de caja y no se resta."
        >
          <DataTable
            columns={CIERRE_COLS}
            rows={cierre.weeks.map((w) => ({
              semana: `${w.semana} (${w.from_date.slice(8)} – ${w.to_date.slice(8)})`,
              ing_efectivo: w.ingresos.efectivo,
              ing_tarjeta: w.ingresos.tarjeta,
              gas_efectivo: w.gastos.efectivo,
              gas_tarjeta: w.gastos.tarjeta,
              esp_efectivo: w.esperado_efectivo,
              esp_tarjeta: w.esperado_tarjeta,
            }))}
            renderCell={(row, key) => {
              if (key === 'semana')
                return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.semana}</span>;
              if (key === 'esp_efectivo' || key === 'esp_tarjeta')
                return (
                  <span
                    style={{
                      fontWeight: 700,
                      color: row[key] >= 0 ? 'var(--positive)' : 'var(--negative)',
                    }}
                  >
                    {money(row[key])}
                  </span>
                );
              if (key.startsWith('gas_')) return <span style={{ color: 'var(--negative)' }}>−{money(row[key])}</span>;
              return money(row[key]);
            }}
          />
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
