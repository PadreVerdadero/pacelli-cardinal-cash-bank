import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentSearch } from "@/components/StudentSearch";
import { prisma } from "@/lib/prisma";
import { canViewAllStudents } from "@/lib/roles";
import { getAuthUser, homePathForRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "STUDENT") {
    if (user.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: user.studentId },
        select: { qrToken: true },
      });
      redirect(homePathForRole("STUDENT", student?.qrToken));
    }
    redirect("/login");
  }

  if (!canViewAllStudents(user.role)) {
    redirect("/login");
  }

  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentNumber: true,
      grade: true,
      qrToken: true,
      balanceCents: true,
    },
  });

  return (
    <div>
      <section className="relative overflow-hidden rounded-2xl bg-[var(--navy)] px-6 py-10 text-white sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(135deg, transparent 40%, rgba(200,16,46,0.55) 40%, rgba(200,16,46,0.55) 58%, transparent 58%), repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 12px)",
          }}
        />
        <div className="relative max-w-2xl">
          <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.28em] text-[var(--cardinal-red-soft)] uppercase">
            Pacelli Catholic Schools
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide sm:text-5xl">
            Cardinal Cash Bank
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Staff can view all student balances, scan QR codes, and record
            transactions. Students only see their own account after signing in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/teacher/scan"
              className="rounded-md bg-[var(--cardinal-red)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--cardinal-red-hot)]"
            >
              Scan student QR
            </Link>
            <Link
              href="/teacher"
              className="rounded-md border border-white/40 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
            >
              Staff desk
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
            Student balances
          </h2>
          <p className="text-sm text-[var(--ink-muted)]">
            Staff directory · {students.length} active students
          </p>
        </div>
        <StudentSearch students={students} />
      </section>
    </div>
  );
}
