"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const teacherSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function createTeacher(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Teachers only" };
  }

  const parsed = teacherSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Name, valid email, and password (6+ chars) are required." };
  }

  try {
    await prisma.teacher.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash: await hash(parsed.data.password, 10),
      },
    });
  } catch {
    return { error: "Could not create teacher. Email may already be in use." };
  }

  revalidatePath("/teacher/teachers");
  return { success: true };
}
