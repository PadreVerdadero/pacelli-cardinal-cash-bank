import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { canViewAllStudents } from "@/lib/roles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function StudentTransactionsPrintPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || !canViewAllStudents(session.user.role)) {
    redirect("/login");
  }

  const { token } = await params;
  const student = await prisma.student.findUnique({
    where: { qrToken: token },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-black">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/students/${token}`} className="text-sm text-[var(--navy)] underline">
          Back to student
        </Link>
        <PrintButton label="Print / Save as PDF" />
      </div>

      <header className="border-b border-black/20 pb-4">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--cardinal-red)]">
          Pacelli Catholic Schools · Cardinal Cash Bank
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {student.firstName} {student.lastName}
        </h1>
        <p className="mt-1 text-sm text-black/70">
          {[student.grade ? `Grade ${student.grade}` : null, student.studentNumber]
            .filter(Boolean)
            .join(" · ")}
          {" · "}Current balance: {formatCash(student.balanceCents)}
        </p>
        <p className="mt-1 text-xs text-black/50">
          Transaction report generated {new Date().toLocaleString()}
        </p>
      </header>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="py-2 pr-2">Date</th>
            <th className="py-2 pr-2">Type</th>
            <th className="py-2 pr-2">Note</th>
            <th className="py-2 pr-2">Staff</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {student.transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-black/10">
              <td className="py-2 pr-2 whitespace-nowrap">
                {tx.createdAt.toLocaleString()}
              </td>
              <td className="py-2 pr-2">{tx.type}</td>
              <td className="py-2 pr-2">{tx.note ?? "—"}</td>
              <td className="py-2 pr-2">{tx.user?.name ?? "—"}</td>
              <td className="py-2 text-right whitespace-nowrap">
                {tx.amountCents >= 0 ? "+" : ""}
                {formatCash(tx.amountCents)}
              </td>
            </tr>
          ))}
          {student.transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-black/60">
                No transactions.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
