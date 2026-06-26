import { LogOut } from 'lucide-react';
import Avatar from '../ui/avatar';
import { getIcon } from '../../lib/icons';

const Sidebar = ({
  active,
  onNavigate,
  items = [],
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
  owner,
  onLogout,
}) => {
  const ownerName = [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || 'Dueña';
  return (
    <>
      <aside
        className={`z-sidebar${mobileOpen ? ' z-mobile-open' : ''}`}
        style={{
          width: collapsed ? 68 : 232,
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '18px 0' : '20px 20px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid var(--border-subtle)',
            minHeight: 64,
          }}
        >
          <img
            src="/zenya-mark-rose.png"
            alt="Zenya"
            style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
          />
          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--fw-medium)',
                  color: 'var(--text-display)',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                zenya
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: 9,
                  fontWeight: 'var(--fw-semibold)',
                  letterSpacing: '0.2em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginTop: 1,
                }}
              >
                NAILS &amp; SPA
              </div>
            </div>
          )}
        </div>

        <nav
          style={{
            flex: 1,
            padding: collapsed ? '12px 8px' : '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate && onNavigate(item.id);
                  onCloseMobile && onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '9px 0' : '9px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--brand-primary-soft)' : 'transparent',
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  position: 'relative',
                  transition: 'all var(--dur-fast) var(--ease-soft)',
                }}
              >
                {Icon && <Icon size={18} strokeWidth={isActive ? 2 : 1.7} />}
                {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span
                    style={{
                      background: 'var(--brand-primary)',
                      color: 'var(--white)',
                      fontSize: 10,
                      fontWeight: 'var(--fw-bold)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '1px 6px',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--brand-primary)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            padding: collapsed ? '12px 8px' : '12px 14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Avatar name={ownerName} size="sm" tone="rose" />
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-medium)',
                    color: 'var(--text-heading)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ownerName}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Dueña
                </div>
              </div>
              <button
                title="Cerrar sesión"
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <LogOut size={16} strokeWidth={1.7} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
