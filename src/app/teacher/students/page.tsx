import Link from "next/link";
import {
  createStudent,
  deleteStudent,
  updateStudent,
} from "@/app/actions/students";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CsvImport } from "@/components/CsvImport";
import { MassLoginForm } from "@/components/MassLoginForm";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { canManageAccounts } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function addStudentAction(formData: FormData) {
  "use server";
  await createStudent(formData);
}

async function updateStudentAction(formData: FormData) {
  "use server";
  await updateStudent(formData);
}

async function deleteStudentAction(formData: FormData) {
  "use server";
  await deleteStudent(formData);
}

export default async function StudentsAdminPage() {
  const session = await auth();
  const canEdit = canManageAccounts(session?.user?.role);

  const students = await prisma.student.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      user: { select: { username: true } },
    },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Students
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Add one student at a time, or import a full roster from CSV.
          {canEdit
            ? " Admins can edit or permanently delete students below."
            : " Ask an Admin to edit or delete student records."}
        </p>

        <form action={addStudentAction} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">First name</span>
            <input name="firstName" required className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Last name</span>
            <input name="lastName" required className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Student number</span>
            <input name="studentNumber" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Grade</span>
            <input name="grade" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
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
        {canEdit ? <MassLoginForm /> : null}
      </section>

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          Roster ({students.length})
        </h2>
        <ul className="mt-4 space-y-4">
          {students.map((student) => (
            <li key={student.id} className="rounded-xl border border-[var(--navy)]/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/students/${student.qrToken}`}
                    className="font-medium text-[var(--navy)] underline-offset-2 hover:underline"
                  >
                    {student.lastName}, {student.firstName}
                  </Link>
                  <p className="text-sm text-[var(--ink-muted)]">
                    Balance {formatCash(student.balanceCents)}
                    {student.user ? ` · login @${student.user.username}` : ""}
                  </p>
                </div>
              </div>

              {canEdit ? (
                <form action={updateStudentAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="id" value={student.id} />
                  <input
                    name="firstName"
                    defaultValue={student.firstName}
                    required
                    className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                  />
                  <input
                    name="lastName"
                    defaultValue={student.lastName}
                    required
                    className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                  />
                  <input
                    name="studentNumber"
                    defaultValue={student.studentNumber ?? ""}
                    placeholder="Student number"
                    className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                  />
                  <input
                    name="grade"
                    defaultValue={student.grade ?? ""}
                    placeholder="Grade"
                    className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                  />
                  <input
                    name="balance"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={(student.balanceCents / 100).toFixed(2)}
                    className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                  />
                  <select
                    name="active"
                    defaultValue={student.active ? "true" : "false"}
                    className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-md border border-[var(--navy)] px-3 py-2 text-sm font-medium text-[var(--navy)] sm:w-fit"
                  >
                    Save changes
                  </button>
                  <ConfirmDeleteButton
                    formAction={deleteStudentAction}
                    message="Are you sure you want to delete this?"
                    className="rounded-md bg-[var(--cardinal-red)] px-3 py-2 text-sm font-medium text-white sm:w-fit"
                  >
                    Delete student
                  </ConfirmDeleteButton>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
