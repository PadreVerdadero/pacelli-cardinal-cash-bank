import { setViewAsRole } from "@/app/actions/viewAs";
import { roleLabel, type Role } from "@/lib/roles";
import { VIEW_AS_OPTIONS } from "@/lib/view-as";

type Props = {
  realRole: Role;
  effectiveRole: Role;
};

export function RoleViewSwitcher({ realRole, effectiveRole }: Props) {
  if (realRole !== "SUPER_ADMIN") return null;

  const options: Role[] = ["SUPER_ADMIN", ...VIEW_AS_OPTIONS];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-white/70">View as</span>
      {options.map((role) => {
        const active = effectiveRole === role;
        return (
          <form key={role} action={setViewAsRole}>
            <input type="hidden" name="role" value={role} />
            <button
              type="submit"
              className={
                active
                  ? "rounded bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--navy)]"
                  : "rounded border border-white/30 px-2.5 py-1.5 text-xs text-white/90 transition hover:bg-white/10"
              }
            >
              {roleLabel(role)}
            </button>
          </form>
        );
      })}
    </div>
  );
}
