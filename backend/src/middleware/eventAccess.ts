import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../server";
import { AuthenticatedRequest } from "./neonAuth";

export interface EventAccessRequest extends AuthenticatedRequest {
  eventId?: string;
  userRole?: string; // "owner" or "member"
}

/**
 * Middleware to verify user has access to the requested event
 * Checks EventMember table for membership
 * Extracts eventId from x-event-id header or eventId query parameter
 */
export async function verifyEventAccess(
  request: EventAccessRequest,
  reply: FastifyReply
) {
  try {
    // Ensure user is authenticated first
    if (!request.user?.id) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "User authentication required",
      });
    }

    // Get eventId from multiple sources: URL params, header, query, or body
    const eventId =
      (request.params as any)?.id ||
      (request.params as any)?.eventId ||
      (request.headers["x-event-id"] as string) ||
      (request.query as any)?.eventId ||
      (request.body as any)?.eventId;

    if (!eventId) {
      return reply.status(400).send({
        error: "Bad Request",
        message:
          "Event ID is required (provide via URL param, x-event-id header, eventId query parameter, or request body)",
      });
    }

    // Check if user is a member of the event
    const membership = await prisma.eventMember.findUnique({
      where: {
        userId_eventId: {
          userId: request.user.id,
          eventId: eventId,
        },
      },
      include: {
        event: true,
      },
    });

    if (!membership) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "You do not have access to this event",
      });
    }

    // Attach event info to request
    request.eventId = eventId;
    request.userRole = membership.role;
  } catch (error) {
    request.log.error(error, "Event access verification error");
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to verify event access",
    });
  }
}

/**
 * Middleware to verify user is the owner of the event
 * Must be used after verifyEventAccess
 */
export async function verifyEventOwner(
  request: EventAccessRequest,
  reply: FastifyReply
) {
  if (request.userRole !== "owner") {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Only event owners can perform this action",
    });
  }
}

/**
 * Optional event access - doesn't fail if no eventId provided
 * but validates access if eventId is present
 * Supports both JWT auth (request.user) and API key auth (request.apiKey)
 */
export async function optionalEventAccess(
  request: EventAccessRequest,
  reply: FastifyReply
) {
  try {
    // Get userId from either JWT auth or API key auth
    const userId = request.user?.id || (request as any).apiKey?.userId;

    if (!userId) {
      return; // No user, skip
    }

    const eventId =
      (request.params as any)?.id ||
      (request.params as any)?.eventId ||
      (request.headers["x-event-id"] as string) ||
      (request.query as any)?.eventId ||
      (request.body as any)?.eventId;

    if (!eventId) {
      return; // No eventId, skip
    }

    // Check if user is a member of the event
    const membership = await prisma.eventMember.findUnique({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: eventId,
        },
      },
    });

    if (membership) {
      request.eventId = eventId;
      request.userRole = membership.role;
    }
  } catch (error) {
    // Silent fail for optional access
    request.log.debug(error, "Optional event access check failed");
  }
}
