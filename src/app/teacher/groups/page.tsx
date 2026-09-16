import { redirect } from "next/navigation";
import {
  claimGroup,
  createGroup,
  deleteGroup,
  unclaimGroup,
  updateGroup,
} from "@/app/actions/groups";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { GroupPayoutForm } from "@/components/GroupPayoutForm";
import { StudentChecklist } from "@/components/StudentChecklist";
import { prisma } from "@/lib/prisma";
import { canManageGroups } from "@/lib/roles";
import { getAuthUser } from "@/lib/session";

export const dynamic = "force-dynamic";

async function createGroupAction(formData: FormData) {
  "use server";
  await createGroup(formData);
}

async function updateGroupAction(formData: FormData) {
  "use server";
  await updateGroup(formData);
}

async function deleteGroupAction(formData: FormData) {
  "use server";
  await deleteGroup(formData);
}

async function claimGroupAction(formData: FormData) {
  "use server";
  await claimGroup(formData);
}

async function unclaimGroupAction(formData: FormData) {
  "use server";
  await unclaimGroup(formData);
}

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  grade: string | null;
};

type GroupWithMembers = {
  id: string;
  name: string;
  description: string | null;
  members: {
    studentId: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      active: boolean;
    };
  }[];
};

function GroupCard({
  group,
  students,
  claimed,
}: {
  group: GroupWithMembers;
  students: StudentOption[];
  claimed: boolean;
}) {
  const memberIds = group.members.map((m) => m.studentId);
  const activeCount = group.members.filter((m) => m.student.active).length;

  return (
    <div className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
            {group.name}
          </h3>
          <p className="text-sm text-[var(--ink-muted)]">
            {activeCount} active members
            {group.description ? ` · ${group.description}` : ""}
          </p>
        </div>
        {claimed ? (
          <form action={unclaimGroupAction}>
            <input type="hidden" name="groupId" value={group.id} />
            <button
              type="submit"
              className="rounded-md border border-[var(--navy)] px-3 py-1.5 text-xs font-medium text-[var(--navy)]"
            >
              Remove from My Groups
            </button>
          </form>
        ) : (
          <form action={claimGroupAction}>
            <input type="hidden" name="groupId" value={group.id} />
            <button
              type="submit"
              className="rounded-md bg-[var(--navy)] px-3 py-1.5 text-xs font-medium text-white"
            >
              Add to My Groups
            </button>
          </form>
        )}
      </div>

      <GroupPayoutForm
        groupId={group.id}
        groupName={group.name}
        memberCount={activeCount}
      />

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-[var(--navy)]">
          Edit members
        </summary>
        <form action={updateGroupAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={group.id} />
          <input
            name="name"
            defaultValue={group.name}
            required
            className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
          />
          <input
            name="description"
            defaultValue={group.description ?? ""}
            className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
          />
          <StudentChecklist students={students} initialSelected={memberIds} />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-md border border-[var(--navy)] px-3 py-2 text-sm font-medium text-[var(--navy)]"
            >
              Save group
            </button>
            <ConfirmDeleteButton
              formAction={deleteGroupAction}
              message="Are you sure you want to delete this?"
              className="rounded-md bg-[var(--cardinal-red)] px-3 py-2 text-sm font-medium text-white"
            >
              Delete group
            </ConfirmDeleteButton>
          </div>
        </form>
      </details>
    </div>
  );
}

export default async function GroupsPage() {
  const user = await getAuthUser();
  if (!user || !canManageGroups(user.role)) {
    redirect("/teacher");
  }

  const [students, groups, claims] = await Promise.all([
    prisma.student.findMany({
      where: { active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentNumber: true,
        grade: true,
      },
    }),
    prisma.studentGroup.findMany({
      orderBy: { name: "asc" },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                active: true,
              },
            },
          },
        },
      },
    }),
    prisma.teacherGroup.findMany({
      where: { teacherId: user.id },
      select: { groupId: true },
    }),
  ]);

  const claimedIds = new Set(claims.map((claim) => claim.groupId));
  const myGroups = groups.filter((group) => claimedIds.has(group.id));
  const otherGroups = groups.filter((group) => !claimedIds.has(group.id));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Student groups
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Check the students in a class or team, then pay Cardinal Cash to everyone in the
          group at once. Add groups to My Groups so they stay at the top for your login.
        </p>

        <form action={createGroupAction} className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--navy)]">Group name</span>
              <input
                name="name"
                required
                placeholder="Group name"
                className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--navy)]">Description</span>
              <input
                name="description"
                placeholder="Optional"
                className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2"
              />
            </label>
          </div>
          <StudentChecklist students={students} />
          <button
            type="submit"
            className="rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Create group
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          My Groups ({myGroups.length})
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Groups you assigned to yourself. Only you see this list at the top.
        </p>
        {myGroups.map((group) => (
          <GroupCard key={group.id} group={group} students={students} claimed />
        ))}
        {myGroups.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            No groups in My Groups yet. Use &quot;Add to My Groups&quot; below.
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          All groups ({groups.length})
        </h2>
        {otherGroups.map((group) => (
          <GroupCard key={group.id} group={group} students={students} claimed={false} />
        ))}
        {otherGroups.length === 0 && groups.length > 0 ? (
          <p className="text-[var(--ink-muted)]">All groups are in My Groups.</p>
        ) : null}
        {groups.length === 0 ? (
          <p className="text-[var(--ink-muted)]">No groups yet.</p>
        ) : null}
      </section>
    </div>
  );
}
