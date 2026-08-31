"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCash } from "@/lib/money";

export type StudentListItem = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  grade: string | null;
  qrToken: string;
  balanceCents: number;
};

export function StudentSearch({ students }: { students: StudentListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => {
      const haystack = [
        student.firstName,
        student.lastName,
        student.studentNumber ?? "",
        student.grade ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, students]);

  return (
    <div>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--navy)]">
          Search students
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, student number, or grade"
          className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-4 py-3 outline-none ring-[var(--cardinal-red)] focus:ring-2"
        />
      </label>

      <ul className="mt-6 divide-y divide-[var(--navy)]/10 border-y border-[var(--navy)]/10">
        {filtered.map((student) => (
          <li key={student.id}>
            <Link
              href={`/students/${student.qrToken}`}
              className="flex items-center justify-between gap-4 py-4 transition hover:bg-[var(--navy)]/[0.03]"
            >
              <div>
                <p className="font-medium text-[var(--navy)]">
                  {student.lastName}, {student.firstName}
                </p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {[student.grade ? `Grade ${student.grade}` : null, student.studentNumber]
                    .filter(Boolean)
                    .join(" · ") || "Student"}
                </p>
              </div>
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--cardinal-red)]">
                {formatCash(student.balanceCents)}
              </p>
            </Link>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="py-8 text-center text-[var(--ink-muted)]">No students match that search.</li>
        ) : null}
      </ul>
    </div>
  );
}
