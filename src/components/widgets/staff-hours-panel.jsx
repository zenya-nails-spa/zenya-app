import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import Card from '../ui/card';
import Badge from '../ui/badge';
import Button from '../ui/button';
import IconButton from '../ui/icon-button';
import Select from '../ui/select';
import DataTable from './data-table';

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// The only individually-tracked manicuristas — "Cosmetología" and "Lashes y
// cejas" are shared AgendaPro accounts for a service, not people who can owe
// or be owed time, so they're excluded from this ledger.
const TRACKED_PROFESSIONAL_NAMES = ['Danna Aquino', 'Guadalupe Villegas Martínez', 'Liliana Martínez'];

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

function fmtDuration(minutes) {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// 1 día = jornada de 8 horas, para convertir la entrada del formulario a minutos.
function minutesFromInput(amount, unit) {
  const n = Number(amount) || 0;
  if (unit === 'horas') return Math.round(n * 60);
  if (unit === 'dias') return Math.round(n * 480);
  return Math.round(n);
}

const inputStyle = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid var(--border-subtle)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-body)',
  background: 'var(--surface-card)',
};

const labelStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--fw-medium)',
  color: 'var(--text-secondary)',
};

const EmptyRow = ({ text }) => (
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

const Stat = ({ label, value, highlight }) => (
  <div>
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        fontWeight: 700,
        color: highlight ? 'var(--brand-primary)' : 'var(--text-display)',
      }}
    >
      {value}
    </div>
  </div>
);

const BalanceCard = ({ summary, active, onSelect }) => {
  const name = [summary.first_name, summary.last_name].filter(Boolean).join(' ').trim();
  const owed = summary.net_minutes > 0;
  const owes = summary.net_minutes < 0;

  let tone = 'positive';
  let statusText = 'Sin pendientes';
  if (owed) {
    tone = 'lavender';
    statusText = `Le debemos ${fmtDuration(summary.net_minutes)}`;
  } else if (owes) {
    const daysOwed = summary.since_date
      ? Math.floor((Date.now() - new Date(summary.since_date + 'T00:00:00').getTime()) / 86400000)
      : 0;
    tone = daysOwed >= 14 ? 'negative' : 'caution';
    statusText = `Debe ${fmtDuration(summary.net_minutes)}`;
  }

  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        padding: 16,
        borderRadius: 'var(--radius-lg)',
        border: active ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
        background: 'var(--surface-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-heading)' }}>
        {name}
      </div>
      <Badge tone={tone} dot>
        {statusText}
      </Badge>
      {summary.since_date && (owed || owes) && (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          desde {fmtDate(summary.since_date)}
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        Vacaciones: {summary.vacation_remaining_days} de {summary.vacation_total_days} días disponibles
      </div>
    </button>
  );
};

const TimeEntrySection = ({ professional, entries, onChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entryType, setEntryType] = useState('extra');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('minutos');
  const [reason, setReason] = useState('');
  const [clientName, setClientName] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEntryDate(new Date().toISOString().slice(0, 10));
    setEntryType('extra');
    setAmount('');
    setUnit('minutos');
    setReason('');
    setClientName('');
  };

  const handleSubmit = async () => {
    const minutes = minutesFromInput(amount, unit);
    if (!minutes) return;
    setSaving(true);
    try {
      await api.createStaffTimeEntry({
        professional_id: professional.id,
        entry_date: entryDate,
        entry_type: entryType,
        minutes,
        reason: reason || null,
        client_name: entryType === 'extra' && clientName ? clientName : null,
      });
      resetForm();
      setShowForm(false);
      onChange();
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async (id) => {
    await api.updateStaffTimeEntry(id, { active: false });
    onChange();
  };

  const columns = [
    { key: 'entry_date', label: 'Fecha' },
    { key: 'entry_type', label: 'Tipo' },
    { key: 'minutes', label: 'Tiempo', align: 'right' },
    { key: 'reason', label: 'Motivo' },
    { key: 'client_name', label: 'Clienta' },
    { key: 'actions', label: '', align: 'right' },
  ];

  return (
    <Card
      eyebrow="Registro"
      title={`Horas — ${professional.first_name?.trim()}`}
      info="Extra: tiempo que trabajó de más y se le debe. Debe: tiempo que ella debe al salón (faltas, permisos, salidas anticipadas)."
      action={
        <Button size="sm" variant="soft" iconLeft={Plus} onClick={() => setShowForm((v) => !v)}>
          Agregar
        </Button>
      }
    >
      {showForm && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'flex-end',
            padding: '4px 0 16px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={inputStyle} />
          </div>
          <Select
            label="Tipo"
            value={entryType}
            onChange={setEntryType}
            size="sm"
            options={[
              { value: 'extra', label: 'Extra (se le debe)' },
              { value: 'debe', label: 'Debe (ella debe)' },
            ]}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>Cantidad</label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...inputStyle, width: 90 }}
            />
          </div>
          <Select
            value={unit}
            onChange={setUnit}
            size="sm"
            options={[
              { value: 'minutos', label: 'Minutos' },
              { value: 'horas', label: 'Horas' },
              { value: 'dias', label: 'Días (8h)' },
            ]}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Motivo</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={inputStyle}
              placeholder="Opcional"
            />
          </div>
          {entryType === 'extra' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Clienta</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={inputStyle}
                placeholder="Opcional"
              />
            </div>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={saving || !amount}>
            Guardar
          </Button>
        </div>
      )}

      {entries.length ? (
        <DataTable
          columns={columns}
          rows={entries}
          renderCell={(row, key) => {
            if (key === 'entry_date') return fmtDate(row.entry_date);
            if (key === 'entry_type')
              return (
                <Badge tone={row.entry_type === 'extra' ? 'lavender' : 'caution'}>
                  {row.entry_type === 'extra' ? 'Extra' : 'Debe'}
                </Badge>
              );
            if (key === 'minutes') return fmtDuration(row.minutes);
            if (key === 'reason') return row.reason ?? '—';
            if (key === 'client_name') return row.client_name ?? '—';
            if (key === 'actions')
              return <IconButton icon={X} title="Anular" size="sm" variant="ghost" onClick={() => handleVoid(row.id)} />;
            return row[key];
          }}
        />
      ) : (
        <EmptyRow text="Sin registros todavía." />
      )}
    </Card>
  );
};

const VacationSection = ({ professional, vacations, allotment, summary, onChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [vacationDate, setVacationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [status, setStatus] = useState('taken');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [totalDaysDraft, setTotalDaysDraft] = useState(String(allotment?.total_days ?? summary?.vacation_total_days ?? 0));
  const [savingAllotment, setSavingAllotment] = useState(false);

  useEffect(() => {
    setTotalDaysDraft(String(allotment?.total_days ?? summary?.vacation_total_days ?? 0));
    // eslint-disable-next-line
  }, [professional.id, allotment]);

  const handleSaveAllotment = async () => {
    setSavingAllotment(true);
    try {
      await api.upsertStaffAllotment(professional.id, { total_days: Number(totalDaysDraft) || 0 });
      onChange();
    } finally {
      setSavingAllotment(false);
    }
  };

  const resetForm = () => {
    setVacationDate(new Date().toISOString().slice(0, 10));
    setIsHalfDay(false);
    setStatus('taken');
    setNote('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.createStaffVacation({
        professional_id: professional.id,
        vacation_date: vacationDate,
        is_half_day: isHalfDay,
        status,
        note: note || null,
      });
      resetForm();
      setShowForm(false);
      onChange();
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async (id) => {
    await api.updateStaffVacation(id, { active: false });
    onChange();
  };

  const columns = [
    { key: 'vacation_date', label: 'Fecha' },
    { key: 'is_half_day', label: 'Días' },
    { key: 'status', label: 'Estado' },
    { key: 'note', label: 'Nota' },
    { key: 'actions', label: '', align: 'right' },
  ];

  return (
    <Card
      eyebrow="Vacaciones"
      title={`Vacaciones — ${professional.first_name?.trim()}`}
      action={
        <Button size="sm" variant="soft" iconLeft={Plus} onClick={() => setShowForm((v) => !v)}>
          Agregar
        </Button>
      }
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 16, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Días al año</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              min="0"
              step="0.5"
              value={totalDaysDraft}
              onChange={(e) => setTotalDaysDraft(e.target.value)}
              style={{ ...inputStyle, width: 70 }}
            />
            <Button size="sm" variant="secondary" onClick={handleSaveAllotment} disabled={savingAllotment}>
              Guardar
            </Button>
          </div>
        </div>
        {summary && (
          <>
            <Stat label="Tomados" value={summary.vacation_taken_days} />
            <Stat label="Solicitados" value={summary.vacation_requested_days} />
            <Stat label="Disponibles" value={summary.vacation_remaining_days} highlight />
          </>
        )}
      </div>

      {showForm && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'flex-end',
            padding: '4px 0 16px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>Fecha</label>
            <input
              type="date"
              value={vacationDate}
              onChange={(e) => setVacationDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, ...labelStyle }}>
            <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} />
            Medio día
          </label>
          <Select
            label="Estado"
            value={status}
            onChange={setStatus}
            size="sm"
            options={[
              { value: 'taken', label: 'Tomado' },
              { value: 'requested', label: 'Solicitado' },
            ]}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Nota</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder="Opcional" />
          </div>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            Guardar
          </Button>
        </div>
      )}

      {vacations.length ? (
        <DataTable
          columns={columns}
          rows={vacations}
          renderCell={(row, key) => {
            if (key === 'vacation_date') return fmtDate(row.vacation_date);
            if (key === 'is_half_day') return row.is_half_day ? '½ día' : '1 día';
            if (key === 'status')
              return (
                <Badge tone={row.status === 'taken' ? 'positive' : 'caution'}>
                  {row.status === 'taken' ? 'Tomado' : 'Solicitado'}
                </Badge>
              );
            if (key === 'note') return row.note ?? '—';
            if (key === 'actions')
              return <IconButton icon={X} title="Anular" size="sm" variant="ghost" onClick={() => handleVoid(row.id)} />;
            return row[key];
          }}
        />
      ) : (
        <EmptyRow text="Sin vacaciones registradas." />
      )}
    </Card>
  );
};

const StaffHoursPanel = () => {
  const [professionals, setProfessionals] = useState([]);
  const [balances, setBalances] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [entries, setEntries] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [allotment, setAllotment] = useState(null);

  const loadBalances = useCallback(async () => {
    const [profList, balanceData] = await Promise.all([api.professionals(), api.staffHoursBalance()]);
    const tracked = (profList ?? []).filter((p) => TRACKED_PROFESSIONAL_NAMES.includes((p.first_name || '').trim()));
    setProfessionals(tracked);
    const trackedIds = new Set(tracked.map((p) => p.id));
    setBalances((balanceData?.professionals ?? []).filter((s) => trackedIds.has(s.professional_id)));
    setSelectedId((prev) => prev ?? tracked[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBalances();
    // eslint-disable-next-line
  }, []);

  const loadDetail = useCallback(async (professionalId) => {
    if (!professionalId) return;
    const [entryList, vacationList, allotmentList] = await Promise.all([
      api.staffTimeEntries({ professional_id: professionalId }),
      api.staffVacations({ professional_id: professionalId }),
      api.staffAllotments(),
    ]);
    setEntries(entryList ?? []);
    setVacations(vacationList ?? []);
    setAllotment((allotmentList ?? []).find((a) => a.professional_id === professionalId) ?? null);
  }, []);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const refreshAll = async () => {
    await Promise.all([loadBalances(), loadDetail(selectedId)]);
  };

  const selectedProfessional = professionals.find((p) => p.id === selectedId);
  const selectedSummary = balances.find((s) => s.professional_id === selectedId);

  if (loading) return <EmptyRow text="Cargando..." />;

  if (!professionals.length) {
    return <EmptyRow text="No se encontraron las manicuristas en AgendaPro." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {balances.map((s) => (
          <BalanceCard
            key={s.professional_id}
            summary={s}
            active={s.professional_id === selectedId}
            onSelect={() => setSelectedId(s.professional_id)}
          />
        ))}
      </div>

      {selectedProfessional && (
        <>
          <TimeEntrySection professional={selectedProfessional} entries={entries} onChange={refreshAll} />
          <VacationSection
            professional={selectedProfessional}
            vacations={vacations}
            allotment={allotment}
            summary={selectedSummary}
            onChange={refreshAll}
          />
        </>
      )}
    </div>
  );
};

export default StaffHoursPanel;
