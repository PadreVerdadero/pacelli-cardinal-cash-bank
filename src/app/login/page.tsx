import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { homePathForRole } from "@/lib/session";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    let studentToken: string | null = null;
    if (session.user.role === "STUDENT" && session.user.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: session.user.studentId },
        select: { qrToken: true },
      });
      studentToken = student?.qrToken ?? null;
    }
    redirect(params.callbackUrl || homePathForRole(session.user.role, studentToken));
  }

  const callbackUrl = params.callbackUrl || "/";

  async function loginAction(formData: FormData) {
    "use server";
    const nextUrl = String(formData.get("callbackUrl") || "/");
    try {
      await signIn("credentials", {
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirectTo: nextUrl,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=CredentialsSignin");
      }
      throw error;
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-[var(--paper)] p-8 shadow-[0_10px_40px_rgba(0,31,63,0.08)]">
      <p className="font-[family-name:var(--font-display)] text-xs tracking-[0.22em] text-[var(--cardinal-red)] uppercase">
        Sign in
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
        Cardinal Cash Bank
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Use your username and password. Students only see their own balance.
      </p>

      <form action={loginAction} className="mt-6 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--navy)]">Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2 outline-none ring-[var(--cardinal-red)] focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--navy)]">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2 outline-none ring-[var(--cardinal-red)] focus:ring-2"
          />
        </label>
        {params.error ? (
          <p className="text-sm text-[var(--cardinal-red)]">
            Sign in failed. Check your username and password.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-md bg-[var(--navy)] px-4 py-2.5 font-medium text-white transition hover:bg-[var(--navy-deep)]"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
