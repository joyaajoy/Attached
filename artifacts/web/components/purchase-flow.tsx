"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Ticket as TicketIcon,
} from "lucide-react";
import type { Ticket } from "@/lib/types";
import {
  formatDateFull,
  formatDuration,
  formatPrice,
  formatTime,
} from "@/lib/format";
import { generateSeat, generateTicketId } from "@/lib/utils";
import { ticketsStore } from "@/lib/tickets-store";

type Props = {
  uid: string;
  number: string;
  title: string;
  departure: string;
  arrival: string;
  duration: number;
  fromCode: string;
  fromTitle: string;
  toCode: string;
  toTitle: string;
  price: number;
  transportSubtype: string | null;
  expressType: string | null;
  date: string;
};

export function PurchaseFlow(props: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [document, setDocument] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formValid =
    fullName.trim().length >= 3 &&
    document.trim().length >= 4 &&
    card.replace(/\s/g, "").length >= 12 &&
    expiry.length >= 4 &&
    cvc.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setProcessing(true);
    setError(null);

    // Имитация оплаты
    await new Promise((r) => setTimeout(r, 1400));

    try {
      const ticket: Ticket = {
        id: generateTicketId(),
        createdAt: new Date().toISOString(),
        travelDate: props.date,
        passenger: {
          fullName: fullName.trim(),
          document: document.trim(),
        },
        segment: {
          uid: props.uid,
          number: props.number,
          title: props.title,
          departure: props.departure,
          arrival: props.arrival,
          duration: props.duration,
          fromCode: props.fromCode,
          fromTitle: props.fromTitle,
          toCode: props.toCode,
          toTitle: props.toTitle,
          transportSubtype: props.transportSubtype,
          expressType: props.expressType,
        },
        price: props.price,
        seat: generateSeat(),
        status: "paid",
      };

      ticketsStore.add(ticket);
      router.push(`/tickets/${ticket.id}?new=1`);
    } catch (err) {
      console.error("[v0] purchase error", err);
      setError("Не удалось оформить билет. Попробуйте ещё раз.");
      setProcessing(false);
    }
  };

  if (!props.uid) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm">
        Рейс не выбран.{" "}
        <Link href="/" className="text-primary underline">
          Вернуться к поиску
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Назад к расписанию
      </button>

      <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
        Оформление билета
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Проверьте детали поездки и заполните данные пассажира.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TicketIcon className="h-4 w-4 text-primary" aria-hidden />
              Пассажир
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              <Field
                label="Фамилия и имя"
                placeholder="Иванов Иван"
                value={fullName}
                onChange={setFullName}
                autoComplete="name"
              />
              <Field
                label="Номер документа"
                placeholder="Серия и номер паспорта"
                value={document}
                onChange={setDocument}
                autoComplete="off"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-primary" aria-hidden />
              Оплата
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden />
                Демо-режим
              </span>
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              <Field
                label="Номер карты"
                placeholder="1234 5678 9012 3456"
                value={card}
                onChange={(v) => setCard(formatCardNumber(v))}
                inputMode="numeric"
                autoComplete="cc-number"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="MM/YY"
                  placeholder="12/29"
                  value={expiry}
                  onChange={(v) => setExpiry(formatExpiry(v))}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                />
                <Field
                  label="CVC"
                  placeholder="•••"
                  value={cvc}
                  onChange={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  type="password"
                  autoComplete="cc-csc"
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                Реальные списания не производятся, данные не сохраняются.
              </p>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!formValid || processing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {processing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Обработка оплаты...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Оплатить {formatPrice(props.price)}
              </>
            )}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-card p-4 md:sticky md:top-20 md:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ваша поездка
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-8 w-0.5 bg-border" />
                <span className="h-2 w-2 rounded-full bg-accent" />
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(props.departure)} · отправление
                  </div>
                  <div className="text-sm font-medium">{props.fromTitle}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(props.arrival)} · прибытие
                  </div>
                  <div className="text-sm font-medium">{props.toTitle}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{formatDateFull(props.date)}</span>
              <span>В пути {formatDuration(props.duration)}</span>
              {props.transportSubtype && <span>{props.transportSubtype}</span>}
            </div>

            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">К оплате</span>
              <span className="text-lg font-semibold">
                {formatPrice(props.price)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function formatCardNumber(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
