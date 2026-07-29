import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Calendar, Palmtree, Clock3 } from 'lucide-react';
import { api } from '../../lib/api';

const POLL_MS = 60000;

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontFamily: 'var(--font-label)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-label)',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      padding: '10px 14px 4px',
    }}
  >
    {children}
  </div>
);

const AlertRow = ({ icon: Icon, iconColor, title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      width: '100%',
      padding: '8px 14px',
      background: 'transparent',
      border: 'none',
      cursor: onClick ? 'pointer' : 'default',
      textAlign: 'left',
    }}
    className="z-row"
  >
    <Icon size={15} strokeWidth={1.8} style={{ color: iconColor, marginTop: 2, flexShrink: 0 }} />
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--fw-medium)',
          color: 'var(--text-heading)',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  </button>
);

const NotificationBell = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(() => {
    api
      .alerts()
      .then(setAlerts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const goTo = (page) => {
    setOpen(false);
    onNavigate?.(page);
  };

  const totalCount = alerts?.total_count ?? 0;
  const hasAlerts =
    (alerts?.pending_reminders?.length ?? 0) +
      (alerts?.upcoming_vacations?.length ?? 0) +
      (alerts?.owed_hours?.length ?? 0) >
    0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notificaciones"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          background: open ? 'var(--surface-page)' : 'var(--surface-card)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Bell size={16} strokeWidth={1.7} />
        {totalCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 17,
              height: 17,
              padding: '0 4px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--red-600, #dc2626)',
              color: 'var(--white)',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
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
            minWidth: 300,
            maxWidth: 340,
            maxHeight: 420,
            overflowY: 'auto',
            paddingBottom: 6,
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-heading)',
            }}
          >
            Notificaciones
          </div>

          {!hasAlerts && (
            <div
              style={{
                padding: '24px 14px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Sin notificaciones pendientes.
            </div>
          )}

          {alerts?.pending_reminders?.length > 0 && (
            <>
              <SectionLabel>Recordatorios pendientes</SectionLabel>
              {alerts.pending_reminders.map((r) => (
                <AlertRow
                  key={r.category}
                  icon={Calendar}
                  iconColor="var(--brand-primary)"
                  title={r.label}
                  subtitle={`${r.count} por enviar`}
                  onClick={() => goTo('appointments')}
                />
              ))}
            </>
          )}

          {alerts?.upcoming_vacations?.length > 0 && (
            <>
              <SectionLabel>Vacaciones próximas</SectionLabel>
              {alerts.upcoming_vacations.map((v) => (
                <AlertRow
                  key={`${v.professional_id}-${v.vacation_date}`}
                  icon={Palmtree}
                  iconColor="var(--lavender-600, #7c3aed)"
                  title={[v.first_name, v.last_name].filter(Boolean).join(' ').trim()}
                  subtitle={
                    v.days_until === 0
                      ? 'Es hoy'
                      : v.days_until === 1
                        ? 'Es mañana'
                        : `En ${v.days_until} días · ${v.vacation_date}`
                  }
                  onClick={() => goTo('staff')}
                />
              ))}
            </>
          )}

          {alerts?.owed_hours?.length > 0 && (
            <>
              <SectionLabel>Horas pendientes 2+ semanas</SectionLabel>
              {alerts.owed_hours.map((o) => (
                <AlertRow
                  key={o.professional_id}
                  icon={Clock3}
                  iconColor="var(--caution)"
                  title={[o.first_name, o.last_name].filter(Boolean).join(' ').trim()}
                  subtitle={`Debe desde hace ${o.days_owed} días`}
                  onClick={() => goTo('staff')}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
