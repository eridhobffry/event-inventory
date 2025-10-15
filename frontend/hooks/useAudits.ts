"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useUser } from "@stackframe/stack";
import { toast } from "sonner";
import { useEventContext } from "@/contexts/EventContext";

export function useAudits(params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  contextId?: string;
}) {
  const { currentEventId } = useEventContext();

  return useQuery({
    queryKey: ["audits", currentEventId, params],
    queryFn: () =>
      api.getAudits({ ...params, eventId: currentEventId || undefined }),
    enabled: !!currentEventId,
  });
}

export function useAuditStats() {
  const { currentEventId } = useEventContext();

  return useQuery({
    queryKey: ["audits", "stats", currentEventId],
    queryFn: () => api.getAuditStats(currentEventId || undefined),
    enabled: !!currentEventId,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  const user = useUser();
  const { currentEventId } = useEventContext();

  return useMutation({
    mutationFn: async (data: {
      itemId: string;
      actualQuantity: number;
      expectedQuantity: number;
      notes?: string;
      contextId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (!currentEventId) throw new Error("No event selected");
      const token = await user.getAuthJson().then((auth) => auth.accessToken);
      return api.createAudit({ ...data, eventId: currentEventId }, token || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits", currentEventId] });
      queryClient.invalidateQueries({ queryKey: ["items", currentEventId] });
      toast.success("Audit log created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create audit: ${error.message}`);
    },
  });
}
