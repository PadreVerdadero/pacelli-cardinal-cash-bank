import { prisma } from "@/lib/prisma";
import { canManageAccounts, type Role } from "@/lib/roles";

export async function getSchoolSettings() {
  return prisma.schoolSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function canAccessAccountsPage(role: Role | string | null | undefined) {
  if (canManageAccounts(role)) return true;
  if (role !== "TEACHER") return false;
  const settings = await getSchoolSettings();
  return settings.teachersCanEditAssignedStudentLogins;
}

/** Teacher may edit this student login when the school setting is on and the student is assigned. */
export async function teacherCanEditStudentLogin(
  teacherId: string,
  studentId: string | null | undefined,
) {
  if (!studentId) return false;
  const settings = await getSchoolSettings();
  if (!settings.teachersCanEditAssignedStudentLogins) return false;
  const link = await prisma.teacherStudent.findUnique({
    where: {
      teacherId_studentId: { teacherId, studentId },
    },
    select: { teacherId: true },
  });
  return Boolean(link);
}
