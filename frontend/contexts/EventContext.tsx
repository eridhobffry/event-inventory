"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUser } from "@stackframe/stack";

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
  const user = useUser();
  const [currentEventId, setCurrentEventIdState] = useState<string | null>(
    null
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Auto-select first event if no current event is selected
  useEffect(() => {
    if (events.length > 0 && !currentEventId) {
      setCurrentEventId(events[0].id);
    }
  }, [events, currentEventId]);

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
