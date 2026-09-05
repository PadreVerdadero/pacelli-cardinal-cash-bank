"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/roles";
import { homePathForRole } from "@/lib/session";
import {
  VIEW_AS_COOKIE,
  VIEW_AS_STUDENT_COOKIE,
  parseViewAsRole,
  readViewAsStudentId,
  viewAsCookieOptions,
} from "@/lib/view-as";

export async function setViewAsRole(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Only Super Admin can change role view");
  }

  const raw = String(formData.get("role") ?? "");
  const jar = await cookies();

  if (!raw || raw === "SUPER_ADMIN") {
    jar.delete(VIEW_AS_COOKIE);
    jar.delete(VIEW_AS_STUDENT_COOKIE);
    redirect("/teacher");
  }

  const viewAs = parseViewAsRole(raw);
  if (!viewAs) {
    throw new Error("Invalid role view");
  }

  jar.set(VIEW_AS_COOKIE, viewAs, viewAsCookieOptions());

  if (viewAs !== "STUDENT") {
    jar.delete(VIEW_AS_STUDENT_COOKIE);
    redirect(homePathForRole(viewAs as Role));
  }

  const preferredId = await readViewAsStudentId();
  const student =
    (preferredId
      ? await prisma.student.findFirst({
          where: { id: preferredId, active: true },
          select: { id: true, qrToken: true },
        })
      : null) ??
    (session.user.studentId
      ? await prisma.student.findFirst({
          where: { id: session.user.studentId, active: true },
          select: { id: true, qrToken: true },
        })
      : null) ??
    (await prisma.student.findFirst({
      where: { active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, qrToken: true },
    }));

  if (student) {
    jar.set(VIEW_AS_STUDENT_COOKIE, student.id, viewAsCookieOptions());
    redirect(homePathForRole("STUDENT", student.qrToken));
  }

  redirect("/");
}

export async function setViewAsStudent(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Only Super Admin can change student preview");
  }

  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!studentId) {
    throw new Error("Student is required");
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, active: true },
    select: { id: true, qrToken: true },
  });
  if (!student) {
    throw new Error("Student not found");
  }

  const jar = await cookies();
  jar.set(VIEW_AS_COOKIE, "STUDENT", viewAsCookieOptions());
  jar.set(VIEW_AS_STUDENT_COOKIE, student.id, viewAsCookieOptions());
  redirect(homePathForRole("STUDENT", student.qrToken));
}
