import { useState, useCallback, useEffect } from 'react';
import { Plus, X, Check, Pencil } from 'lucide-react';
import { api } from '../../lib/api';
import Card from '../ui/card';
import Badge from '../ui/badge';
import Button from '../ui/button';
import IconButton from '../ui/icon-button';
import Select from '../ui/select';
import DataTable from './data-table';

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
  fontWeight: 'var(--fw-semibold)',
  color: 'var(--text-secondary)',
  letterSpacing: '0.02em',
};

const EmptyRow = ({ text }) => (
  <div
    style={{
      padding: '20px 0',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
    }}
  >
    {text}
  </div>
);

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const TYPE_OPTIONS = [
  { value: 'monthly', label: 'Cada mes, el día...' },
  { value: 'one_time', label: 'Fecha única' },
];

const COLUMNS = [
  { key: 'label', label: 'Recordatorio' },
  { key: 'schedule', label: 'Cuándo' },
  { key: 'next_due_date', label: 'Próxima fecha' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '', align: 'right' },
];

const CustomRemindersPanel = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const data = await api.customReminders();
    setReminders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState('');
  const [reminderType, setReminderType] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [reminderDate, setReminderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [daysBefore, setDaysBefore] = useState('3');
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setLabel('');
    setReminderType('monthly');
    setDayOfMonth('1');
    setReminderDate(new Date().toISOString().slice(0, 10));
    setDaysBefore('3');
    setEditingId(null);
  }, []);

  const startEdit = (row) => {
    setEditingId(row.id);
    setLabel(row.label);
    setReminderType(row.reminder_type);
    setDayOfMonth(String(row.day_of_month ?? 1));
    setReminderDate(row.reminder_date ?? new Date().toISOString().slice(0, 10));
    setDaysBefore(String(row.days_before));
    setShowForm(true);
  };

  useEffect(() => {
    if (!showForm) resetForm();
    // eslint-disable-next-line
  }, [showForm]);

  const handleSubmit = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const payload = {
        label: label.trim(),
        reminder_type: reminderType,
        day_of_month: reminderType === 'monthly' ? Number(dayOfMonth) : null,
        reminder_date: reminderType === 'one_time' ? reminderDate : null,
        days_before: Number(daysBefore) || 0,
      };
      if (editingId) {
        await api.updateCustomReminder(editingId, payload);
      } else {
        await api.createCustomReminder(payload);
      }
      setShowForm(false);
      resetForm();
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async (id) => {
    await api.updateCustomReminder(id, { active: false });
    refetch();
  };

  const handleDismiss = async (id) => {
    await api.dismissCustomReminder(id);
    refetch();
  };

  const rows = reminders ?? [];

  return (
    <Card
      eyebrow="Notificaciones"
      title="Recordatorios personalizados"
      info="Recordatorios que tú programas — por ejemplo 'pagar la tarjeta de crédito el día 30 de cada mes'. Aparecen en la campanita de notificaciones desde los días que elijas antes de la fecha, y desaparecen solos al pasar la fecha si no los marcas como hechos."
      action={
        <Button
          size="sm"
          variant="soft"
          iconLeft={Plus}
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
        >
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
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={labelStyle}>Recordatorio</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={inputStyle}
              placeholder="Ej. Pagar tarjeta de crédito"
            />
          </label>
          <Select label="Repetición" value={reminderType} onChange={setReminderType} size="sm" options={TYPE_OPTIONS} />
          {reminderType === 'monthly' ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>Día del mes</span>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                style={{ ...inputStyle, width: 70 }}
              />
            </label>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>Fecha</span>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                style={inputStyle}
              />
            </label>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={labelStyle}>Avisar desde (días antes)</span>
            <input
              type="number"
              min="0"
              value={daysBefore}
              onChange={(e) => setDaysBefore(e.target.value)}
              style={{ ...inputStyle, width: 70 }}
            />
          </label>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !label.trim()}>
            {editingId ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </div>
      )}

      {loading ? (
        <EmptyRow text="Cargando..." />
      ) : rows.length ? (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          renderCell={(row, key) => {
            if (key === 'label')
              return <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.label}</span>;
            if (key === 'schedule')
              return row.reminder_type === 'monthly'
                ? `Día ${row.day_of_month} de cada mes`
                : `${fmtDate(row.reminder_date)} (una vez)`;
            if (key === 'next_due_date') return fmtDate(row.next_due_date);
            if (key === 'status') {
              if (row.is_pending) return <Badge tone="caution">Mostrando ahora</Badge>;
              const isPastOneTime =
                row.reminder_type === 'one_time' &&
                row.next_due_date &&
                row.next_due_date < new Date().toISOString().slice(0, 10);
              return isPastOneTime ? <Badge tone="neutral">Completado</Badge> : <Badge tone="neutral">En espera</Badge>;
            }
            if (key === 'actions')
              return (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  {row.is_pending && (
                    <IconButton
                      icon={Check}
                      title="Marcar como hecho"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(row.id)}
                    />
                  )}
                  <IconButton icon={Pencil} title="Editar" size="sm" variant="ghost" onClick={() => startEdit(row)} />
                  <IconButton icon={X} title="Eliminar" size="sm" variant="ghost" onClick={() => handleVoid(row.id)} />
                </div>
              );
            return row[key];
          }}
        />
      ) : (
        <EmptyRow text="Sin recordatorios programados." />
      )}
    </Card>
  );
};

export default CustomRemindersPanel;
