import { cookies } from "next/headers";
import { ROLES, type Role } from "@/lib/roles";

export const VIEW_AS_COOKIE = "ccb_view_as";

/** Roles Super Admin can preview (not their own). */
export const VIEW_AS_OPTIONS = ["ADMIN", "TEACHER", "STUDENT"] as const satisfies readonly Role[];

export function parseViewAsRole(value: string | undefined | null): Role | null {
  if (!value) return null;
  if (!(ROLES as readonly string[]).includes(value)) return null;
  if (value === "SUPER_ADMIN") return null;
  return value as Role;
}

export async function readViewAsCookie(): Promise<Role | null> {
  const jar = await cookies();
  return parseViewAsRole(jar.get(VIEW_AS_COOKIE)?.value);
}

export function resolveEffectiveRole(realRole: Role, viewAs: Role | null): Role {
  if (realRole !== "SUPER_ADMIN") return realRole;
  return viewAs ?? realRole;
}

export function effectiveRoleFromRequest(
  realRole: string | undefined | null,
  cookieValue: string | undefined,
): string | undefined | null {
  if (realRole !== "SUPER_ADMIN") return realRole;
  return parseViewAsRole(cookieValue) ?? realRole;
}
