import { Suspense } from "react";
import { PurchaseFlow } from "@/components/purchase-flow";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function PurchasePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const p = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">
          Загружаем...
        </div>
      }
    >
      <PurchaseFlow
        uid={p.uid || ""}
        number={p.number || ""}
        title={p.title || ""}
        departure={p.departure || ""}
        arrival={p.arrival || ""}
        duration={Number(p.duration || 0)}
        fromCode={p.fromCode || ""}
        fromTitle={p.fromTitle || ""}
        toCode={p.toCode || ""}
        toTitle={p.toTitle || ""}
        price={Number(p.price || 0)}
        transportSubtype={p.transport || null}
        expressType={p.express || null}
        date={p.date || ""}
      />
    </Suspense>
  );
}
