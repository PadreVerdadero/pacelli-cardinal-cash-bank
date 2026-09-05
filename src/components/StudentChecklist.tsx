"use client";

import { useMemo, useState } from "react";

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  grade: string | null;
};

export function StudentChecklist({
  students,
  name = "studentIds",
  initialSelected = [],
}: {
  students: StudentOption[];
  name?: string;
  initialSelected?: string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
      `${student.lastName} ${student.firstName} ${student.studentNumber ?? ""} ${student.grade ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [query, students]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible(on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const student of filtered) {
        if (on) next.add(student.id);
        else next.delete(student.id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students"
          className="min-w-[200px] flex-1 rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => selectVisible(true)}
          className="rounded-md border border-[var(--navy)] px-3 py-2 text-sm"
        >
          Check visible
        </button>
        <button
          type="button"
          onClick={() => selectVisible(false)}
          className="rounded-md border border-[var(--navy)] px-3 py-2 text-sm"
        >
          Uncheck visible
        </button>
        <span className="text-sm text-[var(--ink-muted)]">{selected.size} selected</span>
      </div>
      <ul className="max-h-72 overflow-auto rounded-md border border-[var(--navy)]/10 divide-y divide-[var(--navy)]/10">
        {filtered.map((student) => (
          <li key={student.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--navy)]/[0.03]">
              <input
                type="checkbox"
                checked={selected.has(student.id)}
                onChange={() => toggle(student.id)}
              />
              <span>
                {student.lastName}, {student.firstName}
                <span className="text-[var(--ink-muted)]">
                  {" "}
                  ·{" "}
                  {[student.grade ? `Grade ${student.grade}` : null, student.studentNumber]
                    .filter(Boolean)
                    .join(" · ") || "Student"}
                </span>
              </span>
            </label>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-sm text-[var(--ink-muted)]">No students match.</li>
        ) : null}
      </ul>
    </div>
  );
}
