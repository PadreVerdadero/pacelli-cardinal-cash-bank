import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageAccounts,
  canManageActivities,
  canManageStore,
  canTransact,
  canViewAllStudents,
  roleLabel,
} from "@/lib/roles";

export async function Header() {
  const session = await auth();
  const role = session?.user?.role;
  let studentHref: string | null = null;

  if (role === "STUDENT" && session?.user?.studentId) {
    const student = await prisma.student.findUnique({
      where: { id: session.user.studentId },
      select: { qrToken: true },
    });
    if (student) studentHref = `/students/${student.qrToken}`;
  }

  return (
    <header className="border-b border-white/15 bg-[var(--navy)] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="group flex flex-col">
          <span className="font-[family-name:var(--font-display)] text-xs tracking-[0.22em] text-[var(--cardinal-red-soft)] uppercase">
            Pacelli Catholic Schools
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl tracking-wide sm:text-2xl">
            Cardinal Cash Bank
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
          {session?.user ? (
            <>
              {canViewAllStudents(role) ? (
                <Link href="/" className="rounded px-3 py-2 transition hover:bg-white/10">
                  Students
                </Link>
              ) : null}
              {studentHref ? (
                <Link
                  href={studentHref}
                  className="rounded px-3 py-2 transition hover:bg-white/10"
                >
                  My balance
                </Link>
              ) : null}
              {canTransact(role) ? (
                <>
                  <Link
                    href="/teacher"
                    className="rounded px-3 py-2 transition hover:bg-white/10"
                  >
                    Staff desk
                  </Link>
                  <Link
                    href="/teacher/scan"
                    className="rounded px-3 py-2 transition hover:bg-white/10"
                  >
                    Scan QR
                  </Link>
                  <Link
                    href="/teacher/store"
                    className="rounded px-3 py-2 transition hover:bg-white/10"
                  >
                    Store
                  </Link>
                </>
              ) : null}
              {canManageActivities(role) ? (
                <Link
                  href="/teacher/activities"
                  className="rounded px-3 py-2 transition hover:bg-white/10"
                >
                  Activities
                </Link>
              ) : null}
              {canManageStore(role) ? (
                <Link
                  href="/teacher/catalog"
                  className="rounded px-3 py-2 transition hover:bg-white/10"
                >
                  Catalog
                </Link>
              ) : null}
              {canManageAccounts(role) ? (
                <Link
                  href="/teacher/accounts"
                  className="rounded px-3 py-2 transition hover:bg-white/10"
                >
                  Accounts
                </Link>
              ) : null}
              <span className="hidden text-xs text-white/70 sm:inline">
                {session.user.name} · {role ? roleLabel(role) : ""}
              </span>
              <form
                action={async () => {
                  "use server";
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
              className="rounded bg-[var(--cardinal-red)] px-3 py-2 font-medium transition hover:bg-[var(--cardinal-red-hot)]"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
