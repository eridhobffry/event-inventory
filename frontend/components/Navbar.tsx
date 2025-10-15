"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import {
  PackageIcon,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Plus,
  Calendar,
} from "lucide-react";
import { useEventContext } from "@/contexts/EventContext";
import { useEvents } from "@/hooks/useEvents";
import { useEffect } from "react";

export function Navbar() {
  const user = useUser();
  const router = useRouter();
  const { currentEventId, setCurrentEventId, events } = useEventContext();
  const { data: eventsData } = useEvents();

  // Load events into context when they're fetched
  useEffect(() => {
    if (eventsData?.data) {
      // Events are already set in the useEvents hook
    }
  }, [eventsData]);

  if (!user) return null;

  const handleEventChange = (value: string) => {
    if (value === "create") {
      router.push("/events/new");
    } else {
      setCurrentEventId(value);
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-xl"
            >
              <PackageIcon className="h-6 w-6" />
              EventForge
            </Link>

            {/* Event Selector */}
            {events.length > 0 && (
              <Select
                value={currentEventId || undefined}
                onValueChange={handleEventChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="create">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Event
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="ghost" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </Button>
              </Link>
              <Link href="/items">
                <Button variant="ghost" size="sm">
                  <PackageIcon className="h-4 w-4 mr-2" />
                  Items
                </Button>
              </Link>
              <Link href="/audits">
                <Button variant="ghost" size="sm">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Audits
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.displayName || user.primaryEmail}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => user.signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
