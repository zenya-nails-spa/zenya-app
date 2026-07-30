import { useState, useMemo } from 'react';
import { MessageCircle, Plus, Edit2, Archive, Send } from 'lucide-react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/use-api';
import { usePagination } from '../../hooks/use-pagination';
import { buildWhatsappUrl, TEST_RECIPIENTS } from '../../lib/whatsapp';
import Card from '../ui/card';
import Badge from '../ui/badge';
import Button from '../ui/button';
import IconButton from '../ui/icon-button';
import Avatar from '../ui/avatar';
import Pagination from '../ui/pagination';
import DataTable from './data-table';
import StatCard from './stat-card';

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
  // Some AgendaPro records keep more than one word in first_name (or trailing
  // whitespace) — only the first token goes into the message, never the full name.
  const name = (firstName || '').trim().split(/\s+/)[0] || 'hola';
  return (body || '').replaceAll('{nombre}', name);
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function estadoBadge(status) {
  if (status === 'active')
    return (
      <Badge tone="positive" size="sm" dot>
        Activa
      </Badge>
    );
  if (status === 'at_risk')
    return (
      <Badge tone="caution" size="sm" dot>
        En riesgo
      </Badge>
    );
  if (status === 'churned')
    return (
      <Badge tone="negative" size="sm" dot>
        Perdida
      </Badge>
    );
  return (
    <Badge tone="neutral" size="sm">
      —
    </Badge>
  );
}

function campaignCell(send) {
  if (!send)
    return (
      <Badge tone="neutral" size="sm">
        Sin contactar
      </Badge>
    );
  const templateLabel = send.template_name ?? 'Plantilla';
  if (send.reactivated) {
    return (
      <span title={`Reactivada ${send.days_to_reactivate ?? '?'} días después · enviado ${fmtDate(send.sent_at)}`}>
        <Badge tone="positive" size="sm" dot>
          Reactivada · {templateLabel}
        </Badge>
      </span>
    );
  }
  return (
    <span title={`Enviado el ${fmtDate(send.sent_at)}`}>
      <Badge tone="lavender" size="sm" dot>
        Contactada · {templateLabel}
      </Badge>
    </span>
  );
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

const TemplateForm = ({ initial, onCancel, onSave }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), body });
    setSaving(false);
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: 14,
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <input
        placeholder="Nombre de la plantilla (ej. Reactivación 90 días)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Escribe el mensaje... usa {nombre} para que se rellene con el nombre de la clienta"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={submit} disabled={saving}>
          Guardar
        </Button>
      </div>
    </div>
  );
};

const ESTADO_RANK = { active: 0, at_risk: 1, churned: 2 };

function campaignRank(send) {
  if (!send) return 0;
  return send.reactivated ? 2 : 1;
}

// Click a header to sort by it (asc/desc toggle); click another to add it as
// the next-priority criterion — up to 3 at once — without losing the first.
// A small superscript number marks each column's priority once 2+ are active.
const CANDIDATE_COLS = [
  {
    key: 'name',
    label: 'Clienta',
    sortable: true,
    sortValue: (r) => [r.first_name, r.last_name].filter(Boolean).join(' '),
  },
  { key: 'phone', label: 'Teléfono', sortable: true, sortValue: (r) => r.phone ?? '' },
  {
    key: 'days_since',
    label: 'Días sin visitar',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.days_since_last,
  },
  { key: 'estado', label: 'Estado', sortable: true, sortValue: (r) => ESTADO_RANK[r.churn_status] ?? 3 },
  { key: 'campana', label: 'Campaña', sortable: true, sortValue: (r) => campaignRank(r.latestSend) },
  { key: 'accion', label: '', align: 'right' },
];

const ReactivationPanel = ({ profiles }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState(null); // null | 'new' | template object
  const [selectedTemplateByClient, setSelectedTemplateByClient] = useState({});
  const [testRecipientByTemplate, setTestRecipientByTemplate] = useState({});
  const [candidateSearch, setCandidateSearch] = useState('');
  const [sortSignal, setSortSignal] = useState(null);

  const { data: templates } = useApi(() => api.whatsappTemplates({ category: 'reactivation' }), [refreshKey]);
  const { data: campaignStatus } = useApi(() => api.whatsappCampaignStatus(), [refreshKey]);

  const sends = campaignStatus?.sends ?? [];
  const effectiveness = campaignStatus?.effectiveness ?? [];

  // sends comes back sorted desc by sent_at, so the first hit per client is her latest attempt
  const latestSendByClient = useMemo(() => {
    const map = new Map();
    for (const s of sends) {
      if (!map.has(s.client_id)) map.set(s.client_id, s);
    }
    return map;
  }, [sends]);

  const candidates = useMemo(() => {
    const profileByClient = new Map((profiles ?? []).map((p) => [p.client_id, p]));
    const ids = new Set();
    (profiles ?? []).forEach((p) => {
      if (p.churn_status === 'at_risk' || p.churn_status === 'churned') ids.add(p.client_id);
    });
    // Keep clients we've contacted before even after they come back — we still want to see the win.
    latestSendByClient.forEach((_send, clientId) => ids.add(clientId));

    return Array.from(ids)
      .map((id) => {
        const profile = profileByClient.get(id);
        const send = latestSendByClient.get(id) ?? null;
        return {
          client_id: id,
          first_name: profile?.first_name ?? send?.first_name,
          last_name: profile?.last_name ?? send?.last_name,
          phone: profile?.phone ?? send?.phone,
          days_since_last: profile?.days_since_last ?? null,
          churn_status: profile?.churn_status ?? null,
          latestSend: send,
        };
      })
      .sort((a, b) => (b.days_since_last ?? -1) - (a.days_since_last ?? -1));
  }, [profiles, latestSendByClient]);

  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase();
      return name.includes(q) || (c.phone ?? '').toLowerCase().includes(q);
    });
  }, [candidates, candidateSearch]);

  // DataTable does the actual multi-column sort internally (maxSortKeys={3}
  // below); onSortChange just gives us a signal to reset back to page 1
  // whenever the active sort changes.
  const candidatesPagination = usePagination(filteredCandidates.length, 50, `${candidateSearch}|${sortSignal}`);

  const stats = useMemo(() => {
    const contacted = candidates.filter((c) => c.latestSend).length;
    const reactivated = candidates.filter((c) => c.latestSend?.reactivated).length;
    return { contacted, reactivated, rate: contacted ? reactivated / contacted : null };
  }, [candidates]);

  const handleSend = async (client) => {
    const templateId = selectedTemplateByClient[client.client_id] ?? templates?.[0]?.id;
    const template = (templates ?? []).find((t) => t.id === Number(templateId));
    if (!template || !client.phone) return;
    const message = fillTemplate(template.body, client.first_name);
    window.open(buildWhatsappUrl(client.phone, message), '_blank', 'noopener');
    await api.createWhatsappSend({ client_id: client.client_id, template_id: template.id });
    setRefreshKey((k) => k + 1);
  };

  // Preview-only — never logged as a real send, so it can't skew reactivation stats.
  const handleTestSend = (template) => {
    const recipientPhone = testRecipientByTemplate[template.id] ?? TEST_RECIPIENTS[0].phone;
    const recipient = TEST_RECIPIENTS.find((r) => r.phone === recipientPhone) ?? TEST_RECIPIENTS[0];
    const message = fillTemplate(template.body, recipient.name);
    window.open(buildWhatsappUrl(recipient.phone, message), '_blank', 'noopener');
  };

  const handleSaveTemplate = async (payload) => {
    if (editingTemplate?.id) {
      await api.updateWhatsappTemplate(editingTemplate.id, payload);
    } else {
      await api.createWhatsappTemplate(payload);
    }
    setEditingTemplate(null);
    setRefreshKey((k) => k + 1);
  };

  const handleArchiveTemplate = async (template) => {
    await api.updateWhatsappTemplate(template.id, { active: false });
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <div className="z-status-row">
        <StatCard
          label="Contactadas"
          value={String(stats.contacted)}
          caption="clientas"
          icon="MessageCircle"
          numeralStyle="sans"
          info="Clientas en riesgo o perdidas a las que les mandaste un mensaje de reactivación."
        />
        <StatCard
          label="Reactivadas"
          value={String(stats.reactivated)}
          caption="volvieron a comprar"
          icon="CheckCircle"
          numeralStyle="sans"
          info="De las clientas contactadas, cuántas hicieron una compra después del mensaje."
        />
        <StatCard
          label="Efectividad"
          value={stats.rate != null ? Math.round(stats.rate * 100) + '%' : '—'}
          caption="tasa de reactivación"
          icon="TrendingUp"
          numeralStyle="sans"
          info="Porcentaje de clientas contactadas que se reactivaron."
        />
      </div>

      <Card
        eyebrow="Mensajes"
        title="Plantillas de WhatsApp"
        info="Usa {nombre} en el mensaje para que se reemplace automáticamente por el primer nombre de la clienta. Al enviar se abre WhatsApp Web con el mensaje ya escrito — tú das clic en enviar dentro de WhatsApp. El ícono de avión de papel manda una prueba a Bety o Carlos (elige a quién en el selector) y no cuenta como envío real — no queda registrada en el tracking de reactivación."
        action={
          !editingTemplate && (
            <Button variant="secondary" size="sm" iconLeft={Plus} onClick={() => setEditingTemplate('new')}>
              Nueva plantilla
            </Button>
          )
        }
      >
        {editingTemplate === 'new' && (
          <TemplateForm initial={null} onCancel={() => setEditingTemplate(null)} onSave={handleSaveTemplate} />
        )}
        {(templates ?? []).length === 0 && !editingTemplate ? (
          <EmptyState text="Todavía no tienes plantillas. Crea una para empezar a mandar mensajes de reactivación." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(templates ?? []).map((t) =>
              editingTemplate && editingTemplate !== 'new' && editingTemplate.id === t.id ? (
                <TemplateForm
                  key={t.id}
                  initial={t}
                  onCancel={() => setEditingTemplate(null)}
                  onSave={handleSaveTemplate}
                />
              ) : (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 12px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: 'var(--text-sm)' }}>
                      {t.name}
                    </div>
                    <div
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                        whiteSpace: 'pre-wrap',
                        marginTop: 4,
                      }}
                    >
                      {t.body}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <select
                      value={testRecipientByTemplate[t.id] ?? TEST_RECIPIENTS[0].phone}
                      onChange={(e) => setTestRecipientByTemplate((prev) => ({ ...prev, [t.id]: e.target.value }))}
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
                      title="Enviar de prueba"
                      onClick={() => handleTestSend(t)}
                    />
                    <IconButton icon={Edit2} size="sm" title="Editar" onClick={() => setEditingTemplate(t)} />
                    <IconButton icon={Archive} size="sm" title="Archivar" onClick={() => handleArchiveTemplate(t)} />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {effectiveness.length > 0 && (
        <Card
          eyebrow="Resultados"
          title="Efectividad por plantilla"
          info="De las clientas contactadas con cada plantilla, cuántas volvieron a comprar después."
        >
          <DataTable
            columns={[
              { key: 'template_name', label: 'Plantilla' },
              { key: 'sends', label: 'Enviados', align: 'right' },
              { key: 'reactivated', label: 'Reactivadas', align: 'right' },
              { key: 'reactivation_rate', label: 'Efectividad', align: 'right' },
            ]}
            rows={effectiveness}
            renderCell={(row, key) => {
              if (key === 'reactivation_rate')
                return row.reactivation_rate != null ? Math.round(row.reactivation_rate * 100) + '%' : '—';
              return row[key];
            }}
          />
        </Card>
      )}

      <Card
        eyebrow="Reactivación"
        title="Clientas en riesgo o perdidas"
        info="Clientas con 45+ días sin visitar (más las que ya contactaste antes, aunque hayan vuelto). Elige una plantilla y da clic en el ícono de WhatsApp para abrir el chat con el mensaje listo. Haz clic en un encabezado para ordenar por esa columna; haz clic en otra para agregarla como siguiente criterio (hasta 3, sin perder la anterior) — un número junto a la flecha marca la prioridad."
        action={
          <input
            placeholder="Buscar por nombre o teléfono..."
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)}
            style={{ ...inputStyle, padding: '4px 10px', height: 30 }}
          />
        }
      >
        {filteredCandidates.length > 0 ? (
          <>
            <DataTable
              columns={CANDIDATE_COLS}
              rows={filteredCandidates}
              maxSortKeys={3}
              onSortChange={(s) => setSortSignal(JSON.stringify(s))}
              page={candidatesPagination.page}
              pageSize={candidatesPagination.pageSize}
              renderCell={(row, key) => {
                if (key === 'name') {
                  const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || '—';
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={name} size="sm" tone="ink" />
                      <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{name}</span>
                    </div>
                  );
                }
                if (key === 'phone') return <span style={{ color: 'var(--text-secondary)' }}>{row.phone ?? '—'}</span>;
                if (key === 'days_since')
                  return row.days_since_last != null ? (
                    <span style={{ color: 'var(--text-body)' }}>{row.days_since_last} d</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  );
                if (key === 'estado') return estadoBadge(row.churn_status);
                if (key === 'campana') return campaignCell(row.latestSend);
                if (key === 'accion') {
                  const hasTemplates = (templates ?? []).length > 0;
                  return (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {(templates ?? []).length > 1 && (
                        <select
                          value={selectedTemplateByClient[row.client_id] ?? templates[0]?.id}
                          onChange={(e) =>
                            setSelectedTemplateByClient((prev) => ({ ...prev, [row.client_id]: e.target.value }))
                          }
                          style={{ ...inputStyle, padding: '4px 8px', height: 30, fontSize: 'var(--text-xs)' }}
                        >
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <IconButton
                        icon={MessageCircle}
                        size="sm"
                        variant="soft"
                        title={
                          !row.phone
                            ? 'Sin teléfono'
                            : !hasTemplates
                              ? 'Crea una plantilla primero'
                              : 'Enviar por WhatsApp'
                        }
                        disabled={!row.phone || !hasTemplates}
                        onClick={() => handleSend(row)}
                      />
                    </div>
                  );
                }
                return row[key] ?? '—';
              }}
            />
            <Pagination
              page={candidatesPagination.page}
              totalPages={candidatesPagination.totalPages}
              pageSize={candidatesPagination.pageSize}
              hasPrev={candidatesPagination.hasPrev}
              hasNext={candidatesPagination.hasNext}
              rangeLabel={candidatesPagination.rangeLabel}
              onPageChange={candidatesPagination.setPage}
              onPageSizeChange={candidatesPagination.setPageSize}
            />
          </>
        ) : (
          <EmptyState
            text={
              candidateSearch ? 'Sin resultados para esa búsqueda' : 'No hay clientas en riesgo o perdidas por ahora'
            }
          />
        )}
      </Card>
    </>
  );
};

export default ReactivationPanel;
