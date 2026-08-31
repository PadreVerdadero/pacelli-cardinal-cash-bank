import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function Header() {
  const session = await auth();

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
          <Link
            href="/"
            className="rounded px-3 py-2 transition hover:bg-white/10"
          >
            Balances
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/teacher"
                className="rounded px-3 py-2 transition hover:bg-white/10"
              >
                Teacher Desk
              </Link>
              <Link
                href="/teacher/scan"
                className="rounded px-3 py-2 transition hover:bg-white/10"
              >
                Scan QR
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
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
              Teacher Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
