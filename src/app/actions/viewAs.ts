"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/roles";
import { homePathForRole } from "@/lib/session";
import { VIEW_AS_COOKIE, parseViewAsRole } from "@/lib/view-as";

export async function setViewAsRole(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Only Super Admin can change role view");
  }

  const raw = String(formData.get("role") ?? "");
  const jar = await cookies();

  if (!raw || raw === "SUPER_ADMIN") {
    jar.delete(VIEW_AS_COOKIE);
    redirect("/teacher");
  }

  const viewAs = parseViewAsRole(raw);
  if (!viewAs) {
    throw new Error("Invalid role view");
  }

  jar.set(VIEW_AS_COOKIE, viewAs, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });

  if (viewAs === "STUDENT") {
    const linked = session.user.studentId
      ? await prisma.student.findUnique({
          where: { id: session.user.studentId },
          select: { qrToken: true, active: true },
        })
      : null;

    const student =
      linked?.active && linked.qrToken
        ? linked
        : await prisma.student.findFirst({
            where: { active: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: { qrToken: true, active: true },
          });

    if (student?.active && student.qrToken) {
      redirect(homePathForRole("STUDENT", student.qrToken));
    }
    redirect("/");
  }

  redirect(homePathForRole(viewAs as Role));
}
