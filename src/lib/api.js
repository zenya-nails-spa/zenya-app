const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API_KEY = process.env.REACT_APP_API_KEY || 'dev-key';

async function get(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { 'X-API-Key': API_KEY } });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function post(path, body, params) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function put(path, body, params) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
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
  topProducts: (params) => get('/analytics/top-products', params),
  staffPerformance: (params) => get('/analytics/staff-performance', params),
  staffRendimiento: (params) => get('/analytics/staff-rendimiento', params),
  commissionAnomalies: (params) => get('/analytics/commission-anomalies', params),
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
  syncGastos: (params) => post('/analytics/gastos/sync', {}, params),
  mayoreoGastos: () => get('/analytics/gastos/mayoreo'),
  revenueGoal: (params) => get('/analytics/revenue-goal', params),
  updateRevenueGoal: (body, params) => put('/analytics/revenue-goal', body, params),
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
  clientsCount: (params) => get('/clients/count', params),
  clientHistory: (clientId) => get(`/clients/${clientId}/history`),
  professionals: () => get('/professionals'),
  services: () => get('/services'),
  businessProfile: () => get('/business-profile'),
  updateBusinessProfile: (body) => put('/business-profile', body),
  businessHours: () => get('/business-hours'),
  updateBusinessHours: (rows) => put('/business-hours', rows),
  userProfile: () => get('/me'),
  updateUserProfile: (body) => put('/me', body),
  staffProfiles: () => get('/staff-profiles/professionals'),
  updateStaffProfile: (professionalId, body) => put(`/staff-profiles/professionals/${professionalId}`, body),
  sharedStaffProfiles: () => get('/staff-profiles/shared'),
  updateSharedStaffProfile: (name, body) => put(`/staff-profiles/shared/${encodeURIComponent(name)}`, body),
  receptionStaffProfiles: () => get('/staff-profiles/reception'),
  updateReceptionStaffProfile: (name, body) => put(`/staff-profiles/reception/${encodeURIComponent(name)}`, body),
  products: () => get('/products'),
  paymentMethods: () => get('/payment-methods'),

  // whatsapp reactivation campaigns
  whatsappTemplates: (params) => get('/whatsapp/templates', params),
  createWhatsappTemplate: (body) => post('/whatsapp/templates', body),
  updateWhatsappTemplate: (id, body) => put(`/whatsapp/templates/${id}`, body),
  createWhatsappSend: (body) => post('/whatsapp/campaign-sends', body),
  whatsappCampaignStatus: () => get('/whatsapp/campaign-status'),
  appointmentReminders: (params) => get('/whatsapp/appointment-reminders', params),
  retouchReminders: (params) => get('/whatsapp/retouch-reminders', params),
  newClientFeedback: (params) => get('/whatsapp/new-client-feedback', params),
  dismissReminder: (body) => post('/whatsapp/dismissals', body),
  reminderEffectiveness: () => get('/whatsapp/reminder-effectiveness'),

  // staff hours — "Adeudo de tiempo extra manicuristas" ledger + vacations
  staffHoursBalance: () => get('/staff-hours/balance'),
  staffTimeEntries: (params) => get('/staff-hours/time-entries', params),
  createStaffTimeEntry: (body) => post('/staff-hours/time-entries', body),
  updateStaffTimeEntry: (id, body) => put(`/staff-hours/time-entries/${id}`, body),
  staffVacations: (params) => get('/staff-hours/vacations', params),
  createStaffVacation: (body) => post('/staff-hours/vacations', body),
  updateStaffVacation: (id, body) => put(`/staff-hours/vacations/${id}`, body),
  staffAllotments: () => get('/staff-hours/allotments'),
  upsertStaffAllotment: (professionalId, body) => put(`/staff-hours/allotments/${professionalId}`, body),

  // alerts
  alerts: () => get('/alerts'),
};
