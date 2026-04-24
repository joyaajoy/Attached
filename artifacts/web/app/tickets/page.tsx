import { TicketsList } from "@/components/tickets-list";

export default function TicketsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Мои билеты</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Активные и прошедшие поездки. Билеты хранятся локально в браузере.
      </p>
      <div className="mt-6">
        <TicketsList />
      </div>
    </div>
  );
}
