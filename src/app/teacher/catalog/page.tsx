import { redirect } from "next/navigation";
import {
  createStoreItem,
  deleteStoreItem,
  updateStoreItem,
} from "@/app/actions/catalog";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { auth } from "@/lib/auth";
import { formatCash } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { canManageStore } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function createStoreItemAction(formData: FormData) {
  "use server";
  await createStoreItem(formData);
}

async function updateStoreItemAction(formData: FormData) {
  "use server";
  await updateStoreItem(formData);
}

async function deleteStoreItemAction(formData: FormData) {
  "use server";
  await deleteStoreItem(formData);
}

export default async function CatalogPage() {
  const session = await auth();
  if (!session?.user || !canManageStore(session.user.role)) {
    redirect("/teacher");
  }

  const items = await prisma.storeItem.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          Store catalog
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Add, edit, or delete school store items and prices.
        </p>

        <form action={createStoreItemAction} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--navy)]">Item name</span>
            <input name="name" required className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" placeholder="Pencil pack" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--navy)]">Description</span>
            <input name="description" className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--navy)]">Price ($)</span>
            <input name="price" type="number" min="0.01" step="0.01" required className="w-full rounded-md border border-[var(--navy)]/20 px-3 py-2" placeholder="2.50" />
          </label>
          <button type="submit" className="self-end rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white sm:w-fit">
            Add item
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
          Items ({items.length})
        </h2>
        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[var(--navy)]/10 p-4">
              <p className="text-sm text-[var(--ink-muted)]">
                Current: {formatCash(item.priceCents)}
                {!item.active ? " · inactive" : ""}
              </p>
              <form action={updateStoreItemAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="id" value={item.id} />
                <input
                  name="name"
                  defaultValue={item.name}
                  required
                  className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  name="description"
                  defaultValue={item.description ?? ""}
                  placeholder="Description"
                  className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={(item.priceCents / 100).toFixed(2)}
                  className="rounded-md border border-[var(--navy)]/20 px-3 py-2 text-sm"
                />
                <select
                  name="active"
                  defaultValue={item.active ? "true" : "false"}
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
                  formAction={deleteStoreItemAction}
                  message="Are you sure you want to delete this?"
                  className="rounded-md bg-[var(--cardinal-red)] px-3 py-2 text-sm font-medium text-white sm:w-fit"
                >
                  Delete item
                </ConfirmDeleteButton>
              </form>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="py-4 text-[var(--ink-muted)]">No store items yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
