import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number | boolean | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Super Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "1";

  const downloadedAt = new Date();
  const students = await prisma.student.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      user: { select: { username: true, active: true } },
    },
  });

  const stamp = downloadedAt.toISOString();
  const header = [
    "lastName",
    "firstName",
    "studentNumber",
    "grade",
    "active",
    "balance",
    "balanceCents",
    "username",
    "loginActive",
    "downloadedAt",
  ];

  const rows = students.map((student) =>
    [
      student.lastName,
      student.firstName,
      student.studentNumber ?? "",
      student.grade ?? "",
      student.active ? "true" : "false",
      formatCash(student.balanceCents),
      student.balanceCents,
      student.user?.username ?? "",
      student.user ? (student.user.active ? "true" : "false") : "",
      stamp,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = `\uFEFF${[header.join(","), ...rows].join("\r\n")}\r\n`;
  const fileStamp = stamp.replace(/[:.]/g, "-");
  const filename = `cardinal-cash-balances-${fileStamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
