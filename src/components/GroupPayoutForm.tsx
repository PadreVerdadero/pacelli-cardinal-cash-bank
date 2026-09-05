"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { creditGroup } from "@/app/actions/groups";

export function GroupPayoutForm({
  groupId,
  groupName,
  memberCount,
}: {
  groupId: string;
  groupName: string;
  memberCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        formData.set("groupId", groupId);
        startTransition(async () => {
          const result = await creditGroup(formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setMessage(
            `Added cash to ${result.count} students in ${groupName}.`,
          );
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <input
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        required
        placeholder="Amount $"
        className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
      />
      <input
        name="note"
        placeholder="Note (optional)"
        className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending || memberCount === 0}
        className="rounded-md bg-[var(--cardinal-red)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Paying…" : `Pay all (${memberCount})`}
      </button>
      {error ? <p className="text-sm text-[var(--cardinal-red)] sm:col-span-3">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700 sm:col-span-3">{message}</p> : null}
    </form>
  );
}
