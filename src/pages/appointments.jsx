import { useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import DataTable from '../components/widgets/data-table';
import ApptStatus from '../components/widgets/appt-status';
import Button from '../components/ui/button';
import Badge from '../components/ui/badge';
import SegmentedControl from '../components/ui/segmented-control';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const STATUS_MAP = { 1: 'paid', 2: 'pending', 3: 'unpaid' };

const APPT_COLS = [
  { key: 'time', label: 'Hora', nowrap: true },
  { key: 'service', label: 'Servicio' },
  { key: 'professional', label: 'Empleada' },
  { key: 'status', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' },
];

const MiniCalendar = ({ selectedDate, onSelect }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            padding: 4,
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-heading)',
          }}
        >
          {MONTHS_ES[month]} {year}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            padding: 4,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-muted)',
              padding: '4px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const sel = selectedDate ? new Date(selectedDate) : null;
          const isSelected = sel && d === sel.getDate() && month === sel.getMonth() && year === sel.getFullYear();
          return (
            <button
              key={i}
              onClick={() => {
                if (d) {
                  const dt = new Date(year, month, d);
                  onSelect(dt.toISOString().slice(0, 10));
                }
              }}
              disabled={!d}
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                fontWeight: isToday || isSelected ? 'var(--fw-bold)' : 'var(--fw-regular)',
                color: isSelected
                  ? 'var(--white)'
                  : isToday
                    ? 'var(--brand-primary)'
                    : d
                      ? 'var(--text-body)'
                      : 'transparent',
                background: isSelected ? 'var(--brand-primary)' : isToday ? 'var(--rose-100)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '5px 0',
                cursor: d ? 'pointer' : 'default',
              }}
            >
              {d || ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Appointments = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState('lista');

  const { data: bookings, loading } = useApi(
    () => api.bookings({ from_date: selectedDate, to_date: selectedDate, limit: 200 }),
    [selectedDate]
  );

  const rows = (bookings ?? []).map((b) => ({
    ...b,
    time: b.start ? new Date(b.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—',
    professional: b.professional_id ? `Prof. ${b.professional_id}` : '—',
    status: STATUS_MAP[b.status_id] ?? 'pending',
  }));

  const paid = rows.filter((r) => r.status === 'paid').length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const unpaid = rows.filter((r) => r.status === 'unpaid').length;
  const totalRev = rows.reduce((s, r) => s + (r.amount ?? 0), 0);

  const displayDate = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : today;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-status-row">
        <StatCard label="Citas del día" value={rows.length} caption="programadas" icon="Calendar" />
        <StatCard label="Ingreso del día" value={money(totalRev)} caption="citas pagadas" icon="DollarSign" />
        <StatCard label="Pendientes" value={pending + unpaid} caption={`${paid} pagadas`} icon="Clock" />
      </div>

      <div className="z-appt-layout">
        <Card
          eyebrow="Agenda"
          title={`Citas del ${displayDate}`}
          action={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SegmentedControl
                options={[{ value: 'lista', label: 'Lista' }]}
                value={view}
                onChange={setView}
                size="sm"
              />
              <Button variant="primary" size="sm" iconLeft={Plus}>
                Nueva
              </Button>
            </div>
          }
        >
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
          ) : (
            <DataTable
              columns={APPT_COLS}
              rows={rows}
              renderCell={(row, key) => {
                if (key === 'service') return row.service_name ?? '—';
                if (key === 'status') return <ApptStatus status={row.status} />;
                if (key === 'total') return money(row.amount ?? 0);
                return row[key];
              }}
            />
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            eyebrow={
              MONTHS_ES[new Date(selectedDate + 'T12:00:00').getMonth()] +
              ' ' +
              new Date(selectedDate + 'T12:00:00').getFullYear()
            }
            title="Calendario"
          >
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </Card>

          <Card eyebrow="Resumen" title="Estado de citas">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Pagadas', count: paid, tone: 'positive' },
                { label: 'Pendientes', count: pending, tone: 'caution' },
                { label: 'Sin pagar', count: unpaid, tone: 'negative' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Badge tone={item.tone} dot>
                    {item.label}
                  </Badge>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--fw-semibold)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
