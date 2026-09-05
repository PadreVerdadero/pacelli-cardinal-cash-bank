"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/app/actions/password";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await changePassword(formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setMessage("Password updated.");
          event.currentTarget.reset();
        });
      }}
    >
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--navy)]">Current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--navy)]">New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--navy)]">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-[var(--cardinal-red)]">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
