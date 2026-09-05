import { redirect } from "next/navigation";
import { createActivity, setActivityActive } from "@/app/actions/catalog";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { canManageActivities } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function createActivityAction(formData: FormData) {
  "use server";
  await createActivity(formData);
}

async function setActivityActiveAction(formData: FormData) {
  "use server";
  await setActivityActive(formData);
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
          Assign Cardinal Cash values to activities. Teachers can apply these on a student page.
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
        <ul className="mt-4 divide-y divide-[var(--navy)]/10">
          {activities.map((activity) => (
            <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-[var(--navy)]">{activity.name}</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {formatCash(activity.valueCents)}
                  {activity.description ? ` · ${activity.description}` : ""}
                  {!activity.active ? " · inactive" : ""}
                </p>
              </div>
              <form action={setActivityActiveAction}>
                <input type="hidden" name="id" value={activity.id} />
                <input type="hidden" name="active" value={activity.active ? "false" : "true"} />
                <button type="submit" className="rounded-md border border-[var(--navy)] px-3 py-2 text-sm">
                  {activity.active ? "Deactivate" : "Activate"}
                </button>
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
