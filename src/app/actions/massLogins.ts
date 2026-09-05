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

function splitCsvLine(line: string) {
  return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
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

/**
 * CSV columns (header row required):
 * - username, password (required)
 * - studentNumber (preferred match) and/or firstName,lastName
 */
export async function importStudentLoginsCsv(csvText: string) {
  await requireAccountManager();

  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { error: "CSV needs a header row and at least one login row." };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const usernameIdx = headers.indexOf("username");
  const passwordIdx = headers.indexOf("password");
  const numberIdx = headers.indexOf("studentnumber");
  const firstIdx = headers.indexOf("firstname");
  const lastIdx = headers.indexOf("lastname");

  if (usernameIdx === -1 || passwordIdx === -1) {
    return { error: "CSV must include username and password columns." };
  }
  if (numberIdx === -1 && (firstIdx === -1 || lastIdx === -1)) {
    return {
      error:
        "CSV must include studentNumber, or both firstName and lastName, to match each student.",
    };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const problems: string[] = [];

  for (const [offset, line] of lines.slice(1).entries()) {
    const rowNumber = offset + 2;
    const cols = splitCsvLine(line);
    const username = (cols[usernameIdx] ?? "").toLowerCase().replace(/\s+/g, "");
    const password = cols[passwordIdx] ?? "";
    const studentNumber = numberIdx >= 0 ? cols[numberIdx] || null : null;
    const firstName = firstIdx >= 0 ? cols[firstIdx] || "" : "";
    const lastName = lastIdx >= 0 ? cols[lastIdx] || "" : "";

    if (!username || username.length < 3) {
      skipped += 1;
      problems.push(`Row ${rowNumber}: username must be at least 3 characters.`);
      continue;
    }
    if (!password) {
      skipped += 1;
      problems.push(`Row ${rowNumber}: password is required.`);
      continue;
    }

    let student =
      studentNumber
        ? await prisma.student.findUnique({
            where: { studentNumber },
            include: { user: true },
          })
        : null;

    if (!student && firstName && lastName) {
      const matches = await prisma.student.findMany({
        where: {
          firstName: { equals: firstName, mode: "insensitive" },
          lastName: { equals: lastName, mode: "insensitive" },
          active: true,
        },
        include: { user: true },
        take: 2,
      });
      if (matches.length === 1) {
        student = matches[0];
      } else if (matches.length > 1) {
        skipped += 1;
        problems.push(
          `Row ${rowNumber}: multiple students named ${firstName} ${lastName}; use studentNumber.`,
        );
        continue;
      }
    }

    if (!student) {
      skipped += 1;
      problems.push(
        `Row ${rowNumber}: no matching student` +
          (studentNumber ? ` for number ${studentNumber}` : ` for ${firstName} ${lastName}`) +
          ".",
      );
      continue;
    }

    const passwordHash = await hash(password, 10);
    const displayName = `${student.firstName} ${student.lastName}`;

    try {
      if (student.user) {
        const taken = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id: student.user.id },
          },
          select: { id: true },
        });
        if (taken) {
          skipped += 1;
          problems.push(`Row ${rowNumber}: username @${username} is already taken.`);
          continue;
        }

        await prisma.user.update({
          where: { id: student.user.id },
          data: {
            name: displayName,
            username,
            passwordHash,
            role: "STUDENT",
            active: true,
            studentId: student.id,
          },
        });
        updated += 1;
      } else {
        const taken = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });
        if (taken) {
          skipped += 1;
          problems.push(`Row ${rowNumber}: username @${username} is already taken.`);
          continue;
        }

        await prisma.user.create({
          data: {
            name: displayName,
            username,
            role: "STUDENT",
            passwordHash,
            studentId: student.id,
          },
        });
        created += 1;
      }
    } catch {
      skipped += 1;
      problems.push(`Row ${rowNumber}: could not save login for @${username}.`);
    }
  }

  revalidatePath("/teacher/students");
  revalidatePath("/teacher/accounts");
  return {
    success: true,
    created,
    updated,
    skipped,
    problems: problems.slice(0, 8),
  };
}
