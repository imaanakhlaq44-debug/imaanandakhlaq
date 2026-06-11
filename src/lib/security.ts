/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate required field
 */
export const isValidRequired = (input: string | null | undefined): boolean => {
  return input != null && input.toString().trim().length > 0;
};

/**
 * Validate minimum length
 */
export const isValidMinLength = (input: string, minLength: number): boolean => {
  return input.trim().length >= minLength;
};

/**
 * Validate maximum length
 */
export const isValidMaxLength = (input: string, maxLength: number): boolean => {
  return input.trim().length <= maxLength;
};

/**
 * Safe JSON parse with error handling
 */
export const safeJsonParse = (jsonString: string, defaultValue: any = null): any => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    return defaultValue;
  }
};

/**
 * Escape HTML in string
 */
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};
