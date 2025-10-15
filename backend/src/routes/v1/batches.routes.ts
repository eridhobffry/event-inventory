import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import { verifyNeonAuth, AuthenticatedRequest } from "../../middleware/neonAuth";
import { hasPermission } from "../../middleware/permissions";
import { Role } from "@prisma/client";

const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const createBatchSchema = z.object({
  eventId: z.string().uuid(),
  quantity: z.number().int().positive(),
  lotNumber: z.string().max(255).optional(),
  expirationDate: isoDateSchema.optional(),
  receivedAt: isoDateSchema.optional(),
  manufacturedAt: isoDateSchema.optional(),
  notes: z.string().optional(),
});

const consumeBatchSchema = z.object({
  eventId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const batchesRoutes: FastifyPluginAsync = async (server) => {
  // POST /api/v1/items/:id/batches - Create a new batch for an item
  server.post(
    "/items/:id/batches",
    {
      preHandler: [verifyNeonAuth],
      schema: {
        tags: ["batches"],
        description:
          "Create a new inventory batch for an item (EDITOR, ADMIN, or OWNER)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", description: "Item ID" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["eventId", "quantity"],
          properties: {
            eventId: { type: "string", format: "uuid" },
            quantity: { type: "number", minimum: 1 },
            lotNumber: { type: "string" },
            expirationDate: { type: "string", format: "date-time" },
            receivedAt: { type: "string", format: "date-time" },
            manufacturedAt: { type: "string", format: "date-time" },
            notes: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              itemId: { type: "string" },
              quantity: { type: "number" },
              initialQuantity: { type: "number" },
              expirationDate: { type: "string", nullable: true },
              receivedAt: { type: "string" },
              manufacturedAt: { type: "string", nullable: true },
              lotNumber: { type: "string", nullable: true },
              isOpen: { type: "boolean" },
              notes: { type: "string", nullable: true },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id: itemId } = request.params as { id: string };
      const data = createBatchSchema.parse(request.body);

      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true, eventId: true },
      });

      if (!item) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }

      if (item.eventId !== data.eventId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Item does not belong to the specified event",
        });
      }

      const membership = await prisma.eventMember.findUnique({
        where: {
          userId_eventId: {
            userId: request.user!.id,
            eventId: item.eventId,
          },
        },
        select: { role: true },
      });

      if (!membership) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "You do not have access to this event",
        });
      }

      if (!hasPermission(membership.role as Role, Role.EDITOR)) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Only EDITOR, ADMIN, or OWNER can create batches",
        });
      }

      const receivedAt = data.receivedAt ?? new Date();

      const batch = await prisma.$transaction(async (tx) => {
        const createdBatch = await tx.itemBatch.create({
          data: {
            itemId,
            lotNumber: data.lotNumber,
            quantity: data.quantity,
            initialQuantity: data.quantity,
            expirationDate: data.expirationDate,
            receivedAt,
            manufacturedAt: data.manufacturedAt,
            notes: data.notes,
          },
        });

        await tx.item.update({
          where: { id: itemId },
          data: {
            quantity: {
              increment: data.quantity,
            },
          },
        });

        return createdBatch;
      });

      return reply.status(201).send(batch);
    }
  );

  // POST /api/v1/items/:id/consume - Consume quantity using FIFO batches
  server.post(
    "/items/:id/consume",
    {
      preHandler: [verifyNeonAuth],
      schema: {
        tags: ["batches"],
        description:
          "Consume item quantity using FIFO batches (EDITOR, ADMIN, or OWNER)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", description: "Item ID" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["eventId", "quantity"],
          properties: {
            eventId: { type: "string", format: "uuid" },
            quantity: { type: "number", minimum: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              itemId: { type: "string" },
              totalConsumed: { type: "number" },
              batches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    consumed: { type: "number" },
                    remainingQuantity: { type: "number" },
                    isOpen: { type: "boolean" },
                    expirationDate: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id: itemId } = request.params as { id: string };
      const data = consumeBatchSchema.parse(request.body);

      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true, eventId: true, quantity: true },
      });

      if (!item) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }

      if (item.eventId !== data.eventId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Item does not belong to the specified event",
        });
      }

      const membership = await prisma.eventMember.findUnique({
        where: {
          userId_eventId: {
            userId: request.user!.id,
            eventId: item.eventId,
          },
        },
        select: { role: true },
      });

      if (!membership) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "You do not have access to this event",
        });
      }

      if (!hasPermission(membership.role as Role, Role.EDITOR)) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Only EDITOR, ADMIN, or OWNER can consume batches",
        });
      }

      if (item.quantity < data.quantity) {
        return reply.status(400).send({
          error: "Bad Request",
          message: `Requested quantity (${data.quantity}) exceeds available item quantity (${item.quantity})`,
        });
      }

      const openBatches = await prisma.itemBatch.findMany({
        where: { itemId, isOpen: true },
        orderBy: [
          { expirationDate: { sort: "asc", nulls: "last" } },
          { receivedAt: "asc" },
          { createdAt: "asc" },
        ],
      });

      if (openBatches.length === 0) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "No open batches available to consume",
        });
      }

      let remainingToConsume = data.quantity;
      const batchUpdates: Array<{
        id: string;
        consume: number;
        newQuantity: number;
      }> = [];

      for (const batch of openBatches) {
        if (remainingToConsume === 0) {
          break;
        }

        const consumeAmount = Math.min(batch.quantity, remainingToConsume);
        remainingToConsume -= consumeAmount;

        batchUpdates.push({
          id: batch.id,
          consume: consumeAmount,
          newQuantity: batch.quantity - consumeAmount,
        });
      }

      if (remainingToConsume > 0) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Insufficient batch quantity available to fulfill request",
        });
      }

      const updatedBatches = await prisma.$transaction(async (tx) => {
        const updates = [];

        for (const update of batchUpdates) {
          const updatedBatch = await tx.itemBatch.update({
            where: { id: update.id },
            data: {
              quantity: update.newQuantity,
              isOpen: update.newQuantity > 0,
            },
            select: {
              id: true,
              quantity: true,
              isOpen: true,
              expirationDate: true,
            },
          });

          updates.push({
            id: updatedBatch.id,
            consumed: update.consume,
            remainingQuantity: updatedBatch.quantity,
            isOpen: updatedBatch.isOpen,
            expirationDate: updatedBatch.expirationDate,
          });
        }

        await tx.item.update({
          where: { id: itemId },
          data: {
            quantity: {
              decrement: data.quantity,
            },
          },
        });

        return updates;
      });

      return {
        itemId,
        totalConsumed: data.quantity,
        batches: updatedBatches,
      };
    }
  );
};

export default batchesRoutes;
