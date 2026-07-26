export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function getAuthCookieExpiry(): Date {
  return new Date(Date.now() + AUTH_COOKIE_MAX_AGE_SECONDS * 1000);
}
