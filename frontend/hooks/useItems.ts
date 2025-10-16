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
  status?: string;
  location?: string;
  q?: string;
  semantic?: boolean;
}) {
  const { currentEventId } = useEventContext();

  return useQuery({
    queryKey: ["items", currentEventId, params?.semantic ? "semantic" : "keyword", params],
    queryFn: async () => {
      // Use semantic search if enabled and query exists
      if (params?.semantic && params?.q) {
        const semanticResults = await api.semanticSearch({
          query: params.q,
          limit: params.limit || 20,
          threshold: 0.3, // Lower threshold for better recall (30% similarity)
          eventId: currentEventId || undefined,
        });
        
        // Transform semantic results to match paginated response format
        return {
          data: semanticResults.results,
          pagination: {
            page: params.page || 1,
            limit: params.limit || 20,
            total: semanticResults.count,
            totalPages: 1, // Semantic search doesn't support pagination yet
          },
        };
      }
      
      // Use regular keyword search
      return api.getItems({ ...params, eventId: currentEventId || undefined });
    },
    enabled: !!currentEventId,
    // Keep previous data while fetching to prevent UI flicker
    placeholderData: (previousData) => previousData,
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
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["items", currentEventId] });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(["items", currentEventId]);

      // Optimistically update to the new value
      queryClient.setQueryData(["items", currentEventId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { data: Item[]; pagination: { total: number } };
        const optimisticItem = {
          ...newItem,
          id: `temp-${Date.now()}`,
          eventId: currentEventId || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...oldData,
          data: [optimisticItem, ...(oldData.data || [])],
          pagination: {
            ...oldData.pagination,
            total: (oldData.pagination?.total || 0) + 1,
          },
        };
      });

      // Return a context object with the snapshotted value
      return { previousItems };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item created successfully");
    },
    onError: (error: Error, _newItem, context) => {
      // Rollback to the previous value on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["items", currentEventId],
          context.previousItems
        );
      }
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
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["items", currentEventId] });
      await queryClient.cancelQueries({ queryKey: ["items", id] });

      // Snapshot previous values
      const previousItems = queryClient.getQueryData(["items", currentEventId]);
      const previousItem = queryClient.getQueryData(["items", id]);

      // Optimistically update items list
      queryClient.setQueryData(["items", currentEventId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { data: Item[] };
        return {
          ...oldData,
          data: oldData.data?.map((item: Item) =>
            item.id === id
              ? { ...item, ...data, updatedAt: new Date().toISOString() }
              : item
          ),
        };
      });

      // Optimistically update single item
      queryClient.setQueryData(["items", id], (old: unknown) => {
        if (!old) return old;
        const oldItem = old as Item;
        return { ...oldItem, ...data, updatedAt: new Date().toISOString() };
      });

      return { previousItems, previousItem };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", currentEventId] });
      queryClient.invalidateQueries({ queryKey: ["items", variables.id] });
      toast.success("Item updated successfully");
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["items", currentEventId],
          context.previousItems
        );
      }
      if (context?.previousItem) {
        queryClient.setQueryData(["items", variables.id], context.previousItem);
      }
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
