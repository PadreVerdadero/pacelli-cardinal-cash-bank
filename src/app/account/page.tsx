import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { roleLabel } from "@/lib/roles";
import { getAuthUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
      <p className="font-[family-name:var(--font-display)] text-xs tracking-[0.22em] text-[var(--cardinal-red)] uppercase">
        My account
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
        {user.name}
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Role: {roleLabel(user.realRole)}
        {user.viewingAs ? ` · Previewing as ${roleLabel(user.role)}` : ""}
      </p>

      <h2 className="mt-8 font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
        Change password
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Choose a new password for your Cardinal Cash Bank login.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
