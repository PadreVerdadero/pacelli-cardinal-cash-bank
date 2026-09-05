import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteTransaction } from "@/app/actions/balance";
import { BalanceAdjuster } from "@/components/BalanceAdjuster";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { canDeleteTransactions, canTransact, canViewAllStudents } from "@/lib/roles";
import { studentQrDataUrl } from "@/lib/qr";
import { getAuthUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

async function deleteTransactionAction(formData: FormData) {
  "use server";
  await deleteTransaction(formData);
}

export default async function StudentPage({ params }: Props) {
  const { token } = await params;
  const user = await getAuthUser();

  if (!user) {
    redirect(`/login?callbackUrl=/students/${token}`);
  }

  const canRemoveTx = canDeleteTransactions(user.role);

  const student = await prisma.student.findUnique({
    where: { qrToken: token },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: canRemoveTx ? 100 : 12,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!student || !student.active) {
    notFound();
  }

  const isOwnStudent =
    user.role === "STUDENT" &&
    (user.studentId === student.id ||
      // Super Admin student preview can open any student as "own" account UI.
      (user.realRole === "SUPER_ADMIN" && user.viewingAs));
  const staffView = canViewAllStudents(user.role);

  if (!staffView && !isOwnStudent) {
    redirect("/");
  }

  const canAdjust = canTransact(user.role);
  const qrDataUrl = staffView ? await studentQrDataUrl(student.qrToken) : null;

  const [activities, storeItems] = canAdjust
    ? await Promise.all([
        prisma.activity.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, valueCents: true },
        }),
        prisma.storeItem.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, priceCents: true },
        }),
      ])
    : [[], []];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <p className="font-[family-name:var(--font-display)] text-xs tracking-[0.22em] text-[var(--cardinal-red)] uppercase">
          {isOwnStudent ? "My account" : "Student account"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--navy)]">
          {student.firstName} {student.lastName}
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          {[student.grade ? `Grade ${student.grade}` : null, student.studentNumber]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-8 rounded-xl bg-[var(--navy)] px-6 py-8 text-white">
          <p className="text-sm tracking-wide text-white/70 uppercase">Cardinal Cash balance</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-5xl tracking-wide">
            {formatCash(student.balanceCents)}
          </p>
        </div>

        {canAdjust ? (
          <BalanceAdjuster
            studentId={student.id}
            currentBalanceCents={student.balanceCents}
            activities={activities}
            storeItems={storeItems}
          />
        ) : (
          <p className="mt-6 text-sm text-[var(--ink-muted)]">
            This is a view-only account. Teachers and admins record Cardinal Cash changes.
          </p>
        )}

        {staffView ? (
          <p className="mt-4">
            <Link
              href={`/teacher/print/students/${student.qrToken}`}
              prefetch={false}
              className="text-sm font-medium text-[var(--cardinal-red)] underline"
            >
              Print / save transactions as PDF
            </Link>
          </p>
        ) : null}

        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
            Recent activity
          </h2>
          <ul className="mt-3 divide-y divide-[var(--navy)]/10">
            {student.transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--navy)]">
                    {tx.type} {tx.note ? `· ${tx.note}` : ""}
                  </p>
                  <p className="text-[var(--ink-muted)]">
                    {tx.user?.name ?? "Staff"} · {tx.createdAt.toLocaleString()}
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
            {student.transactions.length === 0 ? (
              <li className="py-4 text-[var(--ink-muted)]">No transactions yet.</li>
            ) : null}
          </ul>
        </section>
      </section>

      {staffView && qrDataUrl ? (
        <aside className="rounded-2xl bg-[var(--paper)] p-6 text-center shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
            Student QR code
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Staff can scan this to open the student balance page quickly.
          </p>
          <div className="mt-6 inline-block rounded-xl border border-[var(--navy)]/10 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR code for ${student.firstName} ${student.lastName}`}
              width={280}
              height={280}
            />
          </div>
          <p className="mt-4 break-all text-xs text-[var(--ink-muted)]">
            Token: {student.qrToken}
          </p>
          <Link
            href="/teacher"
            className="mt-4 inline-block text-sm font-medium text-[var(--cardinal-red)] underline"
          >
            Back to staff desk
          </Link>
        </aside>
      ) : null}
    </div>
  );
}
