"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Mail, Clock, MapPin, Loader2 } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import {
  usePendingInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
} from "@/hooks/useInvitations";
import { formatDistanceToNow } from "date-fns";

export function PendingInvitationsCard() {
  const { data: invitations, isLoading } = usePendingInvitations();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  const pendingInvitations = invitations?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return null; // Don't show card if no invitations
  }

  const handleAccept = async (invitationId: string) => {
    try {
      await acceptInvitation.mutateAsync(invitationId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await declineInvitation.mutateAsync(invitationId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            Pending Invitations
          </CardTitle>
          <Badge variant="secondary">{pendingInvitations.length}</Badge>
        </div>
        <CardDescription>
          You have {pendingInvitations.length} event invitation
          {pendingInvitations.length !== 1 ? "s" : ""} waiting for your response
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {pendingInvitations.map((invitation, index) => {
              const isExpiringSoon =
                new Date(invitation.expiresAt).getTime() - Date.now() <
                24 * 60 * 60 * 1000;

              return (
                <div key={invitation.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{invitation.event.name}</h4>
                        {invitation.event.location && (
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="mr-1 h-3 w-3" />
                            {invitation.event.location}
                          </p>
                        )}
                        {invitation.event.description && (
                          <p className="text-sm text-muted-foreground">
                            {invitation.event.description}
                          </p>
                        )}
                      </div>
                      <RoleBadge role={invitation.role} />
                    </div>

                    {invitation.message && (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-sm italic">"{invitation.message}"</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        Invited {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                      </span>
                      {isExpiringSoon && (
                        <Badge variant="destructive" className="text-xs">
                          Expires soon
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(invitation.id)}
                        disabled={
                          acceptInvitation.isPending ||
                          declineInvitation.isPending
                        }
                        className="flex-1"
                      >
                        {acceptInvitation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(invitation.id)}
                        disabled={
                          acceptInvitation.isPending ||
                          declineInvitation.isPending
                        }
                        className="flex-1"
                      >
                        {declineInvitation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
