"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import type { Station } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
  suggestions: Station[];
  placeholder?: string;
  inputId?: string;
};

export function StationPicker({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  inputId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.short_title?.toLowerCase().includes(q) ||
        s.region?.toLowerCase().includes(q),
    );
  }, [query, suggestions]);

  const displayValue = value?.title || "";

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <button
        type="button"
        id={inputId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-card px-3.5 py-3 text-left text-sm transition-colors",
          open
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-accent/40",
        )}
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span
          className={cn(
            "flex-1 truncate",
            !displayValue && "text-muted-foreground",
          )}
        >
          {displayValue || placeholder || "Выберите станцию"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название станции"
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                Ничего не найдено
              </li>
            )}
            {filtered.map((s) => (
              <li key={`${s.code}-${s.title}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                    value?.code === s.code && "bg-muted",
                  )}
                >
                  <span className="font-medium text-foreground">{s.title}</span>
                  {s.region && (
                    <span className="text-xs text-muted-foreground">{s.region}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
