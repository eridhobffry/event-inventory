import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import {
  verifyNeonAuth,
  AuthenticatedRequest,
} from "../../middleware/neonAuth";
import {
  EventAccessRequest,
  verifyEventAccess,
} from "../../middleware/eventAccess";
import {
  verifyCanManageMembers,
  canInviteRole,
} from "../../middleware/permissions";
import { Role, InvitationStatus } from "@prisma/client";

// Validation schemas
const createInvitationSchema = z.object({
  inviteeEmail: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).default("VIEWER"),
  message: z.string().optional(),
});

const invitationsRoutes: FastifyPluginAsync = async (server) => {
  // POST /api/v1/events/:eventId/invitations - Create invitation
  server.post(
    "/events/:eventId/invitations",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanManageMembers],
      schema: {
        tags: ["invitations"],
        description: "Send an invitation to join an event (OWNER/ADMIN only)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            eventId: { type: "string", format: "uuid" },
          },
          required: ["eventId"],
        },
        body: {
          type: "object",
          required: ["inviteeEmail"],
          properties: {
            inviteeEmail: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["OWNER", "ADMIN", "EDITOR", "VIEWER"],
              default: "VIEWER",
            },
            message: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              eventId: { type: "string" },
              inviteeEmail: { type: "string" },
              role: { type: "string" },
              status: { type: "string" },
              createdAt: { type: "string" },
              expiresAt: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          409: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: EventAccessRequest, reply) => {
      const { eventId } = request.params as { eventId: string };
      const data = createInvitationSchema.parse(request.body);
      const inviterRole = request.userRole as Role;
      const inviterUserId = request.user!.id;

      try {
        // Check if inviter can invite this role
        if (!canInviteRole(inviterRole, data.role as Role)) {
          return reply.status(403).send({
            error: "Forbidden",
            message: `You cannot invite users with role ${data.role}. ${
              inviterRole === "ADMIN"
                ? "Admins can only invite EDITOR or VIEWER roles."
                : "You don't have permission to invite members."
            }`,
          });
        }

        // Check if user is already a member
        const existingMember = await prisma.eventMember.findFirst({
          where: {
            eventId,
            userId: data.inviteeEmail, // Note: We'll match by email later, but check userId too
          },
        });

        if (existingMember) {
          return reply.status(409).send({
            error: "Conflict",
            message: "User is already a member of this event",
          });
        }

        // Check for existing pending invitation
        const existingInvitation = await prisma.eventInvitation.findFirst({
          where: {
            eventId,
            inviteeEmail: data.inviteeEmail.toLowerCase(),
            status: InvitationStatus.PENDING,
          },
        });

        if (existingInvitation) {
          return reply.status(409).send({
            error: "Conflict",
            message:
              "A pending invitation already exists for this email address",
          });
        }

        // Create invitation with 7-day expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await prisma.eventInvitation.create({
          data: {
            eventId,
            inviterUserId,
            inviteeEmail: data.inviteeEmail.toLowerCase(),
            role: data.role as Role,
            message: data.message,
            expiresAt,
          },
        });

        return reply.status(201).send(invitation);
      } catch (error) {
        request.log.error(error, "Error creating invitation");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to create invitation",
        });
      }
    }
  );

  // GET /api/v1/events/:eventId/invitations - List event invitations
  server.get(
    "/events/:eventId/invitations",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanManageMembers],
      schema: {
        tags: ["invitations"],
        description:
          "Get list of invitations for an event (OWNER/ADMIN only)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            eventId: { type: "string", format: "uuid" },
          },
          required: ["eventId"],
        },
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"],
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    inviteeEmail: { type: "string" },
                    role: { type: "string" },
                    status: { type: "string" },
                    message: { type: "string" },
                    createdAt: { type: "string" },
                    expiresAt: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: EventAccessRequest, reply) => {
      const { eventId } = request.params as { eventId: string };
      const { status } = request.query as { status?: InvitationStatus };

      const invitations = await prisma.eventInvitation.findMany({
        where: {
          eventId,
          ...(status && { status }),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          inviteeEmail: true,
          role: true,
          status: true,
          message: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      return { data: invitations };
    }
  );

  // GET /api/v1/invitations/pending - Get current user's pending invitations
  server.get(
    "/invitations/pending",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["invitations"],
        description:
          "Get pending invitations for the current user (matched by email)",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    eventId: { type: "string" },
                    role: { type: "string" },
                    message: { type: "string" },
                    createdAt: { type: "string" },
                    expiresAt: { type: "string" },
                    event: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                        location: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const userEmail = request.user!.email?.toLowerCase();

      if (!userEmail) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User email not found in authentication token",
        });
      }

      // Check for expired invitations and update them
      const now = new Date();
      await prisma.eventInvitation.updateMany({
        where: {
          inviteeEmail: userEmail,
          status: InvitationStatus.PENDING,
          expiresAt: {
            lt: now,
          },
        },
        data: {
          status: InvitationStatus.EXPIRED,
        },
      });

      // Get pending invitations
      const invitations = await prisma.eventInvitation.findMany({
        where: {
          inviteeEmail: userEmail,
          status: InvitationStatus.PENDING,
          expiresAt: {
            gte: now,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return { data: invitations };
    }
  );

  // PUT /api/v1/invitations/:id/accept - Accept invitation
  server.put(
    "/invitations/:id/accept",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["invitations"],
        description: "Accept a pending invitation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              eventMember: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  userId: { type: "string" },
                  eventId: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;
      const userEmail = request.user!.email?.toLowerCase();

      if (!userEmail) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User email not found in authentication token",
        });
      }

      try {
        // Get invitation
        const invitation = await prisma.eventInvitation.findUnique({
          where: { id },
        });

        if (!invitation) {
          return reply.status(404).send({
            error: "Not Found",
            message: "Invitation not found",
          });
        }

        // Verify email matches
        if (invitation.inviteeEmail !== userEmail) {
          return reply.status(403).send({
            error: "Forbidden",
            message: "This invitation is not for your email address",
          });
        }

        // Check if already accepted/declined
        if (invitation.status !== InvitationStatus.PENDING) {
          return reply.status(400).send({
            error: "Bad Request",
            message: `Invitation has already been ${invitation.status.toLowerCase()}`,
          });
        }

        // Check if expired
        if (invitation.expiresAt < new Date()) {
          await prisma.eventInvitation.update({
            where: { id },
            data: { status: InvitationStatus.EXPIRED },
          });
          return reply.status(400).send({
            error: "Bad Request",
            message: "Invitation has expired",
          });
        }

        // Check if user is already a member
        const existingMember = await prisma.eventMember.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: invitation.eventId,
            },
          },
        });

        if (existingMember) {
          return reply.status(409).send({
            error: "Conflict",
            message: "You are already a member of this event",
          });
        }

        // Create event member and update invitation in a transaction
        const [eventMember, _] = await prisma.$transaction([
          prisma.eventMember.create({
            data: {
              userId,
              eventId: invitation.eventId,
              role: invitation.role,
            },
          }),
          prisma.eventInvitation.update({
            where: { id },
            data: { status: InvitationStatus.ACCEPTED },
          }),
        ]);

        return {
          message: "Invitation accepted successfully",
          eventMember,
        };
      } catch (error) {
        request.log.error(error, "Error accepting invitation");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to accept invitation",
        });
      }
    }
  );

  // PUT /api/v1/invitations/:id/decline - Decline invitation
  server.put(
    "/invitations/:id/decline",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["invitations"],
        description: "Decline a pending invitation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userEmail = request.user!.email?.toLowerCase();

      if (!userEmail) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User email not found in authentication token",
        });
      }

      try {
        const invitation = await prisma.eventInvitation.findUnique({
          where: { id },
        });

        if (!invitation) {
          return reply.status(404).send({
            error: "Not Found",
            message: "Invitation not found",
          });
        }

        // Verify email matches
        if (invitation.inviteeEmail !== userEmail) {
          return reply.status(403).send({
            error: "Forbidden",
            message: "This invitation is not for your email address",
          });
        }

        // Check if already processed
        if (invitation.status !== InvitationStatus.PENDING) {
          return reply.status(400).send({
            error: "Bad Request",
            message: `Invitation has already been ${invitation.status.toLowerCase()}`,
          });
        }

        // Update invitation status
        await prisma.eventInvitation.update({
          where: { id },
          data: { status: InvitationStatus.DECLINED },
        });

        return { message: "Invitation declined" };
      } catch (error) {
        request.log.error(error, "Error declining invitation");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to decline invitation",
        });
      }
    }
  );

  // DELETE /api/v1/invitations/:id - Cancel invitation (OWNER/ADMIN only)
  server.delete(
    "/invitations/:id",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["invitations"],
        description:
          "Cancel/delete an invitation (must be owner/admin of the event)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;

      try {
        // Get invitation with event membership check
        const invitation = await prisma.eventInvitation.findUnique({
          where: { id },
          include: {
            event: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        });

        if (!invitation) {
          return reply.status(404).send({
            error: "Not Found",
            message: "Invitation not found",
          });
        }

        // Check if user is owner or admin of the event
        const userMembership = invitation.event.members[0];
        if (
          !userMembership ||
          (userMembership.role !== "OWNER" && userMembership.role !== "ADMIN")
        ) {
          return reply.status(403).send({
            error: "Forbidden",
            message: "Only event owners and admins can cancel invitations",
          });
        }

        // Delete invitation
        await prisma.eventInvitation.delete({
          where: { id },
        });

        return { message: "Invitation cancelled successfully" };
      } catch (error) {
        request.log.error(error, "Error cancelling invitation");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to cancel invitation",
        });
      }
    }
  );
};

export default invitationsRoutes;
