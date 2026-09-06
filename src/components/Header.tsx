import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { RoleViewSwitcher } from "@/components/RoleViewSwitcher";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransact, canViewAllStudents, roleLabel } from "@/lib/roles";
import { getAuthUser } from "@/lib/session";
import { VIEW_AS_COOKIE, VIEW_AS_STUDENT_COOKIE } from "@/lib/view-as";

export async function Header() {
  const session = await auth();
  const user = session?.user ? await getAuthUser() : null;
  const role = user?.role;
  let studentHref: string | null = null;

  if (role === "STUDENT" && user?.studentId) {
    const student = await prisma.student.findUnique({
      where: { id: user.studentId },
      select: { qrToken: true },
    });
    if (student) studentHref = `/students/${student.qrToken}`;
  }

  const previewStudents =
    user?.realRole === "SUPER_ADMIN" && user.role === "STUDENT"
      ? await prisma.student.findMany({
          where: { active: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        })
      : [];

  return (
    <header className="border-b border-white/15 bg-[var(--navy)] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link
          href="/"
          prefetch={false}
          className="group flex items-center gap-3"
        >
          <Image
            src="/pacelli-logo.png"
            alt="Pacelli Catholic Middle School"
            width={220}
            height={72}
            priority
            className="h-12 w-auto shrink-0 object-contain sm:h-14"
          />
          <span className="flex flex-col">
            <span className="font-[family-name:var(--font-display)] text-xl tracking-wide sm:text-2xl">
              Cardinal Cash Bank
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
          {user ? (
            <>
              {canViewAllStudents(role) ? (
                <Link
                  href="/"
                  prefetch={false}
                  className="rounded px-3 py-2 transition hover:bg-white/10"
                >
                  Students
                </Link>
              ) : null}
              {studentHref ? (
                <Link
                  href={studentHref}
                  prefetch={false}
                  className="rounded px-3 py-2 transition hover:bg-white/10"
                >
                  My balance
                </Link>
              ) : null}
              {canTransact(role) ? (
                <Link
                  href="/teacher"
                  prefetch={false}
                  className="rounded px-3 py-2 transition hover:bg-white/10"
                >
                  Staff desk
                </Link>
              ) : null}
              <Link
                href="/account"
                prefetch={false}
                className="rounded px-3 py-2 transition hover:bg-white/10"
              >
                Account
              </Link>
              <span className="hidden text-xs text-white/70 sm:inline">
                {user.name} · {role ? roleLabel(role) : ""}
                {user.viewingAs ? " (preview)" : ""}
              </span>
              <form
                action={async () => {
                  "use server";
                  const jar = await cookies();
                  jar.delete(VIEW_AS_COOKIE);
                  jar.delete(VIEW_AS_STUDENT_COOKIE);
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded border border-white/30 px-3 py-2 transition hover:bg-white/10"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              prefetch={false}
              className="rounded bg-[var(--cardinal-red)] px-3 py-2 font-medium transition hover:bg-[var(--cardinal-red-hot)]"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
      {user?.realRole === "SUPER_ADMIN" ? (
        <div className="border-t border-white/10 bg-[var(--navy)]/95">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
            <RoleViewSwitcher
              realRole={user.realRole}
              effectiveRole={user.role}
              previewStudentId={user.studentId}
              students={previewStudents}
            />
            {user.viewingAs ? (
              <p className="text-xs text-[var(--cardinal-red-soft)]">
                Previewing {roleLabel(user.role)} menus and permissions
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
