import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import {
  verifyNeonAuth,
  AuthenticatedRequest,
} from "../../middleware/neonAuth";

// Validation schemas
const createSupplierSchema = z.object({
  name: z.string().min(1).max(255),
  contactName: z.string().max(255).optional(),
  contactEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  contactPhone: z.string().max(50).optional(),
  leadTimeDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateSupplierSchema = createSupplierSchema.partial();

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  isActive: z.string().optional(), // "true" or "false"
  q: z.string().optional(), // search query for name
});

const suppliersRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/v1/suppliers - List suppliers with pagination and filters
  server.get(
    "/suppliers",
    {
      schema: {
        tags: ["suppliers"],
        description: "Get list of suppliers with pagination and filters",
        querystring: {
          type: "object",
          properties: {
            page: { type: "string", default: "1" },
            limit: { type: "string", default: "20" },
            isActive: { type: "string", description: "true|false" },
            q: { type: "string", description: "Search query for name" },
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
                    name: { type: "string" },
                    contactName: { type: "string", nullable: true },
                    contactEmail: { type: "string", nullable: true },
                    contactPhone: { type: "string", nullable: true },
                    leadTimeDays: { type: "number", nullable: true },
                    notes: { type: "string", nullable: true },
                    isActive: { type: "boolean" },
                    createdAt: { type: "string" },
                    updatedAt: { type: "string" },
                    _count: {
                      type: "object",
                      properties: {
                        items: { type: "number" },
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
      const query = querySchema.parse(request.query);
      const page = parseInt(query.page);
      const limit = Math.min(parseInt(query.limit), 100); // Max 100 items per page

      // Build where clause
      const where: any = {};

      if (typeof query.isActive === "string") {
        if (query.isActive === "true") where.isActive = true;
        if (query.isActive === "false") where.isActive = false;
      }

      if (query.q) {
        where.name = { contains: query.q, mode: "insensitive" };
      }

      // Get total count
      const total = await prisma.supplier.count({ where });

      // Get suppliers with item count
      const suppliers = await prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { items: true },
          },
        },
      });

      return {
        data: suppliers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  );

  // GET /api/v1/suppliers/:id - Get single supplier
  server.get(
    "/suppliers/:id",
    {
      schema: {
        tags: ["suppliers"],
        description: "Get a single supplier by ID with associated items",
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
              contactName: { type: "string", nullable: true },
              contactEmail: { type: "string", nullable: true },
              contactPhone: { type: "string", nullable: true },
              leadTimeDays: { type: "number", nullable: true },
              notes: { type: "string", nullable: true },
              isActive: { type: "boolean" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    sku: { type: "string" },
                    category: { type: "string" },
                    quantity: { type: "number" },
                    status: { type: "string" },
                  },
                },
              },
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
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              quantity: true,
              status: true,
              eventId: true,
            },
            orderBy: { name: "asc" },
          },
        },
      });

      if (!supplier) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Supplier not found",
        });
      }

      return supplier;
    }
  );

  // POST /api/v1/suppliers - Create new supplier (authenticated users)
  server.post(
    "/suppliers",
    {
      preHandler: [verifyNeonAuth],
      schema: {
        tags: ["suppliers"],
        description: "Create a new supplier",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            contactName: { type: "string", maxLength: 255 },
            contactEmail: { type: "string", format: "email" },
            contactPhone: { type: "string", maxLength: 50 },
            leadTimeDays: { type: "number", minimum: 1 },
            notes: { type: "string" },
            isActive: { type: "boolean", default: true },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              contactName: { type: "string", nullable: true },
              contactEmail: { type: "string", nullable: true },
              contactPhone: { type: "string", nullable: true },
              leadTimeDays: { type: "number", nullable: true },
              notes: { type: "string", nullable: true },
              isActive: { type: "boolean" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const data = createSupplierSchema.parse(request.body);

      const supplier = await prisma.supplier.create({
        data,
      });

      return reply.status(201).send(supplier);
    }
  );

  // PUT /api/v1/suppliers/:id - Update supplier (authenticated users)
  server.put(
    "/suppliers/:id",
    {
      preHandler: [verifyNeonAuth],
      schema: {
        tags: ["suppliers"],
        description: "Update a supplier",
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
            name: { type: "string", minLength: 1, maxLength: 255 },
            contactName: { type: "string", maxLength: 255 },
            contactEmail: { type: "string", format: "email" },
            contactPhone: { type: "string", maxLength: 50 },
            leadTimeDays: { type: "number", minimum: 1 },
            notes: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              contactName: { type: "string", nullable: true },
              contactEmail: { type: "string", nullable: true },
              contactPhone: { type: "string", nullable: true },
              leadTimeDays: { type: "number", nullable: true },
              notes: { type: "string", nullable: true },
              isActive: { type: "boolean" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
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
      const data = updateSupplierSchema.parse(request.body);

      try {
        const supplier = await prisma.supplier.update({
          where: { id },
          data,
        });

        return supplier;
      } catch (error) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Supplier not found",
        });
      }
    }
  );

  // DELETE /api/v1/suppliers/:id - Delete supplier (authenticated users)
  server.delete(
    "/suppliers/:id",
    {
      preHandler: [verifyNeonAuth],
      schema: {
        tags: ["suppliers"],
        description: "Delete a supplier (only if no items are associated)",
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

      // Check if supplier exists and has associated items
      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          _count: {
            select: { items: true },
          },
        },
      });

      if (!supplier) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Supplier not found",
        });
      }

      if (supplier._count.items > 0) {
        return reply.status(400).send({
          error: "Bad Request",
          message: `Cannot delete supplier with ${supplier._count.items} associated item(s). Please remove or reassign items first.`,
        });
      }

      try {
        await prisma.supplier.delete({
          where: { id },
        });

        return { message: "Supplier deleted successfully" };
      } catch (error) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Supplier not found",
        });
      }
    }
  );
};

export default suppliersRoutes;
