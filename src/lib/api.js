const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API_KEY = process.env.REACT_APP_API_KEY || 'dev-key';

const HEADERS = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

async function get(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  kpis: (params) => get('/analytics/kpis', params),
  revenueByDay: (params) => get('/analytics/revenue-by-day', params),
  topServices: (params) => get('/analytics/top-services', params),
  staffPerformance: (params) => get('/analytics/staff-performance', params),
  paymentMethodsBreakdown: (params) => get('/analytics/payment-methods-breakdown', params),
  sales: (params) => get('/sales', params),
  salesSummary: (params) => get('/sales/summary', params),
  bookings: (params) => get('/bookings', params),
  clients: (params) => get('/clients', params),
  professionals: () => get('/professionals'),
  services: () => get('/services'),
  products: () => get('/products'),
  paymentMethods: () => get('/payment-methods'),

  businessProfile: () => get('/business-profile'),
  updateBusinessProfile: (data) => put('/business-profile', data),
  businessHours: () => get('/business-hours'),
  updateBusinessHours: (data) => put('/business-hours', data),
  userProfile: () => get('/me'),
  updateUserProfile: (data) => put('/me', data),
};
