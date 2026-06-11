import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Menu, Search, Bell, Plus } from 'lucide-react';

import Sidebar from './components/layout/sidebar';
import SectionTitle from './components/widgets/section-title';
import Button from './components/ui/button';
import IconButton from './components/ui/icon-button';
import Select from './components/ui/select';
import { SkeletonCard } from './components/ui/skeleton';

import Overview from './pages/overview';
import Revenue from './pages/revenue';
import Services from './pages/services';
import Staff from './pages/staff';
import Clients from './pages/clients';
import Appointments from './pages/appointments';
import SettingsPage from './pages/settings';

const NAV = [
  { id: 'overview', label: 'Resumen', icon: 'LayoutDashboard' },
  { id: 'revenue', label: 'Ingresos', icon: 'TrendingUp' },
  { id: 'services', label: 'Servicios', icon: 'Sparkles' },
  { id: 'staff', label: 'Personal', icon: 'Users' },
  { id: 'clients', label: 'Clientas', icon: 'Heart' },
  { id: 'appointments', label: 'Citas', icon: 'Calendar', badge: '8' },
  { id: 'settings', label: 'Ajustes', icon: 'Settings' },
];

const PAGE_META = {
  overview: { eyebrow: 'Dashboard', title: 'Resumen general', subtitle: 'Vista consolidada del negocio' },
  revenue: { eyebrow: 'Finanzas', title: 'Ingresos', subtitle: 'Análisis de ventas y tendencias' },
  services: { eyebrow: 'Catálogo', title: 'Servicios', subtitle: 'Rendimiento por servicio' },
  staff: { eyebrow: 'Equipo', title: 'Personal', subtitle: 'Métricas de desempeño' },
  clients: { eyebrow: 'CRM', title: 'Clientas', subtitle: 'Base de datos y segmentación' },
  appointments: { eyebrow: 'Agenda', title: 'Citas', subtitle: 'Gestión de citas del día' },
  settings: { eyebrow: 'Configuración', title: 'Ajustes', subtitle: 'Personaliza tu espacio de trabajo' },
};

const RANGE_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'quarter', label: 'Este trimestre' },
  { value: 'year', label: 'Este año' },
];

const HIDE_RANGE = new Set(['settings', 'appointments']);

const PAGE_MAP = {
  overview: Overview,
  revenue: Revenue,
  services: Services,
  staff: Staff,
  clients: Clients,
  appointments: Appointments,
  settings: SettingsPage,
};

const LoadingScreen = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="z-kpi-grid">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} lines={3} height={130} />
      ))}
    </div>
    <div className="z-2col-wide">
      <SkeletonCard lines={4} height={300} />
      <SkeletonCard lines={5} height={300} />
    </div>
    <div className="z-2col">
      <SkeletonCard lines={4} height={220} />
      <SkeletonCard lines={4} height={220} />
    </div>
  </div>
);

const App = () => {
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('month');

  const meta = PAGE_META[active] || PAGE_META.overview;
  const PageComponent = PAGE_MAP[active] || Overview;

  const navigate = (id) => {
    if (id === active) return;
    setLoading(true);
    setTimeout(() => {
      setActive(id);
      setLoading(false);
    }, 480);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--surface-page)', overflow: 'hidden' }}>
      <Sidebar
        active={active}
        onNavigate={navigate}
        items={NAV}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className="z-main">
        <div className="z-content">
          <div className="z-topbar" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="z-collapse-btn"
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 6,
                  transition: 'all var(--dur-fast) var(--ease-soft)',
                }}
              >
                {collapsed ? (
                  <PanelLeftOpen size={18} strokeWidth={1.7} />
                ) : (
                  <PanelLeftClose size={18} strokeWidth={1.7} />
                )}
              </button>
              <button
                className="z-menu-btn z-mobile-only"
                onClick={() => setMobileOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'none',
                  alignItems: 'center',
                  padding: 6,
                }}
              >
                <Menu size={18} strokeWidth={1.7} />
              </button>
              <SectionTitle eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
            </div>

            <div className="z-topbar-actions">
              {!HIDE_RANGE.has(active) && (
                <Select value={range} onChange={setRange} options={RANGE_OPTIONS} size="sm" className="z-hide-sm" />
              )}
              <IconButton icon={Search} variant="ghost" size="md" shape="rounded" title="Buscar" />
              <div style={{ position: 'relative' }}>
                <IconButton icon={Bell} variant="ghost" size="md" shape="rounded" title="Notificaciones" />
                <span
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    border: '2px solid var(--surface-page)',
                  }}
                />
              </div>
              <Button variant="primary" size="sm" iconLeft={Plus} onClick={() => navigate('appointments')}>
                Nueva venta
              </Button>
            </div>
          </div>

          {loading ? <LoadingScreen /> : <PageComponent />}
        </div>
      </main>
    </div>
  );
};

export default App;
