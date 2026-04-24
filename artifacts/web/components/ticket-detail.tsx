"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Hash,
  MapPin,
  Train,
  Trash2,
  User,
} from "lucide-react";
import type { Ticket } from "@/lib/types";
import { ticketsStore } from "@/lib/tickets-store";
import {
  formatDateFull,
  formatDuration,
  formatPrice,
  formatTime,
} from "@/lib/format";

export function TicketDetail({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const [ticket, setTicket] = useState<Ticket | null | undefined>(undefined);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    const t = ticketsStore.get(id);
    setTicket(t ?? null);
    return ticketsStore.subscribe(() => {
      const updated = ticketsStore.get(id);
      setTicket(updated ?? null);
    });
  }, [id]);

  const payload = useMemo(() => {
    if (!ticket) return "";
    return JSON.stringify({
      v: 1,
      id: ticket.id,
      date: ticket.travelDate,
      from: ticket.segment.fromCode,
      to: ticket.segment.toCode,
      dep: ticket.segment.departure,
      arr: ticket.segment.arrival,
      passenger: ticket.passenger.fullName,
      seat: ticket.seat,
    });
  }, [ticket]);

  useEffect(() => {
    let cancelled = false;
    if (!payload) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch((err) => {
        console.error("[v0] qr error", err);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (ticket === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">
        Загрузка билета...
      </div>
    );
  }

  if (ticket === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm">Билет не найден.</p>
        <Link
          href="/tickets"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          К списку билетов
        </Link>
      </div>
    );
  }

  const handleRemove = () => {
    if (confirmRemove) {
      ticketsStore.remove(ticket.id);
      window.location.href = "/tickets";
      return;
    }
    setConfirmRemove(true);
  };

  const statusLabel: Record<Ticket["status"], string> = {
    paid: "Оплачен",
    used: "Использован",
    cancelled: "Отменён",
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 md:py-8">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        К моим билетам
      </Link>

      {isNew && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Оплата прошла успешно. Билет сохранён в разделе «Мои билеты».
        </div>
      )}

      <article className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex items-start justify-between gap-3 bg-accent p-5 text-accent-foreground">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-accent-foreground/70">
              Электронный билет
            </span>
            <h1 className="mt-1 text-xl font-bold md:text-2xl">
              {ticket.segment.fromTitle} → {ticket.segment.toTitle}
            </h1>
            <p className="mt-1 text-xs text-accent-foreground/75">
              {formatDateFull(ticket.travelDate)}
            </p>
          </div>
          <span className="rounded-full bg-success/20 px-2.5 py-1 text-[11px] font-semibold text-success">
            {statusLabel[ticket.status]}
          </span>
        </header>

        <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-background p-4">
              <div className="flex flex-col items-center pt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                <span className="h-10 w-0.5 bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent/10" />
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <div className="font-mono text-xl font-semibold">
                    {formatTime(ticket.segment.departure)}
                  </div>
                  <div className="text-sm font-medium">
                    {ticket.segment.fromTitle}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Отправление
                  </div>
                </div>
                <div>
                  <div className="font-mono text-xl font-semibold">
                    {formatTime(ticket.segment.arrival)}
                  </div>
                  <div className="text-sm font-medium">
                    {ticket.segment.toTitle}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Прибытие
                  </div>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon={User} label="Пассажир" value={ticket.passenger.fullName} />
              <InfoRow icon={Hash} label="Документ" value={maskDoc(ticket.passenger.document)} />
              <InfoRow
                icon={Train}
                label="Поезд"
                value={ticket.segment.title || `№ ${ticket.segment.number}`}
              />
              <InfoRow
                icon={Clock}
                label="В пути"
                value={formatDuration(ticket.segment.duration)}
              />
              <InfoRow icon={MapPin} label="Место" value={ticket.seat} />
              <InfoRow
                icon={CheckCircle2}
                label="Оплачено"
                value={formatPrice(ticket.price)}
              />
            </dl>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background p-4">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt={`QR-код билета ${ticket.id}`}
                className="h-40 w-40 rounded-lg md:h-44 md:w-44"
              />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-lg bg-muted md:h-44 md:w-44" />
            )}
            <div className="text-center">
              <div className="font-mono text-xs font-semibold tracking-wider">
                {ticket.id}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Покажите QR контролёру
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-border bg-muted/40 p-4">
          <span className="text-[11px] text-muted-foreground">
            Билет оформлен {formatDateFull(ticket.createdAt)}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {confirmRemove ? "Подтвердить удаление" : "Удалить"}
          </button>
        </footer>
      </article>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex min-w-0 flex-col">
        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function maskDoc(doc: string): string {
  const trimmed = doc.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 2)} ${"•".repeat(Math.max(0, trimmed.length - 4))} ${trimmed.slice(-2)}`;
}
