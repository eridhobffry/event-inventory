import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import {
  verifyNeonAuth,
  AuthenticatedRequest,
  optionalNeonAuth,
} from "../../middleware/neonAuth";
import {
  EventAccessRequest,
  verifyEventAccess,
} from "../../middleware/eventAccess";
import { verifyCanEditItems } from "../../middleware/permissions";

// Validation schemas
const createAuditSchema = z.object({
  itemId: z.string().uuid(),
  eventId: z.string().uuid(),
  actualQuantity: z.number().int().min(0),
  expectedQuantity: z.number().int().min(0),
  notes: z.string().optional(),
  contextId: z.string().optional(), // For MCP session tracking
});

const auditRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/v1/audits - List audit logs
  server.get(
    "/audits",
    {
      preHandler: optionalNeonAuth,
      schema: {
        tags: ["audits"],
        description:
          "Get list of audit logs with pagination (requires eventId)",
        querystring: {
          type: "object",
          properties: {
            page: { type: "string", default: "1" },
            limit: { type: "string", default: "20" },
            itemId: { type: "string", description: "Filter by item ID" },
            eventId: {
              type: "string",
              format: "uuid",
              description: "Filter by event ID",
            },
            contextId: {
              type: "string",
              description: "Filter by MCP context ID",
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
                    itemId: { type: "string" },
                    eventId: { type: "string" },
                    actualQuantity: { type: "number" },
                    expectedQuantity: { type: "number" },
                    discrepancy: { type: "number" },
                    notes: { type: "string" },
                    contextId: { type: "string" },
                    timestamp: { type: "string" },
                    item: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        category: { type: "string" },
                        location: { type: "string" },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  totalPages: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query: any = request.query;
      const page = parseInt(query.page || "1");
      const limit = Math.min(parseInt(query.limit || "20"), 100);

      // Get eventId from query or header
      const eventId =
        query.eventId || (request.headers["x-event-id"] as string);

      if (!eventId) {
        return reply.status(400).send({
          error: "Bad Request",
          message:
            "Event ID is required (provide via eventId query parameter or x-event-id header)",
        });
      }

      const where: any = { eventId };
      if (query.itemId) where.itemId = query.itemId;
      if (query.contextId) where.contextId = query.contextId;

      const total = await prisma.auditLog.count({ where });

      const audits = await prisma.auditLog.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              location: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: "desc" },
      });

      return {
        data: audits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  );

  // POST /api/v1/audits - Create audit log (EDITOR or higher)
  server.post(
    "/audits",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanEditItems],
      schema: {
        tags: ["audits"],
        description: "Create a new audit log entry (EDITOR, ADMIN, or OWNER)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["itemId", "eventId", "actualQuantity", "expectedQuantity"],
          properties: {
            itemId: { type: "string", format: "uuid" },
            eventId: { type: "string", format: "uuid" },
            actualQuantity: { type: "number" },
            expectedQuantity: { type: "number" },
            notes: { type: "string" },
            contextId: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              itemId: { type: "string" },
              eventId: { type: "string" },
              actualQuantity: { type: "number" },
              expectedQuantity: { type: "number" },
              discrepancy: { type: "number" },
              notes: { type: "string" },
              timestamp: { type: "string" },
            },
          },
        },
      },
    },
    async (request: EventAccessRequest, reply) => {
      const data = createAuditSchema.parse(request.body);
      const discrepancy = data.actualQuantity - data.expectedQuantity;

      // Verify the eventId in the body matches the user's access
      if (data.eventId !== request.eventId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "You can only create audits in events you have access to",
        });
      }

      // Verify item exists and belongs to the event
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
      });

      if (!item) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }

      if (item.eventId !== data.eventId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Item does not belong to the specified event",
        });
      }

      // Create audit log
      const audit = await prisma.auditLog.create({
        data: {
          ...data,
          discrepancy,
          createdBy: request.user?.id,
        },
      });

      // Update item's last audit timestamp
      await prisma.item.update({
        where: { id: data.itemId },
        data: { lastAudit: new Date() },
      });

      return reply.status(201).send(audit);
    }
  );

  // GET /api/v1/audits/stats - Get audit statistics
  server.get(
    "/audits/stats",
    {
      preHandler: optionalNeonAuth,
      schema: {
        tags: ["audits"],
        description: "Get audit statistics for dashboard (requires eventId)",
        querystring: {
          type: "object",
          properties: {
            eventId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              totalAudits: { type: "number" },
              auditsLast30Days: { type: "number" },
              itemsWithDiscrepancies: { type: "number" },
              averageDiscrepancy: { type: "number" },
              recentAudits: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    itemId: { type: "string" },
                    eventId: { type: "string" },
                    actualQuantity: { type: "number" },
                    expectedQuantity: { type: "number" },
                    discrepancy: { type: "number" },
                    notes: { type: "string" },
                    timestamp: { type: "string" },
                    item: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string" },
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
    async (request, reply) => {
      const query: any = request.query;

      // Get eventId from query or header
      const eventId =
        query.eventId || (request.headers["x-event-id"] as string);

      if (!eventId) {
        return reply.status(400).send({
          error: "Bad Request",
          message:
            "Event ID is required (provide via eventId query parameter or x-event-id header)",
        });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalAudits, auditsLast30Days, discrepancies, recentAudits] =
        await Promise.all([
          prisma.auditLog.count({
            where: { eventId },
          }),
          prisma.auditLog.count({
            where: {
              eventId,
              timestamp: { gte: thirtyDaysAgo },
            },
          }),
          prisma.auditLog.findMany({
            where: {
              eventId,
              discrepancy: { not: 0 },
              timestamp: { gte: thirtyDaysAgo },
            },
            distinct: ["itemId"],
          }),
          prisma.auditLog.findMany({
            where: { eventId },
            include: {
              item: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
            orderBy: { timestamp: "desc" },
            take: 5,
          }),
        ]);

      // Calculate average discrepancy
      const allDiscrepancies = await prisma.auditLog.findMany({
        where: {
          eventId,
          timestamp: { gte: thirtyDaysAgo },
        },
        select: { discrepancy: true },
      });

      const avgDiscrepancy =
        allDiscrepancies.length > 0
          ? allDiscrepancies.reduce(
              (sum, log) => sum + Math.abs(log.discrepancy),
              0
            ) / allDiscrepancies.length
          : 0;

      return {
        totalAudits,
        auditsLast30Days,
        itemsWithDiscrepancies: discrepancies.length,
        averageDiscrepancy: Math.round(avgDiscrepancy * 100) / 100,
        recentAudits,
      };
    }
  );
};

export default auditRoutes;
