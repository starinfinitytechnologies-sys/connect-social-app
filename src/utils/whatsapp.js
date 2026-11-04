import { Linking } from 'react-native';

export const APP_NAME = 'Connect Local';

export function normaliseWhatsAppNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

export function buildEnquiryMessage(professional, customMessage) {
  if (customMessage && customMessage.trim()) return customMessage.trim();

  const firstName = (professional?.name || 'there').split(' ')[0];
  return `Hello ${firstName}, I found your profile on ${APP_NAME}. I would like to enquire about your services.`;
}

export function buildWhatsAppUrl(number, message) {
  const digits = normaliseWhatsAppNumber(number);

  if (digits.length < 10) return null;

  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';

  return `https://wa.me/${withCountryCode}${text}`;
}

export async function openWhatsApp(number, message) {
  const url = buildWhatsAppUrl(number, message);

  if (!url) {
    return { ok: false, reason: 'invalid_number' };
  }

  try {
    await Linking.openURL(url);
    return { ok: true, url };
  } catch {
    return { ok: false, reason: 'open_failed', url };
  }
}

export async function openExternalUrl(url) {
  if (!url) return false;

  try {
    const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    await Linking.openURL(normalised);
    return true;
  } catch {
    return false;
  }
}
