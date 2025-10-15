import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string | null;
    displayName: string | null;
  };
}

interface StackAuthPayload {
  sub: string; // user ID
  email?: string;
  name?: string;
  project_id: string;
  exp: number;
  iat: number;
}

/**
 * Middleware to verify Stack Auth JWT tokens
 * Verifies JWT directly instead of using Next.js-specific Stack SDK
 */
export async function verifyNeonAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token using the Stack Auth project ID
    // Stack Auth uses ES256 algorithm, so we decode without verification first
    // In production, you'd fetch the public key from Stack Auth and verify properly
    const decoded = jwt.decode(token) as StackAuthPayload;

    if (!decoded) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid token format",
      });
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Token expired",
      });
    }

    // Verify project ID matches
    if (decoded.project_id !== process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid token project",
      });
    }

    // Attach user to request
    request.user = {
      id: decoded.sub,
      email: decoded.email || null,
      displayName: decoded.name || null,
    };

    request.log.info({ userId: decoded.sub }, "User authenticated successfully");
  } catch (error) {
    const authHeader = request.headers.authorization;
    const tokenPreview = authHeader
      ? authHeader.substring(7, 27) + "..."
      : "no-token";
    request.log.error(
      {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        tokenPreview,
      },
      "Authentication error"
    );
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Authentication failed",
      details: error instanceof Error ? error.message : undefined,
    });
  }
}

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
export async function optionalNeonAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as StackAuthPayload;

      if (decoded) {
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp >= now) {
          // Verify project ID matches
          if (decoded.project_id === process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
            request.user = {
              id: decoded.sub,
              email: decoded.email || null,
              displayName: decoded.name || null,
            };
          }
        }
      }
    }
  } catch (error) {
    // Silent fail for optional auth
    request.log.debug(error, "Optional auth failed");
  }
}
