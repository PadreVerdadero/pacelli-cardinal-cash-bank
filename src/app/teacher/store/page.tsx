import { StoreCheckout } from "@/components/StoreCheckout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      balanceCents: true,
      qrToken: true,
    },
  });

  return (
    <div className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
        School store
      </h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        Deduct Cardinal Cash when a student buys something. Purchases cannot go below zero.
      </p>
      <div className="mt-6">
        <StoreCheckout students={students} />
      </div>
    </div>
  );
}
