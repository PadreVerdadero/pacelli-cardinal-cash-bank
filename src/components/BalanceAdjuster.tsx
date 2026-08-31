"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adjustBalance } from "@/app/actions/balance";
import { formatCash } from "@/lib/money";

type Props = {
  studentId: string;
  currentBalanceCents: number;
};

export function BalanceAdjuster({ studentId, currentBalanceCents }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(mode: "add" | "subtract" | "store") {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await adjustBalance({ studentId, amount, note, mode });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        `Updated. New balance: ${formatCash(result.balanceCents ?? currentBalanceCents)} Cardinal Cash`,
      );
      setAmount("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <section className="mt-6 border-t border-[var(--navy)]/15 pt-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
        Teacher adjustment
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Add rewards, subtract fines, or ring up a store purchase.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--navy)]">Amount ($)</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-3 py-2 outline-none ring-[var(--cardinal-red)] focus:ring-2"
            placeholder="5.00"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--navy)]">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-3 py-2 outline-none ring-[var(--cardinal-red)] focus:ring-2"
            placeholder="Good citizenship, pencils, etc."
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("add")}
          className="rounded-md bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--navy-deep)] disabled:opacity-60"
        >
          Add Cash
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("subtract")}
          className="rounded-md bg-[var(--cardinal-red)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--cardinal-red-hot)] disabled:opacity-60"
        >
          Subtract Cash
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("store")}
          className="rounded-md border border-[var(--navy)] px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:bg-[var(--navy)]/5 disabled:opacity-60"
        >
          Store Purchase
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--cardinal-red)]">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-[var(--navy)]">{message}</p> : null}
    </section>
  );
}
