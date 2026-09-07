"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { importStaffAccountsCsv } from "@/app/actions/accounts";

export function StaffAccountsCsvImport() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | null) {
    if (!file) return;
    setMessage(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      startTransition(async () => {
        const result = await importStaffAccountsCsv(text);
        if (result.error) {
          setError(result.error);
          return;
        }
        const parts = [
          result.created ? `${result.created} created` : null,
          result.updated ? `${result.updated} updated` : null,
          result.skipped ? `${result.skipped} skipped` : null,
        ].filter(Boolean);
        setMessage(
          parts.length
            ? `Staff account upload finished: ${parts.join(", ")}.`
            : "Staff account upload finished with no changes.",
        );
        if (result.problems?.length) {
          setError(result.problems.join(" "));
        }
        router.refresh();
      });
    };
    reader.readAsText(file);
  }

  return (
    <section className="mt-8 rounded-lg border border-[var(--navy)]/10 bg-[var(--navy)]/[0.03] p-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
        Upload admin &amp; teacher accounts CSV
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Create or update staff logins in bulk. Required columns:{" "}
        <code>firstName,lastName,username,password,role</code>. Role must be{" "}
        <code>Admin</code> or <code>Teacher</code> (Super Admin cannot be
        created by upload). Matching is by username: new usernames are created,
        existing ones are updated.
      </p>
      <p className="mt-2 text-xs text-[var(--ink-muted)]">
        <a
          href="/sample-staff-accounts.csv"
          className="underline underline-offset-2"
          download
        >
          Download sample CSV
        </a>
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        disabled={pending}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm"
      />
      {pending ? (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Uploading…</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-[var(--cardinal-red)]">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-[var(--navy)]">{message}</p> : null}
    </section>
  );
}
