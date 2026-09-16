"use client";

import { useEffect, useMemo, useState } from "react";

type Option = {
  id: string;
  label: string;
};

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  searchPlaceholder = "Type to search",
  emptyText = "No matches",
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.some((option) => option.id === value)) {
      onChange(filtered[0].id);
    }
  }, [filtered, value, onChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--navy)]">{label}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-3 py-2"
        />
      </label>
      <select
        value={filtered.some((option) => option.id === value) ? value : filtered[0]?.id ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--navy)]/20 bg-white px-3 py-2"
        disabled={filtered.length === 0}
      >
        {filtered.length === 0 ? (
          <option value="">{emptyText}</option>
        ) : (
          filtered.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
