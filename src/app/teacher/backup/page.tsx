import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { getAuthUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const user = await getAuthUser();
  if (!user || !isSuperAdmin(user.realRole) || !isSuperAdmin(user.role)) {
    redirect("/teacher");
  }

  const [studentCount, activeCount, totalBalance] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { active: true } }),
    prisma.student.aggregate({
      where: { active: true },
      _sum: { balanceCents: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <p className="font-[family-name:var(--font-display)] text-xs tracking-[0.22em] text-[var(--cardinal-red)] uppercase">
          Super Admin
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Balance backup
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Download a CSV snapshot of every student&apos;s Cardinal Cash balance
          as it stands right now. Save these files on your computer for records
          and recovery reference.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--navy)] p-4 text-white">
            <p className="text-sm text-white/70">Active students</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">
              {activeCount}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--cardinal-red)] p-4 text-white">
            <p className="text-sm text-white/80">Cash in circulation</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">
              {formatCash(totalBalance._sum.balanceCents ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--navy)]/15 p-4">
            <p className="text-sm text-[var(--ink-muted)]">All roster records</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
              {studentCount}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/api/backup/balances"
            className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--navy)]/90"
          >
            Download active student balances
          </a>
          <a
            href="/api/backup/balances?includeInactive=1"
            className="rounded-md border border-[var(--navy)] px-4 py-2.5 text-sm font-medium text-[var(--navy)] transition hover:bg-[var(--navy)]/[0.04]"
          >
            Download all students (including inactive)
          </a>
        </div>

        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Each file includes name, student number, grade, balance, login username,
          and a <code>downloadedAt</code> timestamp for that snapshot.
        </p>

        <Link
          href="/teacher"
          prefetch={false}
          className="mt-6 inline-block text-sm font-medium text-[var(--navy)] underline-offset-2 hover:underline"
        >
          Back to staff desk
        </Link>
      </section>
    </div>
  );
}
