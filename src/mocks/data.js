const money = (v) => '$' + Math.round(v).toLocaleString('es-MX');
const moneyK = (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k' : '$' + Math.round(v));
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function series(seed, n, base, amp, trend = 0) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(Math.max(0, base + r() * amp + trend * i));
  return out;
}
const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const services = [
  {
    name: 'Manicure Gel',
    cat: 'Manicure',
    provider: 'Sofía',
    rev: 18480,
    count: 124,
    avg: 149,
    trend: 6.2,
    spark: series(11, 12, 1000, 700, 30),
  },
  {
    name: 'Pedicure Spa',
    cat: 'Pedicure',
    provider: 'Ana',
    rev: 14120,
    count: 78,
    avg: 181,
    trend: 4.1,
    spark: series(12, 12, 900, 600, 22),
  },
  {
    name: 'Uñas Acrílicas',
    cat: 'Uñas',
    provider: 'Lucía',
    rev: 12540,
    count: 58,
    avg: 216,
    trend: 9.4,
    spark: series(13, 12, 700, 800, 40),
  },
  {
    name: 'Esmaltado Semipermanente',
    cat: 'Manicure',
    provider: 'Sofía',
    rev: 9210,
    count: 132,
    avg: 70,
    trend: -2.3,
    spark: series(14, 12, 900, 400, -8),
  },
  {
    name: 'Diseño & Nail Art',
    cat: 'Uñas',
    provider: 'Mariana',
    rev: 7180,
    count: 49,
    avg: 146,
    trend: 12.8,
    spark: series(15, 12, 400, 600, 35),
  },
  {
    name: 'Manicure Rusa',
    cat: 'Manicure',
    provider: 'Lucía',
    rev: 6620,
    count: 41,
    avg: 161,
    trend: 7.5,
    spark: series(16, 12, 400, 500, 20),
  },
  {
    name: 'Spa de Manos',
    cat: 'Spa',
    provider: 'Ana',
    rev: 4980,
    count: 36,
    avg: 138,
    trend: 3.0,
    spark: series(17, 12, 350, 400, 10),
  },
  {
    name: 'Retiro de Acrílico',
    cat: 'Uñas',
    provider: 'Mariana',
    rev: 2390,
    count: 53,
    avg: 45,
    trend: -5.6,
    spark: series(18, 12, 300, 200, -6),
  },
];

const categories = [
  { name: 'Manicure', rev: 34310, pct: 0.437, color: 'var(--chart-1)' },
  { name: 'Uñas', rev: 22110, pct: 0.281, color: 'var(--chart-2)' },
  { name: 'Pedicure', rev: 14120, pct: 0.18, color: 'var(--chart-3)' },
  { name: 'Spa', rev: 4980, pct: 0.063, color: 'var(--chart-4)' },
  { name: 'Otros', rev: 3000, pct: 0.039, color: 'var(--chart-5)' },
];

const payments = [
  { name: 'Tarjeta', pct: 0.54, color: 'var(--chart-1)' },
  { name: 'Efectivo', pct: 0.24, color: 'var(--chart-2)' },
  { name: 'Transferencia', pct: 0.14, color: 'var(--chart-3)' },
  { name: 'Gift Card', pct: 0.08, color: 'var(--chart-4)' },
];

const staff = [
  {
    name: 'Sofía Reyes',
    role: 'Manicurista Senior',
    rev: 27690,
    clients: 148,
    appts: 256,
    rating: 4.9,
    utilization: 0.88,
    spark: series(21, 12, 2000, 600, 35),
    color: 'var(--chart-1)',
  },
  {
    name: 'Ana Torres',
    role: 'Pedicurista',
    rev: 19100,
    clients: 114,
    appts: 189,
    rating: 4.8,
    utilization: 0.76,
    spark: series(22, 12, 1500, 500, 20),
    color: 'var(--chart-2)',
  },
  {
    name: 'Lucía Mendez',
    role: 'Nail Artist',
    rev: 19160,
    clients: 99,
    appts: 177,
    rating: 4.9,
    utilization: 0.81,
    spark: series(23, 12, 1400, 600, 28),
    color: 'var(--chart-3)',
  },
  {
    name: 'Mariana Vega',
    role: 'Nail Artist',
    rev: 9570,
    clients: 76,
    appts: 102,
    rating: 4.7,
    utilization: 0.62,
    spark: series(24, 12, 800, 400, 12),
    color: 'var(--chart-4)',
  },
];

const clients = [
  { name: 'Valentina Cruz', visits: 14, spent: 2086, last: 'hace 2 días', loyalty: 'VIP', tone: 'rose' },
  { name: 'Isabella Ramos', visits: 11, spent: 1540, last: 'hace 5 días', loyalty: 'VIP', tone: 'rose' },
  { name: 'Camila Ortiz', visits: 9, spent: 1296, last: 'hace 1 sem', loyalty: 'Frecuente', tone: 'lavender' },
  { name: 'Fernanda Mora', visits: 8, spent: 1120, last: 'hace 2 sem', loyalty: 'Frecuente', tone: 'lavender' },
  { name: 'Daniela Fuentes', visits: 6, spent: 780, last: 'hace 3 sem', loyalty: 'Regular', tone: 'neutral' },
  { name: 'Renata Solis', visits: 5, spent: 695, last: 'hace 1 mes', loyalty: 'Regular', tone: 'neutral' },
  { name: 'Paola Jiménez', visits: 3, spent: 390, last: 'hace 6 sem', loyalty: 'Nueva', tone: 'neutral' },
  { name: 'Andrea Ríos', visits: 1, spent: 149, last: 'hace 2 mes', loyalty: 'Nueva', tone: 'neutral' },
];

const loyaltySegments = [
  { name: 'VIP', count: 38, pct: 0.095, rev: 31200, color: 'var(--chart-1)' },
  { name: 'Frecuente', count: 112, pct: 0.28, rev: 44800, color: 'var(--chart-2)' },
  { name: 'Regular', count: 156, pct: 0.39, rev: 31200, color: 'var(--chart-3)' },
  { name: 'Nueva', count: 94, pct: 0.235, rev: 9400, color: 'var(--chart-4)' },
];

const visitFreq = [
  { label: '1 visita', value: 94 },
  { label: '2-3', value: 112 },
  { label: '4-6', value: 89 },
  { label: '7-10', value: 56 },
  { label: '11-15', value: 32 },
  { label: '16+', value: 17 },
];

const spendDist = [
  { label: '<$500', value: 118 },
  { label: '$500-1k', value: 134 },
  { label: '$1k-2k', value: 87 },
  { label: '$2k-3k', value: 44 },
  { label: '$3k+', value: 17 },
];

const appointments = [
  {
    id: 1,
    time: '09:00',
    client: 'Valentina Cruz',
    service: 'Manicure Gel',
    staff: 'Sofía',
    duration: 60,
    status: 'paid',
    total: 149,
  },
  {
    id: 2,
    time: '09:30',
    client: 'Camila Ortiz',
    service: 'Pedicure Spa',
    staff: 'Ana',
    duration: 75,
    status: 'paid',
    total: 181,
  },
  {
    id: 3,
    time: '10:00',
    client: 'Isabella Ramos',
    service: 'Uñas Acrílicas',
    staff: 'Lucía',
    duration: 90,
    status: 'paid',
    total: 216,
  },
  {
    id: 4,
    time: '10:30',
    client: 'Fernanda Mora',
    service: 'Nail Art',
    staff: 'Mariana',
    duration: 60,
    status: 'pending',
    total: 146,
  },
  {
    id: 5,
    time: '11:00',
    client: 'Daniela Fuentes',
    service: 'Manicure Rusa',
    staff: 'Sofía',
    duration: 75,
    status: 'paid',
    total: 161,
  },
  {
    id: 6,
    time: '11:30',
    client: 'Renata Solis',
    service: 'Spa de Manos',
    staff: 'Ana',
    duration: 45,
    status: 'paid',
    total: 138,
  },
  {
    id: 7,
    time: '12:00',
    client: 'Paola Jiménez',
    service: 'Esmaltado Semi',
    staff: 'Lucía',
    duration: 45,
    status: 'pending',
    total: 70,
  },
  {
    id: 8,
    time: '13:00',
    client: 'Andrea Ríos',
    service: 'Manicure Gel',
    staff: 'Mariana',
    duration: 60,
    status: 'unpaid',
    total: 149,
  },
  {
    id: 9,
    time: '14:00',
    client: 'Valentina Cruz',
    service: 'Nail Art',
    staff: 'Sofía',
    duration: 60,
    status: 'pending',
    total: 146,
  },
  {
    id: 10,
    time: '15:00',
    client: 'Camila Ortiz',
    service: 'Pedicure Spa',
    staff: 'Ana',
    duration: 75,
    status: 'paid',
    total: 181,
  },
  {
    id: 11,
    time: '15:30',
    client: 'Isabella Ramos',
    service: 'Manicure Gel',
    staff: 'Lucía',
    duration: 60,
    status: 'paid',
    total: 149,
  },
  {
    id: 12,
    time: '16:00',
    client: 'Fernanda Mora',
    service: 'Uñas Acrílicas',
    staff: 'Mariana',
    duration: 90,
    status: 'pending',
    total: 216,
  },
];

const activity = [
  { time: '09:15', text: 'Valentina Cruz completó Manicure Gel · Sofía', type: 'paid' },
  { time: '09:47', text: 'Nueva cita: Isabella Ramos · Uñas Acrílicas 11:00', type: 'new' },
  { time: '10:32', text: 'Camila Ortiz llegó para Pedicure Spa', type: 'checkin' },
  { time: '11:05', text: 'Fernanda Mora canceló · 13:30 Nail Art', type: 'cancel' },
  { time: '11:58', text: 'Pago recibido $161 · Manicure Rusa · Daniela F.', type: 'paid' },
  { time: '12:20', text: 'Renata Solis completó Spa de Manos · Ana', type: 'paid' },
];

const insights = [
  {
    icon: 'TrendingUp',
    tone: 'positive',
    title: 'Manicure Gel en alza',
    body: 'Creció 6.2% este mes. Considera agregar un horario extra los sábados.',
  },
  {
    icon: 'AlertCircle',
    tone: 'caution',
    title: 'Retiro de Acrílico bajó',
    body: '−5.6% vs mes anterior. Revisa si el precio es competitivo.',
  },
  {
    icon: 'Star',
    tone: 'rose',
    title: 'Sofía, top del mes',
    body: 'Mayor ingreso y satisfacción. Reconócela con un bono.',
  },
  {
    icon: 'Users',
    tone: 'lavender',
    title: '38 clientas VIP',
    body: 'Genera el 41% del ingreso. Lanza un programa de lealtad exclusivo.',
  },
];

const revToday = series(31, 14, 800, 600, 40);
const revPrev = series(32, 14, 750, 550, 30);
const weekCompare = [
  { label: 'Lun', cur: 4200, prev: 3800 },
  { label: 'Mar', cur: 5100, prev: 4600 },
  { label: 'Mié', cur: 4800, prev: 5200 },
  { label: 'Jue', cur: 6200, prev: 5100 },
  { label: 'Vie', cur: 7800, prev: 6900 },
  { label: 'Sáb', cur: 9200, prev: 8400 },
];

const dayRows = [
  { label: 'Lun', cur: 4200, prev: 3800, appts: 18, clients: 16 },
  { label: 'Mar', cur: 5100, prev: 4600, appts: 22, clients: 20 },
  { label: 'Mié', cur: 4800, prev: 5200, appts: 20, clients: 18 },
  { label: 'Jue', cur: 6200, prev: 5100, appts: 26, clients: 24 },
  { label: 'Vie', cur: 7800, prev: 6900, appts: 32, clients: 30 },
  { label: 'Sáb', cur: 9200, prev: 8400, appts: 38, clients: 35 },
];

const totals = {
  revMonth: 78520,
  revPrevMonth: 71840,
  appts: 571,
  apptsPrev: 528,
  avgTicket: 137,
  avgTicketPrev: 128,
  newClients: 47,
  newClientsPrev: 39,
  activeClients: 400,
  totalServices: 75520,
  satisfaction: 4.85,
};

const D = {
  money,
  moneyK,
  series,
  CHART,
  services,
  categories,
  payments,
  staff,
  clients,
  loyaltySegments,
  visitFreq,
  spendDist,
  appointments,
  activity,
  insights,
  revToday,
  revPrev,
  weekCompare,
  dayRows,
  totals,
};

export default D;
