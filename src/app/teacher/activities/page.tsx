import { redirect } from "next/navigation";
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from "@/app/actions/catalog";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { canManageActivities } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function createActivityAction(formData: FormData) {
  "use server";
  await createActivity(formData);
}

async function updateActivityAction(formData: FormData) {
  "use server";
  await updateActivity(formData);
}

async function deleteActivityAction(formData: FormData) {
  "use server";
  await deleteActivity(formData);
}

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session?.user || !canManageActivities(session.user.role)) {
    redirect("/teacher");
  }

  const activities = await prisma.activity.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Activities
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Add, edit, or delete activity rewards. Teachers can apply these on a student page.
        </p>

        <form action={createActivityAction} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--navy)]">Activity name</span>
            <input name="name" required className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" placeholder="Helping a classmate" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--navy)]">Description</span>
            <input name="description" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Value ($)</span>
            <input name="value" type="number" min="0.01" step="0.01" required className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" placeholder="1.00" />
          </label>
          <button type="submit" className="self-end rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white sm:w-fit">
            Add activity
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          Activity list ({activities.length})
        </h2>
        <ul className="mt-4 space-y-4">
          {activities.map((activity) => (
            <li key={activity.id} className="rounded-xl border border-[var(--navy)]/10 p-4">
              <p className="text-sm text-[var(--ink-muted)]">
                Current: {formatCash(activity.valueCents)}
                {!activity.active ? " · inactive" : ""}
              </p>
              <form action={updateActivityAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="id" value={activity.id} />
                <input
                  name="name"
                  defaultValue={activity.name}
                  required
                  className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  name="description"
                  defaultValue={activity.description ?? ""}
                  placeholder="Description"
                  className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  name="value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={(activity.valueCents / 100).toFixed(2)}
                  className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                />
                <select
                  name="active"
                  defaultValue={activity.active ? "true" : "false"}
                  className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button
                  type="submit"
                  className="rounded-md border border-[var(--navy)] px-3 py-2 text-sm font-medium text-[var(--navy)] sm:w-fit"
                >
                  Save changes
                </button>
                <ConfirmDeleteButton
                  formAction={deleteActivityAction}
                  message="Are you sure you want to delete this?"
                  className="rounded-md bg-[var(--cardinal-red)] px-3 py-2 text-sm font-medium text-white sm:w-fit"
                >
                  Delete activity
                </ConfirmDeleteButton>
              </form>
            </li>
          ))}
          {activities.length === 0 ? (
            <li className="py-4 text-[var(--ink-muted)]">No activities yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
