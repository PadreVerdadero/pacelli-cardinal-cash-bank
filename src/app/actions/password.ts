"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
});

export async function changePassword(formData: FormData) {
  const user = await requireSession();

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: "Enter your current password and a new password (6+ characters)." };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) {
    return { error: "Account not found." };
  }

  const valid = await compare(parsed.data.currentPassword, record.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.newPassword, 10) },
  });

  revalidatePath("/account");
  return { success: true };
}
