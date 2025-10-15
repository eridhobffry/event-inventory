"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { CreateEventData, useCreateEvent } from "@/hooks/useEvents";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventForm } from "@/components/EventForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function NewEventPage() {
  const user = useUser({ or: "redirect" });
  const router = useRouter();
  const createEvent = useCreateEvent();

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
    const eventData: CreateEventData = {
      name: formData.name,
    };

    if (formData.description) eventData.description = formData.description;
    if (formData.startDate)
      eventData.startDate = new Date(formData.startDate).toISOString();
    if (formData.endDate)
      eventData.endDate = new Date(formData.endDate).toISOString();
    if (formData.location) eventData.location = formData.location;

    createEvent.mutate(eventData, {
      onSuccess: () => {
        router.push("/dashboard");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>
              Set up a new event to manage its inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              onSubmit={handleSubmit}
              isSubmitting={createEvent.isPending}
              submitLabel="Create Event"
              onCancel={() => router.push("/events")}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
