"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAccountManager } from "@/lib/session";

function slugUsername(firstName: string, lastName: string, studentNumber?: string | null) {
  const base = `${firstName[0] ?? ""}${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const withNumber = studentNumber
    ? `${base}${studentNumber}`.toLowerCase().replace(/[^a-z0-9]/g, "")
    : base;
  return (withNumber || `student${Date.now()}`).slice(0, 36);
}

const massSchema = z.object({
  defaultPassword: z.string().min(6),
  onlyWithoutLogin: z.boolean().default(true),
});

export async function massCreateStudentLogins(formData: FormData) {
  await requireAccountManager();

  const parsed = massSchema.safeParse({
    defaultPassword: formData.get("defaultPassword"),
    onlyWithoutLogin: formData.get("onlyWithoutLogin") !== "false",
  });
  if (!parsed.success) {
    return { error: "Default password must be at least 6 characters." };
  }

  const students = await prisma.student.findMany({
    where: {
      active: true,
      ...(parsed.data.onlyWithoutLogin ? { user: null } : {}),
    },
    include: { user: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const passwordHash = await hash(parsed.data.defaultPassword, 10);
  let created = 0;
  let skipped = 0;

  for (const student of students) {
    if (student.user) {
      skipped += 1;
      continue;
    }

    let username = slugUsername(
      student.firstName,
      student.lastName,
      student.studentNumber,
    );
    let attempt = 0;
    while (attempt < 20) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (!existing) break;
      attempt += 1;
      username = `${slugUsername(student.firstName, student.lastName, student.studentNumber)}${attempt}`;
    }

    try {
      await prisma.user.create({
        data: {
          name: `${student.firstName} ${student.lastName}`,
          username,
          role: "STUDENT",
          passwordHash,
          studentId: student.id,
        },
      });
      created += 1;
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/teacher/students");
  revalidatePath("/teacher/accounts");
  return { success: true, created, skipped, password: parsed.data.defaultPassword };
}
