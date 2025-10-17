import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import {
  verifyNeonAuth,
  AuthenticatedRequest,
} from "../../middleware/neonAuth";
import {
  Category,
  Role,
  UnitOfMeasure,
  ItemStatus,
  StorageType,
} from "@prisma/client";
import {
  EventAccessRequest,
  verifyEventAccess,
} from "../../middleware/eventAccess";
import {
  verifyCanEditItems,
  hasPermission,
} from "../../middleware/permissions";

// Validation schemas
const baseItemSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(255),
  category: z.nativeEnum(Category),
  quantity: z.number().int().min(0),
  unitOfMeasure: z.nativeEnum(UnitOfMeasure).default("EACH"),
  unitPrice: z.preprocess((val) => {
    // Convert 0, empty string, null to undefined for optional handling
    if (val === 0 || val === "" || val === null) return undefined;
    return val;
  }, z.number().positive("Unit price must be greater than 0").optional()),
  status: z.nativeEnum(ItemStatus).default("AVAILABLE"),
  location: z.string().min(1).max(255),
  bin: z.string().max(255).optional(),
  description: z.string().optional(),
  eventId: z.string().uuid(),

  // === PHASE 2: Food & Beverage Fields ===
  // Perishable Management
  isPerishable: z.boolean().default(false),
  storageType: z.nativeEnum(StorageType).optional(),

  // Procurement
  parLevel: z.number().int().positive().optional(),
  reorderPoint: z.number().int().positive().optional(),
  supplierId: z.string().uuid().optional(),

  // Compliance
  isAlcohol: z.boolean().default(false),
  abv: z.number().min(0).max(100).optional(), // Alcohol by volume percentage
  allergens: z.array(z.string()).default([]),

  // Beverage Packaging (for conversions)
  bottlesPerCrate: z.number().int().positive().optional(),
  bottleVolumeMl: z.number().int().positive().optional(),
});

const createItemSchema = baseItemSchema
  .refine(
    (data) => {
      // If isAlcohol is true, abv should be provided
      if (data.isAlcohol && data.abv === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "ABV is required when isAlcohol is true",
      path: ["abv"],
    }
  )
  .refine(
    (data) => {
      // If reorderPoint is set, it should be less than parLevel
      if (data.reorderPoint !== undefined && data.parLevel !== undefined) {
        return data.reorderPoint < data.parLevel;
      }
      return true;
    },
    {
      message: "Reorder point must be less than par level",
      path: ["reorderPoint"],
    }
  );

const updateItemSchema = baseItemSchema.partial().omit({ eventId: true });

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  category: z.nativeEnum(Category).optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  location: z.string().optional(),
  q: z.string().optional(), // search query (name or SKU)
  eventId: z.string().uuid().optional(),

  // === PHASE 2: F&B Filters ===
  perishable: z.string().optional(), // "true" or "false"
  expiringSoon: z.string().optional(), // number of days threshold
  supplierId: z.string().uuid().optional(),
  alcohol: z.string().optional(), // "true" or "false"
});

const itemsRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/v1/items - List items with pagination and filters
  server.get(
    "/items",
    {
      schema: {
        tags: ["items"],
        description:
          "Get list of inventory items with pagination and filters (requires eventId)",
        querystring: {
          type: "object",
          properties: {
            page: { type: "string", default: "1" },
            limit: { type: "string", default: "20" },
            category: { type: "string", enum: Object.values(Category) },
            location: { type: "string" },
            q: { type: "string", description: "Search query for name or SKU" },
            eventId: {
              type: "string",
              format: "uuid",
              description: "Filter by event ID",
            },
            // Phase 2: F&B filters
            status: { type: "string", enum: Object.values(ItemStatus) },
            perishable: { type: "string", description: "true|false" },
            expiringSoon: {
              type: "string",
              description: "Days threshold for expiration (integer)",
            },
            supplierId: { type: "string", format: "uuid" },
            alcohol: { type: "string", description: "true|false" },
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
                  additionalProperties: true, // Allow all fields from Prisma
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
      try {
        const query = querySchema.parse(request.query);
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
        const where: any = { eventId };
        if (query.category) where.category = query.category;
        if (query.status) where.status = query.status;
        if (query.location)
          where.location = { contains: query.location, mode: "insensitive" };
        if (query.supplierId) where.supplierId = query.supplierId;
        if (typeof query.perishable === "string") {
          if (query.perishable === "true") where.isPerishable = true;
          if (query.perishable === "false") where.isPerishable = false;
        }
        if (typeof query.alcohol === "string") {
          if (query.alcohol === "true") where.isAlcohol = true;
          if (query.alcohol === "false") where.isAlcohol = false;
        }
        if (query.q) {
          // Search in both name and SKU
          where.OR = [
            { name: { contains: query.q, mode: "insensitive" } },
            { sku: { contains: query.q, mode: "insensitive" } },
          ];
        }
        if (query.expiringSoon) {
          const days = parseInt(query.expiringSoon);
          if (!isNaN(days) && days > 0) {
            const threshold = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            where.batches = {
              some: {
                isOpen: true,
                expirationDate: { lte: threshold },
              },
            };
          }
        }

        // Get total count
        const total = await prisma.item.count({ where });

        // Get items
        const items = await prisma.item.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                contactName: true,
                contactEmail: true,
              },
            },
            batches: {
              where: {
                isOpen: true,
              },
              orderBy: {
                receivedAt: "asc",
              },
              select: {
                id: true,
                lotNumber: true,
                quantity: true,
                initialQuantity: true,
                expirationDate: true,
                receivedAt: true,
                manufacturedAt: true,
                isOpen: true,
              },
              take: 10,
            },
          },
        });

        // Add computed pricing fields
        const itemsWithComputed = items.map((item) => {
          const computed: any = {};

          // Calculate conversions if we have the data
          if (item.unitPrice && item.bottlesPerCrate) {
            const unitPrice = Number(item.unitPrice);
            const bottlesPerCrate = item.bottlesPerCrate;

            if (item.unitOfMeasure === "CRATE") {
              // Unit price is per crate, calculate per bottle
              computed.pricePerBottle = Number(
                (unitPrice / bottlesPerCrate).toFixed(2)
              );
              computed.pricePerCrate = unitPrice;
            } else if (item.unitOfMeasure === "BOTTLE") {
              // Unit price is per bottle, calculate per crate
              computed.pricePerCrate = Number(
                (unitPrice * bottlesPerCrate).toFixed(2)
              );
              computed.pricePerBottle = unitPrice;
            }
          }

          // Calculate total bottles in inventory
          if (item.bottlesPerCrate && item.unitOfMeasure === "CRATE") {
            computed.totalBottles = item.quantity * item.bottlesPerCrate;
          }

          return {
            ...item,
            _computed: Object.keys(computed).length > 0 ? computed : undefined,
          };
        });

        return {
          data: itemsWithComputed,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  );

  // GET /api/v1/items/:id - Get single item
  server.get(
    "/items/:id",
    {
      schema: {
        tags: ["items"],
        description: "Get a single inventory item by ID",
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
            additionalProperties: true, // Allow all fields from Prisma
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
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const item = await prisma.item.findUnique({
          where: { id },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                contactName: true,
                contactEmail: true,
                contactPhone: true,
              },
            },
            batches: {
              where: {
                isOpen: true,
              },
              orderBy: {
                receivedAt: "asc",
              },
            },
            auditLogs: {
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
        });

        if (!item) {
          return reply.status(404).send({
            error: "Not Found",
            message: "Item not found",
          });
        }

        // Add computed pricing fields
        const computed: any = {};

        if (item.unitPrice && item.bottlesPerCrate) {
          const unitPrice = Number(item.unitPrice);
          const bottlesPerCrate = item.bottlesPerCrate;

          if (item.unitOfMeasure === "CRATE") {
            computed.pricePerBottle = Number(
              (unitPrice / bottlesPerCrate).toFixed(2)
            );
            computed.pricePerCrate = unitPrice;
          } else if (item.unitOfMeasure === "BOTTLE") {
            computed.pricePerCrate = Number(
              (unitPrice * bottlesPerCrate).toFixed(2)
            );
            computed.pricePerBottle = unitPrice;
          }
        }

        if (item.bottlesPerCrate && item.unitOfMeasure === "CRATE") {
          computed.totalBottles = item.quantity * item.bottlesPerCrate;
        }

        return {
          ...item,
          _computed: Object.keys(computed).length > 0 ? computed : undefined,
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  );

  // POST /api/v1/items - Create new item (EDITOR or higher)
  server.post(
    "/items",
    {
      preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanEditItems],
      schema: {
        tags: ["items"],
        description: "Create a new inventory item (EDITOR, ADMIN, or OWNER)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "category", "quantity", "location", "eventId"],
          properties: {
            name: { type: "string" },
            category: { type: "string", enum: Object.values(Category) },
            quantity: { type: "number" },
            location: { type: "string" },
            description: { type: "string" },
            eventId: { type: "string", format: "uuid" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              category: { type: "string" },
              quantity: { type: "number" },
              location: { type: "string" },
              eventId: { type: "string" },
            },
          },
        },
      },
    },
    async (request: EventAccessRequest, reply) => {
      const data = createItemSchema.parse(request.body);

      // Verify the eventId in the body matches the user's access
      if (data.eventId !== request.eventId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "You can only create items in events you have access to",
        });
      }

      const item = await prisma.item.create({
        data,
      });

      return reply.status(201).send(item);
    }
  );

  // PUT /api/v1/items/:id - Update item (EDITOR or higher)
  server.put(
    "/items/:id",
    {
      preHandler: [verifyNeonAuth],
      schema: {
        tags: ["items"],
        description: "Update an inventory item (EDITOR, ADMIN, or OWNER)",
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
            category: { type: "string", enum: Object.values(Category) },
            quantity: { type: "number" },
            location: { type: "string" },
            description: { type: "string" },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const data = updateItemSchema.parse(request.body);

      // Fetch the item to get its eventId
      const existingItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }

      // Check if user has access to the event and has EDITOR role or higher
      const membership = await prisma.eventMember.findUnique({
        where: {
          userId_eventId: {
            userId: request.user!.id,
            eventId: existingItem.eventId,
          },
        },
      });

      if (!membership) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "You can only update items in your events",
        });
      }

      // Verify user has EDITOR role or higher
      if (!hasPermission(membership.role as Role, Role.EDITOR)) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Only EDITOR, ADMIN, or OWNER can update items",
        });
      }

      try {
        const item = await prisma.item.update({
          where: { id },
          data,
        });

        return item;
      } catch (error) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }
    }
  );

  // DELETE /api/v1/items/:id - Delete item (ADMIN or OWNER only)
  server.delete(
    "/items/:id",
    {
      preHandler: [verifyNeonAuth],
      schema: {
        tags: ["items"],
        description: "Delete an inventory item (ADMIN or OWNER only)",
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
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      // Fetch the item to get its eventId
      const existingItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }

      // Check if user has access to the event and has ADMIN role or higher
      const membership = await prisma.eventMember.findUnique({
        where: {
          userId_eventId: {
            userId: request.user!.id,
            eventId: existingItem.eventId,
          },
        },
      });

      if (!membership) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "You can only delete items in your events",
        });
      }

      // Verify user has ADMIN role or higher
      if (!hasPermission(membership.role as Role, Role.ADMIN)) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Only ADMIN or OWNER can delete items",
        });
      }

      try {
        await prisma.item.delete({
          where: { id },
        });

        return { message: "Item deleted successfully" };
      } catch (error) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Item not found",
        });
      }
    }
  );
};

export default itemsRoutes;
