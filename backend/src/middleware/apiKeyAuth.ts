import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../server";
import bcrypt from "bcryptjs";

export interface ApiKeyRequest extends FastifyRequest {
  apiKey?: {
    id: string;
    userId: string;
    name: string;
  };
}

/**
 * Middleware to verify API keys for AI/MCP access
 */
export async function verifyApiKey(
  request: ApiKeyRequest,
  reply: FastifyReply
) {
  try {
    const apiKey = request.headers["x-api-key"] as string;

    if (!apiKey) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing x-api-key header",
      });
    }

    // Find all active API keys and check hashes
    const activeKeys = await prisma.apiKey.findMany({
      where: { isActive: true },
    });

    let matchedKey = null;
    for (const key of activeKeys) {
      const isMatch = await bcrypt.compare(apiKey, key.keyHash);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid API key",
      });
    }

    // Check expiration
    if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "API key has expired",
      });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: matchedKey.id },
      data: { lastUsed: new Date() },
    });

    // Attach API key info to request
    request.apiKey = {
      id: matchedKey.id,
      userId: matchedKey.userId,
      name: matchedKey.name,
    };
  } catch (error) {
    request.log.error(error, "API key verification error");
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to verify API key",
    });
  }
}
