export const ROLES = ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"] as const;

export type Role = (typeof ROLES)[number];

export function roleLabel(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "TEACHER":
      return "Teacher";
    case "STUDENT":
      return "Student";
  }
}

export function isStaff(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "TEACHER";
}

export function canViewAllStudents(role?: string | null): boolean {
  return isStaff(role);
}

export function canTransact(role?: string | null): boolean {
  return isStaff(role);
}

export function canManageStore(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManageActivities(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManageAccounts(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN";
}

export function canDeleteTransactions(role?: string | null): boolean {
  return isAdmin(role);
}

export function canManageGroups(role?: string | null): boolean {
  return isStaff(role);
}

/** Roles the actor is allowed to create or assign. */
export function creatableRoles(actorRole?: string | null): Role[] {
  if (actorRole === "SUPER_ADMIN") {
    return ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"];
  }
  if (actorRole === "ADMIN") {
    return ["ADMIN", "TEACHER", "STUDENT"];
  }
  return [];
}

export function canEditUser(
  actorRole: string | null | undefined,
  targetRole: string,
): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "ADMIN") {
    return targetRole === "ADMIN" || targetRole === "TEACHER" || targetRole === "STUDENT";
  }
  return false;
}

export function canDeleteUser(
  actorRole: string | null | undefined,
  targetRole: string,
  targetId: string,
  actorId: string,
): boolean {
  if (targetRole === "SUPER_ADMIN") return false;
  if (targetId === actorId) return false;
  return canEditUser(actorRole, targetRole);
}
