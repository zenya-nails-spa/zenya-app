import { useState, useMemo, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Menu, Sun, Moon } from 'lucide-react';

import { api } from './lib/api';
import { useApi } from './hooks/use-api';
import Sidebar from './components/layout/sidebar';
import SectionTitle from './components/widgets/section-title';
import DateRangePicker from './components/ui/date-range-picker';
import { SkeletonCard } from './components/ui/skeleton';
import IconButton from './components/ui/icon-button';

import Login from './pages/login';
import Overview from './pages/overview';
import Revenue from './pages/revenue';
import Services from './pages/services';
import Staff from './pages/staff';
import Clients from './pages/clients';
import Appointments from './pages/appointments';
import Gastos from './pages/gastos';
import SettingsPage from './pages/settings';

const NAV = [
  { id: 'overview', label: 'Resumen', icon: 'LayoutDashboard' },
  { id: 'revenue', label: 'Ingresos', icon: 'TrendingUp' },
  { id: 'services', label: 'Servicios', icon: 'Sparkles' },
  { id: 'staff', label: 'Personal', icon: 'Users' },
  { id: 'clients', label: 'Clientas', icon: 'Heart' },
  { id: 'appointments', label: 'Citas', icon: 'Calendar' },
  { id: 'gastos', label: 'Gastos', icon: 'Wallet' },
  { id: 'settings', label: 'Ajustes', icon: 'Settings' },
];

const PAGE_META = {
  overview: { eyebrow: 'Dashboard', title: 'Resumen general', subtitle: 'Vista consolidada del negocio' },
  revenue: { eyebrow: 'Finanzas', title: 'Ingresos', subtitle: 'Análisis de ventas y tendencias' },
  services: { eyebrow: 'Catálogo', title: 'Servicios', subtitle: 'Rendimiento por servicio' },
  staff: { eyebrow: 'Equipo', title: 'Personal', subtitle: 'Métricas de desempeño' },
  clients: { eyebrow: 'CRM', title: 'Clientas', subtitle: 'Base de datos y segmentación' },
  appointments: { eyebrow: 'Agenda', title: 'Citas', subtitle: 'Gestión de citas del día' },
  gastos: { eyebrow: 'Finanzas', title: 'Gastos', subtitle: 'Egresos, pagos a personal e insumos' },
  settings: { eyebrow: 'Configuración', title: 'Ajustes', subtitle: 'Personaliza tu espacio de trabajo' },
};

const HIDE_RANGE = new Set(['settings', 'appointments', 'gastos']);

const PAGE_MAP = {
  overview: Overview,
  revenue: Revenue,
  services: Services,
  staff: Staff,
  clients: Clients,
  appointments: Appointments,
  gastos: Gastos,
  settings: SettingsPage,
};

function initialRange() {
  const now = new Date();
  return {
    from_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to_date: now.toISOString().slice(0, 10),
  };
}

function computePrevRange(from_date, to_date) {
  const fromMs = new Date(from_date).getTime();
  const toMs = new Date(to_date).getTime();
  const numDays = Math.round((toMs - fromMs) / 86400000) + 1;
  const prevTo = new Date(fromMs - 86400000);
  const prevFrom = new Date(prevTo.getTime() - (numDays - 1) * 86400000);
  return {
    from_date: prevFrom.toISOString().slice(0, 10),
    to_date: prevTo.toISOString().slice(0, 10),
  };
}

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

export function applyTheme(t) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = t === 'dark' || (t === 'auto' && prefersDark);
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('zenya-theme', t);
}

const App = () => {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('zenya-auth-token'));
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(initialRange);
  const [theme, setTheme] = useState(() => localStorage.getItem('zenya-theme') || 'light');

  const prevDateRange = useMemo(
    () => computePrevRange(dateRange.from_date, dateRange.to_date),
    [dateRange.from_date, dateRange.to_date]
  );

  useEffect(() => {
    applyTheme(localStorage.getItem('zenya-theme') || 'light');
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const { data: ownerData } = useApi(() => api.userProfile(), []);

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

  const handleLogout = () => {
    localStorage.removeItem('zenya-auth-token');
    setAuthed(false);
    setActive('overview');
  };

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--surface-page)', overflow: 'hidden' }}>
      <Sidebar
        active={active}
        onNavigate={navigate}
        items={NAV}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        owner={ownerData}
        onLogout={handleLogout}
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
                <DateRangePicker value={dateRange} onChange={setDateRange} className="z-hide-sm" />
              )}
              <IconButton
                label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                variant="outline"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? <Sun size={16} strokeWidth={1.7} /> : <Moon size={16} strokeWidth={1.7} />}
              </IconButton>
            </div>
          </div>

          {loading ? <LoadingScreen /> : <PageComponent dateRange={dateRange} prevDateRange={prevDateRange} />}
        </div>
      </main>
    </div>
  );
};

export default App;
