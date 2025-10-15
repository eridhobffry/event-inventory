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
  verifyCanEditItems,
  hasPermission,
} from "../../middleware/permissions";
import { WasteReason, Role } from "@prisma/client";

// Validation schemas
const createWasteLogSchema = z.object({
  itemId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  reason: z.nativeEnum(WasteReason),
  notes: z.string().optional(),
  eventId: z.string().uuid(), // Required for permission check
});

const wasteQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  itemId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  reason: z.nativeEnum(WasteReason).optional(),
  eventId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const wasteRoutes: FastifyPluginAsync = async (server) => {
  // POST /api/v1/waste - Create new waste log entry (EDITOR or higher)
  server.post(
    "/waste",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanEditItems],
      schema: {
        tags: ["waste"],
        description:
          "Log waste for an inventory item (EDITOR, ADMIN, or OWNER)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["itemId", "quantity", "reason", "eventId"],
          properties: {
            itemId: { type: "string", format: "uuid" },
            batchId: { type: "string", format: "uuid" },
            quantity: { type: "number", minimum: 1 },
            reason: { type: "string", enum: Object.values(WasteReason) },
            notes: { type: "string" },
            eventId: { type: "string", format: "uuid" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              itemId: { type: "string" },
              batchId: { type: "string", nullable: true },
              quantity: { type: "number" },
              reason: { type: "string" },
              notes: { type: "string", nullable: true },
              costImpact: { type: "string", nullable: true },
              createdBy: { type: "string", nullable: true },
              timestamp: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          403: {
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
      const data = createWasteLogSchema.parse(request.body);

      // Verify the eventId in the body matches the user's access
      if (data.eventId !== request.eventId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "You can only log waste in events you have access to",
        });
      }

      // Fetch the item to verify it exists and belongs to the event
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
        include: {
          batches: {
            where: {
              id: data.batchId,
              isOpen: true,
            },
          },
        },
      });

      if (!item) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }

      // Verify item belongs to the specified event
      if (item.eventId !== data.eventId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Item does not belong to the specified event",
        });
      }

      // If batchId is provided, verify the batch exists and belongs to the item
      if (data.batchId) {
        const batch = item.batches.find((b) => b.id === data.batchId);
        if (!batch) {
          return reply.status(404).send({
            error: "Not Found",
            message: "Batch not found or already closed",
          });
        }

        // Check if waste quantity exceeds available batch quantity
        if (data.quantity > batch.quantity) {
          return reply.status(400).send({
            error: "Bad Request",
            message: `Waste quantity (${data.quantity}) exceeds available batch quantity (${batch.quantity})`,
          });
        }
      } else {
        // If no batch specified, we need to get all open batches to validate
        const allOpenBatches = await prisma.itemBatch.findMany({
          where: {
            itemId: data.itemId,
            isOpen: true,
          },
        });

        // If the item uses batches, check against total batch quantity instead of item quantity
        // This allows logging waste even if some stock was already consumed
        if (allOpenBatches.length > 0) {
          const totalBatchQuantity = allOpenBatches.reduce(
            (sum, batch) => sum + batch.quantity,
            0
          );

          if (data.quantity > totalBatchQuantity) {
            return reply.status(400).send({
              error: "Bad Request",
              message: `Waste quantity (${data.quantity}) exceeds available batch quantity (${totalBatchQuantity})`,
            });
          }
        } else {
          // If no batches exist, check against total item quantity
          if (data.quantity > item.quantity) {
            return reply.status(400).send({
              error: "Bad Request",
              message: `Waste quantity (${data.quantity}) exceeds available item quantity (${item.quantity})`,
            });
          }
        }
      }

      // Calculate cost impact from unit price
      const costImpact = item.unitPrice
        ? Number(item.unitPrice) * data.quantity
        : null;

      // Create waste log in a transaction
      const wasteLog = await prisma.$transaction(async (tx) => {
        // Create the waste log
        const log = await tx.wasteLog.create({
          data: {
            itemId: data.itemId,
            batchId: data.batchId,
            quantity: data.quantity,
            reason: data.reason,
            notes: data.notes,
            costImpact: costImpact,
            createdBy: request.user!.id,
          },
        });

        // Update item quantity
        await tx.item.update({
          where: { id: data.itemId },
          data: {
            quantity: {
              decrement: data.quantity,
            },
          },
        });

        // If batch specified, update batch quantity and close if depleted
        if (data.batchId) {
          const batch = item.batches[0];
          const newBatchQuantity = batch.quantity - data.quantity;

          await tx.itemBatch.update({
            where: { id: data.batchId },
            data: {
              quantity: newBatchQuantity,
              isOpen: newBatchQuantity > 0,
            },
          });
        } else {
          // If no batch specified, use FIFO to deduct from open batches
          const allOpenBatches = await tx.itemBatch.findMany({
            where: {
              itemId: data.itemId,
              isOpen: true,
            },
            orderBy: [
              { expirationDate: "asc" }, // Earliest expiration first
              { receivedAt: "asc" },     // Then earliest received
            ],
          });

          if (allOpenBatches.length > 0) {
            let remainingQuantity = data.quantity;

            for (const batch of allOpenBatches) {
              if (remainingQuantity <= 0) break;

              const deductAmount = Math.min(batch.quantity, remainingQuantity);
              const newBatchQuantity = batch.quantity - deductAmount;

              await tx.itemBatch.update({
                where: { id: batch.id },
                data: {
                  quantity: newBatchQuantity,
                  isOpen: newBatchQuantity > 0,
                },
              });

              remainingQuantity -= deductAmount;
            }
          }
        }

        return log;
      });

      return reply.status(201).send(wasteLog);
    }
  );

  // GET /api/v1/waste - List waste logs with filters
  server.get(
    "/waste",
    {
      schema: {
        tags: ["waste"],
        description:
          "Get list of waste logs with pagination and filters (requires eventId)",
        querystring: {
          type: "object",
          properties: {
            page: { type: "string", default: "1" },
            limit: { type: "string", default: "20" },
            itemId: {
              type: "string",
              format: "uuid",
              description: "Filter by item ID",
            },
            batchId: {
              type: "string",
              format: "uuid",
              description: "Filter by batch ID",
            },
            reason: { type: "string", enum: Object.values(WasteReason) },
            eventId: {
              type: "string",
              format: "uuid",
              description: "Filter by event ID",
            },
            startDate: {
              type: "string",
              format: "date-time",
              description: "Start date for filtering",
            },
            endDate: {
              type: "string",
              format: "date-time",
              description: "End date for filtering",
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
                    batchId: { type: "string", nullable: true },
                    quantity: { type: "number" },
                    reason: { type: "string" },
                    notes: { type: "string", nullable: true },
                    costImpact: { type: "string", nullable: true },
                    createdBy: { type: "string", nullable: true },
                    timestamp: { type: "string" },
                    item: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        sku: { type: "string" },
                        category: { type: "string" },
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
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = wasteQuerySchema.parse(request.query);
      const page = parseInt(query.page);
      const limit = Math.min(parseInt(query.limit), 100); // Max 100 items per page

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

      // Build where clause
      const where: any = {
        item: {
          eventId: eventId,
        },
      };

      if (query.itemId) where.itemId = query.itemId;
      if (query.batchId) where.batchId = query.batchId;
      if (query.reason) where.reason = query.reason;

      // Date range filtering
      if (query.startDate || query.endDate) {
        where.timestamp = {};
        if (query.startDate) {
          where.timestamp.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.timestamp.lte = new Date(query.endDate);
        }
      }

      // Get total count
      const total = await prisma.wasteLog.count({ where });

      // Get waste logs
      const wasteLogs = await prisma.wasteLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: "desc" },
        include: {
          item: {
            select: {
              name: true,
              sku: true,
              category: true,
            },
          },
        },
      });

      return {
        data: wasteLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  );

  // GET /api/v1/waste/summary - Get aggregated waste statistics
  server.get(
    "/waste/summary",
    {
      schema: {
        tags: ["waste"],
        description: "Get aggregated waste statistics (requires eventId)",
        querystring: {
          type: "object",
          properties: {
            eventId: {
              type: "string",
              format: "uuid",
              description: "Filter by event ID",
            },
            startDate: {
              type: "string",
              format: "date-time",
              description: "Start date for filtering",
            },
            endDate: {
              type: "string",
              format: "date-time",
              description: "End date for filtering",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              totalWasteQuantity: { type: "number" },
              totalCostImpact: { type: "string" },
              wasteByReason: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reason: { type: "string" },
                    count: { type: "number" },
                    totalQuantity: { type: "number" },
                    totalCost: { type: "string" },
                  },
                },
              },
              topWastedItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    itemId: { type: "string" },
                    itemName: { type: "string" },
                    sku: { type: "string" },
                    totalQuantity: { type: "number" },
                    totalCost: { type: "string" },
                  },
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
        },
      },
    },
    async (request, reply) => {
      const { eventId, startDate, endDate } = request.query as {
        eventId?: string;
        startDate?: string;
        endDate?: string;
      };

      // Get eventId from query or header
      const finalEventId = eventId || (request.headers["x-event-id"] as string);

      if (!finalEventId) {
        return reply.status(400).send({
          error: "Bad Request",
          message:
            "Event ID is required (provide via eventId query parameter or x-event-id header)",
        });
      }

      // Build where clause
      const where: any = {
        item: {
          eventId: finalEventId,
        },
      };

      // Date range filtering
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate);
        }
      }

      // Get aggregate statistics
      const [totalStats, wasteByReason, topWastedItems] = await Promise.all([
        // Total waste quantity and cost
        prisma.wasteLog.aggregate({
          where,
          _sum: {
            quantity: true,
            costImpact: true,
          },
        }),

        // Waste grouped by reason
        prisma.wasteLog.groupBy({
          by: ["reason"],
          where,
          _count: {
            id: true,
          },
          _sum: {
            quantity: true,
            costImpact: true,
          },
          orderBy: {
            _sum: {
              quantity: "desc",
            },
          },
        }),

        // Top 10 most wasted items
        prisma.wasteLog.groupBy({
          by: ["itemId"],
          where,
          _sum: {
            quantity: true,
            costImpact: true,
          },
          orderBy: {
            _sum: {
              quantity: "desc",
            },
          },
          take: 10,
        }),
      ]);

      // Fetch item details for top wasted items
      const itemIds = topWastedItems.map((item) => item.itemId);
      const items = await prisma.item.findMany({
        where: {
          id: { in: itemIds },
        },
        select: {
          id: true,
          name: true,
          sku: true,
        },
      });

      // Map item details to top wasted items
      const topWastedItemsWithDetails = topWastedItems.map((wasteItem) => {
        const item = items.find((i) => i.id === wasteItem.itemId);
        return {
          itemId: wasteItem.itemId,
          itemName: item?.name || "Unknown",
          sku: item?.sku || "Unknown",
          totalQuantity: wasteItem._sum.quantity || 0,
          totalCost: wasteItem._sum.costImpact?.toString() || "0",
        };
      });

      return {
        totalWasteQuantity: totalStats._sum.quantity || 0,
        totalCostImpact: totalStats._sum.costImpact?.toString() || "0",
        wasteByReason: wasteByReason.map((item) => ({
          reason: item.reason,
          count: item._count.id,
          totalQuantity: item._sum.quantity || 0,
          totalCost: item._sum.costImpact?.toString() || "0",
        })),
        topWastedItems: topWastedItemsWithDetails,
      };
    }
  );
};

export default wasteRoutes;
