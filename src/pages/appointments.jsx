import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import DataTable from '../components/widgets/data-table';
import ApptStatus from '../components/widgets/appt-status';
import Badge from '../components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(str) {
  return new Date(str + 'T12:00:00');
}

const APPT_COLS = [
  { key: 'time', label: 'Hora', nowrap: true },
  { key: 'service', label: 'Servicio' },
  { key: 'professional', label: 'Empleada' },
  { key: 'status', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' },
];

const MiniCalendar = ({ selectedDate, onSelect }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => parseLocalDate(selectedDate));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selDate = parseLocalDate(selectedDate);
  const isSelected = (d) => d === selDate.getDate() && month === selDate.getMonth() && year === selDate.getFullYear();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

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
        {cells.map((d, i) => (
          <button
            key={i}
            onClick={() => {
              if (d) {
                const dt = new Date(year, month, d);
                const str = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                onSelect(str);
              }
            }}
            disabled={!d}
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-xs)',
              fontWeight: isToday(d) || isSelected(d) ? 'var(--fw-bold)' : 'var(--fw-regular)',
              color: isSelected(d)
                ? 'var(--white)'
                : isToday(d)
                  ? 'var(--brand-primary)'
                  : d
                    ? 'var(--text-body)'
                    : 'transparent',
              background: isSelected(d) ? 'var(--brand-primary)' : isToday(d) ? 'var(--rose-100)' : 'transparent',
              border: 'none',
              borderRadius: 6,
              padding: '5px 0',
              cursor: d ? 'pointer' : 'default',
            }}
          >
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  );
};

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState(localToday);
  const { data: bookings, loading } = useApi(
    () => api.bookings({ from_date: selectedDate, to_date: selectedDate, limit: 200 }),
    [selectedDate]
  );
  const { data: profList } = useApi(() => api.professionals(), []);

  const profNames = useMemo(() => {
    const map = {};
    (profList ?? []).forEach((p) => {
      map[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || `Prof. ${p.id}`;
    });
    return map;
  }, [profList]);

  const rows = useMemo(
    () =>
      (bookings ?? []).map((b) => ({
        ...b,
        time: b.start ? new Date(b.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—',
        professional: profNames[b.professional_id] ?? (b.professional_id ? `Prof. ${b.professional_id}` : '—'),
        status: b.payment_status === 'ASSOCIATED' ? 'paid' : 'pending',
      })),
    [bookings, profNames]
  );

  const paid = rows.filter((r) => r.status === 'paid').length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const totalRev = rows.reduce((s, r) => s + (r.amount ?? 0), 0);

  const displayDate = parseLocalDate(selectedDate).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const calEyebrow =
    MONTHS_ES[parseLocalDate(selectedDate).getMonth()] + ' ' + parseLocalDate(selectedDate).getFullYear();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-status-row">
        <StatCard
          label="Citas del día"
          value={loading ? '…' : String(rows.length)}
          caption={displayDate}
          icon="Calendar"
        />
        <StatCard
          label="Ingresos del día"
          value={loading ? '…' : money(totalRev)}
          caption="citas con pago"
          icon="DollarSign"
        />
        <StatCard label="Pendientes" value={loading ? '…' : String(pending)} caption={`${paid} pagadas`} icon="Clock" />
      </div>

      <div className="z-appt-layout">
        <Card eyebrow="Agenda" title={`Citas — ${displayDate}`}>
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
          ) : (
            <div
              style={{
                padding: '30px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Sin citas para este día
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow={calEyebrow} title="Calendario">
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </Card>

          <Card eyebrow="Resumen" title="Estado de citas">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Pagadas', count: paid, tone: 'positive' },
                { label: 'Pendientes', count: pending, tone: 'caution' },
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
