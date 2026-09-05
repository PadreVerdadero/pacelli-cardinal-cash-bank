import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageAccounts,
  canManageActivities,
  canManageStore,
  canTransact,
  canViewAllStudents,
  isStaff,
  type Role,
} from "@/lib/roles";
import { canAccessAccountsPage } from "@/lib/settings";
import {
  readViewAsCookie,
  readViewAsStudentId,
  resolveEffectiveRole,
} from "@/lib/view-as";

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  /** Effective role (respects Super Admin view-as). */
  role: Role;
  /** Actual signed-in role. */
  realRole: Role;
  studentId?: string | null;
  viewingAs: boolean;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const realRole = session.user.role;
  const viewAs = realRole === "SUPER_ADMIN" ? await readViewAsCookie() : null;
  const role = resolveEffectiveRole(realRole, viewAs);

  let studentId = session.user.studentId ?? null;
  if (role === "STUDENT" && realRole === "SUPER_ADMIN") {
    const previewId = await readViewAsStudentId();
    if (previewId) {
      const preview = await prisma.student.findFirst({
        where: { id: previewId, active: true },
        select: { id: true },
      });
      studentId = preview?.id ?? null;
    }
    if (!studentId) {
      const fallback = await prisma.student.findFirst({
        where: { active: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { id: true },
      });
      studentId = fallback?.id ?? null;
    }
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
    realRole,
    studentId,
    viewingAs: Boolean(viewAs),
  };
}

export async function requireSession() {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Sign in required");
  }
  return user;
}

export async function requireStaff() {
  const user = await requireSession();
  if (!isStaff(user.role)) {
    throw new Error("Staff only");
  }
  return user;
}

export async function requireTransactor() {
  const user = await requireSession();
  if (!canTransact(user.role)) {
    throw new Error("Not allowed to change balances");
  }
  return user;
}

export async function requireAccountManager() {
  const user = await requireSession();
  if (!canManageAccounts(user.role)) {
    throw new Error("Admins only");
  }
  return user;
}

/** Full account managers, or teachers allowed to edit assigned student logins. */
export async function requireAccountsAccess() {
  const user = await requireSession();
  if (!(await canAccessAccountsPage(user.role))) {
    throw new Error("Not allowed to manage accounts");
  }
  return {
    user,
    fullAccess: canManageAccounts(user.role),
  };
}

export async function requireStoreManager() {
  const user = await requireSession();
  if (!canManageStore(user.role)) {
    throw new Error("Admins only");
  }
  return user;
}

export async function requireActivityManager() {
  const user = await requireSession();
  if (!canManageActivities(user.role)) {
    throw new Error("Admins only");
  }
  return user;
}

export function homePathForRole(role: Role, studentQrToken?: string | null) {
  if (role === "STUDENT" && studentQrToken) {
    return `/students/${studentQrToken}`;
  }
  if (isStaff(role)) {
    return "/teacher";
  }
  return "/";
}

export { canViewAllStudents };
