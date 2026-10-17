/**
 * Utilitários de segurança, sanitização e formatação
 */

// Previne ataques de XSS escapando entidades HTML
export function escapeHTML(str) {
  if (typeof str !== 'string') return str ?? '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitiza e padroniza número de WhatsApp para o padrão internacional (E.164: 5562999999999)
export function sanitizeWhatsApp(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  
  // Se começou com 0, remove
  if (digits.startsWith('0')) digits = digits.slice(1);
  
  // Se tem 10 ou 11 dígitos (ex: 62996707046 ou 6296707046), adiciona o DDI do Brasil (55)
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  
  return digits;
}

// Formata número de WhatsApp para exibição amigável (ex: (62) 99670-7046)
export function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  
  // Pega apenas os últimos 10 ou 11 dígitos (sem o 55)
  const localDigits = digits.startsWith('55') ? digits.slice(2) : digits;
  
  if (localDigits.length === 11) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7)}`;
  } else if (localDigits.length === 10) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  }
  
  return phone;
}

// Aplica máscara dinâmica de telefone durante a digitação
export function applyPhoneMask(value) {
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  
  if (v.length > 10) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 6) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  } else if (v.length > 2) {
    return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else if (v.length > 0) {
    return `(${v}`;
  }
  return '';
}
