export function digitsOnly(phone) {
  return (phone || '').replace(/\D/g, '');
}

// web.whatsapp.com (rather than wa.me) so this reliably opens in Chrome —
// wa.me/api.whatsapp.com short links get intercepted by the WhatsApp
// Desktop app on macOS/Windows when it's installed, and that app's own
// emoji rendering is known to be unreliable.
export function buildWhatsappUrl(phone, message) {
  return `https://web.whatsapp.com/send?phone=${digitsOnly(phone)}&text=${encodeURIComponent(message)}`;
}
