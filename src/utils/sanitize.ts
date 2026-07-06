import DOMPurify from 'dompurify';

/** Remove todas as tags HTML e atributos — retorna texto puro. */
export const sanitizeText = (value: string): string =>
  DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();

/** Mascara emails no formato l***@dominio.com para exibição em logs. */
export const maskEmail = (value: string): string =>
  value.replace(/([^\s@]{1})[^\s@]*(@[^\s]+)/g, '$1***$2');

/** Aplica maskEmail em qualquer string que contenha um email. */
export const maskEmailsInText = (value: string | null): string | null => {
  if (!value) return value;
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
  if (!emailRegex.test(value)) return value;
  return value.replace(/([^\s@]{1})[^\s@]*(@[^\s@]+\.[^\s@]+)/g, '$1***$2');
};
