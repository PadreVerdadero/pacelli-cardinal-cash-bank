"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireTransactor } from "@/lib/session";

const groupSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().or(z.literal("")),
  studentIds: z.array(z.string()).default([]),
});

export async function createGroup(formData: FormData) {
  const actor = await requireStaff();
  const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    studentIds,
  });
  if (!parsed.success) return { error: "Group name is required." };
  if (parsed.data.studentIds.length === 0) {
    return { error: "Select at least one student for the group." };
  }

  await prisma.studentGroup.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      createdById: actor.id,
      members: {
        create: parsed.data.studentIds.map((studentId) => ({ studentId })),
      },
    },
  });

  revalidatePath("/teacher/groups");
  return { success: true };
}

export async function updateGroup(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    studentIds,
  });
  if (!id || !parsed.success) return { error: "Group name is required." };
  if (parsed.data.studentIds.length === 0) {
    return { error: "Select at least one student for the group." };
  }

  await prisma.$transaction([
    prisma.studentGroupMember.deleteMany({ where: { groupId: id } }),
    prisma.studentGroup.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        members: {
          create: parsed.data.studentIds.map((studentId) => ({ studentId })),
        },
      },
    }),
  ]);

  revalidatePath("/teacher/groups");
  return { success: true };
}

export async function deleteGroup(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing group." };
  await prisma.studentGroup.delete({ where: { id } });
  revalidatePath("/teacher/groups");
  return { success: true };
}

export async function creditGroup(formData: FormData) {
  const actor = await requireTransactor();
  const groupId = String(formData.get("groupId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const note = String(formData.get("note") ?? "").trim() || "Group reward";

  let amountCents: number;
  try {
    amountCents = dollarsToCents(amountRaw);
  } catch {
    return { error: "Enter a valid amount." };
  }
  if (amountCents <= 0) return { error: "Amount must be greater than zero." };

  const group = await prisma.studentGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { student: true },
      },
    },
  });
  if (!group) return { error: "Group not found." };

  const activeMembers = group.members.filter((m) => m.student.active);
  if (activeMembers.length === 0) {
    return { error: "This group has no active students." };
  }

  await prisma.$transaction(async (tx) => {
    for (const member of activeMembers) {
      await tx.student.update({
        where: { id: member.studentId },
        data: { balanceCents: { increment: amountCents } },
      });
      await tx.transaction.create({
        data: {
          studentId: member.studentId,
          userId: actor.id,
          amountCents,
          type: "GROUP",
          note: `${note} (${group.name})`,
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/teacher");
  revalidatePath("/teacher/groups");
  return { success: true, count: activeMembers.length };
}
