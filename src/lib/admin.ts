type AuthLikeUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
};

export const ADMIN_EMAILS = [
  "valmirbc@gmail.com",
  "valmir-oliver@hotmail.com",
  "admin@radarleiloes.com",
  "suporte@radarleiloes.com",
];

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").toLowerCase().trim();
}

export function isNativeAdminEmail(email: string | null | undefined): boolean {
  const normalizedEmail = normalizeEmail(email);
  return (
    ADMIN_EMAILS.includes(normalizedEmail) ||
    normalizedEmail.endsWith("@radarleiloes.com.br") ||
    normalizedEmail.endsWith("@radarleiloes.com")
  );
}

export function hasDynamicAdminFlag(user: AuthLikeUser | null | undefined): boolean {
  if (!user?.app_metadata) return false;

  const roles = user.app_metadata.roles;
  return (
    user.app_metadata.is_admin === true ||
    user.app_metadata.role === "admin" ||
    (Array.isArray(roles) && roles.includes("admin"))
  );
}

export function isAdminUser(user: AuthLikeUser | null | undefined): boolean {
  return isNativeAdminEmail(user?.email) || hasDynamicAdminFlag(user);
}
