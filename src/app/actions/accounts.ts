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
