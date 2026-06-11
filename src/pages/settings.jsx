import { useState } from 'react';
import D from '../mocks/data';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';
import Select from '../components/ui/select';
import SegmentedControl from '../components/ui/segmented-control';

const Toggle = ({ checked, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
      {label}
    </span>
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
        transition: 'background var(--dur-fast) var(--ease-soft)',
        flexShrink: 0,
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
  </div>
);

const FieldRow = ({ label, value, type = 'text' }) => {
  const [val, setVal] = useState(value || '');
  return (
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
        value={val}
        onChange={(e) => setVal(e.target.value)}
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
};

const TABS = [
  { value: 'negocio', label: 'Negocio' },
  { value: 'cuenta', label: 'Cuenta' },
  { value: 'notificaciones', label: 'Notificaciones' },
  { value: 'preferencias', label: 'Preferencias' },
];

const Settings = () => {
  const [tab, setTab] = useState('negocio');
  const [notifs, setNotifs] = useState({
    newAppt: true,
    cancelAppt: true,
    payment: true,
    reminder24: true,
    reminder2h: false,
    weekReport: true,
    monthReport: true,
    newClient: false,
    reviews: true,
  });
  const [currency, setCurrency] = useState('MXN');
  const [lang, setLang] = useState('es');
  const [theme, setTheme] = useState('light');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} size="md" />
      </div>

      {tab === 'negocio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Negocio" title="Información del spa">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldRow label="Nombre del negocio" value="Zenya Nails & Spa" />
              <FieldRow label="Teléfono" value="+52 55 1234 5678" type="tel" />
              <FieldRow label="Email de contacto" value="hola@zenya.mx" type="email" />
              <FieldRow label="Sitio web" value="www.zenya.mx" />
              <div style={{ gridColumn: '1 / -1' }}>
                <FieldRow label="Dirección" value="Av. Álvaro Obregón 123, Col. Roma Norte, CDMX" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <Button variant="primary" size="md">
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
                      style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
                    >
                      {i === 5 ? '10:00 – 18:00' : '9:00 – 19:00'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card eyebrow="Personal" title="Equipo">
            {D.staff.map((s, i) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < D.staff.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <Avatar name={s.name} size="sm" tone={i === 0 ? 'rose' : i === 1 ? 'lavender' : 'ink'} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--fw-medium)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
                  >
                    {s.role}
                  </div>
                </div>
                <Badge tone="positive" dot>
                  Activa
                </Badge>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <Button variant="secondary" size="sm">
                + Agregar empleada
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'cuenta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Perfil" title="Mi cuenta">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar name="Valentina López" size="lg" tone="rose" ring />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    color: 'var(--text-heading)',
                  }}
                >
                  Valentina López
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  Propietaria · Zenya Nails &amp; Spa
                </div>
                <Badge tone="rose" style={{ marginTop: 6 }}>
                  Dueña
                </Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldRow label="Nombre" value="Valentina" />
              <FieldRow label="Apellido" value="López" />
              <FieldRow label="Email" value="valentina@zenya.mx" type="email" />
              <FieldRow label="Teléfono" value="+52 55 9876 5432" type="tel" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <Button variant="primary" size="md">
                Guardar cambios
              </Button>
            </div>
          </Card>

          <Card eyebrow="Seguridad" title="Contraseña y acceso">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FieldRow label="Contraseña actual" value="" type="password" />
              <FieldRow label="Nueva contraseña" value="" type="password" />
              <FieldRow label="Confirmar contraseña" value="" type="password" />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" size="md">
                  Cambiar contraseña
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'notificaciones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Citas" title="Notificaciones de citas">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 8,
              }}
            >
              <Toggle
                label="Nueva cita confirmada"
                checked={notifs.newAppt}
                onChange={(v) => setNotifs({ ...notifs, newAppt: v })}
              />
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Toggle
                  label="Cita cancelada"
                  checked={notifs.cancelAppt}
                  onChange={(v) => setNotifs({ ...notifs, cancelAppt: v })}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Toggle
                  label="Recordatorio 24 horas antes"
                  checked={notifs.reminder24}
                  onChange={(v) => setNotifs({ ...notifs, reminder24: v })}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Toggle
                  label="Recordatorio 2 horas antes"
                  checked={notifs.reminder2h}
                  onChange={(v) => setNotifs({ ...notifs, reminder2h: v })}
                />
              </div>
            </div>
          </Card>

          <Card eyebrow="Pagos" title="Notificaciones de pagos">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 8,
              }}
            >
              <Toggle
                label="Pago recibido"
                checked={notifs.payment}
                onChange={(v) => setNotifs({ ...notifs, payment: v })}
              />
            </div>
          </Card>

          <Card eyebrow="Reportes" title="Notificaciones de reportes">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 8,
              }}
            >
              <Toggle
                label="Reporte semanal"
                checked={notifs.weekReport}
                onChange={(v) => setNotifs({ ...notifs, weekReport: v })}
              />
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Toggle
                  label="Reporte mensual"
                  checked={notifs.monthReport}
                  onChange={(v) => setNotifs({ ...notifs, monthReport: v })}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Toggle
                  label="Nueva clienta registrada"
                  checked={notifs.newClient}
                  onChange={(v) => setNotifs({ ...notifs, newClient: v })}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Toggle
                  label="Reseñas y calificaciones"
                  checked={notifs.reviews}
                  onChange={(v) => setNotifs({ ...notifs, reviews: v })}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

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

          <Card eyebrow="Plan" title="Mi plan actual">
            <div
              style={{
                background: 'var(--lavender-50)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    color: 'var(--lavender-700)',
                    marginBottom: 4,
                  }}
                >
                  Plan Básico
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--lavender-700)',
                    opacity: 0.8,
                  }}
                >
                  Hasta 2 empleadas · 100 citas/mes · Reportes básicos
                </div>
              </div>
              <Button variant="primary" size="md" style={{ background: 'var(--lavender-700)', color: 'var(--white)' }}>
                Mejorar a Studio
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
