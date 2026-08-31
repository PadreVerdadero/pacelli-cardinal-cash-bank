"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustBalance } from "@/app/actions/balance";
import { formatCash } from "@/lib/money";

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  balanceCents: number;
  qrToken: string;
};

export function StoreCheckout({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("School store");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => students.find((s) => s.id === studentId),
    [students, studentId],
  );

  function checkout() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await adjustBalance({
        studentId,
        amount,
        note,
        mode: "store",
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(`Purchase complete. Remaining balance: ${formatCash(result.balanceCents ?? 0)}`);
      setAmount("");
      router.refresh();
    });
  }

  if (students.length === 0) {
    return <p className="text-[var(--ink-muted)]">Add students before using the store.</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--navy)]">Student</span>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-3 py-2"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.lastName}, {student.firstName} ({formatCash(student.balanceCents)})
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <p className="text-sm text-[var(--ink-muted)]">
          Available:{" "}
          <span className="font-medium text-[var(--navy)]">
            {formatCash(selected.balanceCents)} Cardinal Cash
          </span>
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--navy)]">Purchase amount ($)</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--navy)]">Item / note</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-3 py-2"
        />
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={checkout}
        className="rounded-md bg-[var(--cardinal-red)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--cardinal-red-hot)] disabled:opacity-60"
      >
        Complete purchase
      </button>

      {error ? <p className="text-sm text-[var(--cardinal-red)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--navy)]">{message}</p> : null}
    </div>
  );
}
