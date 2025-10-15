import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../server";
import {
  verifyNeonAuth,
  AuthenticatedRequest,
} from "../../middleware/neonAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

const apiKeysRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/v1/api-keys - List user's API keys
  server.get(
    "/api-keys",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["api-keys"],
        description: "Get list of API keys for the authenticated user",
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
                    lastUsed: { type: "string" },
                    createdAt: { type: "string" },
                    expiresAt: { type: "string" },
                    isActive: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const keys = await prisma.apiKey.findMany({
        where: { userId: request.user!.id },
        select: {
          id: true,
          name: true,
          lastUsed: true,
          createdAt: true,
          expiresAt: true,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return { data: keys };
    }
  );

  // POST /api/v1/api-keys - Generate new API key
  server.post(
    "/api-keys",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["api-keys"],
        description: "Generate a new API key for external AI/MCP access",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1 },
            expiresInDays: { type: "number", minimum: 1, maximum: 365 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              key: {
                type: "string",
                description:
                  "The API key - save this, it will not be shown again!",
              },
              expiresAt: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const data = createApiKeySchema.parse(request.body);

      // Generate a secure random API key
      const rawKey = crypto.randomBytes(32).toString("base64url");
      const keyHash = await bcrypt.hash(rawKey, 10);

      // Calculate expiration date if provided
      let expiresAt: Date | null = null;
      if (data.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
      }

      // Create API key record
      const apiKey = await prisma.apiKey.create({
        data: {
          name: data.name,
          keyHash,
          userId: request.user!.id,
          expiresAt,
        },
      });

      return reply.status(201).send({
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // Return the raw key only once
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        message: "Save this API key securely. It will not be shown again!",
      });
    }
  );

  // DELETE /api/v1/api-keys/:id - Revoke API key
  server.delete(
    "/api-keys/:id",
    {
      preHandler: verifyNeonAuth,
      schema: {
        tags: ["api-keys"],
        description: "Revoke an API key",
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

      try {
        // Verify ownership before deleting
        const apiKey = await prisma.apiKey.findFirst({
          where: {
            id,
            userId: request.user!.id,
          },
        });

        if (!apiKey) {
          return reply.status(404).send({
            error: "Not Found",
            message: "API key not found",
          });
        }

        // Mark as inactive instead of deleting (for audit trail)
        await prisma.apiKey.update({
          where: { id },
          data: { isActive: false },
        });

        return { message: "API key revoked successfully" };
      } catch (error) {
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to revoke API key",
        });
      }
    }
  );
};

export default apiKeysRoutes;
