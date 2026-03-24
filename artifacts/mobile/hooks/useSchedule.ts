import { useQuery } from "@tanstack/react-query";
import { useGetSchedule, useSearchStations, useGetPopularStations } from "@workspace/api-client-react";

export function useScheduleQuery(from: string, to: string, date: string) {
  return useGetSchedule(
    { from, to, date },
    { query: { enabled: !!from && !!to, staleTime: 60000 } }
  );
}

export function useStationSearch(q: string) {
  return useSearchStations(
    { q },
    { query: { enabled: q.length >= 2, staleTime: 300000 } }
  );
}

export function usePopularStations() {
  return useGetPopularStations({ query: { staleTime: 600000 } });
}
