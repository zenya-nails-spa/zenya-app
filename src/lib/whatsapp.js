export function digitsOnly(phone) {
  return (phone || '').replace(/\D/g, '');
}

// web.whatsapp.com (rather than wa.me) so this reliably opens in Chrome.
// wa.me/api.whatsapp.com short links get intercepted by the WhatsApp Desktop
// app on macOS when it's installed, and that app has a confirmed encoding
// bug that corrupts emoji in the text= parameter (verified: every emoji in a
// test message came through as U+FFFD replacement characters). Don't use
// wa.me for anything real until Meta fixes it on their end.
export function buildWhatsappUrl(phone, message) {
  return `https://web.whatsapp.com/send?phone=${digitsOnly(phone)}&text=${encodeURIComponent(message)}`;
}

export const TEST_RECIPIENTS = [
  { name: 'Bety', phone: '522224714697' },
  { name: 'Carlos', phone: '522222063234' },
];
