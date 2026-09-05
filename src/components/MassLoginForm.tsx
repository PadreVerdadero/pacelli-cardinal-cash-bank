"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { massCreateStudentLogins } from "@/app/actions/massLogins";

export function MassLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="mt-8 rounded-lg border border-[var(--navy)]/10 bg-[var(--navy)]/[0.03] p-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
        Mass-create student logins
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Creates a login for every active student who does not already have one.
        Usernames are built automatically from the student&apos;s name and student
        number. Share the default password with students, then they can change it
        under Account.
      </p>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setMessage(null);
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await massCreateStudentLogins(formData);
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage(
              `Created ${result.created} logins` +
                (result.skipped ? ` (${result.skipped} skipped)` : "") +
                `. Default password: ${result.password}`,
            );
            router.refresh();
          });
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--navy)]">
            Default password for new logins
          </span>
          <input
            name="defaultPassword"
            type="text"
            required
            minLength={6}
            defaultValue="cardinal123"
            className="rounded-md border border-[var(--navy)]/20 px-3 py-2"
          />
        </label>
        <input type="hidden" name="onlyWithoutLogin" value="true" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create missing student logins"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-[var(--cardinal-red)]">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-[var(--navy)]">{message}</p> : null}
    </section>
  );
}
