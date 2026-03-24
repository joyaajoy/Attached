import { useQueryClient } from "@tanstack/react-query";
import { useGetTickets, useSaveTicket, useDeleteTicket, getGetTicketsQueryKey } from "@workspace/api-client-react";
import type { TrainSegment } from "@workspace/api-client-react";

export function useTickets() {
  const queryClient = useQueryClient();
  const qk = getGetTicketsQueryKey();

  const query = useGetTickets({ query: { staleTime: 10000 } });

  const saveMutation = useSaveTicket({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
    },
  });

  const deleteMutation = useDeleteTicket({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
    },
  });

  const save = (segment: TrainSegment, date: string) =>
    saveMutation.mutateAsync({ data: { segment, date } });

  const remove = (id: string) => deleteMutation.mutateAsync({ id });

  return { ...query, save, remove, isSaving: saveMutation.isPending };
}
