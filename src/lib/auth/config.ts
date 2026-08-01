export const AUTH_COOKIE_NAME = "hafalan_session";
export const SESSION_MAX_AGE_SECONDS = Number(
  process.env.SESSION_MAX_AGE ?? 2592000
);
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;
export const QR_TOKEN_EXPIRY_MS = Number(
  process.env.QR_TOKEN_EXPIRY ?? 300000
);
export const BCRYPT_SALT_ROUNDS = 12;
export const ROLES = ["guru", "admin", "superadmin"] as const;
export type Role = (typeof ROLES)[number];
