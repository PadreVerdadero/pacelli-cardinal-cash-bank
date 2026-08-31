import Link from "next/link";
import { createStudent } from "@/app/actions/students";
import { CsvImport } from "@/components/CsvImport";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function addStudentAction(formData: FormData) {
  "use server";
  await createStudent(formData);
}

export default async function StudentsAdminPage() {
  const students = await prisma.student.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Students
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Add one student at a time, or import a full roster from CSV.
        </p>

        <form action={addStudentAction} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">First name</span>
            <input
              name="firstName"
              required
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Last name</span>
            <input
              name="lastName"
              required
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Student number</span>
            <input
              name="studentNumber"
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Grade</span>
            <input
              name="grade"
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--navy)]">
              Initial balance (optional)
            </span>
            <input
              name="initialBalance"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white sm:col-span-2 sm:w-fit"
          >
            Add student
          </button>
        </form>

        <CsvImport />
      </section>

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          Roster ({students.length})
        </h2>
        <ul className="mt-4 divide-y divide-[var(--navy)]/10">
          {students.map((student) => (
            <li
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <Link
                  href={`/students/${student.qrToken}`}
                  className="font-medium text-[var(--navy)] underline-offset-2 hover:underline"
                >
                  {student.lastName}, {student.firstName}
                </Link>
                <p className="text-sm text-[var(--ink-muted)]">
                  {[student.grade ? `Grade ${student.grade}` : null, student.studentNumber]
                    .filter(Boolean)
                    .join(" · ") || "No ID"}
                  {!student.active ? " · inactive" : ""}
                </p>
              </div>
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--cardinal-red)]">
                {formatCash(student.balanceCents)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
