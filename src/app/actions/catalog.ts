"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireActivityManager, requireStoreManager } from "@/lib/session";

const itemSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().or(z.literal("")),
  price: z.string().min(1),
});

export async function createStoreItem(formData: FormData) {
  const actor = await requireStoreManager();
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
  });
  if (!parsed.success) return { error: "Name and price are required." };

  let priceCents: number;
  try {
    priceCents = dollarsToCents(parsed.data.price);
  } catch {
    return { error: "Enter a valid price." };
  }
  if (priceCents <= 0) return { error: "Price must be greater than zero." };

  await prisma.storeItem.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceCents,
      createdById: actor.id,
    },
  });

  revalidatePath("/teacher/store");
  revalidatePath("/teacher/catalog");
  return { success: true };
}

export async function setStoreItemActive(formData: FormData) {
  await requireStoreManager();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";
  await prisma.storeItem.update({ where: { id }, data: { active } });
  revalidatePath("/teacher/store");
  revalidatePath("/teacher/catalog");
  return { success: true };
}

export async function createActivity(formData: FormData) {
  const actor = await requireActivityManager();
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("value"),
  });
  if (!parsed.success) return { error: "Name and value are required." };

  let valueCents: number;
  try {
    valueCents = dollarsToCents(parsed.data.price);
  } catch {
    return { error: "Enter a valid Cardinal Cash value." };
  }
  if (valueCents <= 0) return { error: "Value must be greater than zero." };

  await prisma.activity.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      valueCents,
      createdById: actor.id,
    },
  });

  revalidatePath("/teacher/activities");
  return { success: true };
}

export async function setActivityActive(formData: FormData) {
  await requireActivityManager();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";
  await prisma.activity.update({ where: { id }, data: { active } });
  revalidatePath("/teacher/activities");
  return { success: true };
}
