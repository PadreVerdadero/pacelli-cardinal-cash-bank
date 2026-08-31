"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { importStudentsCsv } from "@/app/actions/students";

export function CsvImport() {
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
        const result = await importStudentsCsv(text);
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage(`Imported ${result.created} students${result.skipped ? ` (${result.skipped} skipped)` : ""}.`);
        router.refresh();
      });
    };
    reader.readAsText(file);
  }

  return (
    <section className="mt-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
        Import CSV
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Required columns: <code>firstName,lastName</code>. Optional:{" "}
        <code>studentNumber,grade,initialBalance</code>
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        disabled={pending}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm"
      />
      {error ? <p className="mt-2 text-sm text-[var(--cardinal-red)]">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-[var(--navy)]">{message}</p> : null}
    </section>
  );
}
