"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Item } from "@/lib/api";
import { useUser } from "@stackframe/stack";
import { toast } from "sonner";
import { useEventContext } from "@/contexts/EventContext";

export function useItems(params?: {
  page?: number;
  limit?: number;
  category?: string;
  location?: string;
  q?: string;
}) {
  const { currentEventId } = useEventContext();

  return useQuery({
    queryKey: ["items", currentEventId, params],
    queryFn: () =>
      api.getItems({ ...params, eventId: currentEventId || undefined }),
    enabled: !!currentEventId,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ["items", id],
    queryFn: () => api.getItem(id),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  const user = useUser();
  const { currentEventId } = useEventContext();

  return useMutation({
    mutationFn: async (
      data: Omit<Item, "id" | "createdAt" | "updatedAt" | "eventId">
    ) => {
      if (!user) throw new Error("Not authenticated");
      if (!currentEventId) throw new Error("No event selected");
      const token = await user.getAuthJson().then((auth) => auth.accessToken);
      return api.createItem({ ...data, eventId: currentEventId }, token || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create item: ${error.message}`);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const user = useUser();
  const { currentEventId } = useEventContext();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "eventId">>;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getAuthJson().then((auth) => auth.accessToken);
      return api.updateItem(id, data, token || "");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", currentEventId] });
      queryClient.invalidateQueries({ queryKey: ["items", variables.id] });
      toast.success("Item updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const user = useUser();
  const { currentEventId } = useEventContext();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getAuthJson().then((auth) => auth.accessToken);
      return api.deleteItem(id, token || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", currentEventId] });
      toast.success("Item deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}
