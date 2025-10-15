"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEventContext } from "@/contexts/EventContext";

interface UseWasteLogsParams {
  limit?: number;
  page?: number;
  startDate?: string;
  endDate?: string;
}

export function useWasteLogs(params?: UseWasteLogsParams) {
  const { currentEventId } = useEventContext();

  return useQuery({
    queryKey: ["wasteLogs", currentEventId, params],
    queryFn: () =>
      api.getWasteLogs({
        ...params,
        eventId: currentEventId || undefined,
      }),
    enabled: !!currentEventId,
  });
}
