"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { dollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";

async function requireTeacher() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Teachers only");
  }
  return session.user;
}

const studentSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  studentNumber: z.string().trim().optional().or(z.literal("")),
  grade: z.string().trim().optional().or(z.literal("")),
  initialBalance: z.string().optional().or(z.literal("")),
});

export async function createStudent(formData: FormData) {
  await requireTeacher();

  const parsed = studentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    studentNumber: formData.get("studentNumber"),
    grade: formData.get("grade"),
    initialBalance: formData.get("initialBalance"),
  });

  if (!parsed.success) {
    return { error: "Please fill in first and last name." };
  }

  let balanceCents = 0;
  if (parsed.data.initialBalance) {
    try {
      balanceCents = dollarsToCents(parsed.data.initialBalance);
    } catch {
      return { error: "Initial balance must be a valid number." };
    }
  }

  try {
    await prisma.student.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        studentNumber: parsed.data.studentNumber || null,
        grade: parsed.data.grade || null,
        balanceCents,
      },
    });
  } catch {
    return { error: "Could not create student. Student number may already exist." };
  }

  revalidatePath("/");
  revalidatePath("/teacher/students");
  return { success: true };
}

export async function importStudentsCsv(csvText: string) {
  await requireTeacher();

  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { error: "CSV needs a header row and at least one student." };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const firstIdx = headers.indexOf("firstname");
  const lastIdx = headers.indexOf("lastname");
  const numberIdx = headers.indexOf("studentnumber");
  const gradeIdx = headers.indexOf("grade");
  const balanceIdx = headers.indexOf("initialbalance");

  if (firstIdx === -1 || lastIdx === -1) {
    return {
      error: "CSV must include firstName and lastName columns.",
    };
  }

  let created = 0;
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const firstName = cols[firstIdx];
    const lastName = cols[lastIdx];
    if (!firstName || !lastName) {
      skipped += 1;
      continue;
    }

    const studentNumber = numberIdx >= 0 ? cols[numberIdx] || null : null;
    const grade = gradeIdx >= 0 ? cols[gradeIdx] || null : null;
    let balanceCents = 0;
    if (balanceIdx >= 0 && cols[balanceIdx]) {
      try {
        balanceCents = dollarsToCents(cols[balanceIdx]);
      } catch {
        skipped += 1;
        continue;
      }
    }

    try {
      if (studentNumber) {
        await prisma.student.upsert({
          where: { studentNumber },
          update: { firstName, lastName, grade, active: true },
          create: { firstName, lastName, studentNumber, grade, balanceCents },
        });
      } else {
        await prisma.student.create({
          data: { firstName, lastName, grade, balanceCents },
        });
      }
      created += 1;
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/");
  revalidatePath("/teacher/students");
  return { success: true, created, skipped };
}

export async function setStudentActive(studentId: string, active: boolean) {
  await requireTeacher();
  await prisma.student.update({
    where: { id: studentId },
    data: { active },
  });
  revalidatePath("/");
  revalidatePath("/teacher/students");
}
