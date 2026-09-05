"use client";

export function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white print:hidden"
    >
      {label}
    </button>
  );
}
