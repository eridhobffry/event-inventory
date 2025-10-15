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
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Events</h1>
            <p className="text-muted-foreground">
              Manage your events and inventories
            </p>
          </div>
          <Link href="/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading events...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first event to start managing inventory
              </p>
              <Link href="/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{event.name}</CardTitle>
                        <RoleBadge 
                          role={event.role.toUpperCase() as Role} 
                          showTooltip={false}
                        />
                      </div>
                    </div>
                    {event.description && (
                      <CardDescription className="mt-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    )}
                    {event.startDate && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(event.startDate).toLocaleDateString()}
                        {event.endDate &&
                          ` - ${new Date(event.endDate).toLocaleDateString()}`}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {event.memberCount}{" "}
                      {event.memberCount === 1 ? "member" : "members"}
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
