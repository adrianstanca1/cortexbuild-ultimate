/**
 * Frontend Security Patterns
 * XSS Prevention, CSP Implementation, and Security Best Practices
 */

// ═══════════════════════════════════════════════════════════════════════════════
// XSS PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize user input to prevent XSS attacks
 * Always use this for any user-generated content rendered in HTML
 */
export function sanitizeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitize for attribute context (not HTML content)
 */
export function sanitizeAttribute(str: string): string {
  return str
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Validate URL protocol to prevent javascript: attacks
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'about:blank';
    }
    return url;
  } catch {
    return 'about:blank';
  }
}

/**
 * Check if string contains potential XSS patterns
 */
export function containsXSS(str: string): boolean {
  const patterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<style/i,
    /@import/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ];
  return patterns.some(pattern => pattern.test(str));
}


// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT SECURITY POLICY (CSP)
// ═══════════════════════════════════════════════════════════════════════════════

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'object-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'report-uri'?: string;
  'report-to'?: string;
}

export function buildCSP(directives: CSPDirectives): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (key === 'report-uri' || key === 'report-to') {
      parts.push(`${key} ${value}`);
      continue;
    }
    if (key === 'upgrade-insecure-requests' && value === true) {
      parts.push(key);
      continue;
    }
    if (Array.isArray(value) && value.length > 0) {
      parts.push(`${key} '${value.join(" '")}'`);
    }
  }

  return parts.join('; ');
}

/**
 * Default CSP for CortexBuild - strict but functional
 */
export const DEFAULT_CSP: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "localhost:5173"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'img-src': ["'self'", "data:", "blob:", "https:"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'connect-src': [
    "'self'",
    "ws://localhost:3001",
    "wss://localhost:3001",
    "http://localhost:3001",
    "https://www.cortexbuildpro.com",
  ],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
};


// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SecurityHeaders {
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Strict-Transport-Security'?: string;
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self), payment=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};


// ═══════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) errors.push('At least 8 characters required');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required');
  if (!/[0-9]/.test(password)) errors.push('At least one number required');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character required');

  return {
    isStrong: errors.length === 0,
    errors,
  };
}

/**
 * Validate file upload
 */
export interface FileValidation {
  isValid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidation {
  const { maxSizeMB = 10, allowedTypes, allowedExtensions } = options;

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} not allowed` };
  }

  if (allowedExtensions) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return { isValid: false, error: `File extension .${ext} not allowed` };
    }
  }

  return { isValid: true };
}


// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TOKEN_KEY = 'cortexbuild_token';
const USER_KEY = 'cortexbuild_user';

/**
 * Secure token storage with automatic expiry
 */
export function secureTokenStorage() {
  return {
    setToken(token: string, expiresInSeconds?: number): void {
      const payload = {
        value: token,
        expiry: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : null,
      };
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
    },

    getToken(): string | null {
      try {
        const raw = sessionStorage.getItem(TOKEN_KEY);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        if (payload.expiry && Date.now() > payload.expiry) {
          sessionStorage.removeItem(TOKEN_KEY);
          return null;
        }
        return payload.value;
      } catch {
        return null;
      }
    },

    clearToken(): void {
      sessionStorage.removeItem(TOKEN_KEY);
    },
  };
}

/**
 * Secure user storage
 */
export function secureUserStorage() {
  return {
    setUser<T>(user: T): void {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getUser<T>(): T | null {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    clearUser(): void {
      localStorage.removeItem(USER_KEY);
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// API SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add CSRF token to requests
 */
export function withCSRF(token: string): RequestInit {
  return {
    credentials: 'include',
    headers: {
      'X-CSRF-Token': token,
    },
  };
}

/**
 * Build authenticated headers
 */
export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Validate response for security indicators
 */
export function validateResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    console.warn('Unexpected content type:', contentType);
    return false;
  }
  return true;
}


// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING (CLIENT-SIDE)
// ═══════════════════════════════════════════════════════════════════════════════

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests: number[] = [];

  return {
    canMakeRequest(): boolean {
      const now = Date.now();
      while (requests.length > 0 && now - requests[0] > windowMs) {
        requests.shift();
      }
      return requests.length < maxRequests;
    },

    recordRequest(): void {
      requests.push(Date.now());
    },

    timeUntilNextRequest(): number {
      if (requests.length === 0) return 0;
      const oldest = requests[0];
      return Math.max(0, windowMs - (Date.now() - oldest));
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECURE COMPONENT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate random secure token
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
