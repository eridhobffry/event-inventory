"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  memberCount: number;
}

interface EventContextType {
  currentEventId: string | null;
  setCurrentEventId: (eventId: string | null) => void;
  events: Event[];
  setEvents: (events: Event[]) => void;
  currentEvent: Event | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const EVENT_STORAGE_KEY = "eventforge-current-event-id";

export function EventProvider({ children }: { children: ReactNode }) {
  const [currentEventId, setCurrentEventIdState] = useState<string | null>(
    null
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previousEventsLength, setPreviousEventsLength] = useState(0);

  // Load current event ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(EVENT_STORAGE_KEY);
      if (stored) {
        setCurrentEventIdState(stored);
      }
    }
  }, []);

  // Set current event ID and save to localStorage
  const setCurrentEventId = (eventId: string | null) => {
    setCurrentEventIdState(eventId);
    if (typeof window !== "undefined") {
      if (eventId) {
        localStorage.setItem(EVENT_STORAGE_KEY, eventId);
      } else {
        localStorage.removeItem(EVENT_STORAGE_KEY);
      }
    }
  };

  // Get current event object
  const currentEvent = currentEventId
    ? events.find((e) => e.id === currentEventId) || null
    : null;

  // Enhanced auto-select logic with intelligent event selection
  useEffect(() => {
    if (events.length === 0) {
      setPreviousEventsLength(0);
      return;
    }

    // Case 1: User has no current event selected - auto-select first event
    if (!currentEventId) {
      const firstEvent = events[0];
      setCurrentEventId(firstEvent.id);

      // Show toast notification for clarity
      if (typeof window !== "undefined") {
        // Dynamic import to avoid SSR issues
        import("sonner").then(({ toast }) => {
          toast.success(`Switched to "${firstEvent.name}"`, {
            description:
              "You can change events anytime from the dropdown above",
            duration: 4000,
          });
        });
      }
      setPreviousEventsLength(events.length);
      return;
    }

    // Case 2: Validate current selection - localStorage might have stale ID
    const currentEventExists = events.some((e) => e.id === currentEventId);
    if (!currentEventExists) {
      // Current event no longer exists (deleted or revoked), select first available
      const firstEvent = events[0];
      setCurrentEventId(firstEvent.id);

      if (typeof window !== "undefined") {
        import("sonner").then(({ toast }) => {
          toast.info(`Switched to "${firstEvent.name}"`, {
            description: "Your previous event is no longer accessible",
            duration: 4000,
          });
        });
      }
      setPreviousEventsLength(events.length);
      return;
    }

    // Case 3: New event added (invitation accepted) - don't auto-switch if user has context
    // This respects user's current workflow per modern UX best practices
    if (events.length > previousEventsLength && currentEventExists) {
      const newEventCount = events.length - previousEventsLength;
      if (typeof window !== "undefined") {
        import("sonner").then(({ toast }) => {
          toast.success(
            `${newEventCount} new event${newEventCount > 1 ? "s" : ""} added`,
            {
              description: "Switch to them anytime from the event dropdown",
              duration: 5000,
            }
          );
        });
      }
    }

    setPreviousEventsLength(events.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, currentEventId, setCurrentEventId]);

  const value: EventContextType = {
    currentEventId,
    setCurrentEventId,
    events,
    setEvents,
    currentEvent,
    isLoading,
    setIsLoading,
  };

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export function useEventContext() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
}
