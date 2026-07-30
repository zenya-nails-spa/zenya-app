import { useState, useEffect } from 'react';
import { RefreshCw, Send, X } from 'lucide-react';
import { api } from '../../lib/api';
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

function fillTemplate(body, firstName) {
  const name = (firstName || '').trim().split(/\s+/)[0] || '';
  return (body || '').replaceAll('{nombre}', name);
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

// Generic "sync a candidate list, edit a template, send one by one" panel —
// shared by the retouch and new-client-feedback reminders (AppointmentReminders
// stays separate since it has the multi-appointment grouping these don't need).
const ReminderCampaignPanel = ({
  category,
  fetchClients,
  dateField,
  dateLabel,
  templateEyebrow,
  templateTitle,
  templateInfo,
  listEyebrow,
  listTitle,
  listInfo,
  syncButtonLabel,
  defaultTemplateName,
  defaultTemplateBody,
  emptyBeforeSyncText,
  emptyAfterSyncText,
  dismissable = false,
}) => {
  const [template, setTemplate] = useState(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(defaultTemplateBody);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clients, setClients] = useState([]);
  const [syncMessage, setSyncMessage] = useState(null); // { type: 'info' | 'error', text }
  const [testRecipient, setTestRecipient] = useState(TEST_RECIPIENTS[0].phone);

  const loadTemplate = async () => {
    const found = await api.whatsappTemplates({ category });
    let current = found?.[0] ?? null;
    // Auto-seed with the default text on first-ever load so the test-send
    // and edit controls (which need a real template to fill in) are there
    // right away, instead of forcing an explicit "Crear plantilla" step.
    if (!current) {
      current = await api.createWhatsappTemplate({
        name: defaultTemplateName,
        body: defaultTemplateBody,
        category,
      });
    }
    setTemplate(current);
    setDraftBody(current.body);
    setTemplateLoaded(true);
    return current;
  };

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line
  }, []);

  const mapClients = (rawClients) =>
    (rawClients ?? []).map((c) => ({
      ...c,
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || `Clienta nueva #${c.client_id}`,
    }));

  // Reads whatever the shared backend currently has — no AgendaPro pull, just
  // the local (shared, MySQL-backed) state — so every browser shows the same
  // list on load. Syncing from one device should be visible on every other
  // device on refresh, not just cached per-browser via localStorage.
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchClients({ live_sync: false });
        setClients(mapClients(data.clients));
        setSynced(true);
      } catch {
        // leave unsynced — the manual "Sincronizar" button still works
      }
    })();
    // eslint-disable-next-line
  }, []);

  const handleTestSend = () => {
    if (!template) return;
    const recipient = TEST_RECIPIENTS.find((r) => r.phone === testRecipient) ?? TEST_RECIPIENTS[0];
    const message = fillTemplate(template.body, recipient.name);
    window.open(buildWhatsappUrl(recipient.phone, message), '_blank', 'noopener');
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      if (template) {
        const updated = await api.updateWhatsappTemplate(template.id, { body: draftBody });
        setTemplate(updated);
      } else {
        const created = await api.createWhatsappTemplate({
          name: defaultTemplateName,
          body: draftBody,
          category,
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
      const data = await fetchClients({ live_sync: true });
      const freshClients = mapClients(data.clients);

      const previousIds = new Set(clients.map((c) => c.client_id));
      const newCount = freshClients.filter((c) => !previousIds.has(c.client_id)).length;

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
    const message = fillTemplate(template.body, client.first_name);
    window.open(buildWhatsappUrl(client.phone, message), '_blank', 'noopener');
    await api.createWhatsappSend({ client_id: client.client_id, template_id: template.id });
    setClients((prev) =>
      prev.map((c) =>
        c.client_id === client.client_id ? { ...c, reminder_sent: true, reminder_sent_at: new Date().toISOString() } : c
      )
    );
  };

  const handleDismiss = async (client) => {
    await api.dismissReminder({ client_id: client.client_id, category });
    setClients((prev) => prev.filter((c) => c.client_id !== client.client_id));
  };

  const columns = [
    { key: 'name', label: 'Clienta' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'date', label: dateLabel },
    { key: 'estado', label: 'Estado' },
    { key: 'accion', label: '', align: 'right' },
  ];

  return (
    <>
      <Card
        eyebrow={templateEyebrow}
        title={templateTitle}
        info={templateInfo}
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
                    onClick={handleTestSend}
                  />
                </>
              )}
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
                  setDraftBody(template?.body ?? defaultTemplateBody);
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
            {!templateLoaded ? 'Cargando...' : (template?.body ?? defaultTemplateBody)}
          </div>
        )}
      </Card>

      <Card
        eyebrow={listEyebrow}
        title={listTitle}
        info={listInfo}
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
              {syncing ? 'Sincronizando...' : syncButtonLabel}
            </Button>
          </div>
        }
      >
        {!synced ? (
          <EmptyState text={emptyBeforeSyncText} />
        ) : clients.length > 0 ? (
          <DataTable
            columns={columns}
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
              if (key === 'date') return <span style={{ color: 'var(--text-body)' }}>{row[dateField] ?? '—'}</span>;
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
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <IconButton
                      icon={Send}
                      size="sm"
                      variant="soft"
                      title={
                        !row.phone
                          ? 'Sin teléfono todavía — probablemente es clienta nueva, sincroniza de nuevo en un rato'
                          : !template
                            ? 'Crea la plantilla primero'
                            : 'Enviar mensaje'
                      }
                      disabled={!row.phone || !template}
                      onClick={() => handleSend(row)}
                    />
                    {dismissable && (
                      <IconButton
                        icon={X}
                        size="sm"
                        variant="outline"
                        title="Quitar de la lista sin enviar mensaje"
                        onClick={() => handleDismiss(row)}
                      />
                    )}
                  </div>
                );
              return row[key] ?? '—';
            }}
          />
        ) : (
          <EmptyState text={emptyAfterSyncText} />
        )}
      </Card>
    </>
  );
};

export default ReminderCampaignPanel;
