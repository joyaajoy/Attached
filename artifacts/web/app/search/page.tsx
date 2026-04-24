import { Suspense } from "react";
import { ScheduleView } from "@/components/schedule-view";

type SearchParams = Promise<{
  from?: string;
  fromTitle?: string;
  to?: string;
  toTitle?: string;
  date?: string;
}>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          Загружаем расписание...
        </div>
      }
    >
      <ScheduleView
        from={params.from || ""}
        fromTitle={params.fromTitle || ""}
        to={params.to || ""}
        toTitle={params.toTitle || ""}
        date={params.date || ""}
      />
    </Suspense>
  );
}
