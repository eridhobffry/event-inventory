"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useAuthToken } from "./useAuthenticatedApi";

export interface EventMember {
  id: string;
  userId: string;
  eventId: string;
  role: string;
  createdAt: string;
}

export interface AddMemberData {
  userId: string;
  role?: "owner" | "member";
}

// Fetch event members
export function useEventMembers(eventId: string | null) {
  const authToken = useAuthToken();

  return useQuery<{ data: EventMember[] }>({
    queryKey: ["event-members", eventId, authToken],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}/members`, {
        headers: {
          "x-event-id": eventId || "",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });
      return response.data;
    },
    enabled: !!eventId && !!authToken,
  });
}

// Add member mutation
export function useAddEventMember(eventId: string) {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async (data: AddMemberData) => {
      const response = await apiClient.post(
        `/events/${eventId}/members`,
        data,
        {
          headers: {
            "x-event-id": eventId,
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-members", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      toast.success("Member added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add member");
    },
  });
}

// Remove member mutation
export function useRemoveEventMember(eventId: string) {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(
        `/events/${eventId}/members/${userId}`,
        {
          headers: {
            "x-event-id": eventId,
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-members", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      toast.success("Member removed successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });
}
