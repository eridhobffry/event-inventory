"use client";

import { useUser } from "@stackframe/stack";
import { useEvents } from "@/hooks/useEvents";
import { Navbar } from "@/components/Navbar";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Role } from "@/hooks/useInvitations";

export default function EventsPage() {
  const user = useUser({ or: "redirect" });
  const { data: eventsData, isLoading } = useEvents();

  if (!user) {
    redirect("/");
  }

  const events = eventsData?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Events</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your events and inventories
            </p>
          </div>
          <Link href="/events/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
              <Calendar className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">
                No Events Yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Create your first event to start managing inventory
              </p>
              <Link href="/events/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto min-h-[44px]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:border-primary cursor-pointer h-full transition-all active:scale-[0.98]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="mb-2 truncate text-lg md:text-xl">
                          {event.name}
                        </CardTitle>
                        <RoleBadge
                          role={event.role.toUpperCase() as Role}
                          showTooltip={false}
                        />
                      </div>
                    </div>
                    {event.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {event.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.startDate && (
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(event.startDate).toLocaleDateString()}
                          {event.endDate &&
                            ` - ${new Date(
                              event.endDate
                            ).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {event.memberCount}{" "}
                        {event.memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
