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

const adjustSchema = z.object({
  studentId: z.string().min(1),
  amount: z.string().min(1),
  note: z.string().optional(),
  mode: z.enum(["add", "subtract", "store"]),
});

export async function adjustBalance(input: {
  studentId: string;
  amount: string;
  note?: string;
  mode: "add" | "subtract" | "store";
}) {
  const teacher = await requireTeacher();
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid adjustment request." };
  }

  let amountCents: number;
  try {
    amountCents = dollarsToCents(parsed.data.amount);
  } catch {
    return { error: "Enter a valid dollar amount." };
  }

  if (amountCents <= 0) {
    return { error: "Amount must be greater than zero." };
  }

  const signed =
    parsed.data.mode === "add" ? amountCents : -amountCents;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: parsed.data.studentId },
      });
      if (!student || !student.active) {
        throw new Error("Student not found.");
      }

      const nextBalance = student.balanceCents + signed;
      if (nextBalance < 0) {
        throw new Error("Not enough Cardinal Cash for this purchase.");
      }

      const updated = await tx.student.update({
        where: { id: student.id },
        data: { balanceCents: nextBalance },
      });

      await tx.transaction.create({
        data: {
          studentId: student.id,
          teacherId: teacher.id,
          amountCents: signed,
          type: parsed.data.mode.toUpperCase(),
          note: parsed.data.note?.trim() || null,
        },
      });

      return updated;
    });

    revalidatePath("/");
    revalidatePath(`/students/${result.qrToken}`);
    revalidatePath("/teacher");
    revalidatePath("/teacher/store");
    return { success: true, balanceCents: result.balanceCents };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update balance.",
    };
  }
}
