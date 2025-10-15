import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import { verifyNeonAuth } from "../../middleware/neonAuth";
import { EventAccessRequest, verifyEventAccess } from "../../middleware/eventAccess";
import { verifyCanManageMembers } from "../../middleware/permissions";
import { Role } from "@prisma/client";

// Validation schemas
const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).optional().default("VIEWER"),
});

const eventMembersRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/v1/events/:eventId/members - List event members
  server.get(
    "/events/:eventId/members",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess],
      schema: {
        tags: ["event-members"],
        description: "Get list of members for an event",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            eventId: { type: "string", format: "uuid" },
          },
          required: ["eventId"],
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
                    userId: { type: "string" },
                    role: { type: "string" },
                    createdAt: { type: "string" },
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

      const members = await prisma.eventMember.findMany({
        where: { eventId },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      });

      return { data: members };
    }
  );

  // POST /api/v1/events/:eventId/members - Add member (OWNER/ADMIN only)
  server.post(
    "/events/:eventId/members",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanManageMembers],
      schema: {
        tags: ["event-members"],
        description: "Add a member to an event (OWNER/ADMIN only)",
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
          required: ["userId"],
          properties: {
            userId: { type: "string" },
            role: { type: "string", enum: ["OWNER", "ADMIN", "EDITOR", "VIEWER"] },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              userId: { type: "string" },
              eventId: { type: "string" },
              role: { type: "string" },
              createdAt: { type: "string" },
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
      const data = addMemberSchema.parse(request.body);

      try {
        // Check if member already exists
        const existingMember = await prisma.eventMember.findUnique({
          where: {
            userId_eventId: {
              userId: data.userId,
              eventId,
            },
          },
        });

        if (existingMember) {
          return reply.status(409).send({
            error: "Conflict",
            message: "User is already a member of this event",
          });
        }

        // Add member
        const member = await prisma.eventMember.create({
          data: {
            userId: data.userId,
            eventId,
            role: (data.role as Role) || Role.VIEWER,
          },
        });

        return reply.status(201).send(member);
      } catch (error) {
        request.log.error(error, "Error adding member");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to add member",
        });
      }
    }
  );

  // DELETE /api/v1/events/:eventId/members/:userId - Remove member (OWNER/ADMIN only)
  server.delete(
    "/events/:eventId/members/:userId",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanManageMembers],
      schema: {
        tags: ["event-members"],
        description: "Remove a member from an event (OWNER/ADMIN only)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            eventId: { type: "string", format: "uuid" },
            userId: { type: "string" },
          },
          required: ["eventId", "userId"],
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
    async (request: EventAccessRequest, reply) => {
      const { eventId, userId } = request.params as {
        eventId: string;
        userId: string;
      };

      try {
        const userRole = request.userRole as Role;

        // Get member to remove
        const memberToRemove = await prisma.eventMember.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId,
            },
          },
        });

        if (!memberToRemove) {
          return reply.status(404).send({
            error: "Not Found",
            message: "Member not found",
          });
        }

        // Check if this is the last owner
        if (memberToRemove.role === Role.OWNER) {
          const ownerCount = await prisma.eventMember.count({
            where: {
              eventId,
              role: Role.OWNER,
            },
          });

          if (ownerCount <= 1) {
            return reply.status(400).send({
              error: "Bad Request",
              message: "Cannot remove the last owner from an event",
            });
          }
        }

        // ADMIN cannot remove OWNER or other ADMINs
        if (userRole === Role.ADMIN) {
          if (memberToRemove.role === Role.OWNER || memberToRemove.role === Role.ADMIN) {
            return reply.status(403).send({
              error: "Forbidden",
              message: "Admins cannot remove owners or other admins",
            });
          }
        }

        // Remove member
        await prisma.eventMember.delete({
          where: {
            userId_eventId: {
              userId,
              eventId,
            },
          },
        });

        return { message: "Member removed successfully" };
      } catch (error) {
        request.log.error(error, "Error removing member");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to remove member",
        });
      }
    }
  );

  // PATCH /api/v1/events/:eventId/members/:userId/role - Update member role (OWNER only)
  server.patch(
    "/events/:eventId/members/:userId/role",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess],
      schema: {
        tags: ["event-members"],
        description: "Update a member's role (OWNER only)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            eventId: { type: "string", format: "uuid" },
            userId: { type: "string" },
          },
          required: ["eventId", "userId"],
        },
        body: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["OWNER", "ADMIN", "EDITOR", "VIEWER"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              userId: { type: "string" },
              eventId: { type: "string" },
              role: { type: "string" },
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
    async (request: EventAccessRequest, reply) => {
      const { eventId, userId } = request.params as {
        eventId: string;
        userId: string;
      };
      const { role } = request.body as { role: Role };
      const currentUserRole = request.userRole as Role;

      // Only OWNER can change roles
      if (currentUserRole !== Role.OWNER) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Only event owners can change member roles",
        });
      }

      try {
        // Get member to update
        const member = await prisma.eventMember.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId,
            },
          },
        });

        if (!member) {
          return reply.status(404).send({
            error: "Not Found",
            message: "Member not found",
          });
        }

        // Prevent demoting the last owner
        if (member.role === Role.OWNER && role !== Role.OWNER) {
          const ownerCount = await prisma.eventMember.count({
            where: {
              eventId,
              role: Role.OWNER,
            },
          });

          if (ownerCount <= 1) {
            return reply.status(400).send({
              error: "Bad Request",
              message: "Cannot demote the last owner. Promote another member to owner first.",
            });
          }
        }

        // Update role
        const updatedMember = await prisma.eventMember.update({
          where: {
            userId_eventId: {
              userId,
              eventId,
            },
          },
          data: { role },
        });

        return updatedMember;
      } catch (error) {
        request.log.error(error, "Error updating member role");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to update member role",
        });
      }
    }
  );
};

export default eventMembersRoutes;
