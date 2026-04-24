import { TicketDetail } from "@/components/ticket-detail";

type Params = Promise<{ id: string }>;

export default async function TicketPage({ params }: { params: Params }) {
  const { id } = await params;
  return <TicketDetail id={id} />;
}
