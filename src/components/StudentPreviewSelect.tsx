"use client";

import { setViewAsStudent } from "@/app/actions/viewAs";

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
};

export function StudentPreviewSelect({
  students,
  previewStudentId,
}: {
  students: StudentOption[];
  previewStudentId?: string | null;
}) {
  if (students.length === 0) return null;

  return (
    <form action={setViewAsStudent} className="flex flex-wrap items-center gap-1.5">
      <label htmlFor="preview-student" className="text-xs text-white/70">
        Student
      </label>
      <select
        id="preview-student"
        name="studentId"
        defaultValue={previewStudentId ?? students[0]?.id}
        className="max-w-[240px] rounded border border-white/30 bg-[var(--navy)] px-2 py-1.5 text-xs text-white"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.lastName}, {student.firstName}
            {student.studentNumber ? ` (${student.studentNumber})` : ""}
          </option>
        ))}
      </select>
    </form>
  );
}
