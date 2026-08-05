export type SignInFieldErrors = {
  email?: string;
  password?: string;
};

export type SignUpFieldErrors = SignInFieldErrors & {
  confirmPassword?: string;
};

export type ProfileFieldErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  legalAccepted?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const validateEmail = (value: string): string | undefined => {
  const email = normalizeEmail(value);
  if (!email) return 'Email address is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  return undefined;
};

export const validatePassword = (value: string): string | undefined => {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Use at least 8 characters.';
  return undefined;
};

export const validateSignIn = (email: string, password: string): SignInFieldErrors => ({
  email: validateEmail(email),
  password: password ? undefined : 'Password is required.',
});

export const validateSignUp = (
  email: string,
  password: string,
  confirmPassword: string,
): SignUpFieldErrors => ({
  email: validateEmail(email),
  password: validatePassword(password),
  confirmPassword:
    !confirmPassword
      ? 'Confirm your password.'
      : password !== confirmPassword
        ? 'Passwords do not match.'
        : undefined,
});

export const validateVerificationCode = (code: string, allowBackupCode = false) => {
  const normalized = code.trim();
  if (!normalized) return 'Enter the verification code.';
  if (!allowBackupCode && !/^\d{6}$/.test(normalized)) return 'Enter the 6-digit code.';
  return undefined;
};

export const hasFieldErrors = (errors: Record<string, string | undefined>) =>
  Object.values(errors).some(Boolean);

export const getErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    if ('longMessage' in error && typeof error.longMessage === 'string' && error.longMessage) {
      return error.longMessage;
    }
    if ('message' in error && typeof error.message === 'string' && error.message) {
      return error.message;
    }
  }
  return fallback;
};

export const isAlreadyVerifiedError = (error: unknown) =>
  getErrorCode(error) === 'verification_already_verified';

export const getReadableFieldName = (field: string) =>
  field
    .replace(/^oauth_/, '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
