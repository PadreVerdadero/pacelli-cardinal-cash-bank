import Link from "next/link";
import { StudentSearch } from "@/components/StudentSearch";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
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
            Anyone can view student balances. Teachers sign in to reward students,
            scan QR codes, and check out at the school store.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/teacher/scan"
                  className="rounded-md bg-[var(--cardinal-red)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--cardinal-red-hot)]"
                >
                  Scan student QR
                </Link>
                <Link
                  href="/teacher/store"
                  className="rounded-md border border-white/40 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
                >
                  School store
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-[var(--cardinal-red)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--cardinal-red-hot)]"
              >
                Teacher sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
              Student balances
            </h2>
            <p className="text-sm text-[var(--ink-muted)]">
              Public directory · {students.length} active students
            </p>
          </div>
        </div>
        <StudentSearch students={students} />
      </section>
    </div>
  );
}
