export function digitsOnly(phone) {
  return (phone || '').replace(/\D/g, '');
}

// web.whatsapp.com (rather than wa.me) so this reliably opens in Chrome.
// wa.me/api.whatsapp.com short links can get intercepted by the WhatsApp
// Desktop app on macOS/Windows when it's installed — whether that app
// renders emoji correctly depends on which build is installed, so this is
// the default until confirmed otherwise via buildWhatsappAppUrl below.
export function buildWhatsappUrl(phone, message) {
  return `https://web.whatsapp.com/send?phone=${digitsOnly(phone)}&text=${encodeURIComponent(message)}`;
}

// wa.me — for deliberately testing/using the WhatsApp Desktop app instead of
// the browser. Only wire this up somewhere real once a test message through
// it has been visually confirmed to render emoji correctly.
export function buildWhatsappAppUrl(phone, message) {
  return `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(message)}`;
}

export const TEST_RECIPIENTS = [
  { name: 'Bety', phone: '522224714697' },
  { name: 'Carlos', phone: '522222063234' },
];
