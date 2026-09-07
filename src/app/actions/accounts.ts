"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  canDeleteUser,
  canEditUser,
  creatableRoles,
  type Role,
} from "@/lib/roles";
import {
  requireAccountManager,
  requireAccountsAccess,
} from "@/lib/session";
import { teacherCanEditStudentLogin } from "@/lib/settings";

const createSchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().min(3).max(40),
  password: z.string().min(6),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"]),
  email: z.string().trim().email().optional().or(z.literal("")),
  studentId: z.string().optional().or(z.literal("")),
  firstName: z.string().trim().optional().or(z.literal("")),
  lastName: z.string().trim().optional().or(z.literal("")),
  studentNumber: z.string().trim().optional().or(z.literal("")),
  grade: z.string().trim().optional().or(z.literal("")),
});

export async function createAccount(formData: FormData) {
  const { user: actor, fullAccess } = await requireAccountsAccess();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
    email: formData.get("email"),
    studentId: formData.get("studentId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    studentNumber: formData.get("studentNumber"),
    grade: formData.get("grade"),
  });

  if (!parsed.success) {
    return { error: "Name, username (3+), password (6+), and role are required." };
  }

  if (!fullAccess) {
    if (parsed.data.role !== "STUDENT" || !parsed.data.studentId) {
      return {
        error: "Teachers can only create logins for their assigned students.",
      };
    }
    if (!(await teacherCanEditStudentLogin(actor.id, parsed.data.studentId))) {
      return { error: "That student is not assigned to you." };
    }
    const existing = await prisma.user.findUnique({
      where: { studentId: parsed.data.studentId },
      select: { id: true },
    });
    if (existing) {
      return { error: "That student already has a login." };
    }
  } else {
    const allowed = creatableRoles(actor.role);
    if (!allowed.includes(parsed.data.role as Role)) {
      return { error: "You cannot create that role." };
    }
  }

  const username = parsed.data.username.toLowerCase();

  try {
    let studentId: string | null = parsed.data.studentId || null;

    if (parsed.data.role === "STUDENT") {
      if (!studentId) {
        if (!fullAccess) {
          return { error: "Choose an assigned student for the login." };
        }
        if (!parsed.data.firstName || !parsed.data.lastName) {
          return {
            error: "Student accounts need a linked student or first/last name.",
          };
        }
        const student = await prisma.student.create({
          data: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            studentNumber: parsed.data.studentNumber || null,
            grade: parsed.data.grade || null,
          },
        });
        studentId = student.id;
      }
    } else {
      studentId = null;
    }

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        username,
        email: parsed.data.email ? parsed.data.email.toLowerCase() : null,
        passwordHash: await hash(parsed.data.password, 10),
        role: parsed.data.role,
        studentId,
      },
    });
  } catch {
    return { error: "Could not create account. Username may already be taken." };
  }

  revalidatePath("/teacher/accounts");
  revalidatePath("/teacher/students");
  return { success: true };
}

export async function updateAccount(formData: FormData) {
  const { user: actor, fullAccess } = await requireAccountsAccess();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  const active = String(formData.get("active") ?? "true") === "true";
  const password = String(formData.get("password") ?? "");

  if (!id || !name || username.length < 3) {
    return { error: "Name and username (3+ characters) are required." };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "Account not found." };

  if (!fullAccess) {
    if (
      target.role !== "STUDENT" ||
      !(await teacherCanEditStudentLogin(actor.id, target.studentId))
    ) {
      return { error: "You can only edit logins for your assigned students." };
    }
  } else {
    if (!canEditUser(actor.role, target.role)) {
      return { error: "You cannot edit that account." };
    }
    if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
      return { error: "Only a Super Admin can edit a Super Admin." };
    }
    if (role && role !== target.role) {
      if (target.role === "SUPER_ADMIN") {
        return { error: "A Super Admin role cannot be changed." };
      }
      if (!creatableRoles(actor.role).includes(role)) {
        return { error: "You cannot assign that role." };
      }
    }
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        username,
        email: emailRaw ? emailRaw.toLowerCase() : null,
        role: fullAccess
          ? target.role === "SUPER_ADMIN"
            ? "SUPER_ADMIN"
            : role
          : "STUDENT",
        active: fullAccess
          ? target.role === "SUPER_ADMIN"
            ? true
            : active
          : active,
        ...(password.length >= 6
          ? { passwordHash: await hash(password, 10) }
          : {}),
      },
    });
  } catch {
    return { error: "Could not update account. Username may already be taken." };
  }

  revalidatePath("/teacher/accounts");
  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const actor = await requireAccountManager();
  const id = String(formData.get("id") ?? "");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "Account not found." };

  if (!canDeleteUser(actor.role, target.role, target.id, actor.id)) {
    return {
      error:
        target.role === "SUPER_ADMIN"
          ? "Super Admin accounts can never be deleted."
          : "You cannot delete that account.",
    };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/teacher/accounts");
  return { success: true };
}

function splitCsvLine(line: string) {
  return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
}

function parseStaffRole(raw: string): Role | null {
  const normalized = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (normalized) {
    case "super_admin":
    case "superadmin":
    case "super":
      return "SUPER_ADMIN";
    case "admin":
    case "administrator":
      return "ADMIN";
    case "teacher":
    case "staff":
      return "TEACHER";
    default:
      return null;
  }
}

/**
 * CSV for Admin/Teacher (and Super Admin if allowed) accounts.
 * Required columns: firstName,lastName,username,password,role
 */
export async function importStaffAccountsCsv(csvText: string) {
  const actor = await requireAccountManager();
  const allowed = creatableRoles(actor.role).filter(
    (role) => role === "ADMIN" || role === "TEACHER",
  );

  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { error: "CSV needs a header row and at least one account row." };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const firstIdx = headers.indexOf("firstname");
  const lastIdx = headers.indexOf("lastname");
  const usernameIdx = headers.indexOf("username");
  const passwordIdx = headers.indexOf("password");
  const roleIdx = headers.indexOf("role");

  if (
    firstIdx === -1 ||
    lastIdx === -1 ||
    usernameIdx === -1 ||
    passwordIdx === -1 ||
    roleIdx === -1
  ) {
    return {
      error:
        "CSV must include firstName, lastName, username, password, and role columns.",
    };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const problems: string[] = [];

  for (const [offset, line] of lines.slice(1).entries()) {
    const rowNumber = offset + 2;
    const cols = splitCsvLine(line);
    const firstName = (cols[firstIdx] ?? "").trim();
    const lastName = (cols[lastIdx] ?? "").trim();
    const username = (cols[usernameIdx] ?? "").toLowerCase().replace(/\s+/g, "");
    const password = cols[passwordIdx] ?? "";
    const role = parseStaffRole(cols[roleIdx] ?? "");

    if (!firstName || !lastName) {
      skipped += 1;
      problems.push(`Row ${rowNumber}: firstName and lastName are required.`);
      continue;
    }
    if (!username || username.length < 3) {
      skipped += 1;
      problems.push(`Row ${rowNumber}: username must be at least 3 characters.`);
      continue;
    }
    if (!password || password.length < 6) {
      skipped += 1;
      problems.push(`Row ${rowNumber}: password must be at least 6 characters.`);
      continue;
    }
    if (!role || role === "SUPER_ADMIN" || role === "STUDENT") {
      skipped += 1;
      problems.push(
        `Row ${rowNumber}: role must be Admin or Teacher (Super Admin cannot be created by upload).`,
      );
      continue;
    }
    if (!allowed.includes(role)) {
      skipped += 1;
      problems.push(`Row ${rowNumber}: you cannot create or assign ${role}.`);
      continue;
    }

    const name = `${firstName} ${lastName}`.trim();
    const passwordHash = await hash(password, 10);

    try {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        if (!canEditUser(actor.role, existing.role)) {
          skipped += 1;
          problems.push(
            `Row ${rowNumber}: you cannot edit existing account @${username}.`,
          );
          continue;
        }
        if (existing.role === "SUPER_ADMIN") {
          skipped += 1;
          problems.push(
            `Row ${rowNumber}: Super Admin accounts cannot be changed by upload.`,
          );
          continue;
        }

        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            passwordHash,
            role,
            active: true,
            studentId: null,
          },
        });
        updated += 1;
      } else {
        await prisma.user.create({
          data: {
            name,
            username,
            passwordHash,
            role,
            active: true,
          },
        });
        created += 1;
      }
    } catch {
      skipped += 1;
      problems.push(`Row ${rowNumber}: could not save account @${username}.`);
    }
  }

  revalidatePath("/teacher/accounts");
  return {
    success: true,
    created,
    updated,
    skipped,
    problems: problems.slice(0, 8),
  };
}
