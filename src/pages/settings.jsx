import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';
import Select from '../components/ui/select';
import SegmentedControl from '../components/ui/segmented-control';

/* ── helpers ─────────────────────────────────────────────────────────── */

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DEFAULT_SCHEDULE = DAYS.map((day, i) => ({
  day,
  open: i < 6,
  from: i === 5 ? '10:00' : '09:00',
  to: i === 5 ? '18:00' : '19:00',
}));

async function save(setStatus, fn) {
  setStatus('saving');
  try {
    await fn();
    setStatus('saved');
    setTimeout(() => setStatus(null), 2500);
  } catch {
    setStatus('error');
  }
}

/* ── sub-components ───────────────────────────────────────────────────── */

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: 42,
      height: 24,
      borderRadius: 12,
      background: checked ? 'var(--brand-primary)' : 'var(--ink-200)',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      flexShrink: 0,
      transition: 'background var(--dur-fast) var(--ease-soft)',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: checked ? 20 : 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-xs)',
        transition: 'left var(--dur-fast) var(--ease-soft)',
      }}
    />
  </button>
);

const FieldRow = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--fw-semibold)',
        color: 'var(--text-secondary)',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        height: 38,
        padding: '0 12px',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-body)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        outline: 'none',
      }}
    />
  </div>
);

const SaveRow = ({ status, label = 'Guardar cambios', onSave }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
    {status === 'saved' && (
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--green-600)' }}>
        ✓ Guardado
      </span>
    )}
    {status === 'error' && (
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--red-600)' }}>
        Error al guardar
      </span>
    )}
    <Button variant="primary" size="md" onClick={onSave} disabled={status === 'saving'}>
      {status === 'saving' ? 'Guardando…' : label}
    </Button>
  </div>
);

const TIME_INPUT = {
  height: 34,
  padding: '0 8px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-body)',
  background: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm)',
  width: 94,
};

/* ── TABS ─────────────────────────────────────────────────────────────── */

const TABS = [
  { value: 'negocio', label: 'Negocio' },
  { value: 'cuenta', label: 'Cuenta' },
  { value: 'preferencias', label: 'Preferencias' },
];

/* ── main component ───────────────────────────────────────────────────── */

const Settings = () => {
  const [tab, setTab] = useState('negocio');

  /* spa info */
  const [spa, setSpa] = useState({ nombre: '', telefono: '', email: '', web: '', direccion: '' });
  const [spaStatus, setSpaStatus] = useState(null);
  const { data: spaData } = useApi(() => api.businessProfile(), []);

  useEffect(() => {
    if (!spaData) return;
    setSpa({
      nombre: spaData.nombre ?? spaData.name ?? '',
      telefono: spaData.telefono ?? spaData.phone ?? '',
      email: spaData.email ?? '',
      web: spaData.web ?? spaData.website ?? '',
      direccion: spaData.direccion ?? spaData.address ?? '',
    });
  }, [spaData]);

  const saveSpa = () =>
    save(setSpaStatus, () =>
      api.updateBusinessProfile({
        name: spa.nombre,
        phone: spa.telefono,
        email: spa.email,
        website: spa.web,
        address: spa.direccion,
      })
    );

  /* schedule */
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [scheduleStatus, setScheduleStatus] = useState(null);
  const { data: hoursData } = useApi(() => api.businessHours(), []);

  useEffect(() => {
    if (!hoursData) return;
    setSchedule(
      DAYS.map((day, i) => {
        const row = hoursData.find((h) => h.day === day || h.day_name === day);
        return row
          ? {
              day,
              open: row.open ?? row.is_open ?? true,
              from: row.from ?? row.open_time ?? '09:00',
              to: row.to ?? row.close_time ?? '19:00',
            }
          : DEFAULT_SCHEDULE[i];
      })
    );
  }, [hoursData]);

  const updateDay = (i, patch) => setSchedule((s) => s.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const saveSchedule = () => save(setScheduleStatus, () => api.updateBusinessHours(schedule));

  /* staff */
  const { data: profData } = useApi(() => api.professionals(), []);
  const staff = profData ?? [];

  /* profile */
  const [profile, setProfile] = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [profileStatus, setProfileStatus] = useState(null);
  const { data: profileData } = useApi(() => api.userProfile(), []);

  useEffect(() => {
    if (!profileData) return;
    setProfile({
      nombre: profileData.first_name ?? profileData.nombre ?? '',
      apellido: profileData.last_name ?? profileData.apellido ?? '',
      email: profileData.email ?? '',
      telefono: profileData.phone ?? profileData.telefono ?? '',
    });
  }, [profileData]);

  const saveProfile = () =>
    save(setProfileStatus, () =>
      api.updateUserProfile({
        first_name: profile.nombre,
        last_name: profile.apellido,
        email: profile.email,
        phone: profile.telefono,
      })
    );

  /* password */
  const [pwd, setPwd] = useState({ current: '', nuevo: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState(null);
  const [pwdError, setPwdError] = useState('');

  const savePassword = () => {
    if (pwd.nuevo !== pwd.confirm) {
      setPwdError('Las contraseñas no coinciden');
      return;
    }
    if (pwd.nuevo.length < 8) {
      setPwdError('Mínimo 8 caracteres');
      return;
    }
    setPwdError('');
    save(setPwdStatus, () => api.changePassword({ current_password: pwd.current, new_password: pwd.nuevo })).then(() =>
      setPwd({ current: '', nuevo: '', confirm: '' })
    );
  };

  /* preferences */
  const [currency, setCurrency] = useState('MXN');
  const [lang, setLang] = useState('es');
  const [theme, setTheme] = useState('light');

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} size="md" />
      </div>

      {/* ── NEGOCIO ─────────────────────────────────────────────────────── */}
      {tab === 'negocio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Negocio" title="Información del spa">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldRow
                label="Nombre del negocio"
                value={spa.nombre}
                onChange={(v) => setSpa((s) => ({ ...s, nombre: v }))}
                placeholder="Zenya Nails & Spa"
              />
              <FieldRow
                label="Teléfono"
                value={spa.telefono}
                onChange={(v) => setSpa((s) => ({ ...s, telefono: v }))}
                type="tel"
                placeholder="+52 55 0000 0000"
              />
              <FieldRow
                label="Email de contacto"
                value={spa.email}
                onChange={(v) => setSpa((s) => ({ ...s, email: v }))}
                type="email"
                placeholder="hola@zenya.mx"
              />
              <FieldRow
                label="Sitio web"
                value={spa.web}
                onChange={(v) => setSpa((s) => ({ ...s, web: v }))}
                placeholder="www.zenya.mx"
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <FieldRow
                  label="Dirección"
                  value={spa.direccion}
                  onChange={(v) => setSpa((s) => ({ ...s, direccion: v }))}
                  placeholder="Av. Álvaro Obregón 123, Col. Roma Norte, CDMX"
                />
              </div>
            </div>
            <SaveRow status={spaStatus} onSave={saveSpa} />
          </Card>

          <Card eyebrow="Horario" title="Días y horario de servicio">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {schedule.map((row, i) => (
                <div
                  key={row.day}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: i < 6 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-body)',
                      width: 88,
                      flexShrink: 0,
                    }}
                  >
                    {row.day}
                  </span>
                  <ToggleSwitch checked={row.open} onChange={(v) => updateDay(i, { open: v })} />
                  {row.open ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="time"
                        value={row.from}
                        onChange={(e) => updateDay(i, { from: e.target.value })}
                        style={TIME_INPUT}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        —
                      </span>
                      <input
                        type="time"
                        value={row.to}
                        onChange={(e) => updateDay(i, { to: e.target.value })}
                        style={TIME_INPUT}
                      />
                    </div>
                  ) : (
                    <Badge tone="neutral">Cerrado</Badge>
                  )}
                </div>
              ))}
            </div>
            <SaveRow status={scheduleStatus} onSave={saveSchedule} />
          </Card>

          <Card eyebrow="Personal" title="Equipo">
            {staff.length ? (
              staff.map((s, i) => {
                const name =
                  [s.first_name, s.last_name].filter(Boolean).join(' ') || `Profesional ${s.professional_id}`;
                return (
                  <div
                    key={s.professional_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: i < staff.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <Avatar name={name} size="sm" tone={i === 0 ? 'rose' : i === 1 ? 'lavender' : 'ink'} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--fw-medium)',
                          color: 'var(--text-heading)',
                        }}
                      >
                        {name}
                      </div>
                      {s.role && (
                        <div
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {s.role}
                        </div>
                      )}
                    </div>
                    <Badge tone="positive" dot>
                      Activa
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </div>
                );
              })
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
                Sin personal registrado
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Button variant="secondary" size="sm">
                + Agregar empleada
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── CUENTA ──────────────────────────────────────────────────────── */}
      {tab === 'cuenta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Perfil" title="Mi cuenta">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar
                name={[profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Usuario'}
                size="lg"
                tone="rose"
                ring
              />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    color: 'var(--text-heading)',
                  }}
                >
                  {[profile.nombre, profile.apellido].filter(Boolean).join(' ') || '—'}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  Propietaria · Zenya Nails &amp; Spa
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldRow
                label="Nombre"
                value={profile.nombre}
                onChange={(v) => setProfile((p) => ({ ...p, nombre: v }))}
              />
              <FieldRow
                label="Apellido"
                value={profile.apellido}
                onChange={(v) => setProfile((p) => ({ ...p, apellido: v }))}
              />
              <FieldRow
                label="Email"
                value={profile.email}
                onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
                type="email"
              />
              <FieldRow
                label="Teléfono"
                value={profile.telefono}
                onChange={(v) => setProfile((p) => ({ ...p, telefono: v }))}
                type="tel"
              />
            </div>
            <SaveRow status={profileStatus} onSave={saveProfile} />
          </Card>

          <Card eyebrow="Seguridad" title="Contraseña y acceso">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FieldRow
                label="Contraseña actual"
                value={pwd.current}
                onChange={(v) => setPwd((p) => ({ ...p, current: v }))}
                type="password"
              />
              <FieldRow
                label="Nueva contraseña"
                value={pwd.nuevo}
                onChange={(v) => setPwd((p) => ({ ...p, nuevo: v }))}
                type="password"
              />
              <FieldRow
                label="Confirmar nueva contraseña"
                value={pwd.confirm}
                onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))}
                type="password"
              />
              {pwdError && (
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--red-600)',
                  }}
                >
                  {pwdError}
                </span>
              )}
              <SaveRow status={pwdStatus} label="Cambiar contraseña" onSave={savePassword} />
            </div>
          </Card>
        </div>
      )}

      {/* ── PREFERENCIAS ────────────────────────────────────────────────── */}
      {tab === 'preferencias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Apariencia" title="Tema y visualización">
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  letterSpacing: '0.02em',
                }}
              >
                TEMA
              </div>
              <SegmentedControl
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'auto', label: 'Sistema' },
                ]}
                value={theme}
                onChange={setTheme}
                size="md"
              />
            </div>
          </Card>

          <Card eyebrow="Regional" title="Idioma y moneda">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Select
                label="IDIOMA"
                value={lang}
                onChange={setLang}
                options={[
                  { value: 'es', label: 'Español (MX)' },
                  { value: 'en', label: 'English' },
                ]}
              />
              <Select
                label="MONEDA"
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: 'MXN', label: 'MXN – Peso mexicano' },
                  { value: 'USD', label: 'USD – Dólar' },
                ]}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
