import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import {
  canManageAccounts,
  canManageActivities,
  canManageStore,
  isStaff,
} from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function TeacherHomePage() {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/login");
  }

  const [studentCount, totalBalance, recent] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.student.aggregate({
      where: { active: true },
      _sum: { balanceCents: true },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        student: { select: { firstName: true, lastName: true, qrToken: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const links = [
    {
      href: "/teacher/scan",
      title: "Scan QR",
      body: "Open a student account with the phone camera.",
      show: true,
    },
    {
      href: "/teacher/students",
      title: "Students",
      body: "Add students manually or import a CSV roster.",
      show: true,
    },
    {
      href: "/teacher/store",
      title: "School store",
      body: "Ring up purchases and deduct Cardinal Cash.",
      show: true,
    },
    {
      href: "/teacher/activities",
      title: "Activities",
      body: "Set reward values for specific activities.",
      show: canManageActivities(session.user.role),
    },
    {
      href: "/teacher/catalog",
      title: "Store catalog",
      body: "Add store items and prices.",
      show: canManageStore(session.user.role),
    },
    {
      href: "/teacher/accounts",
      title: "Accounts",
      body: "Create and manage Admin, Teacher, and Student logins.",
      show: canManageAccounts(session.user.role),
    },
  ].filter((link) => link.show);

  return (
    <div>
      <p className="font-[family-name:var(--font-display)] text-xs tracking-[0.22em] text-[var(--cardinal-red)] uppercase">
        Staff desk
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--navy)]">
        Welcome, {session.user.name?.split(" ")[0] ?? "Staff"}
      </h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        Manage Cardinal Cash for Pacelli Catholic Schools.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[var(--navy)] p-6 text-white">
          <p className="text-sm text-white/70">Active students</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {studentCount}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--cardinal-red)] p-6 text-white">
          <p className="text-sm text-white/80">Cash in circulation</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            {formatCash(totalBalance._sum.balanceCents ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(0,31,63,0.1)]"
          >
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
              {link.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{link.body}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10 rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          Latest transactions
        </h2>
        <ul className="mt-4 divide-y divide-[var(--navy)]/10">
          {recent.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <Link
                  href={`/students/${tx.student.qrToken}`}
                  className="font-medium text-[var(--navy)] underline-offset-2 hover:underline"
                >
                  {tx.student.lastName}, {tx.student.firstName}
                </Link>
                <p className="text-[var(--ink-muted)]">
                  {tx.type} · {tx.user?.name ?? "Staff"} ·{" "}
                  {tx.createdAt.toLocaleString()}
                </p>
              </div>
              <p
                className={
                  tx.amountCents >= 0
                    ? "font-semibold text-emerald-700"
                    : "font-semibold text-[var(--cardinal-red)]"
                }
              >
                {tx.amountCents >= 0 ? "+" : ""}
                {formatCash(tx.amountCents)}
              </p>
            </li>
          ))}
          {recent.length === 0 ? (
            <li className="py-4 text-[var(--ink-muted)]">No transactions yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
