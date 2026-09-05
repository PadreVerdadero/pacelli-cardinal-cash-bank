import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteTransaction } from "@/app/actions/balance";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import {
  canDeleteTransactions,
  canManageAccounts,
  canManageActivities,
  canManageStore,
  isAdmin,
  isStaff,
} from "@/lib/roles";
import { getAuthUser } from "@/lib/session";
import { canAccessAccountsPage } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function deleteTransactionAction(formData: FormData) {
  "use server";
  await deleteTransaction(formData);
}

export default async function TeacherHomePage() {
  const user = await getAuthUser();
  if (!user || !isStaff(user.role)) {
    redirect("/login");
  }

  const admin = isAdmin(user.role);
  const canRemoveTx = canDeleteTransactions(user.role);
  const showAccounts = await canAccessAccountsPage(user.role);

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
      href: "/teacher/groups",
      title: "Groups",
      body: "Check students into a group and pay them all at once.",
      show: true,
    },
    {
      href: "/teacher/activities",
      title: "Activities",
      body: "Set reward values for specific activities.",
      show: canManageActivities(user.role),
    },
    {
      href: "/teacher/catalog",
      title: "Store catalog",
      body: "Add store items and prices.",
      show: canManageStore(user.role),
    },
    {
      href: "/teacher/accounts",
      title: "Accounts",
      body: canManageAccounts(user.role)
        ? "Create and manage Admin, Teacher, and Student logins."
        : "Edit usernames and passwords for your assigned students.",
      show: showAccounts,
    },
    {
      href: "/teacher/print/qr-cards",
      title: "Print QR cards",
      body: "PDF-ready page of every student with their QR code.",
      show: admin,
    },
  ].filter((link) => link.show);

  return (
    <div>
      <p className="font-[family-name:var(--font-display)] text-xs tracking-[0.22em] text-[var(--cardinal-red)] uppercase">
        Staff desk
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--navy)]">
        Welcome, {user.name?.split(" ")[0] ?? "Staff"}
      </h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        {admin
          ? "Admin tools include accounts, catalog, activities, groups, and QR print sheets."
          : "Teacher tools: scan QR, students, school store, and groups."}
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
            prefetch={false}
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
                  prefetch={false}
                  className="font-medium text-[var(--navy)] underline-offset-2 hover:underline"
                >
                  {tx.student.lastName}, {tx.student.firstName}
                </Link>
                <p className="text-[var(--ink-muted)]">
                  {tx.type} · {tx.user?.name ?? "Staff"} ·{" "}
                  {tx.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                {canRemoveTx ? (
                  <form>
                    <input type="hidden" name="id" value={tx.id} />
                    <ConfirmDeleteButton
                      formAction={deleteTransactionAction}
                      message="Are you sure you want to delete this?"
                      className="rounded-md border border-[var(--cardinal-red)] px-2 py-1 text-xs font-medium text-[var(--cardinal-red)]"
                    >
                      Delete
                    </ConfirmDeleteButton>
                  </form>
                ) : null}
              </div>
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
