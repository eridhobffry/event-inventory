"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useAuthToken } from "./useAuthenticatedApi";
import { useEventContext } from "@/contexts/EventContext";

export type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface EventInvitation {
  id: string;
  eventId: string;
  inviteeEmail: string;
  role: Role;
  status: InvitationStatus;
  message?: string;
  createdAt: string;
  expiresAt: string;
}

export interface PendingInvitation {
  id: string;
  eventId: string;
  role: Role;
  message?: string;
  createdAt: string;
  expiresAt: string;
  event: {
    id: string;
    name: string;
    description?: string;
    location?: string;
  };
}

export interface CreateInvitationData {
  inviteeEmail: string;
  role: Role;
  message?: string;
}

// Fetch event invitations (for event owners/admins)
export function useEventInvitations(eventId: string | null) {
  const authToken = useAuthToken();

  return useQuery<{ data: EventInvitation[] }>({
    queryKey: ["event-invitations", eventId, authToken],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}/invitations`, {
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

// Fetch pending invitations for current user
export function usePendingInvitations() {
  const authToken = useAuthToken();

  return useQuery<{ data: PendingInvitation[] }>({
    queryKey: ["pending-invitations", authToken],
    queryFn: async () => {
      const response = await apiClient.get("/invitations/pending", {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });
      return response.data;
    },
    enabled: !!authToken,
    refetchInterval: 30000, // Refetch every 30 seconds to show new invitations
  });
}

// Create invitation mutation
export function useCreateInvitation(eventId: string) {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async (data: CreateInvitationData) => {
      const response = await apiClient.post(
        `/events/${eventId}/invitations`,
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
      queryClient.invalidateQueries({
        queryKey: ["event-invitations", eventId],
      });
      toast.success("Invitation sent successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to send invitation";
      toast.error(message);
    },
  });
}

// Accept invitation mutation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();
  const { currentEventId, setCurrentEventId } = useEventContext();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiClient.put(
        `/invitations/${invitationId}/accept`,
        {},
        {
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-members"] });

      // If user has no current event, the EventContext will auto-select
      // If they do have an event, respect their context (modern UX best practice)
      const acceptedEventName = data?.event?.name || "the event";

      if (!currentEventId) {
        toast.success(`Welcome to ${acceptedEventName}!`, {
          description: "Setting up your workspace...",
          duration: 3000,
        });
      } else {
        toast.success(`You joined ${acceptedEventName}!`, {
          description: "Find it in the event dropdown when you're ready",
          duration: 4000,
          action: {
            label: "Switch Now",
            onClick: () => {
              if (data?.event?.id) {
                setCurrentEventId(data.event.id);
              }
            },
          },
        });
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to accept invitation";
      toast.error(message);
    },
  });
}

// Decline invitation mutation
export function useDeclineInvitation() {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiClient.put(
        `/invitations/${invitationId}/decline`,
        {},
        {
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      toast.success("Invitation declined");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to decline invitation";
      toast.error(message);
    },
  });
}

// Cancel invitation mutation (for event owners/admins)
export function useCancelInvitation() {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiClient.delete(`/invitations/${invitationId}`, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to cancel invitation";
      toast.error(message);
    },
  });
}

// Update member role mutation
export function useUpdateMemberRole(eventId: string) {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const response = await apiClient.patch(
        `/events/${eventId}/members/${userId}/role`,
        { role },
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
      toast.success("Member role updated successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update role";
      toast.error(message);
    },
  });
}
