import { redirect } from "next/navigation";
import { createAccount, deleteAccount, updateAccount } from "@/app/actions/accounts";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canDeleteUser,
  canEditUser,
  canManageAccounts,
  creatableRoles,
  roleLabel,
  type Role,
} from "@/lib/roles";

export const dynamic = "force-dynamic";

async function createAccountAction(formData: FormData) {
  "use server";
  await createAccount(formData);
}

async function updateAccountAction(formData: FormData) {
  "use server";
  await updateAccount(formData);
}

async function deleteAccountAction(formData: FormData) {
  "use server";
  await deleteAccount(formData);
}

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user || !canManageAccounts(session.user.role)) {
    redirect("/teacher");
  }

  const [users, unlinkedStudents] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
      },
    }),
    prisma.student.findMany({
      where: { user: null, active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, studentNumber: true },
    }),
  ]);

  const roles = creatableRoles(session.user.role);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Accounts
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Super Admin can manage everyone. Admins can create Admin, Teacher, and Student
          accounts. Super Admin accounts can never be deleted.
        </p>

        <form action={createAccountAction} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Display name</span>
            <input name="name" required className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Username</span>
            <input name="username" required minLength={3} className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Password</span>
            <input name="password" type="password" required minLength={6} className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Role</span>
            <select name="role" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" defaultValue="TEACHER">
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--navy)]">Email (optional)</span>
            <input name="email" type="email" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>

          <div className="sm:col-span-2 rounded-lg border border-[var(--navy)]/10 bg-[var(--navy)]/[0.03] p-4">
            <p className="text-sm font-medium text-[var(--navy)]">Student login options</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Only needed when role is Student. Link an existing student, or enter names to create one.
            </p>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-medium text-[var(--navy)]">Link existing student</span>
              <select name="studentId" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" defaultValue="">
                <option value="">Create new / not a student login</option>
                {unlinkedStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.lastName}, {student.firstName}
                    {student.studentNumber ? ` (${student.studentNumber})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input name="firstName" placeholder="First name" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
              <input name="lastName" placeholder="Last name" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
              <input name="studentNumber" placeholder="Student number" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
              <input name="grade" placeholder="Grade" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white sm:col-span-2 sm:w-fit"
          >
            Create account
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          All accounts ({users.length})
        </h2>
        <ul className="mt-4 space-y-4">
          {users.map((user) => {
            const editable = canEditUser(session.user.role, user.role);
            const deletable = canDeleteUser(
              session.user.role,
              user.role,
              user.id,
              session.user.id,
            );
            const assignable = creatableRoles(session.user.role).filter((role) =>
              user.role === "SUPER_ADMIN" ? role === "SUPER_ADMIN" : true,
            );

            return (
              <li
                key={user.id}
                className="rounded-xl border border-[var(--navy)]/10 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--navy)]">{user.name}</p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      @{user.username} · {roleLabel(user.role as Role)}
                      {!user.active ? " · inactive" : ""}
                      {user.student
                        ? ` · ${user.student.lastName}, ${user.student.firstName}`
                        : ""}
                    </p>
                  </div>
                  {user.role === "SUPER_ADMIN" ? (
                    <span className="rounded bg-[var(--cardinal-red)]/10 px-2 py-1 text-xs font-medium text-[var(--cardinal-red)]">
                      Protected
                    </span>
                  ) : null}
                </div>

                {editable ? (
                  <form action={updateAccountAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={user.id} />
                    <input
                      name="name"
                      defaultValue={user.name}
                      required
                      placeholder="Display name"
                      className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                    />
                    <input
                      name="username"
                      defaultValue={user.username}
                      required
                      minLength={3}
                      placeholder="Username"
                      className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                    />
                    <input
                      name="email"
                      type="email"
                      defaultValue={user.email ?? ""}
                      placeholder="Email (optional)"
                      className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                    />
                    <select
                      name="role"
                      defaultValue={user.role}
                      disabled={user.role === "SUPER_ADMIN"}
                      className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {(user.role === "SUPER_ADMIN"
                        ? (["SUPER_ADMIN"] as Role[])
                        : assignable
                      ).map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <select
                      name="active"
                      defaultValue={user.active ? "true" : "false"}
                      disabled={user.role === "SUPER_ADMIN"}
                      className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm disabled:opacity-60"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <input
                      name="password"
                      type="password"
                      placeholder="New password (optional)"
                      minLength={6}
                      className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-[var(--navy)] px-3 py-2 text-sm font-medium text-[var(--navy)] sm:w-fit"
                    >
                      Save changes
                    </button>
                    {deletable ? (
                      <button
                        formAction={deleteAccountAction}
                        type="submit"
                        className="rounded-md bg-[var(--cardinal-red)] px-3 py-2 text-sm font-medium text-white sm:w-fit"
                      >
                        Delete login
                      </button>
                    ) : null}
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
