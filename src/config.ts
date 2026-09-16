// Central configuration for VINI CODE dynamic links and domain management

export const getPublicBaseUrl = (): string => {
  // If explicitly provided via Vite environment variable, use it
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_BASE_URL) {
    return import.meta.env.VITE_PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  // If in browser, use current window origin (works seamlessly on dev, preview, or custom domains)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'https://vinicode.com.br';
};

/**
 * Returns the permanent dynamic URL embedded in the QR Code.
 * Example: https://dominio.com/q/KYS7G9ND
 */
export const getDynamicQrUrl = (code: string): string => {
  const baseUrl = getPublicBaseUrl();
  return `${baseUrl}/q/${code}`;
};

/**
 * Normalizes input URL. If the user types "instagram.com/carlos",
 * it turns it into "https://instagram.com/carlos".
 */
export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Check if it already starts with a protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Handle mailto or tel if needed
  if (/^(mailto:|tel:|wa\.me\/)/i.test(trimmed)) {
    if (trimmed.startsWith('wa.me/')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  return `https://${trimmed}`;
};

/**
 * Validates if the string is a functional web destination URL.
 */
export const isValidDestinationUrl = (url: string): boolean => {
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
