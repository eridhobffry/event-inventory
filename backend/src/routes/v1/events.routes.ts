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
import { verifyOwnerRole } from "../../middleware/permissions";
import { Role } from "@prisma/client";

// Validation schemas
const createEventSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
});

const updateEventSchema = createEventSchema.partial();

const eventsRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/v1/events - List user's events (as owner or member)
  server.get(
    "/events",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["events"],
        description: "Get list of events where user is owner or member",
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
                    name: { type: "string" },
                    description: { type: "string" },
                    startDate: { type: "string" },
                    endDate: { type: "string" },
                    location: { type: "string" },
                    createdById: { type: "string" },
                    createdAt: { type: "string" },
                    updatedAt: { type: "string" },
                    role: { type: "string" },
                    memberCount: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.id;

      // Get all event memberships for the user
      const memberships = await prisma.eventMember.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              _count: {
                select: { members: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const events = memberships.map((membership) => ({
        id: membership.event.id,
        name: membership.event.name,
        description: membership.event.description,
        startDate: membership.event.startDate,
        endDate: membership.event.endDate,
        location: membership.event.location,
        createdById: membership.event.createdById,
        createdAt: membership.event.createdAt,
        updatedAt: membership.event.updatedAt,
        role: membership.role,
        memberCount: membership.event._count.members,
      }));

      return { data: events };
    }
  );

  // GET /api/v1/events/:id - Get single event details
  server.get(
    "/events/:id",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess],
      schema: {
        tags: ["events"],
        description: "Get a single event by ID",
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
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              location: { type: "string" },
              createdById: { type: "string" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
              role: { type: "string" },
              memberCount: { type: "number" },
              itemCount: { type: "number" },
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
      const { id } = request.params as { id: string };

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          _count: {
            select: { members: true, items: true },
          },
        },
      });

      if (!event) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Event not found",
        });
      }

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        createdById: event.createdById,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        role: request.userRole,
        memberCount: event._count.members,
        itemCount: event._count.items,
      };
    }
  );

  // POST /api/v1/events - Create new event (auth required)
  server.post(
    "/events",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["events"],
        description: "Create a new event",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            location: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              location: { type: "string" },
              createdById: { type: "string" },
              createdAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const data = createEventSchema.parse(request.body);
      const userId = request.user!.id;

      // Create event
      const event = await prisma.event.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          location: data.location,
          createdById: userId,
        },
      });

      // Automatically add creator as owner
      await prisma.eventMember.create({
        data: {
          userId,
          eventId: event.id,
          role: Role.OWNER,
        },
      });

      return reply.status(201).send(event);
    }
  );

  // PUT /api/v1/events/:id - Update event (OWNER only)
  server.put(
    "/events/:id",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyOwnerRole],
      schema: {
        tags: ["events"],
        description: "Update an event (owner only)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            location: { type: "string" },
          },
        },
      },
    },
    async (request: EventAccessRequest, reply) => {
      const { id } = request.params as { id: string };
      const data = updateEventSchema.parse(request.body);

      try {
        const event = await prisma.event.update({
          where: { id },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.startDate && { startDate: new Date(data.startDate) }),
            ...(data.endDate && { endDate: new Date(data.endDate) }),
            ...(data.location !== undefined && { location: data.location }),
          },
        });

        return event;
      } catch (error) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Event not found",
        });
      }
    }
  );

  // DELETE /api/v1/events/:id - Delete event (OWNER only)
  server.delete(
    "/events/:id",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyOwnerRole],
      schema: {
        tags: ["events"],
        description: "Delete an event (owner only)",
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
        },
      },
    },
    async (request: EventAccessRequest, reply) => {
      const { id } = request.params as { id: string };

      try {
        await prisma.event.delete({
          where: { id },
        });

        return { message: "Event deleted successfully" };
      } catch (error) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Event not found",
        });
      }
    }
  );
};

export default eventsRoutes;
