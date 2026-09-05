"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireTransactor } from "@/lib/session";

const adjustSchema = z.object({
  studentId: z.string().min(1),
  amount: z.string().min(1),
  note: z.string().optional(),
  mode: z.enum(["add", "subtract", "store", "activity"]),
  activityId: z.string().optional(),
  storeItemId: z.string().optional(),
});

export async function adjustBalance(input: {
  studentId: string;
  amount: string;
  note?: string;
  mode: "add" | "subtract" | "store" | "activity";
  activityId?: string;
  storeItemId?: string;
}) {
  const actor = await requireTransactor();
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid adjustment request." };
  }

  let amountCents: number;
  let note = parsed.data.note?.trim() || null;
  let activityId: string | null = null;
  let storeItemId: string | null = null;
  let type = parsed.data.mode.toUpperCase();

  try {
    if (parsed.data.mode === "activity" && parsed.data.activityId) {
      const activity = await prisma.activity.findUnique({
        where: { id: parsed.data.activityId },
      });
      if (!activity || !activity.active) {
        return { error: "Activity not found." };
      }
      amountCents = activity.valueCents;
      activityId = activity.id;
      note = note || activity.name;
      type = "ACTIVITY";
    } else if (parsed.data.mode === "store" && parsed.data.storeItemId) {
      const item = await prisma.storeItem.findUnique({
        where: { id: parsed.data.storeItemId },
      });
      if (!item || !item.active) {
        return { error: "Store item not found." };
      }
      amountCents = item.priceCents;
      storeItemId = item.id;
      note = note || item.name;
      type = "STORE";
    } else {
      amountCents = dollarsToCents(parsed.data.amount);
    }
  } catch {
    return { error: "Enter a valid dollar amount." };
  }

  if (amountCents <= 0) {
    return { error: "Amount must be greater than zero." };
  }

  const signed =
    parsed.data.mode === "add" || parsed.data.mode === "activity"
      ? amountCents
      : -amountCents;

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
          userId: actor.id,
          amountCents: signed,
          type,
          note,
          activityId,
          storeItemId,
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
