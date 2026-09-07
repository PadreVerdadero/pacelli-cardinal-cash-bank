import { redirect } from "next/navigation";
import { createAccount, deleteAccount, updateAccount } from "@/app/actions/accounts";
import {
  setTeacherAssignments,
  updateSchoolSettings,
} from "@/app/actions/settings";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { StaffAccountsCsvImport } from "@/components/StaffAccountsCsvImport";
import { StudentChecklist } from "@/components/StudentChecklist";
import { prisma } from "@/lib/prisma";
import {
  canDeleteUser,
  canEditUser,
  canManageAccounts,
  creatableRoles,
  roleLabel,
  type Role,
} from "@/lib/roles";
import { getAuthUser } from "@/lib/session";
import {
  canAccessAccountsPage,
  getSchoolSettings,
} from "@/lib/settings";

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

async function updateSettingsAction(formData: FormData) {
  "use server";
  await updateSchoolSettings(formData);
}

async function setAssignmentsAction(formData: FormData) {
  "use server";
  await setTeacherAssignments(formData);
}

export default async function AccountsPage() {
  const actor = await getAuthUser();
  if (!actor || !(await canAccessAccountsPage(actor.role))) {
    redirect("/teacher");
  }

  const fullAccess = canManageAccounts(actor.role);
  const settings = await getSchoolSettings();

  const assignedStudentIds = !fullAccess
    ? (
        await prisma.teacherStudent.findMany({
          where: { teacherId: actor.id },
          select: { studentId: true },
        })
      ).map((row) => row.studentId)
    : [];

  const [users, unlinkedStudents, allStudents, teachers] = await Promise.all([
    prisma.user.findMany({
      where: fullAccess
        ? undefined
        : {
            role: "STUDENT",
            studentId: { in: assignedStudentIds },
          },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
      },
    }),
    fullAccess
      ? prisma.student.findMany({
          where: { user: null, active: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            grade: true,
          },
        })
      : prisma.student.findMany({
          where: {
            active: true,
            user: null,
            id: { in: assignedStudentIds },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            grade: true,
          },
        }),
    fullAccess
      ? prisma.student.findMany({
          where: { active: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            grade: true,
          },
        })
      : Promise.resolve([]),
    fullAccess
      ? prisma.user.findMany({
          where: { role: "TEACHER", active: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            username: true,
            assignedStudents: { select: { studentId: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const roles = fullAccess ? creatableRoles(actor.role) : (["STUDENT"] as Role[]);

  return (
    <div className="space-y-8">
      {fullAccess ? (
        <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
            Account settings
          </h1>
          <p className="mt-2 text-[var(--ink-muted)]">
            Control whether teachers can edit logins for students assigned to them.
          </p>
          <form action={updateSettingsAction} className="mt-4 space-y-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="teachersCanEditAssignedStudentLogins"
                value="true"
                defaultChecked={settings.teachersCanEditAssignedStudentLogins}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-[var(--navy)]">
                  Allow teachers to edit assigned student logins
                </span>
                <span className="mt-1 block text-[var(--ink-muted)]">
                  When on, each teacher can reset passwords and update usernames for
                  students on their roster only. Assign students below.
                </span>
              </span>
            </label>
            <button
              type="submit"
              className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white"
            >
              Save setting
            </button>
          </form>

          {settings.teachersCanEditAssignedStudentLogins ? (
            <div className="mt-8 space-y-6 border-t border-[var(--navy)]/10 pt-6">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
                  Teacher student assignments
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Choose which students each teacher may manage logins for.
                </p>
              </div>
              {teachers.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">No teacher accounts yet.</p>
              ) : (
                teachers.map((teacher) => (
                  <form
                    key={teacher.id}
                    action={setAssignmentsAction}
                    className="rounded-xl border border-[var(--navy)]/10 p-4"
                  >
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <p className="font-medium text-[var(--navy)]">
                      {teacher.name}{" "}
                      <span className="font-normal text-[var(--ink-muted)]">
                        @{teacher.username}
                      </span>
                    </p>
                    <div className="mt-3">
                      <StudentChecklist
                        students={allStudents}
                        initialSelected={teacher.assignedStudents.map((row) => row.studentId)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-3 rounded-md border border-[var(--navy)] px-3 py-2 text-sm font-medium text-[var(--navy)]"
                    >
                      Save roster for {teacher.name.split(" ")[0]}
                    </button>
                  </form>
                ))
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          {fullAccess ? "Accounts" : "Assigned student logins"}
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          {fullAccess
            ? "Super Admin can manage everyone. Admins can create Admin, Teacher, and Student accounts. Super Admin accounts can never be deleted."
            : "Update usernames and passwords for students assigned to you. You cannot delete accounts or change roles."}
        </p>

        {(fullAccess || unlinkedStudents.length > 0) ? (
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
            {fullAccess ? (
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
            ) : (
              <input type="hidden" name="role" value="STUDENT" />
            )}
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-[var(--navy)]">Email (optional)</span>
              <input name="email" type="email" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
            </label>

            <div className="sm:col-span-2 rounded-lg border border-[var(--navy)]/10 bg-[var(--navy)]/[0.03] p-4">
              <p className="text-sm font-medium text-[var(--navy)]">Student login options</p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {fullAccess
                  ? "Only needed when role is Student. Link an existing student, or enter names to create one."
                  : "Choose an assigned student who does not have a login yet."}
              </p>
              <label className="mt-3 block text-sm">
                <span className="mb-1 block font-medium text-[var(--navy)]">
                  {fullAccess ? "Link existing student" : "Assigned student"}
                </span>
                <select
                  name="studentId"
                  required={!fullAccess}
                  className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
                  defaultValue=""
                >
                  <option value="">
                    {fullAccess ? "Create new / not a student login" : "Select student"}
                  </option>
                  {unlinkedStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.lastName}, {student.firstName}
                      {student.studentNumber ? ` (${student.studentNumber})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {fullAccess ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input name="firstName" placeholder="First name" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
                  <input name="lastName" placeholder="Last name" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
                  <input name="studentNumber" placeholder="Student number" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
                  <input name="grade" placeholder="Grade" className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm" />
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white sm:col-span-2 sm:w-fit"
            >
              {fullAccess ? "Create account" : "Create student login"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            No assigned students without a login. Ask an admin to assign students to you.
          </p>
        )}
        {fullAccess ? <StaffAccountsCsvImport /> : null}
      </section>

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          {fullAccess ? `All accounts (${users.length})` : `Your students' logins (${users.length})`}
        </h2>
        <ul className="mt-4 space-y-4">
          {users.map((user) => {
            const editable = fullAccess
              ? canEditUser(actor.role, user.role)
              : user.role === "STUDENT";
            const deletable = fullAccess
              ? canDeleteUser(actor.role, user.role, user.id, actor.id)
              : false;
            const assignable = creatableRoles(actor.role).filter((role) =>
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
                    {fullAccess ? (
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
                    ) : (
                      <input type="hidden" name="role" value="STUDENT" />
                    )}
                    <select
                      name="active"
                      defaultValue={user.active ? "true" : "false"}
                      disabled={fullAccess && user.role === "SUPER_ADMIN"}
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
                      <ConfirmDeleteButton
                        formAction={deleteAccountAction}
                        message="Are you sure you want to delete this?"
                        className="rounded-md bg-[var(--cardinal-red)] px-3 py-2 text-sm font-medium text-white sm:w-fit"
                      >
                        Delete login
                      </ConfirmDeleteButton>
                    ) : null}
                  </form>
                ) : null}
              </li>
            );
          })}
          {users.length === 0 ? (
            <li className="py-4 text-sm text-[var(--ink-muted)]">
              {fullAccess
                ? "No accounts yet."
                : "No logins for your assigned students yet."}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
