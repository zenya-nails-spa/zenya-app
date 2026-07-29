const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API_KEY = process.env.REACT_APP_API_KEY || 'dev-key';

async function get(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { 'X-API-Key': API_KEY } });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  // auth
  login: (email, password) => post('/auth/login', { email, password }),

  // analytics — existing
  kpis: (params) => get('/analytics/kpis', params),
  revenueByDay: (params) => get('/analytics/revenue-by-day', params),
  topServices: (params) => get('/analytics/top-services', params),
  staffPerformance: (params) => get('/analytics/staff-performance', params),
  paymentMethodsBreakdown: (params) => get('/analytics/payment-methods-breakdown', params),
  clientRetention: (params) => get('/analytics/client-retention', params),
  clientStats: (params) => get('/analytics/client-stats', params),

  // analytics — new endpoints (to be implemented in zenya-api)
  healthScore: (params) => get('/analytics/health-score', params),
  serviceCategories: (params) => get('/analytics/service-categories', params),
  crossSell: (params) => get('/analytics/cross-sell', params),
  serviceRepeatRate: (params) => get('/analytics/service-repeat-rate', params),
  staffRepeatRate: (params) => get('/analytics/staff-repeat-rate', params),
  unassignedServices: (params) => get('/analytics/unassigned-services', params),
  sharedProviderBreakdown: (params) => get('/analytics/shared-provider-breakdown', params),
  gastos: (params) => get('/analytics/gastos', params),
  syncGastos: () => post('/analytics/gastos/sync'),
  cierreSemanal: (params) => get('/analytics/cierre-semanal', params),
  clientProfiles: (params) => get('/analytics/client-profiles', params),
  clvSegments: (params) => get('/analytics/clv-segments', params),
  lowDemandServices: (params) => get('/analytics/low-demand-services', params),
  acquisitionTrend: (params) => get('/analytics/acquisition-trend', params),

  // resources
  sales: (params) => get('/sales', params),
  salesSummary: (params) => get('/sales/summary', params),
  bookings: (params) => get('/bookings', params),
  clients: (params) => get('/clients', params),
  professionals: () => get('/professionals'),
  services: () => get('/services'),
  businessProfile: () => get('/business-profile'),
  updateBusinessProfile: (body) => put('/business-profile', body),
  userProfile: () => get('/me'),
  updateUserProfile: (body) => put('/me', body),
  products: () => get('/products'),
  paymentMethods: () => get('/payment-methods'),

  // whatsapp reactivation campaigns
  whatsappTemplates: (params) => get('/whatsapp/templates', params),
  createWhatsappTemplate: (body) => post('/whatsapp/templates', body),
  updateWhatsappTemplate: (id, body) => put(`/whatsapp/templates/${id}`, body),
  createWhatsappSend: (body) => post('/whatsapp/campaign-sends', body),
  whatsappCampaignStatus: () => get('/whatsapp/campaign-status'),
  appointmentReminders: () => get('/whatsapp/appointment-reminders'),
  retouchReminders: () => get('/whatsapp/retouch-reminders'),
  newClientFeedback: () => get('/whatsapp/new-client-feedback'),
  dismissReminder: (body) => post('/whatsapp/dismissals', body),
};
