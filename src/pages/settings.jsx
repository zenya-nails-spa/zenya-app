import { useState, useEffect } from 'react';
import { Cake, Phone, Mail, Calendar, Wallet, Clock, Ban, X, Plus, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import { applyTheme } from '../App';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import IconButton from '../components/ui/icon-button';
import Avatar from '../components/ui/avatar';
import Badge from '../components/ui/badge';
import Select from '../components/ui/select';
import SegmentedControl from '../components/ui/segmented-control';
import CustomRemindersPanel from '../components/widgets/custom-reminders-panel';

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

const Field = ({ label, value, onChange, type = 'text', icon: Icon, suffix }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {Icon && (
        <Icon
          size={14}
          strokeWidth={1.8}
          style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }}
        />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingLeft: Icon ? 32 : 12, paddingRight: suffix ? 30 : 12 }}
      />
      {suffix && (
        <span
          style={{
            position: 'absolute',
            right: 10,
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--fw-medium)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const SectionLabel = ({ icon: Icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
    {Icon && <Icon size={14} strokeWidth={2.2} color="var(--brand-primary)" />}
    <span style={{ ...labelStyle, marginBottom: 0 }}>{children}</span>
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

const WEEK_DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
];

const DEFAULT_HOURS = WEEK_DAYS.map((d) => ({
  day_id: d.id,
  day_name: d.name,
  is_open: true,
  open_time: '10:00',
  close_time: d.id === 0 ? '15:00' : '19:00',
}));

const parseScheduleDays = (s) =>
  new Set(
    (s || '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
  );
const scheduleFromDays = (daySet) =>
  WEEK_DAYS.filter((d) => daySet.has(d.name))
    .map((d) => d.name)
    .join(', ');

const DAY_OPTIONS = [
  { value: '', label: 'Sin definir' },
  ...WEEK_DAYS.map((d) => ({ value: String(d.id), label: d.name })),
];

const dayName = (id) => WEEK_DAYS.find((d) => d.id === Number(id))?.name;

// Walks the week starting at startDay until it reaches endDay, wrapping past
// Sábado into Domingo — a "período de pago" doesn't have to sit inside a
// Monday-Sunday week (e.g. Sábado a Martes).
const rangeDays = (startDay, endDay) => {
  if (startDay === '' || endDay === '' || startDay == null || endDay == null) return [];
  const days = [];
  let cur = Number(startDay);
  const end = Number(endDay);
  for (let i = 0; i < 7; i++) {
    days.push(cur);
    if (cur === end) break;
    cur = (cur + 1) % 7;
  }
  return days;
};

const periodSummary = (startDay, endDay, payDay) => {
  if (startDay === '' || endDay === '') return 'Aún no se ha definido su período de comisión.';
  const range = `Su semana de comisión va de ${dayName(startDay)} a ${dayName(endDay)}`;
  return payDay !== '' ? `${range}; se le paga el ${dayName(payDay)}.` : `${range}.`;
};

const CommissionWeekStrip = ({ startDay, endDay, payDay }) => {
  const inRange = new Set(rangeDays(startDay, endDay));
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {WEEK_DAYS.map((d) => {
        const active = inRange.has(d.id);
        const isPayDay = payDay !== '' && Number(payDay) === d.id;
        return (
          <div
            key={d.id}
            title={d.name}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: 40,
              borderRadius: 'var(--radius-xs)',
              background: active ? 'var(--brand-primary-soft)' : 'var(--surface-sunken)',
              border: isPayDay ? '2px solid var(--brand-primary)' : '1px solid transparent',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--fw-semibold)',
                color: active ? 'var(--brand-primary)' : 'var(--text-muted)',
              }}
            >
              {d.name.slice(0, 1)}
            </span>
            {isPayDay && <Wallet size={10} strokeWidth={2.4} color="var(--brand-primary)" />}
          </div>
        );
      })}
    </div>
  );
};

const TABS = [
  { value: 'negocio', label: 'Negocio' },
  { value: 'personal', label: 'Personal' },
  { value: 'recordatorios', label: 'Recordatorios' },
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
        phone: bpData.phone ?? '+52 ',
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
        phone: meData.phone ?? '+52 ',
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

  const { data: hoursData } = useApi(() => api.businessHours(), []);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [hoursStatus, setHoursStatus] = useState(null);

  useEffect(() => {
    if (!hoursData || hoursData.length === 0) return;
    const byId = Object.fromEntries(hoursData.map((r) => [r.day_id, r]));
    setHours(
      WEEK_DAYS.map((d) => {
        const r = byId[d.id];
        const fallback = DEFAULT_HOURS.find((h) => h.day_id === d.id);
        return r
          ? {
              day_id: d.id,
              day_name: d.name,
              is_open: r.is_open,
              open_time: r.open_time ? r.open_time.slice(0, 5) : fallback.open_time,
              close_time: r.close_time ? r.close_time.slice(0, 5) : fallback.close_time,
            }
          : { ...fallback, is_open: false };
      })
    );
  }, [hoursData]);

  const setHourField = (dayId, field, value) => {
    setHours((hs) => hs.map((h) => (h.day_id === dayId ? { ...h, [field]: value } : h)));
  };

  const saveHours = async () => {
    setHoursStatus('saving');
    try {
      await api.updateBusinessHours(
        hours.map((h) => ({
          day_id: h.day_id,
          day_name: h.day_name,
          is_open: h.is_open,
          open_time: h.is_open ? h.open_time : null,
          close_time: h.is_open ? h.close_time : null,
        }))
      );
      setHoursStatus('saved');
      setTimeout(() => setHoursStatus(null), 3000);
    } catch {
      setHoursStatus('error');
    }
  };

  const [staffRefreshKey, setStaffRefreshKey] = useState(0);
  const { data: staffProfilesData } = useApi(() => api.staffProfiles(), [staffRefreshKey]);
  const { data: servicesData } = useApi(() => api.services(), []);
  const [staffProfiles, setStaffProfiles] = useState({});
  const [staffProfileStatus, setStaffProfileStatus] = useState({});
  const [noCommissionStatus, setNoCommissionStatus] = useState({});
  const [noCommissionSearch, setNoCommissionSearch] = useState({});
  const [syncingProfessionals, setSyncingProfessionals] = useState(false);
  const [syncProfessionalsMsg, setSyncProfessionalsMsg] = useState(null);

  const handleSyncProfessionals = async () => {
    setSyncingProfessionals(true);
    setSyncProfessionalsMsg(null);
    try {
      const res = await api.syncProfessionals();
      setSyncProfessionalsMsg(`Sincronizado: ${res.synced_count} colaboradoras`);
      setStaffRefreshKey((k) => k + 1);
    } catch {
      setSyncProfessionalsMsg('No se pudo sincronizar, intenta de nuevo');
    } finally {
      setSyncingProfessionals(false);
    }
  };

  useEffect(() => {
    if (staffProfilesData) {
      const next = {};
      staffProfilesData.forEach((p) => {
        next[p.professional_id] = {
          birth_date: p.birth_date ?? '',
          schedule: p.schedule ?? '',
          commission_pct: p.commission_pct ?? '',
          phone: p.phone ?? '+52 ',
          email: p.email ?? '',
          commission_period_start_day: p.commission_period_start_day ?? '',
          commission_period_end_day: p.commission_period_end_day ?? '',
          commission_pay_day: p.commission_pay_day ?? '',
          commission_min_guarantee: p.commission_min_guarantee ?? '',
          colaborador_alias: p.colaborador_alias ?? '',
          no_commission_services: p.no_commission_services ?? [],
        };
      });
      setStaffProfiles(next);
    }
  }, [staffProfilesData]);

  const setStaffProfileField = (professionalId, field, value) => {
    setStaffProfiles((s) => ({ ...s, [professionalId]: { ...s[professionalId], [field]: value } }));
  };

  const toggleStaffScheduleDay = (professionalId, dayName) => {
    setStaffProfiles((s) => {
      const current = parseScheduleDays(s[professionalId]?.schedule);
      if (current.has(dayName)) current.delete(dayName);
      else current.add(dayName);
      return { ...s, [professionalId]: { ...s[professionalId], schedule: scheduleFromDays(current) } };
    });
  };

  const saveStaffProfile = async (professionalId) => {
    setStaffProfileStatus((s) => ({ ...s, [professionalId]: 'saving' }));
    try {
      const p = staffProfiles[professionalId] ?? {};
      await api.updateStaffProfile(professionalId, {
        birth_date: p.birth_date || null,
        schedule: p.schedule || null,
        commission_pct: p.commission_pct === '' ? null : Number(p.commission_pct),
        phone: p.phone || null,
        email: p.email || null,
        commission_period_start_day:
          p.commission_period_start_day === '' ? null : Number(p.commission_period_start_day),
        commission_period_end_day: p.commission_period_end_day === '' ? null : Number(p.commission_period_end_day),
        commission_pay_day: p.commission_pay_day === '' ? null : Number(p.commission_pay_day),
        commission_min_guarantee: p.commission_min_guarantee === '' ? null : Number(p.commission_min_guarantee),
        colaborador_alias: p.colaborador_alias || null,
      });
      setStaffProfileStatus((s) => ({ ...s, [professionalId]: 'saved' }));
      setTimeout(() => setStaffProfileStatus((s) => ({ ...s, [professionalId]: null })), 3000);
    } catch {
      setStaffProfileStatus((s) => ({ ...s, [professionalId]: 'error' }));
    }
  };

  // Services she doesn't earn commission on (mirrors AgendaPro's own
  // commission editor, e.g. a service configured at 0% there) — a separate
  // save action since it's backed by its own endpoint/table, not a field on
  // the flat profile row above.
  const addNoCommissionService = (professionalId, serviceName) => {
    setStaffProfiles((s) => {
      const current = s[professionalId]?.no_commission_services ?? [];
      if (current.includes(serviceName)) return s;
      return { ...s, [professionalId]: { ...s[professionalId], no_commission_services: [...current, serviceName] } };
    });
    setNoCommissionSearch((s) => ({ ...s, [professionalId]: '' }));
  };

  const removeNoCommissionService = (professionalId, serviceName) => {
    setStaffProfiles((s) => ({
      ...s,
      [professionalId]: {
        ...s[professionalId],
        no_commission_services: (s[professionalId]?.no_commission_services ?? []).filter((n) => n !== serviceName),
      },
    }));
  };

  const saveNoCommissionServices = async (professionalId) => {
    setNoCommissionStatus((s) => ({ ...s, [professionalId]: 'saving' }));
    try {
      const names = staffProfiles[professionalId]?.no_commission_services ?? [];
      await api.updateNoCommissionServices(professionalId, { service_names: names });
      setNoCommissionStatus((s) => ({ ...s, [professionalId]: 'saved' }));
      setTimeout(() => setNoCommissionStatus((s) => ({ ...s, [professionalId]: null })), 3000);
    } catch {
      setNoCommissionStatus((s) => ({ ...s, [professionalId]: 'error' }));
    }
  };

  const [sharedRefreshKey, setSharedRefreshKey] = useState(0);
  const { data: sharedStaffData } = useApi(() => api.sharedStaffProfiles(), [sharedRefreshKey]);
  const [sharedStaff, setSharedStaff] = useState({});
  const [sharedStaffStatus, setSharedStaffStatus] = useState({});
  const [sharedKeywords, setSharedKeywords] = useState({});
  const [sharedKeywordStatus, setSharedKeywordStatus] = useState({});
  const [newSharedName, setNewSharedName] = useState('');
  const [newSharedProviderId, setNewSharedProviderId] = useState('550532');
  const [newSharedKeywords, setNewSharedKeywords] = useState('');
  const [addingSharedKeyword, setAddingSharedKeyword] = useState(false);
  const [addSharedError, setAddSharedError] = useState(null);

  useEffect(() => {
    if (sharedStaffData) {
      const nextStaff = {};
      const nextKeywords = {};
      sharedStaffData.forEach((p) => {
        nextStaff[p.name] = { commission_pct: p.commission_pct ?? '', birth_date: p.birth_date ?? '' };
        nextKeywords[`${p.provider_id}-${p.name}`] = p.keywords ?? '';
      });
      setSharedStaff(nextStaff);
      setSharedKeywords(nextKeywords);
    }
  }, [sharedStaffData]);

  const setSharedStaffField = (name, field, value) => {
    setSharedStaff((s) => ({ ...s, [name]: { ...s[name], [field]: value } }));
  };

  const saveSharedStaff = async (name) => {
    setSharedStaffStatus((s) => ({ ...s, [name]: 'saving' }));
    try {
      const p = sharedStaff[name] ?? {};
      await api.updateSharedStaffProfile(name, {
        commission_pct: p.commission_pct === '' ? null : Number(p.commission_pct),
        birth_date: p.birth_date || null,
      });
      setSharedStaffStatus((s) => ({ ...s, [name]: 'saved' }));
      setTimeout(() => setSharedStaffStatus((s) => ({ ...s, [name]: null })), 3000);
    } catch {
      setSharedStaffStatus((s) => ({ ...s, [name]: 'error' }));
    }
  };

  const saveSharedKeywords = async (providerId, name) => {
    const key = `${providerId}-${name}`;
    setSharedKeywordStatus((s) => ({ ...s, [key]: 'saving' }));
    try {
      await api.updateSharedProviderKeyword(providerId, name, { keywords: sharedKeywords[key] || '' });
      setSharedKeywordStatus((s) => ({ ...s, [key]: 'saved' }));
      setTimeout(() => setSharedKeywordStatus((s) => ({ ...s, [key]: null })), 3000);
    } catch {
      setSharedKeywordStatus((s) => ({ ...s, [key]: 'error' }));
    }
  };

  const removeSharedKeyword = async (providerId, name) => {
    const key = `${providerId}-${name}`;
    setSharedKeywordStatus((s) => ({ ...s, [key]: 'saving' }));
    try {
      await api.updateSharedProviderKeyword(providerId, name, { active: false });
      setSharedRefreshKey((k) => k + 1);
    } catch {
      setSharedKeywordStatus((s) => ({ ...s, [key]: 'error' }));
    }
  };

  const addSharedKeyword = async () => {
    const name = newSharedName.trim();
    const keywords = newSharedKeywords.trim();
    if (!name || !keywords) return;
    setAddingSharedKeyword(true);
    setAddSharedError(null);
    try {
      await api.addSharedProviderKeyword(Number(newSharedProviderId), name, keywords);
      setNewSharedName('');
      setNewSharedKeywords('');
      setSharedRefreshKey((k) => k + 1);
    } catch (e) {
      setAddSharedError(e.message || 'No se pudo agregar');
    } finally {
      setAddingSharedKeyword(false);
    }
  };

  const [receptionRefreshKey, setReceptionRefreshKey] = useState(0);
  const { data: receptionStaffData } = useApi(() => api.receptionStaffProfiles(), [receptionRefreshKey]);
  const [receptionStaff, setReceptionStaff] = useState({});
  const [receptionStaffStatus, setReceptionStaffStatus] = useState({});
  const [newReceptionName, setNewReceptionName] = useState('');
  const [addingReceptionStaff, setAddingReceptionStaff] = useState(false);
  const [addReceptionError, setAddReceptionError] = useState(null);

  useEffect(() => {
    if (receptionStaffData) {
      const next = {};
      receptionStaffData.forEach((p) => {
        next[p.name] = p.birth_date ?? '';
      });
      setReceptionStaff(next);
    }
  }, [receptionStaffData]);

  const saveReceptionStaff = async (name) => {
    setReceptionStaffStatus((s) => ({ ...s, [name]: 'saving' }));
    try {
      await api.updateReceptionStaffProfile(name, { birth_date: receptionStaff[name] || null });
      setReceptionStaffStatus((s) => ({ ...s, [name]: 'saved' }));
      setTimeout(() => setReceptionStaffStatus((s) => ({ ...s, [name]: null })), 3000);
    } catch {
      setReceptionStaffStatus((s) => ({ ...s, [name]: 'error' }));
    }
  };

  const addReceptionStaff = async () => {
    const name = newReceptionName.trim();
    if (!name) return;
    setAddingReceptionStaff(true);
    setAddReceptionError(null);
    try {
      await api.addReceptionStaff(name);
      setNewReceptionName('');
      setReceptionRefreshKey((k) => k + 1);
    } catch (e) {
      setAddReceptionError(e.message || 'No se pudo agregar');
    } finally {
      setAddingReceptionStaff(false);
    }
  };

  const removeReceptionStaff = async (name) => {
    setReceptionStaffStatus((s) => ({ ...s, [name]: 'saving' }));
    try {
      await api.updateReceptionStaffProfile(name, { active: false });
      setReceptionRefreshKey((k) => k + 1);
    } catch {
      setReceptionStaffStatus((s) => ({ ...s, [name]: 'error' }));
    }
  };

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
              {hours.map((h, i) => (
                <div
                  key={h.day_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < hours.length - 1 ? '1px solid var(--border-subtle)' : 'none',
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
                      {h.day_name}
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={h.is_open}
                        onChange={(e) => setHourField(h.day_id, 'is_open', e.target.checked)}
                      />
                      <Badge tone={h.is_open ? 'positive' : 'neutral'} dot={h.is_open}>
                        {h.is_open ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </label>
                  </div>
                  {h.is_open && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="time"
                        value={h.open_time}
                        onChange={(e) => setHourField(h.day_id, 'open_time', e.target.value)}
                        style={{ ...inputStyle, width: 120 }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>–</span>
                      <input
                        type="time"
                        value={h.close_time}
                        onChange={(e) => setHourField(h.day_id, 'close_time', e.target.value)}
                        style={{ ...inputStyle, width: 120 }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <SaveStatus status={hoursStatus} />
              <Button variant="primary" size="md" onClick={saveHours} disabled={hoursStatus === 'saving'}>
                Guardar cambios
              </Button>
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

      {tab === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            eyebrow="Colaboradoras"
            title="Perfil de colaboradoras"
            info="Datos, días de trabajo y período de pago de comisión de cada manicurista. Se guarda por separado para cada una."
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {syncProfessionalsMsg && (
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {syncProfessionalsMsg}
                  </span>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={RefreshCw}
                  onClick={handleSyncProfessionals}
                  disabled={syncingProfessionals}
                >
                  {syncingProfessionals ? 'Sincronizando…' : 'Sincronizar ahora'}
                </Button>
              </div>
            }
          >
            {(staffProfilesData ?? []).length === 0 ? (
              <div
                style={{
                  padding: '16px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Cargando…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {staffProfilesData.map((p, i) => {
                  const local = staffProfiles[p.professional_id] ?? {};
                  const fullName =
                    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || `Profesional ${p.professional_id}`;
                  const startDay = local.commission_period_start_day ?? '';
                  const endDay = local.commission_period_end_day ?? '';
                  const payDay = local.commission_pay_day ?? '';
                  const noCommissionNames = local.no_commission_services ?? [];
                  const noCommissionSearchText = noCommissionSearch[p.professional_id] ?? '';
                  const noCommissionMatches = noCommissionSearchText.trim()
                    ? (servicesData ?? [])
                        .filter(
                          (svc) =>
                            svc.name &&
                            !noCommissionNames.includes(svc.name) &&
                            svc.name.toLowerCase().includes(noCommissionSearchText.trim().toLowerCase())
                        )
                        .slice(0, 8)
                    : [];
                  return (
                    <div
                      key={p.professional_id}
                      style={{
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 18,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <Avatar name={fullName} size="sm" tone={i === 0 ? 'rose' : i === 1 ? 'lavender' : 'ink'} />
                        <div
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--fw-semibold)',
                            color: 'var(--text-heading)',
                          }}
                        >
                          {fullName}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
                        <Field
                          label="Fecha de nacimiento"
                          type="date"
                          icon={Cake}
                          value={local.birth_date}
                          onChange={(v) => setStaffProfileField(p.professional_id, 'birth_date', v)}
                        />
                        <Field
                          label="Teléfono"
                          type="tel"
                          icon={Phone}
                          value={local.phone}
                          onChange={(v) => setStaffProfileField(p.professional_id, 'phone', v)}
                        />
                        <Field
                          label="Correo"
                          type="email"
                          icon={Mail}
                          value={local.email}
                          onChange={(v) => setStaffProfileField(p.professional_id, 'email', v)}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
                        <Field
                          label="Nombre en hoja de gastos"
                          value={local.colaborador_alias}
                          onChange={(v) => setStaffProfileField(p.professional_id, 'colaborador_alias', v)}
                        />
                      </div>

                      <div style={{ marginBottom: 18 }}>
                        <SectionLabel icon={Clock}>Días que trabaja</SectionLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {WEEK_DAYS.map((d) => {
                            const active = parseScheduleDays(local.schedule).has(d.name);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => toggleStaffScheduleDay(p.professional_id, d.name)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 'var(--radius-pill)',
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 'var(--fw-medium)',
                                  cursor: 'pointer',
                                  border: active ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                                  background: active ? 'var(--brand-primary-soft)' : 'var(--surface-card)',
                                  color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                }}
                              >
                                {d.name.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'var(--surface-blush)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 16,
                        }}
                      >
                        <SectionLabel icon={Wallet}>Comisión</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                          <Field
                            label="Porcentaje"
                            type="number"
                            suffix="%"
                            value={local.commission_pct}
                            onChange={(v) => setStaffProfileField(p.professional_id, 'commission_pct', v)}
                          />
                          <Field
                            label="Mínimo garantizado"
                            type="number"
                            suffix="$"
                            value={local.commission_min_guarantee}
                            onChange={(v) => setStaffProfileField(p.professional_id, 'commission_min_guarantee', v)}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 14 }}>
                          <Select
                            label="SEMANA: DE"
                            icon={Calendar}
                            value={String(startDay)}
                            onChange={(v) => setStaffProfileField(p.professional_id, 'commission_period_start_day', v)}
                            options={DAY_OPTIONS}
                          />
                          <Select
                            label="A"
                            icon={Calendar}
                            value={String(endDay)}
                            onChange={(v) => setStaffProfileField(p.professional_id, 'commission_period_end_day', v)}
                            options={DAY_OPTIONS}
                          />
                          <Select
                            label="DÍA DE PAGO"
                            icon={Wallet}
                            value={String(payDay)}
                            onChange={(v) => setStaffProfileField(p.professional_id, 'commission_pay_day', v)}
                            options={DAY_OPTIONS}
                          />
                        </div>
                        <CommissionWeekStrip startDay={startDay} endDay={endDay} payDay={payDay} />
                        {local.commission_min_guarantee !== '' && (
                          <p
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-secondary)',
                              margin: '10px 0 0',
                            }}
                          >
                            Se le paga lo que sea mayor entre su comisión y $
                            {Number(local.commission_min_guarantee).toLocaleString('es-MX')}.
                          </p>
                        )}
                        <p
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            margin: '10px 0 0',
                          }}
                        >
                          {periodSummary(startDay, endDay, payDay)}
                        </p>
                      </div>

                      <div
                        style={{
                          background: 'var(--surface-sunken)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 16,
                          marginTop: 16,
                        }}
                      >
                        <SectionLabel icon={Ban}>Servicios sin comisión</SectionLabel>
                        <p
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            margin: '0 0 10px',
                          }}
                        >
                          Igual que en AgendaPro → Administración → Comisiones: estos servicios no le generan comisión.
                          Se restan de lo generado antes de calcular lo esperado en Gastos → Anomalías de pago de
                          comisión.
                        </p>
                        <div style={{ position: 'relative' }}>
                          <input
                            placeholder="Buscar servicio para excluir de su comisión..."
                            value={noCommissionSearchText}
                            onChange={(e) =>
                              setNoCommissionSearch((s) => ({ ...s, [p.professional_id]: e.target.value }))
                            }
                            style={inputStyle}
                          />
                          {noCommissionMatches.length > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                zIndex: 10,
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: 4,
                                background: 'var(--surface-card)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: 'var(--shadow-md)',
                                overflow: 'hidden',
                              }}
                            >
                              {noCommissionMatches.map((svc) => (
                                <button
                                  key={svc.id}
                                  type="button"
                                  onClick={() => addNoCommissionService(p.professional_id, svc.name)}
                                  style={{
                                    all: 'unset',
                                    boxSizing: 'border-box',
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--text-body)',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rose-50)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  {svc.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                            marginTop: noCommissionNames.length ? 10 : 0,
                          }}
                        >
                          {noCommissionNames.map((name) => (
                            <Badge key={name} tone="neutral" size="sm">
                              {name}
                              <button
                                type="button"
                                title="Quitar"
                                onClick={() => removeNoCommissionService(p.professional_id, name)}
                                style={{
                                  all: 'unset',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  marginLeft: 2,
                                }}
                              >
                                <X size={11} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 12,
                            marginTop: 12,
                          }}
                        >
                          <SaveStatus status={noCommissionStatus[p.professional_id]} />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => saveNoCommissionServices(p.professional_id)}
                            disabled={noCommissionStatus[p.professional_id] === 'saving'}
                          >
                            Guardar servicios sin comisión
                          </Button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 12,
                          marginTop: 16,
                        }}
                      >
                        <SaveStatus status={staffProfileStatus[p.professional_id]} />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => saveStaffProfile(p.professional_id)}
                          disabled={staffProfileStatus[p.professional_id] === 'saving'}
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card
            eyebrow="Lashes y Cejas · Cosmetología"
            title="Comisión por colaboradora"
            info="Comparten una cuenta de AgendaPro — a cada una se le identifica por palabras clave en la nota de la cita (ej. 'Atiende Chio'). Agrega o quita personas conforme cambie el equipo."
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 160 }}>
                <Select
                  label="Cuenta compartida"
                  value={newSharedProviderId}
                  onChange={setNewSharedProviderId}
                  options={[
                    { value: '550532', label: 'Lashes y Cejas' },
                    { value: '542418', label: 'Cosmetología' },
                  ]}
                />
              </div>
              <div style={{ width: 160 }}>
                <Field label="Nombre" value={newSharedName} onChange={setNewSharedName} />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <Field
                  label="Palabras clave (separadas por coma)"
                  value={newSharedKeywords}
                  onChange={setNewSharedKeywords}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={Plus}
                onClick={addSharedKeyword}
                disabled={addingSharedKeyword || !newSharedName.trim() || !newSharedKeywords.trim()}
              >
                {addingSharedKeyword ? 'Agregando…' : 'Agregar'}
              </Button>
            </div>
            {addSharedError && (
              <div
                style={{
                  color: 'var(--negative)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  marginBottom: 12,
                }}
              >
                {addSharedError}
              </div>
            )}

            {(sharedStaffData ?? []).length === 0 ? (
              <div
                style={{
                  padding: '16px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin colaboradoras compartidas registradas.
              </div>
            ) : (
              sharedStaffData.map((p, i) => {
                const key = `${p.provider_id}-${p.name}`;
                return (
                  <div
                    key={key}
                    style={{
                      padding: '12px 0',
                      borderBottom: i < sharedStaffData.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, height: 38 }}>
                        <Avatar name={p.name} size="sm" tone={p.category === 'Lashes y Cejas' ? 'lavender' : 'rose'} />
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: 'var(--text-sm)',
                              fontWeight: 'var(--fw-medium)',
                              color: 'var(--text-heading)',
                            }}
                          >
                            {p.name}
                          </div>
                          <Badge tone={p.category === 'Lashes y Cejas' ? 'lavender' : 'rose'} size="sm">
                            {p.category}
                          </Badge>
                        </div>
                      </div>
                      <div style={{ width: 170 }}>
                        <Field
                          label="Fecha de nacimiento"
                          type="date"
                          icon={Cake}
                          value={sharedStaff[p.name]?.birth_date ?? ''}
                          onChange={(v) => setSharedStaffField(p.name, 'birth_date', v)}
                        />
                      </div>
                      <div style={{ width: 110 }}>
                        <Field
                          label="Comisión"
                          type="number"
                          suffix="%"
                          value={sharedStaff[p.name]?.commission_pct ?? ''}
                          onChange={(v) => setSharedStaffField(p.name, 'commission_pct', v)}
                        />
                      </div>
                      <SaveStatus status={sharedStaffStatus[p.name]} />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => saveSharedStaff(p.name)}
                        disabled={sharedStaffStatus[p.name] === 'saving'}
                      >
                        Guardar
                      </Button>
                      <IconButton
                        icon={X}
                        title="Quitar de esta cuenta compartida"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSharedKeyword(p.provider_id, p.name)}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, paddingLeft: 50 }}>
                      <div style={{ flex: 1, maxWidth: 420 }}>
                        <Field
                          label="Palabras clave en la nota de la cita"
                          value={sharedKeywords[key] ?? ''}
                          onChange={(v) => setSharedKeywords((s) => ({ ...s, [key]: v }))}
                        />
                      </div>
                      <SaveStatus status={sharedKeywordStatus[key]} />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => saveSharedKeywords(p.provider_id, p.name)}
                        disabled={sharedKeywordStatus[key] === 'saving'}
                      >
                        Guardar palabras
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          <Card
            eyebrow="Recepción"
            title="Personal de recepción"
            info="No genera comisión — solo se le puede configurar la fecha de nacimiento. Agrega o quita personas conforme cambie el equipo de recepción."
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, maxWidth: 260 }}>
                <Field label="Nombre" value={newReceptionName} onChange={setNewReceptionName} />
              </div>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={Plus}
                onClick={addReceptionStaff}
                disabled={addingReceptionStaff || !newReceptionName.trim()}
              >
                {addingReceptionStaff ? 'Agregando…' : 'Agregar'}
              </Button>
            </div>
            {addReceptionError && (
              <div
                style={{
                  color: 'var(--negative)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  marginBottom: 12,
                }}
              >
                {addReceptionError}
              </div>
            )}

            {(receptionStaffData ?? []).length === 0 ? (
              <div
                style={{
                  padding: '16px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sin personal de recepción registrado.
              </div>
            ) : (
              receptionStaffData.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: i < receptionStaffData.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, height: 38 }}>
                    <Avatar name={p.name} size="sm" tone="ink" />
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--fw-medium)',
                        color: 'var(--text-heading)',
                      }}
                    >
                      {p.name}
                    </div>
                  </div>
                  <div style={{ width: 170 }}>
                    <Field
                      label="Fecha de nacimiento"
                      type="date"
                      icon={Cake}
                      value={receptionStaff[p.name] ?? ''}
                      onChange={(v) => setReceptionStaff((s) => ({ ...s, [p.name]: v }))}
                    />
                  </div>
                  <SaveStatus status={receptionStaffStatus[p.name]} />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => saveReceptionStaff(p.name)}
                    disabled={receptionStaffStatus[p.name] === 'saving'}
                  >
                    Guardar
                  </Button>
                  <IconButton
                    icon={X}
                    title="Quitar de recepción"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeReceptionStaff(p.name)}
                  />
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {tab === 'recordatorios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CustomRemindersPanel />
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
