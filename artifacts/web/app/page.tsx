import Link from "next/link";
import { ArrowRight, Clock, QrCode, Zap } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { POPULAR_ROUTES, POPULAR_STATIONS } from "@/lib/yandex";
import { todayIso } from "@/lib/format";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-border bg-accent text-accent-foreground">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary" />
          <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-primary" />
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary-foreground/90 ring-1 ring-primary/25">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Данные в реальном времени
            </span>
            <h1 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Электрички России. Расписание и билеты в одном месте.
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-accent-foreground/75 md:text-base">
              Актуальные отправления с обновлением каждые 30 секунд, мгновенная
              покупка билета и QR-код прямо в телефоне.
            </p>
          </div>

          <SearchForm stations={POPULAR_STATIONS} initial={{ date: todayIso() }} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Популярные направления
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Быстрый переход к часто используемым маршрутам
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {POPULAR_ROUTES.map((r) => {
            const params = new URLSearchParams({
              from: r.from.code,
              fromTitle: r.from.title,
              to: r.to.code,
              toTitle: r.to.title,
              date: todayIso(),
            });
            return (
              <Link
                key={r.label}
                href={`/search?${params.toString()}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-accent/40"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Маршрут
                  </span>
                  <span className="truncate text-base font-semibold">
                    {r.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {r.from.title} → {r.to.title}
                  </span>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-12">
        <div className="grid gap-3 md:grid-cols-3">
          <FeatureCard
            icon={Clock}
            title="Реальное расписание"
            text="Время отправления и прибытия подгружается из открытых данных Яндекс.Расписаний."
          />
          <FeatureCard
            icon={QrCode}
            title="QR-билет в один клик"
            text="После оформления билет сохраняется локально и всегда доступен офлайн."
          />
          <FeatureCard
            icon={Zap}
            title="Автообновление"
            text="Страница расписания автоматически подтягивает свежие отправления."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
