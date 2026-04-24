"use client";

import Link from "next/link";
import { ArrowRight, Ticket as TicketIcon } from "lucide-react";
import { useTickets } from "@/lib/use-tickets";
import {
  formatDateFull,
  formatDuration,
  formatPrice,
  formatTime,
} from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TicketsList() {
  const { tickets, mounted } = useTickets();

  if (!mounted) {
    return (
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <li
            key={i}
            className="h-[140px] animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </ul>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TicketIcon className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="mt-3 text-base font-semibold">Билетов пока нет</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Найдите подходящую электричку и оформите билет — он появится здесь и
          будет доступен офлайн.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Найти электричку
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const now = Date.now();

  return (
    <ul className="flex flex-col gap-3">
      {tickets.map((t) => {
        const departureTs = new Date(t.segment.departure).getTime();
        const isPast = t.status === "used" || departureTs < now - 3_600_000;
        return <TicketCard key={t.id} ticket={t} isPast={isPast} />;
      })}
    </ul>
  );
}

function TicketCard({ ticket, isPast }: { ticket: Ticket; isPast: boolean }) {
  return (
    <li>
      <Link
        href={`/tickets/${ticket.id}`}
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-accent/40 md:flex-row md:items-center md:gap-4 md:p-5",
          isPast && "opacity-70",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              isPast
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
            )}
          >
            <TicketIcon className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {formatDateFull(ticket.travelDate)}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                isPast ? "text-muted-foreground" : "text-success",
              )}
            >
              {isPast ? "Использован" : "Действителен"}
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 md:gap-5">
          <div className="flex flex-col">
            <span className="font-mono text-lg font-semibold">
              {formatTime(ticket.segment.departure)}
            </span>
            <span className="max-w-[140px] truncate text-xs text-muted-foreground">
              {ticket.segment.fromTitle}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center text-[11px] text-muted-foreground">
            {formatDuration(ticket.segment.duration)}
            <div className="my-1 h-px w-full bg-border" />
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-lg font-semibold">
              {formatTime(ticket.segment.arrival)}
            </span>
            <span className="max-w-[140px] truncate text-xs text-muted-foreground">
              {ticket.segment.toTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <span className="text-xs text-muted-foreground">
            {formatPrice(ticket.price)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Показать билет
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}
