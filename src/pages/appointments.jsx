import { useState } from 'react';
import D from '../mocks/data';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import DataTable from '../components/widgets/data-table';
import Avatar from '../components/ui/avatar';
import ApptStatus from '../components/widgets/appt-status';
import Button from '../components/ui/button';
import Badge from '../components/ui/badge';
import SegmentedControl from '../components/ui/segmented-control';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const STAFF_NAMES = D.staff.map((s) => s.name.split(' ')[0]);
const STAFF_COLORS = D.staff.map((s) => s.color);

const APPT_COLS = [
  { key: 'time', label: 'Hora', nowrap: true },
  { key: 'client', label: 'Clienta' },
  { key: 'service', label: 'Servicio' },
  { key: 'staff', label: 'Empleada' },
  { key: 'duration', label: 'Duración', align: 'right' },
  { key: 'status', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' },
];

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
const TODAY = new Date(2026, 5, 6);

const MiniCalendar = ({ selectedDay, onSelect }) => {
  const [viewDate, setViewDate] = useState(TODAY);
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
          const isToday = d === TODAY.getDate() && month === TODAY.getMonth() && year === TODAY.getFullYear();
          const isSelected = d === selectedDay;
          const hasAppts = d && d % 3 !== 0;
          return (
            <button
              key={i}
              onClick={() => d && onSelect(d)}
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
                position: 'relative',
              }}
            >
              {d || ''}
              {hasAppts && !isSelected && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--chart-1)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimelineGrid = ({ appts }) => {
  const hours = Array.from({ length: 10 }, (_, i) => i + 9);
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 560 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(4, 1fr)', gap: 0 }}>
          <div />
          {STAFF_NAMES.map((name, i) => (
            <div
              key={name}
              style={{
                padding: '8px 6px',
                textAlign: 'center',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-heading)',
                borderBottom: '2px solid var(--border-subtle)',
                borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              {name}
            </div>
          ))}
        </div>
        {hours.map((hour) => (
          <div key={hour} style={{ display: 'grid', gridTemplateColumns: '56px repeat(4, 1fr)', gap: 0 }}>
            <div
              style={{
                padding: '6px 8px 6px 0',
                textAlign: 'right',
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {hour}:00
            </div>
            {STAFF_NAMES.map((name, si) => {
              const cellAppts = appts.filter((a) => a.staff === name && parseInt(a.time.split(':')[0]) === hour);
              return (
                <div
                  key={name}
                  style={{
                    minHeight: 44,
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: si > 0 ? '1px solid var(--border-subtle)' : 'none',
                    padding: 3,
                  }}
                >
                  {cellAppts.map((appt) => (
                    <div
                      key={appt.id}
                      style={{
                        background: STAFF_COLORS[si] || 'var(--chart-1)',
                        opacity: 0.85,
                        borderRadius: 5,
                        padding: '3px 6px',
                        marginBottom: 2,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 10,
                          fontWeight: 'var(--fw-semibold)',
                          color: 'var(--white)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {appt.client.split(' ')[0]}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 9,
                          color: 'rgba(255,255,255,0.8)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {appt.service.split(' ').slice(0, 2).join(' ')}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const Appointments = () => {
  const [view, setView] = useState('lista');
  const [selectedDay, setSelectedDay] = useState(6);

  const paid = D.appointments.filter((a) => a.status === 'paid').length;
  const pending = D.appointments.filter((a) => a.status === 'pending').length;
  const unpaid = D.appointments.filter((a) => a.status === 'unpaid').length;
  const totalRev = D.appointments.filter((a) => a.status === 'paid').reduce((s, a) => s + a.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-status-row">
        <StatCard label="Citas hoy" value={D.appointments.length} caption="programadas" icon="Calendar" />
        <StatCard label="Ingreso hoy" value={D.money(totalRev)} delta={8.2} caption="vs ayer" icon="DollarSign" />
        <StatCard label="Pendientes" value={pending} caption={`${paid} pagadas · ${unpaid} sin pagar`} icon="Clock" />
      </div>

      <div className="z-appt-layout">
        <Card
          eyebrow="Agenda"
          title={`Citas del ${selectedDay} de junio`}
          action={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SegmentedControl
                options={[
                  { value: 'lista', label: 'Lista' },
                  { value: 'timeline', label: 'Timeline' },
                ]}
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
          {view === 'timeline' ? (
            <TimelineGrid appts={D.appointments} />
          ) : (
            <DataTable
              columns={APPT_COLS}
              rows={D.appointments}
              renderCell={(row, key) => {
                if (key === 'client')
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={row.client} size="xs" />
                      <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-heading)' }}>{row.client}</span>
                    </div>
                  );
                if (key === 'status') return <ApptStatus status={row.status} />;
                if (key === 'total') return D.money(row.total);
                if (key === 'duration') return `${row.duration} min`;
                return row[key];
              }}
            />
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Junio 2026" title="Calendario">
            <MiniCalendar selectedDay={selectedDay} onSelect={setSelectedDay} />
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

          <Card eyebrow="Personal" title="Hoy por empleada">
            {D.staff.map((s, i) => {
              const staffAppts = D.appointments.filter((a) => a.staff === s.name.split(' ')[0]);
              return (
                <div
                  key={s.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: i < D.staff.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <Avatar name={s.name} size="xs" />
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-body)',
                    }}
                  >
                    {s.name.split(' ')[0]}
                  </span>
                  <Badge tone="neutral">{staffAppts.length} citas</Badge>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
