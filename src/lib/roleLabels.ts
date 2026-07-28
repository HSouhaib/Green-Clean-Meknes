import type { Lang } from "@/contexts/language-context";

export const BUILTIN_ROLE_KEYS: Record<string, string> = {
  super_admin: "admin.roles.super_admin",
  admin: "admin.roles.admin",
  content_manager: "admin.roles.content_manager",
  volunteer_coordinator: "admin.roles.volunteer_coordinator",
  viewer: "admin.roles.viewer",
  user: "admin.roles.user",
};

export interface RoleLabels {
  name: string;
  labelEn: string;
  labelFr?: string | null;
  labelAr?: string | null;
}

/**
 * Returns the display label for a role: the translated label for built-in
 * roles, or the custom role's label in the current language (labelEn fallback).
 */
export function localizedRoleLabel(
  role: RoleLabels,
  lang: Lang,
  t: (key: string) => string
): string {
  if (BUILTIN_ROLE_KEYS[role.name]) return t(BUILTIN_ROLE_KEYS[role.name]);
  if (lang === "fr" && role.labelFr) return role.labelFr;
  if (lang === "ar" && role.labelAr) return role.labelAr;
  return role.labelEn;
}

/** Same as localizedRoleLabel but looks the role up by name first. */
export function roleLabelByName(
  roleName: string,
  roles: RoleLabels[] | undefined,
  lang: Lang,
  t: (key: string) => string
): string {
  if (BUILTIN_ROLE_KEYS[roleName]) return t(BUILTIN_ROLE_KEYS[roleName]);
  const role = roles?.find(r => r.name === roleName);
  if (!role) return roleName;
  return localizedRoleLabel(role, lang, t);
}
