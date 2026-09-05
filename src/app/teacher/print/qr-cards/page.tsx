import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import { studentQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function QrCardsPrintPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/teacher");
  }

  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const cards = await Promise.all(
    students.map(async (student) => ({
      student,
      qr: await studentQrDataUrl(student.qrToken),
    })),
  );

  return (
    <div className="mx-auto max-w-6xl bg-white p-6 text-black">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/teacher" className="text-sm text-[var(--navy)] underline">
          Back to staff desk
        </Link>
        <PrintButton label="Print / Save QR cards as PDF" />
      </div>

      <header className="mb-6 border-b border-black/20 pb-4 print:mb-4">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--cardinal-red)]">
          Pacelli Catholic Schools · Cardinal Cash Bank
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Student QR cards</h1>
        <p className="mt-1 text-sm text-black/70">
          {students.length} active students · print and cut apart for each student
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
        {cards.map(({ student, qr }) => (
          <article
            key={student.id}
            className="break-inside-avoid rounded-lg border border-black/20 p-4 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt={`QR for ${student.firstName} ${student.lastName}`}
              width={200}
              height={200}
              className="mx-auto"
            />
            <h2 className="mt-3 text-lg font-semibold">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-sm text-black/70">
              {[student.grade ? `Grade ${student.grade}` : null, student.studentNumber]
                .filter(Boolean)
                .join(" · ") || "Student"}
            </p>
            <p className="mt-1 text-sm font-medium">
              Balance: {formatCash(student.balanceCents)}
            </p>
            <p className="mt-2 text-[10px] break-all text-black/45">{student.qrToken}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
