import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCardsPrinter } from "@/components/QrCardsPrinter";
import { auth } from "@/lib/auth";
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
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
      grade: student.grade,
      balanceCents: student.balanceCents,
      qrToken: student.qrToken,
      qr: await studentQrDataUrl(student.qrToken),
    })),
  );

  return (
    <div className="mx-auto max-w-6xl bg-white p-6 text-black">
      <div className="mb-6 print:hidden">
        <Link href="/teacher" className="text-sm text-[var(--navy)] underline">
          Back to staff desk
        </Link>
      </div>
      <QrCardsPrinter cards={cards} />
    </div>
  );
}
