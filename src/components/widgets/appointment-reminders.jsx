import { useState, useEffect } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import { api } from '../../lib/api';
import { isAdmin } from '../../lib/auth';
import { buildWhatsappUrl, TEST_RECIPIENTS } from '../../lib/whatsapp';
import Card from '../ui/card';
import Badge from '../ui/badge';
import Button from '../ui/button';
import IconButton from '../ui/icon-button';
import Avatar from '../ui/avatar';
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

const DEFAULT_TEMPLATE = `¡Hola! ☺️🌸 te recordamos que tienes una cita con nosotras:

{detalle_cita}

Por favor, cualquier cambio o cancelación te pedimos hacerlo con al menos 2 horas de anticipación, ya que preparamos todo el espacio especialmente para consentirte 💅💕

Agradeceríamos mucho si nos ayudas confirmando este mensaje para tener todo listo para ti 🌸

¡Te esperamos! ☺️🎀

Zenya Nails & Spa 🌸`;

function formatFecha(targetDateStr) {
  if (!targetDateStr) return '';
  const [y, m, d] = targetDateStr.split('-');
  return `${d}/${m}/${y}`;
}

function buildDetalleCita(appointments, targetDate) {
  const lines = [`📅 Fecha: ${formatFecha(targetDate)}`];
  (appointments ?? []).forEach((a) => {
    lines.push(`⏰ Hora: ${a.time}`);
    lines.push(`💗 Servicio: ${a.service_name ?? 'Servicio'}`);
  });
  return lines.join('\n');
}

function fillReminderTemplate(body, detalleCita, firstName) {
  const name = (firstName || '').trim().split(/\s+/)[0] || '';
  return (body || '').replaceAll('{detalle_cita}', detalleCita).replaceAll('{nombre}', name);
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

const EmptyState = ({ text }) => (
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

function sampleDetalleCita() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  return buildDetalleCita([{ time: '12:00', service_name: 'Manicure de prueba' }], dateStr);
}

const REMINDER_COLS = [
  { key: 'name', label: 'Clienta' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'citas', label: 'Citas de mañana' },
  { key: 'estado', label: 'Estado' },
  { key: 'accion', label: '', align: 'right' },
];

const AppointmentReminders = () => {
  const [template, setTemplate] = useState(null); // the reminder template, or null if none exists yet
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(DEFAULT_TEMPLATE);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [targetDate, setTargetDate] = useState(null);
  const [clients, setClients] = useState([]);
  const [syncMessage, setSyncMessage] = useState(null); // { type: 'info' | 'error', text }
  const [testRecipient, setTestRecipient] = useState(TEST_RECIPIENTS[0].phone);

  const handleTestSend = (urlBuilder) => {
    if (!template) return;
    const recipient = TEST_RECIPIENTS.find((r) => r.phone === testRecipient) ?? TEST_RECIPIENTS[0];
    const message = fillReminderTemplate(template.body, sampleDetalleCita(), recipient.name);
    window.open(urlBuilder(recipient.phone, message), '_blank', 'noopener');
  };

  const loadTemplate = async () => {
    const found = await api.whatsappTemplates({ category: 'reminder' });
    let current = found?.[0] ?? null;
    // Auto-seed with the default text on first-ever load so the test-send
    // and edit controls (which need a real template to fill in) are there
    // right away, instead of forcing an explicit "Crear plantilla" step.
    // Skipped for non-admins -- their key can't create templates, and by
    // the time a recepcionista account exists this category already has
    // one anyway.
    if (!current && isAdmin()) {
      current = await api.createWhatsappTemplate({
        name: 'Recordatorio de cita',
        body: DEFAULT_TEMPLATE,
        category: 'reminder',
      });
    }
    setTemplate(current);
    setDraftBody(current?.body ?? DEFAULT_TEMPLATE);
    setTemplateLoaded(true);
    return current;
  };

  useEffect(() => {
    loadTemplate();
  }, []);

  const mapClients = (rawClients) =>
    (rawClients ?? []).map((c) => ({
      ...c,
      // A brand-new client's booking can sync before her client record does
      // (separate daily syncs) — show something identifiable instead of "—".
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || `Clienta nueva #${c.client_id}`,
    }));

  // Reads whatever the shared backend currently has — no AgendaPro pull, just
  // the local (shared, MySQL-backed) state — so every browser shows the same
  // list on load. Syncing from one device should be visible on every other
  // device on refresh, not just cached per-browser via localStorage.
  useEffect(() => {
    (async () => {
      try {
        const data = await api.appointmentReminders({ live_sync: false });
        setTargetDate(data.target_date);
        setClients(mapClients(data.clients));
        setSynced(true);
      } catch {
        // leave unsynced — the manual "Sincronizar" button still works
      }
    })();
  }, []);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      if (template) {
        const updated = await api.updateWhatsappTemplate(template.id, { body: draftBody });
        setTemplate(updated);
      } else {
        const created = await api.createWhatsappTemplate({
          name: 'Recordatorio de cita',
          body: draftBody,
          category: 'reminder',
        });
        setTemplate(created);
      }
      setEditing(false);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const currentTemplate = templateLoaded ? template : await loadTemplate();
      // Pulls fresh data from AgendaPro first, server-side — this call can take a while.
      const data = await api.appointmentReminders({ live_sync: true });
      const freshClients = mapClients(data.clients);

      // Anyone who was here before but isn't anymore got cancelled/moved off
      // tomorrow — the fresh list from the server already reflects that, we
      // just diff against what was showing to report how many are new.
      const previousIds = new Set(clients.map((c) => c.client_id));
      const newCount = freshClients.filter((c) => !previousIds.has(c.client_id)).length;

      setTargetDate(data.target_date);
      setClients(freshClients);
      setSynced(true);
      setSyncMessage({
        type: 'info',
        text:
          newCount > 0
            ? `${newCount} clienta${newCount === 1 ? '' : 's'} nueva${newCount === 1 ? '' : 's'} encontrada${newCount === 1 ? '' : 's'}`
            : 'No se encontraron clientas nuevas',
      });
      return currentTemplate;
    } catch (err) {
      setSyncMessage({ type: 'error', text: 'No se pudo sincronizar con AgendaPro. Intenta de nuevo.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSend = async (client) => {
    if (!template || !client.phone) return;
    const detalle = buildDetalleCita(client.appointments, targetDate);
    const message = fillReminderTemplate(template.body, detalle, client.first_name);
    window.open(buildWhatsappUrl(client.phone, message), '_blank', 'noopener');
    await api.createWhatsappSend({ client_id: client.client_id, template_id: template.id });
    setClients((prev) =>
      prev.map((c) =>
        c.client_id === client.client_id ? { ...c, reminder_sent: true, reminder_sent_at: new Date().toISOString() } : c
      )
    );
  };

  return (
    <>
      <Card
        eyebrow="WhatsApp"
        title="Plantilla de recordatorio"
        info="Se manda la noche antes de la cita. Usa {detalle_cita} para el bloque de fecha/hora/servicio (se genera solo, incluyendo todas las citas si la clienta tiene más de una) y {nombre} para su primer nombre. El botón de prueba manda un mensaje de ejemplo a Bety o Carlos por WhatsApp Web para revisar cómo se ve antes de mandarlo de verdad."
        action={
          !editing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {template && (
                <>
                  <select
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    style={{ ...inputStyle, padding: '4px 8px', height: 30, fontSize: 'var(--text-xs)' }}
                  >
                    {TEST_RECIPIENTS.map((r) => (
                      <option key={r.phone} value={r.phone}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <IconButton
                    icon={Send}
                    size="sm"
                    variant="outline"
                    title="Enviar mensaje de prueba"
                    onClick={() => handleTestSend(buildWhatsappUrl)}
                  />
                </>
              )}
              {isAdmin() && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (!templateLoaded) await loadTemplate();
                    setEditing(true);
                  }}
                >
                  {template ? 'Editar' : 'Crear plantilla'}
                </Button>
              )}
            </div>
          )
        }
      >
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={10}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftBody(template?.body ?? DEFAULT_TEMPLATE);
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveTemplate} disabled={savingTemplate}>
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {!templateLoaded ? 'Cargando...' : (template?.body ?? DEFAULT_TEMPLATE)}
          </div>
        )}
      </Card>

      <Card
        eyebrow="Citas"
        title="Recordatorios de mañana"
        info="Cada clic sincroniza con AgendaPro primero (puede tardar unos segundos) y luego trae las clientas con cita mañana, agrupando todas sus citas si tiene más de una. Si alguien canceló o movió su cita, desaparece sola de la lista. El estatus se actualiza en cuanto le das clic a enviar."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {syncMessage && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-sans)',
                  color: syncMessage.type === 'error' ? 'var(--negative)' : 'var(--text-muted)',
                }}
              >
                {syncMessage.text}
              </span>
            )}
            <Button variant="secondary" size="sm" iconLeft={RefreshCw} onClick={handleSync} disabled={syncing}>
              {syncing ? 'Sincronizando...' : 'Sincronizar clientas de mañana'}
            </Button>
          </div>
        }
      >
        {!synced ? (
          <EmptyState text="Da clic en “Sincronizar clientas de mañana” para ver las citas de mañana." />
        ) : clients.length > 0 ? (
          <DataTable
            columns={REMINDER_COLS}
            rows={clients}
            renderCell={(row, key) => {
              if (key === 'name')
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={row.name} size="sm" tone="ink" />
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.name}</span>
                  </div>
                );
              if (key === 'phone') return <span style={{ color: 'var(--text-secondary)' }}>{row.phone ?? '—'}</span>;
              if (key === 'citas')
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(row.appointments ?? []).map((a, i) => (
                      <span key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                        {a.time} — {a.service_name ?? 'Servicio'}
                      </span>
                    ))}
                  </div>
                );
              if (key === 'estado')
                return row.reminder_sent ? (
                  <span title={row.reminder_sent_at ? `Enviado ${fmtTime(row.reminder_sent_at)}` : 'Enviado'}>
                    <Badge tone="positive" size="sm" dot>
                      Enviado
                    </Badge>
                  </span>
                ) : (
                  <Badge tone="neutral" size="sm" dot>
                    Pendiente
                  </Badge>
                );
              if (key === 'accion')
                return (
                  <IconButton
                    icon={Send}
                    size="sm"
                    variant="soft"
                    title={
                      !row.phone
                        ? 'Sin teléfono todavía — probablemente es clienta nueva, sincroniza de nuevo en un rato'
                        : !template
                          ? 'Crea la plantilla primero'
                          : 'Enviar recordatorio'
                    }
                    disabled={!row.phone || !template}
                    onClick={() => handleSend(row)}
                  />
                );
              return row[key] ?? '—';
            }}
          />
        ) : (
          <EmptyState text="No hay citas para mañana." />
        )}
      </Card>
    </>
  );
};

export default AppointmentReminders;
