"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Clock, RefreshCw, Train } from "lucide-react";
import type { ScheduleResponse, Segment } from "@/lib/types";
import {
  formatDateFull,
  formatDuration,
  formatPrice,
  formatRelative,
  formatTime,
  minutesUntil,
  todayIso,
} from "@/lib/format";
import { estimateBasePrice } from "@/lib/yandex";
import { cn } from "@/lib/utils";

type Props = {
  from: string;
  fromTitle: string;
  to: string;
  toTitle: string;
  date: string;
};

const fetcher = async (url: string): Promise<ScheduleResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Не удалось получить расписание");
  return res.json();
};

export function ScheduleView({ from, fromTitle, to, toTitle, date }: Props) {
  const effectiveDate = date || todayIso();
  const isToday = effectiveDate === todayIso();
  const apiUrl =
    from && to
      ? `/api/schedule?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${effectiveDate}`
      : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<ScheduleResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval: isToday ? 30_000 : 0,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    },
  );

  if (!from || !to) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
        Выберите станции отправления и прибытия на{" "}
        <Link href="/" className="font-medium text-primary underline">
          главной странице
        </Link>
        .
      </div>
    );
  }

  const segments = data?.segments ?? [];
  const fromName = data?.from?.title || fromTitle || from;
  const toName = data?.to?.title || toTitle || to;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 md:py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Изменить маршрут
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
          {fromName} <span className="text-muted-foreground">→</span> {toName}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{formatDateFull(effectiveDate)}</span>
          {isToday && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-70" />
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Обновляется автоматически
            </span>
          )}
          <button
            type="button"
            onClick={() => mutate()}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors hover:text-foreground",
              isValidating && "animate-pulse",
            )}
          >
            <RefreshCw className={cn("h-3 w-3", isValidating && "animate-spin")} aria-hidden />
            Обновить
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && <ScheduleSkeleton />}

        {error && !isLoading && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm">
            <p className="font-medium">Не удалось загрузить расписание.</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!isLoading && !error && segments.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Train className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-medium">На эту дату рейсов не найдено</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Попробуйте изменить дату или выбрать другую станцию.
            </p>
          </div>
        )}

        {!isLoading && segments.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {segments.map((s) => (
              <SegmentRow
                key={`${s.uid}-${s.departure}`}
                segment={s}
                date={effectiveDate}
                isToday={isToday}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SegmentRow({
  segment,
  date,
  isToday,
}: {
  segment: Segment;
  date: string;
  isToday: boolean;
}) {
  const price =
    segment.price_min ?? estimateBasePrice(segment.duration);
  const mins = minutesUntil(segment.departure);
  const departed = isToday && mins < -5;
  const soon = isToday && mins >= 0 && mins <= 20;

  const params = new URLSearchParams({
    uid: segment.uid,
    number: segment.number,
    title: segment.title,
    departure: segment.departure,
    arrival: segment.arrival,
    duration: String(segment.duration),
    fromCode: segment.from_station.code,
    fromTitle: segment.from_station.title,
    toCode: segment.to_station.code,
    toTitle: segment.to_station.title,
    price: String(price),
    transport: segment.transport_subtype || "",
    express: segment.thread_express_type || "",
    date,
  });

  return (
    <li>
      <Link
        href={`/purchase?${params.toString()}`}
        className={cn(
          "group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-accent/40 md:flex-row md:items-center md:gap-5 md:p-5",
          departed && "opacity-55",
        )}
      >
        <div className="flex items-center gap-4 md:flex-1">
          <div className="flex flex-col items-start">
            <span className="font-mono text-xl font-semibold tracking-tight md:text-2xl">
              {formatTime(segment.departure)}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              отправление
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden />
              {formatDuration(segment.duration)}
            </div>
            <div className="relative my-1 h-0.5 w-full min-w-[40px] rounded-full bg-border">
              <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
              <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent" />
            </div>
            <span className="truncate text-[11px] text-muted-foreground">
              {segment.title || `№ ${segment.number}`}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-mono text-xl font-semibold tracking-tight md:text-2xl">
              {formatTime(segment.arrival)}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              прибытие
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 md:min-w-[180px] md:flex-col md:items-end md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {segment.transport_subtype && (
              <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {segment.transport_subtype}
              </span>
            )}
            {segment.thread_express_type && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                экспресс
              </span>
            )}
            {soon && (
              <span className="inline-flex items-center rounded-md bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
                {formatRelative(segment.departure)}
              </span>
            )}
            {departed && (
              <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                отправился
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                от
              </span>
              <span className="text-lg font-semibold">{formatPrice(price)}</span>
            </div>
            <span className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity group-hover:opacity-90">
              Купить
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function ScheduleSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="h-[112px] animate-pulse rounded-2xl border border-border bg-card md:h-[96px]"
        />
      ))}
    </ul>
  );
}
