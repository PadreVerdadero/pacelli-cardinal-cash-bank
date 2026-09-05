"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import { requireSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/settings";

export async function updateSchoolSettings(formData: FormData) {
  const actor = await requireSession();
  if (!isAdmin(actor.role)) {
    return { error: "Admins only." };
  }

  const teachersCanEditAssignedStudentLogins =
    String(formData.get("teachersCanEditAssignedStudentLogins") ?? "") === "on" ||
    String(formData.get("teachersCanEditAssignedStudentLogins") ?? "") === "true";

  await prisma.schoolSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      teachersCanEditAssignedStudentLogins,
    },
    update: { teachersCanEditAssignedStudentLogins },
  });

  revalidatePath("/teacher/accounts");
  revalidatePath("/teacher");
  return { success: true };
}

export async function setTeacherAssignments(formData: FormData) {
  const actor = await requireSession();
  if (!isAdmin(actor.role)) {
    return { error: "Admins only." };
  }

  const teacherId = String(formData.get("teacherId") ?? "");
  if (!teacherId) return { error: "Teacher is required." };

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { id: true, role: true },
  });
  if (!teacher || teacher.role !== "TEACHER") {
    return { error: "Assignments are only for Teacher accounts." };
  }

  const studentIds = formData
    .getAll("studentIds")
    .map((value) => String(value))
    .filter(Boolean);

  await prisma.$transaction(async (tx) => {
    await tx.teacherStudent.deleteMany({ where: { teacherId } });
    if (studentIds.length > 0) {
      await tx.teacherStudent.createMany({
        data: studentIds.map((studentId) => ({ teacherId, studentId })),
        skipDuplicates: true,
      });
    }
  });

  revalidatePath("/teacher/accounts");
  return { success: true };
}

export async function readTeachersCanEditAssignedLogins() {
  const settings = await getSchoolSettings();
  return settings.teachersCanEditAssignedStudentLogins;
}
