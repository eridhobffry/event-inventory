"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Event } from "@/contexts/EventContext";
import { useEventContext } from "@/contexts/EventContext";
import { toast } from "sonner";
import { useAuthToken } from "./useAuthenticatedApi";

export interface CreateEventData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export interface UpdateEventData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

// Fetch all user's events
export function useEvents() {
  const { setEvents, setIsLoading } = useEventContext();
  const authToken = useAuthToken();

  return useQuery<{ data: Event[] }>({
    queryKey: ["events", authToken],
    queryFn: async () => {
      const response = await apiClient.get("/events", {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = response.data;
      setEvents(data.data);
      setIsLoading(false);
      return data;
    },
    enabled: !!authToken, // Only run query when we have a token
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single event
export function useEvent(eventId: string | null) {
  return useQuery<Event>({
    queryKey: ["events", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}`, {
        headers: { "x-event-id": eventId || "" },
      });
      return response.data;
    },
    enabled: !!eventId,
  });
}

// Create event mutation
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { setCurrentEventId } = useEventContext();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await apiClient.post("/events", data, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      return response.data;
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setCurrentEventId(newEvent.id);
      toast.success("Event created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create event");
    },
  });
}

// Update event mutation
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: UpdateEventData;
    }) => {
      const response = await apiClient.put(`/events/${eventId}`, data, {
        headers: {
          "x-event-id": eventId || "",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({
        queryKey: ["events", variables.eventId],
      });
      toast.success("Event updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update event");
    },
  });
}

// Delete event mutation
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { currentEventId, setCurrentEventId } = useEventContext();
  const authToken = useAuthToken();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.delete(`/events/${eventId}`, {
        headers: {
          "x-event-id": eventId || "",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });
      return response.data;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      // If the deleted event was the current one, clear selection
      if (currentEventId === eventId) {
        setCurrentEventId(null);
      }
      toast.success("Event deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });
}
