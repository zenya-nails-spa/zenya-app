import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import { applyTheme } from '../App';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';
import Select from '../components/ui/select';
import SegmentedControl from '../components/ui/segmented-control';

const inputStyle = {
  height: 38,
  padding: '0 12px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-body)',
  background: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  width: '100%',
};

const labelStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--fw-semibold)',
  color: 'var(--text-secondary)',
  letterSpacing: '0.02em',
  display: 'block',
  marginBottom: 5,
};

const Field = ({ label, value, onChange, type = 'text' }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
  </div>
);

const SaveStatus = ({ status }) => {
  if (!status) return null;
  const map = {
    saving: { color: 'var(--text-muted)', text: 'Guardando…' },
    saved: { color: 'var(--green-600)', text: '✓ Guardado' },
    error: { color: 'var(--red-500)', text: 'Error al guardar' },
  };
  const s = map[status];
  return <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: s.color }}>{s.text}</span>;
};

const TABS = [
  { value: 'negocio', label: 'Negocio' },
  { value: 'cuenta', label: 'Cuenta' },
  { value: 'preferencias', label: 'Preferencias' },
];

const Settings = () => {
  const [tab, setTab] = useState('negocio');

  const { data: bpData } = useApi(() => api.businessProfile(), []);
  const [bp, setBp] = useState({ name: '', phone: '', email: '', website: '', address: '' });
  const [bpStatus, setBpStatus] = useState(null);

  useEffect(() => {
    if (bpData) {
      setBp({
        name: bpData.name ?? '',
        phone: bpData.phone ?? '',
        email: bpData.email ?? '',
        website: bpData.website ?? '',
        address: bpData.address ?? '',
      });
    }
  }, [bpData]);

  const saveBp = async () => {
    setBpStatus('saving');
    try {
      await api.updateBusinessProfile(bp);
      setBpStatus('saved');
      setTimeout(() => setBpStatus(null), 3000);
    } catch {
      setBpStatus('error');
    }
  };

  const { data: meData } = useApi(() => api.userProfile(), []);
  const [me, setMe] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [meStatus, setMeStatus] = useState(null);

  useEffect(() => {
    if (meData) {
      setMe({
        first_name: meData.first_name ?? '',
        last_name: meData.last_name ?? '',
        email: meData.email ?? '',
        phone: meData.phone ?? '',
      });
    }
  }, [meData]);

  const saveMe = async () => {
    setMeStatus('saving');
    try {
      await api.updateUserProfile(me);
      setMeStatus('saved');
      setTimeout(() => setMeStatus(null), 3000);
    } catch {
      setMeStatus('error');
    }
  };

  const { data: profData } = useApi(() => api.professionals(), []);
  const profs = (profData ?? []).map((p) => ({
    ...p,
    fullName: [p.first_name, p.last_name].filter(Boolean).join(' ') || `Profesional ${p.id}`,
  }));

  const [theme, setTheme] = useState(() => localStorage.getItem('zenya-theme') || 'light');

  const handleTheme = (t) => {
    setTheme(t);
    applyTheme(t);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} size="md" />
      </div>

      {tab === 'negocio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Negocio" title="Información del spa">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Nombre del negocio" value={bp.name} onChange={(v) => setBp({ ...bp, name: v })} />
              <Field label="Teléfono" value={bp.phone} type="tel" onChange={(v) => setBp({ ...bp, phone: v })} />
              <Field
                label="Email de contacto"
                value={bp.email}
                type="email"
                onChange={(v) => setBp({ ...bp, email: v })}
              />
              <Field label="Sitio web" value={bp.website} onChange={(v) => setBp({ ...bp, website: v })} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Dirección" value={bp.address} onChange={(v) => setBp({ ...bp, address: v })} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <SaveStatus status={bpStatus} />
              <Button variant="primary" size="md" onClick={saveBp} disabled={bpStatus === 'saving'}>
                Guardar cambios
              </Button>
            </div>
          </Card>

          <Card eyebrow="Horario" title="Días y horas de servicio">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                <div
                  key={day}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < 6 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-body)',
                        width: 80,
                      }}
                    >
                      {day}
                    </span>
                    <Badge tone={i < 6 ? 'positive' : 'neutral'} dot={i < 6}>
                      {i < 6 ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </div>
                  {i < 6 && (
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {i === 5 ? '10:00 – 18:00' : '9:00 – 19:00'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card eyebrow="Personal" title="Equipo">
            {profs.length === 0 ? (
              <div
                style={{
                  padding: '16px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Cargando equipo…
              </div>
            ) : (
              profs.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: i < profs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <Avatar name={p.fullName} size="sm" tone={i === 0 ? 'rose' : i === 1 ? 'lavender' : 'ink'} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--fw-medium)',
                        color: 'var(--text-heading)',
                      }}
                    >
                      {p.fullName}
                    </div>
                  </div>
                  <Badge tone="positive" dot>
                    Activa
                  </Badge>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {tab === 'cuenta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Perfil" title="Mi cuenta">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar
                name={[me.first_name, me.last_name].filter(Boolean).join(' ') || 'Z'}
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
                  {[me.first_name, me.last_name].filter(Boolean).join(' ') || 'Tu nombre'}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  Propietaria &middot; {bp.name || 'Zenya Nails & Spa'}
                </div>
                <Badge tone="rose" style={{ marginTop: 6 }}>
                  Dueña
                </Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Nombre" value={me.first_name} onChange={(v) => setMe({ ...me, first_name: v })} />
              <Field label="Apellido" value={me.last_name} onChange={(v) => setMe({ ...me, last_name: v })} />
              <Field label="Email" value={me.email} type="email" onChange={(v) => setMe({ ...me, email: v })} />
              <Field label="Teléfono" value={me.phone} type="tel" onChange={(v) => setMe({ ...me, phone: v })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <SaveStatus status={meStatus} />
              <Button variant="primary" size="md" onClick={saveMe} disabled={meStatus === 'saving'}>
                Guardar cambios
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'preferencias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Apariencia" title="Tema">
            <div>
              <div style={labelStyle}>TEMA</div>
              <SegmentedControl
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'auto', label: 'Sistema' },
                ]}
                value={theme}
                onChange={handleTheme}
                size="md"
              />
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  margin: '10px 0 0',
                }}
              >
                {theme === 'auto'
                  ? 'Sigue la preferencia de tu dispositivo'
                  : theme === 'dark'
                    ? 'Tema oscuro activo'
                    : 'Tema claro activo'}
              </p>
            </div>
          </Card>

          <Card eyebrow="Regional" title="Idioma y moneda">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Select
                label="IDIOMA"
                value="es"
                onChange={() => {}}
                options={[
                  { value: 'es', label: 'Español (MX)' },
                  { value: 'en', label: 'English' },
                ]}
              />
              <Select
                label="MONEDA"
                value="MXN"
                onChange={() => {}}
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
