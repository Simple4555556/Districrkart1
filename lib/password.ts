/**
 * Shared password-validation and input-sanitization utilities.
 * Used by both API routes (server) and the register form (client — tree-shaken safely).
 */

export interface PasswordChecks {
  length: boolean;      // >= 8 characters
  uppercase: boolean;   // at least 1 A-Z
  lowercase: boolean;   // at least 1 a-z
  number: boolean;      // at least 1 0-9
  special: boolean;     // at least 1 non-alphanumeric
}

export interface PasswordValidation {
  valid: boolean;
  score: number;        // 0-5 — used for the strength bar
  checks: PasswordChecks;
  errors: string[];
}

/** Validate password against all security rules. */
export function validatePassword(password: string): PasswordValidation {
  const checks: PasswordChecks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  };

  const errors: string[] = [];
  if (!checks.length)    errors.push("At least 8 characters");
  if (!checks.uppercase) errors.push("One uppercase letter (A-Z)");
  if (!checks.lowercase) errors.push("One lowercase letter (a-z)");
  if (!checks.number)    errors.push("One number (0-9)");
  if (!checks.special)   errors.push("One special character (!@#$…)");

  const score = Object.values(checks).filter(Boolean).length;
  return { valid: errors.length === 0, score, checks, errors };
}

/** Strength label + colour for the UI progress bar. */
export function strengthMeta(score: number): { label: string; color: string } {
  if (score <= 1) return { label: "Very Weak",  color: "#EF4444" };
  if (score === 2) return { label: "Weak",       color: "#F97316" };
  if (score === 3) return { label: "Fair",       color: "#EAB308" };
  if (score === 4) return { label: "Strong",     color: "#22C55E" };
  return               { label: "Very Strong", color: "#16A34A" };
}

/** Basic RFC-5322-ish email format check. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Strip leading/trailing whitespace and HTML-encode the five characters
 * that cause XSS / injection: < > " ' &
 */
export function sanitizeInput(str: string): string {
  const MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.trim().replace(/[&<>"']/g, (c) => MAP[c] ?? c);
}
