import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/use-api';
import Card from '../ui/card';
import Badge from '../ui/badge';
import Button from '../ui/button';
import IconButton from '../ui/icon-button';
import Select from '../ui/select';
import StatCard from './stat-card';
import DataTable from './data-table';

const CATEGORY_LABELS = {
  servicio: 'Servicio',
  atencion: 'Atención',
  tiempo_espera: 'Tiempo de espera',
  precio: 'Precio',
  producto: 'Producto',
  otro: 'Otro',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

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

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Self-contained so it doesn't have to become a shared component just for
// this one form -- types a name, picks from the dropdown, done.
const ClientPicker = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data: matches } = useApi(
    () => (query.trim().length >= 2 ? api.clients({ search: query.trim(), limit: 8 }) : Promise.resolve([])),
    [query]
  );

  if (value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Badge tone="lavender" size="sm">
          {value.name}
        </Badge>
        <IconButton icon={X} title="Cambiar clienta" size="sm" variant="ghost" onClick={() => onChange(null)} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar clienta..."
        style={{ ...inputStyle, width: 220 }}
      />
      {open && query.trim().length >= 2 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            marginTop: 4,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-md)',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {(matches ?? []).length ? (
            matches.map((c) => {
              const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || `Clienta ${c.id}`;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange({ id: c.id, name });
                    setQuery('');
                    setOpen(false);
                  }}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    display: 'block',
                    width: '100%',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-body)',
                  }}
                >
                  {name}
                </button>
              );
            })
          ) : (
            <div
              style={{
                padding: '8px 10px',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              Sin resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ActionTakenCell = ({ complaint, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await api.updateClientComplaint(complaint.id, { action_taken: draft.trim() });
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (complaint.action_taken) return <span>{complaint.action_taken}</span>;

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', minWidth: 200 }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="¿Qué se hizo?"
          style={{ ...inputStyle, flex: 1, padding: '4px 8px' }}
        />
        <IconButton icon={Check} title="Guardar" size="sm" variant="ghost" onClick={handleSave} disabled={saving} />
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
      Agregar acción
    </Button>
  );
};

const ClientComplaintsPanel = ({ dateRange, onChangeFlagged }) => {
  const [showForm, setShowForm] = useState(false);
  const [client, setClient] = useState(null);
  const [complaintDate, setComplaintDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('servicio');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [complaints, setComplaints] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [list, summaryData] = await Promise.all([
      api.clientComplaints({ from_date: dateRange.from_date, to_date: dateRange.to_date }),
      api.clientComplaintsSummary(dateRange),
    ]);
    setComplaints(list ?? []);
    setSummary(summaryData);
    setLoading(false);
    onChangeFlagged?.();
  }, [dateRange.from_date, dateRange.to_date, onChangeFlagged]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setClient(null);
    setComplaintDate(new Date().toISOString().slice(0, 10));
    setCategory('servicio');
    setNote('');
  };

  const handleSubmit = async () => {
    if (!client || !note.trim()) return;
    setSaving(true);
    try {
      await api.createClientComplaint({
        client_id: client.id,
        complaint_date: complaintDate,
        category,
        note: note.trim(),
      });
      resetForm();
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async (id) => {
    await api.updateClientComplaint(id, { active: false });
    load();
  };

  const topCategory = summary?.by_category?.[0];

  const columns = [
    { key: 'complaint_date', label: 'Fecha' },
    { key: 'client_name', label: 'Clienta' },
    { key: 'category', label: 'Categoría' },
    { key: 'note', label: 'Queja' },
    { key: 'action_taken', label: 'Acción tomada' },
    { key: 'rebooked', label: '¿Volvió?', align: 'center' },
    { key: 'actions', label: '', align: 'right' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Quejas"
          value={summary ? String(summary.total) : '—'}
          caption="en el periodo"
          icon="AlertTriangle"
          numeralStyle="sans"
        />
        <StatCard
          label="Sin resolver"
          value={summary ? String(summary.unresolved) : '—'}
          caption="sin acción registrada"
          icon="Clock"
          numeralStyle="sans"
        />
        <StatCard
          label="Volvieron a agendar"
          value={summary?.rebooked_pct != null ? `${summary.rebooked_pct}%` : '—'}
          caption={summary ? `${summary.rebooked_count} de ${summary.total}` : '—'}
          icon="RefreshCw"
          numeralStyle="sans"
        />
        <StatCard
          label="Más recurrente"
          value={topCategory ? (CATEGORY_LABELS[topCategory.category] ?? topCategory.category) : '—'}
          caption={topCategory ? `${topCategory.count} quejas` : 'sin datos'}
          icon="TrendingUp"
          numeralStyle="sans"
        />
      </div>

      <Card
        eyebrow="Registro"
        title="Quejas de clientas"
        info="Toda queja registrada, con la fecha, categoría y qué se hizo para resolverla. '¿Volvió?' indica si la clienta agendó una cita después de la fecha de la queja."
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
              <span style={labelStyle}>Clienta</span>
              <ClientPicker value={client} onChange={setClient} />
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>Fecha</span>
              <input
                type="date"
                value={complaintDate}
                onChange={(e) => setComplaintDate(e.target.value)}
                style={inputStyle}
              />
            </label>
            <Select label="Categoría" value={category} onChange={setCategory} size="sm" options={CATEGORY_OPTIONS} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 220 }}>
              <span style={labelStyle}>Queja</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={inputStyle}
                placeholder="¿Qué pasó?"
              />
            </label>
            <Button size="sm" onClick={handleSubmit} disabled={saving || !client || !note.trim()}>
              Guardar
            </Button>
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: '16px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Cargando...
          </div>
        ) : complaints?.length ? (
          <DataTable
            columns={columns}
            rows={complaints}
            renderCell={(row, key) => {
              if (key === 'complaint_date') return fmtDate(row.complaint_date);
              if (key === 'client_name')
                return [row.client_first_name, row.client_last_name].filter(Boolean).join(' ').trim() || '—';
              if (key === 'category')
                return (
                  <Badge tone="caution" size="sm">
                    {CATEGORY_LABELS[row.category] ?? row.category}
                  </Badge>
                );
              if (key === 'note') return row.note;
              if (key === 'action_taken') return <ActionTakenCell complaint={row} onSaved={load} />;
              if (key === 'rebooked')
                return row.rebooked ? (
                  <Badge tone="positive" size="sm" dot>
                    Sí
                  </Badge>
                ) : (
                  <Badge tone="neutral" size="sm">
                    No
                  </Badge>
                );
              if (key === 'actions')
                return (
                  <IconButton icon={X} title="Anular" size="sm" variant="ghost" onClick={() => handleVoid(row.id)} />
                );
              return row[key];
            }}
          />
        ) : (
          <div
            style={{
              padding: '16px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Sin quejas registradas en este periodo.
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClientComplaintsPanel;
