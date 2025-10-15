"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@stackframe/stack";
import {
  useEvent,
  useUpdateEvent,
  useDeleteEvent,
  UpdateEventData,
} from "@/hooks/useEvents";
import { MemberManagementCard } from "@/components/MemberManagementCard";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import type { Role } from "@/hooks/useInvitations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventForm } from "@/components/EventForm";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, MapPin, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function EventDetailsPage() {
  const user = useUser({ or: "redirect" });
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const { data: event, isLoading } = useEvent(eventId);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    redirect("/");
  }

  const handleSubmit = async (formData: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  }) => {
    const eventData: UpdateEventData = {
      name: formData.name,
    };

    if (formData.description) eventData.description = formData.description;
    if (formData.startDate)
      eventData.startDate = new Date(formData.startDate).toISOString();
    if (formData.endDate)
      eventData.endDate = new Date(formData.endDate).toISOString();
    if (formData.location) eventData.location = formData.location;

    updateEvent.mutate(
      { eventId, data: eventData },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      deleteEvent.mutate(eventId, {
        onSuccess: () => {
          router.push("/events");
        },
      });
    }
  };

  const userRole = (event?.role?.toUpperCase() || "VIEWER") as Role;
  const isOwner = userRole === "OWNER";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading event...</p>
        ) : !event ? (
          <p className="text-destructive">Event not found</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
                <Badge variant={isOwner ? "default" : "secondary"}>
                  {isOwner ? "Owner" : "Member"}
                </Badge>
              </div>
              {isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteEvent.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              )}
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Event Details</CardTitle>
                      {isOwner && !isEditing && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Event
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <EventForm
                        defaultValues={{
                          name: event.name,
                          description: event.description || "",
                          startDate: event.startDate
                            ? new Date(event.startDate)
                                .toISOString()
                                .split("T")[0]
                            : "",
                          endDate: event.endDate
                            ? new Date(event.endDate)
                                .toISOString()
                                .split("T")[0]
                            : "",
                          location: event.location || "",
                        }}
                        onSubmit={handleSubmit}
                        isSubmitting={updateEvent.isPending}
                        submitLabel="Save Changes"
                        onCancel={() => setIsEditing(false)}
                      />
                    ) : (
                      <div className="space-y-4">
                        {event.description && (
                          <div>
                            <h4 className="font-medium mb-1">Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {event.startDate && (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString()}
                              {event.endDate &&
                                ` - ${new Date(
                                  event.endDate
                                ).toLocaleDateString()}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members">
                <MemberManagementCard
                  eventId={eventId}
                  userRole={userRole}
                  currentUserId={user?.id || ""}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
