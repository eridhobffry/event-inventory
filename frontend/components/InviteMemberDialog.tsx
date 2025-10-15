"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Crown, Shield, Edit, Eye } from "lucide-react";
import { useCreateInvitation, type Role } from "@/hooks/useInvitations";

const formSchema = z.object({
  inviteeEmail: z.string().email("Please enter a valid email address"),
  role: z.enum(["VIEWER", "EDITOR", "ADMIN", "OWNER"] as const),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteMemberDialogProps {
  eventId: string;
  userRole: Role;
  children?: React.ReactNode;
}

export function InviteMemberDialog({
  eventId,
  userRole,
  children,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const createInvitation = useCreateInvitation(eventId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inviteeEmail: "",
      role: "VIEWER",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createInvitation.mutateAsync(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Determine available roles based on user's role
  const availableRoles: Role[] =
    userRole === "OWNER"
      ? ["VIEWER", "EDITOR", "ADMIN", "OWNER"]
      : userRole === "ADMIN"
      ? ["VIEWER", "EDITOR"]
      : [];

  if (availableRoles.length === 0) {
    return null; // Don't show dialog if user can't invite anyone
  }

  const roleIcons = {
    OWNER: Crown,
    ADMIN: Shield,
    EDITOR: Edit,
    VIEWER: Eye,
  };

  const roleDescriptions = {
    OWNER: "Full control over event and all content",
    ADMIN: "Manage items, audits, and invite EDITOR/VIEWER",
    EDITOR: "Create and edit items and audits",
    VIEWER: "Read-only access to event content",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Member to Event</DialogTitle>
          <DialogDescription>
            Send an invitation by email. They'll see it when they log in.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inviteeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="colleague@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    They'll receive an in-app invitation when they log in
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((role) => {
                        const Icon = roleIcons[role];
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center">
                              <Icon className="mr-2 h-4 w-4" />
                              <span className="font-medium">{role}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                - {roleDescriptions[role]}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {userRole === "ADMIN"
                      ? "As an admin, you can invite VIEWER and EDITOR roles"
                      : "Select the permissions for this member"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Welcome to the team! Looking forward to working with you."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a personal note to your invitation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createInvitation.isPending}>
                {createInvitation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Invitation
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
