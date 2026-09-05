"use client";

import { useMemo, useState } from "react";
import { PrintButton } from "@/components/PrintButton";
import { formatCash } from "@/lib/money";

export type QrCard = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  grade: string | null;
  balanceCents: number;
  qrToken: string;
  qr: string;
};

const PER_PAGE_OPTIONS = [
  { value: 1, label: "1 per page (largest)", cols: "grid-cols-1", img: 320 },
  { value: 2, label: "2 per page", cols: "grid-cols-1 sm:grid-cols-2 print:grid-cols-2", img: 260 },
  { value: 4, label: "4 per page", cols: "grid-cols-2 print:grid-cols-2", img: 200 },
  { value: 6, label: "6 per page", cols: "grid-cols-2 lg:grid-cols-3 print:grid-cols-3", img: 170 },
  { value: 9, label: "9 per page", cols: "grid-cols-3 print:grid-cols-3", img: 140 },
  { value: 12, label: "12 per page (smallest)", cols: "grid-cols-3 lg:grid-cols-4 print:grid-cols-4", img: 120 },
] as const;

export function QrCardsPrinter({ cards }: { cards: QrCard[] }) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(cards.map((c) => c.id)),
  );
  const [perPage, setPerPage] = useState(6);

  const option = PER_PAGE_OPTIONS.find((o) => o.value === perPage) ?? PER_PAGE_OPTIONS[3];

  const visible = useMemo(
    () => cards.filter((card) => selected.has(card.id)),
    [cards, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(on: boolean) {
    setSelected(on ? new Set(cards.map((c) => c.id)) : new Set());
  }

  return (
    <div>
      <div className="mb-6 space-y-4 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">
              Cards per page
            </span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-md border border-[var(--navy)]/20 px-3 py-2"
            >
              {PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <PrintButton label="Print / Save QR cards as PDF" />
        </div>

        <div className="rounded-lg border border-[var(--navy)]/10 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[var(--navy)]">
              Students to include ({selected.size} selected)
            </p>
            <button
              type="button"
              onClick={() => selectAll(true)}
              className="rounded-md border border-[var(--navy)] px-3 py-1.5 text-sm"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => selectAll(false)}
              className="rounded-md border border-[var(--navy)] px-3 py-1.5 text-sm"
            >
              Clear all
            </button>
          </div>
          <ul className="max-h-56 overflow-auto divide-y divide-[var(--navy)]/10 rounded-md border border-[var(--navy)]/10">
            {cards.map((card) => (
              <li key={card.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--navy)]/[0.03]">
                  <input
                    type="checkbox"
                    checked={selected.has(card.id)}
                    onChange={() => toggle(card.id)}
                  />
                  <span>
                    {card.lastName}, {card.firstName}
                    <span className="text-[var(--ink-muted)]">
                      {" "}
                      ·{" "}
                      {[card.grade ? `Grade ${card.grade}` : null, card.studentNumber]
                        .filter(Boolean)
                        .join(" · ") || "Student"}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <header className="mb-6 border-b border-black/20 pb-4 print:mb-4">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--cardinal-red)]">
          Pacelli Catholic Schools · Cardinal Cash Bank
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Student QR cards</h1>
        <p className="mt-1 text-sm text-black/70">
          {visible.length} card{visible.length === 1 ? "" : "s"} · {option.label}
        </p>
      </header>

      {visible.length === 0 ? (
        <p className="print:hidden text-[var(--ink-muted)]">
          Select at least one student to print.
        </p>
      ) : (
        <div className={`grid gap-4 ${option.cols}`}>
          {visible.map((card) => (
            <article
              key={card.id}
              className="break-inside-avoid rounded-lg border border-black/20 p-4 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.qr}
                alt={`QR for ${card.firstName} ${card.lastName}`}
                width={option.img}
                height={option.img}
                className="mx-auto"
                style={{ width: option.img, height: option.img }}
              />
              <h2 className="mt-3 text-lg font-semibold">
                {card.firstName} {card.lastName}
              </h2>
              <p className="text-sm text-black/70">
                {[card.grade ? `Grade ${card.grade}` : null, card.studentNumber]
                  .filter(Boolean)
                  .join(" · ") || "Student"}
              </p>
              <p className="mt-1 text-sm font-medium">
                Balance: {formatCash(card.balanceCents)}
              </p>
              <p className="mt-2 text-[10px] break-all text-black/45">{card.qrToken}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
