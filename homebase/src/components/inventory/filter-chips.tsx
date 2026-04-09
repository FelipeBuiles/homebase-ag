"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

interface FilterChipsProps {
  filterValues: {
    categories: string[];
    rooms: string[];
    tags: string[];
  };
  active: {
    search?: string;
    category?: string;
    room?: string;
    tag?: string;
  };
}

export function FilterChips({ filterValues, active }: FilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(active.search ?? "");

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam("search", search || undefined);
  }

  function clearAll() {
    setSearch("");
    router.push(pathname);
  }

  const hasFilters = active.search || active.category || active.room || active.tag;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full pl-9 pr-4 h-9 rounded-lg border border-base-200 bg-white text-sm text-base-800 placeholder:text-base-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
        />
      </form>

      {/* Filter chips */}
      {(filterValues.categories.length > 0 ||
        filterValues.rooms.length > 0 ||
        filterValues.tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {filterValues.rooms.map((room) => (
            <Chip
              key={room}
              label={room}
              active={active.room === room}
              onClick={() =>
                setParam("room", active.room === room ? undefined : room)
              }
            />
          ))}

          {filterValues.categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              active={active.category === cat}
              onClick={() =>
                setParam(
                  "category",
                  active.category === cat ? undefined : cat
                )
              }
            />
          ))}

          {filterValues.tags.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              active={active.tag === tag}
              onClick={() =>
                setParam("tag", active.tag === tag ? undefined : tag)
              }
            />
          ))}

          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-base-400 hover:text-base-700 ml-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-accent-500 text-white"
          : "bg-base-100 text-base-600 hover:bg-base-200"
      )}
    >
      {label}
    </button>
  );
}
