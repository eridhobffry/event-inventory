"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Trash2, Loader2, UserPlus, Mail, X } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { useEventMembers, useRemoveEventMember } from "@/hooks/useEventMembers";
import {
  useEventInvitations,
  useCancelInvitation,
  useUpdateMemberRole,
  type Role,
} from "@/hooks/useInvitations";
import { formatDistanceToNow } from "date-fns";

interface MemberManagementCardProps {
  eventId: string;
  userRole: Role;
  currentUserId: string;
}

export function MemberManagementCard({
  eventId,
  userRole,
  currentUserId,
}: MemberManagementCardProps) {
  const { data: membersData, isLoading: membersLoading } = useEventMembers(eventId);
  const { data: invitationsData, isLoading: invitationsLoading } =
    useEventInvitations(eventId);
  const removeMember = useRemoveEventMember(eventId);
  const cancelInvitation = useCancelInvitation();
  const updateRole = useUpdateMemberRole(eventId);

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<string | null>(null);

  const members = membersData?.data || [];
  const invitations = invitationsData?.data?.filter((inv) => inv.status === "PENDING") || [];

  const canManageMembers = userRole === "OWNER" || userRole === "ADMIN";
  const canChangeRoles = userRole === "OWNER";

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember.mutateAsync(memberToRemove);
      setMemberToRemove(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;
    try {
      await cancelInvitation.mutateAsync(invitationToCancel);
      setInvitationToCancel(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (membersLoading || invitationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Members & Invitations
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Members & Invitations
              </CardTitle>
              <CardDescription>
                {members.length} active member{members.length !== 1 ? "s" : ""}
                {invitations.length > 0 &&
                  ` • ${invitations.length} pending invitation${invitations.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            {canManageMembers && (
              <InviteMemberDialog eventId={eventId} userRole={userRole}>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </InviteMemberDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4">
              {/* Active Members */}
              {members.map((member, index) => {
                const isCurrentUser = member.userId === currentUserId;
                const memberRole = member.role as Role;
                const canRemove =
                  canManageMembers &&
                  !isCurrentUser &&
                  (userRole === "OWNER" ||
                    (userRole === "ADMIN" &&
                      memberRole !== "OWNER" &&
                      memberRole !== "ADMIN"));

                return (
                  <div key={member.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {isCurrentUser ? "You" : member.userId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Member since{" "}
                            {formatDistanceToNow(new Date(member.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canChangeRoles && !isCurrentUser ? (
                          <Select
                            value={memberRole}
                            onValueChange={(value) =>
                              handleRoleChange(member.userId, value as Role)
                            }
                            disabled={updateRole.isPending}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIEWER">
                                <div className="flex items-center">Viewer</div>
                              </SelectItem>
                              <SelectItem value="EDITOR">
                                <div className="flex items-center">Editor</div>
                              </SelectItem>
                              <SelectItem value="ADMIN">
                                <div className="flex items-center">Admin</div>
                              </SelectItem>
                              <SelectItem value="OWNER">
                                <div className="flex items-center">Owner</div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <RoleBadge role={memberRole} />
                        )}
                        {canRemove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberToRemove(member.userId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center text-muted-foreground">
                      <Mail className="mr-2 h-4 w-4" />
                      Pending Invitations
                    </h4>
                    {invitations.map((invitation) => {
                      const isExpiringSoon =
                        new Date(invitation.expiresAt).getTime() - Date.now() <
                        24 * 60 * 60 * 1000;

                      return (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between rounded-md bg-muted/50 p-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {invitation.inviteeEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Invited{" "}
                              {formatDistanceToNow(
                                new Date(invitation.createdAt),
                                { addSuffix: true }
                              )}
                              {isExpiringSoon && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  Expires soon
                                </Badge>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <RoleBadge role={invitation.role} showTooltip={false} />
                            {canManageMembers && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setInvitationToCancel(invitation.id)}
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? They will lose access to
              this event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation */}
      <AlertDialog
        open={!!invitationToCancel}
        onOpenChange={() => setInvitationToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation? The recipient will no
              longer be able to accept it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelInvitation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
