import { createTeacher } from "@/app/actions/teachers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function addTeacherAction(formData: FormData) {
  "use server";
  await createTeacher(formData);
}

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Teacher accounts
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Each teacher signs in with their own email and password.
        </p>

        <form action={addTeacherAction} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Name</span>
            <input
              name="name"
              required
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--navy)]">Temporary password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white sm:col-span-2 sm:w-fit"
          >
            Create teacher
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          Staff ({teachers.length})
        </h2>
        <ul className="mt-4 divide-y divide-[var(--navy)]/10">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="py-3">
              <p className="font-medium text-[var(--navy)]">{teacher.name}</p>
              <p className="text-sm text-[var(--ink-muted)]">{teacher.email}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
