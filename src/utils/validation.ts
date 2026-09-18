import { GKQuestion } from '../types/question';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Security Division: Sanitize user input to prevent XSS and malicious payloads
 */
export function sanitizeString(input?: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers like onclick=...
    .replace(/javascript\s*:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Security Division: Validate image sources to block malicious protocols
 */
export function isSafeImageUrl(url?: string): boolean {
  if (!url) return true;
  const clean = url.trim().toLowerCase();
  // Safe protocols: data:image, http:, https:, or relative /
  if (clean.startsWith('data:image/') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
    // Ensure no embedded script in data uri
    if (clean.includes('<script') || clean.includes('javascript:')) {
      return false;
    }
    return true;
  }
  return false;
}

export function validateQuestion(question: Partial<GKQuestion>): ValidationResult {
  const qText = sanitizeString(question.question);
  if (!qText) {
    return {
      isValid: false,
      error: 'Please enter a valid question.',
    };
  }

  const optA = sanitizeString(question.optionA);
  const optB = sanitizeString(question.optionB);
  const optC = sanitizeString(question.optionC);
  const optD = sanitizeString(question.optionD);

  if (!optA || !optB || !optC || !optD) {
    return {
      isValid: false,
      error: 'Please enter all four options (A, B, C, and D).',
    };
  }

  if (question.image && !isSafeImageUrl(question.image)) {
    return {
      isValid: false,
      error: 'Unsafe image source detected. Only HTTP, HTTPS, and Data URI images are permitted.',
    };
  }

  return { isValid: true };
}
