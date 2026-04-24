"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, Calendar, Search } from "lucide-react";
import type { Station } from "@/lib/types";
import { todayIso } from "@/lib/format";
import { StationPicker } from "./station-picker";

type Props = {
  initial?: {
    from?: Station | null;
    to?: Station | null;
    date?: string;
  };
  stations: Station[];
};

export function SearchForm({ initial, stations }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState<Station | null>(initial?.from ?? null);
  const [to, setTo] = useState<Station | null>(initial?.to ?? null);
  const [date, setDate] = useState<string>(initial?.date ?? todayIso());
  const [submitting, setSubmitting] = useState(false);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;
    if (from.code === to.code) return;
    setSubmitting(true);
    const params = new URLSearchParams({
      from: from.code,
      fromTitle: from.title,
      to: to.code,
      toTitle: to.title,
      date,
    });
    router.push(`/search?${params.toString()}`);
  };

  const canSubmit = Boolean(from && to && from.code !== to.code);

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
        <StationPicker
          label="Откуда"
          value={from}
          onChange={setFrom}
          suggestions={stations}
          placeholder="Станция отправления"
          inputId="from-picker"
        />

        <button
          type="button"
          onClick={swap}
          aria-label="Поменять станции местами"
          className="hidden items-center justify-center self-end rounded-xl border border-border bg-card p-3 text-muted-foreground transition-colors hover:text-foreground md:flex"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </button>

        <StationPicker
          label="Куда"
          value={to}
          onChange={setTo}
          suggestions={stations}
          placeholder="Станция назначения"
          inputId="to-picker"
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="date"
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Дата
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3">
            <Calendar className="h-4 w-4 text-primary" aria-hidden />
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayIso()}
              className="bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={swap}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
          Поменять местами
        </button>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
        >
          <Search className="h-4 w-4" aria-hidden />
          Найти электричку
        </button>
      </div>
    </form>
  );
}
