import { useState, useEffect, useRef } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const PRESETS = [
  {
    label: 'Hoy',
    get() {
      const t = todayIso();
      return { from_date: t, to_date: t };
    },
  },
  {
    label: 'Esta semana',
    get() {
      const now = new Date();
      const dow = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dow + 1);
      return { from_date: monday.toISOString().slice(0, 10), to_date: todayIso() };
    },
  },
  {
    label: 'Este mes',
    get() {
      const now = new Date();
      return {
        from_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
        to_date: todayIso(),
      };
    },
  },
  {
    label: 'Este trimestre',
    get() {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      return {
        from_date: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10),
        to_date: todayIso(),
      };
    },
  },
  {
    label: 'Este año',
    get() {
      const now = new Date();
      return {
        from_date: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
        to_date: todayIso(),
      };
    },
  },
];

const INPUT_STYLE = {
  display: 'block',
  marginTop: 4,
  width: '100%',
  padding: '5px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-page)',
  color: 'var(--text-body)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  boxSizing: 'border-box',
};

const DateRangePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [activePreset, setActivePreset] = useState('Este mes');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const applyPreset = (preset) => {
    const range = preset.get();
    setDraft(range);
    setActivePreset(preset.label);
    onChange(range);
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draft.from_date || !draft.to_date) return;
    setActivePreset(null);
    onChange(draft);
    setOpen(false);
  };

  const rangeLabel =
    value.from_date === value.to_date
      ? fmtDate(value.from_date)
      : `${fmtDate(value.from_date)} – ${fmtDate(value.to_date)}`;

  const triggerLabel = activePreset ? `${activePreset} · ${rangeLabel}` : rangeLabel;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          background: open ? 'var(--surface-page)' : 'var(--surface-card)',
          color: 'var(--text-body)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background var(--dur-fast)',
        }}
      >
        <CalendarDays size={14} strokeWidth={1.7} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        {triggerLabel}
        <ChevronDown
          size={13}
          strokeWidth={1.7}
          style={{
            color: 'var(--text-muted)',
            marginLeft: 2,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--dur-fast)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 200,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: 14,
            minWidth: 240,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {PRESETS.map((p) => {
              const active = activePreset === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    background: active ? 'var(--brand-primary)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-body)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 12 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <label
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                display: 'block',
              }}
            >
              Desde
              <input
                type="date"
                value={draft.from_date}
                max={draft.to_date}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, from_date: e.target.value }));
                  setActivePreset(null);
                }}
                style={INPUT_STYLE}
              />
            </label>
            <label
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                display: 'block',
              }}
            >
              Hasta
              <input
                type="date"
                value={draft.to_date}
                min={draft.from_date}
                max={todayIso()}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, to_date: e.target.value }));
                  setActivePreset(null);
                }}
                style={INPUT_STYLE}
              />
            </label>
          </div>

          <button
            onClick={applyCustom}
            style={{
              width: '100%',
              padding: '6px 0',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--brand-primary)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-medium)',
              cursor: 'pointer',
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
