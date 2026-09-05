import { auth } from "@/lib/auth";
import {
  canManageAccounts,
  canManageActivities,
  canManageStore,
  canTransact,
  canViewAllStudents,
  isStaff,
  type Role,
} from "@/lib/roles";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Sign in required");
  }
  return session.user;
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
