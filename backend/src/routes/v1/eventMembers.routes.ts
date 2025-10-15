import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import { verifyNeonAuth } from "../../middleware/neonAuth";
import {
  EventAccessRequest,
  verifyEventAccess,
  verifyEventOwner,
} from "../../middleware/eventAccess";

// Validation schemas
const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["owner", "member"]).optional().default("member"),
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

  // POST /api/v1/events/:eventId/members - Add member (owner only)
  server.post(
    "/events/:eventId/members",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyEventOwner],
      schema: {
        tags: ["event-members"],
        description: "Add a member to an event (owner only)",
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
            role: { type: "string", enum: ["owner", "member"] },
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
            role: data.role || "member",
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

  // DELETE /api/v1/events/:eventId/members/:userId - Remove member (owner only)
  server.delete(
    "/events/:eventId/members/:userId",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyEventOwner],
      schema: {
        tags: ["event-members"],
        description: "Remove a member from an event (owner only)",
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
        // Check if this is the last owner
        const ownerCount = await prisma.eventMember.count({
          where: {
            eventId,
            role: "owner",
          },
        });

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

        if (memberToRemove.role === "owner" && ownerCount <= 1) {
          return reply.status(400).send({
            error: "Bad Request",
            message: "Cannot remove the last owner from an event",
          });
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
};

export default eventMembersRoutes;
