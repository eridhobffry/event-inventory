import { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";
import { EventAccessRequest } from "./eventAccess";

/**
 * Role hierarchy levels for permission checks
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};

/**
 * Check if a user's role has sufficient permissions
 */
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get roles that a user can invite based on their role
 * - OWNER can invite anyone (OWNER, ADMIN, EDITOR, VIEWER)
 * - ADMIN can invite only EDITOR and VIEWER
 * - EDITOR and VIEWER cannot invite anyone
 */
export function canInviteRole(inviterRole: Role, targetRole: Role): boolean {
  if (inviterRole === "OWNER") {
    return true; // Owner can invite anyone
  }
  if (inviterRole === "ADMIN") {
    return targetRole === "EDITOR" || targetRole === "VIEWER";
  }
  return false; // EDITOR and VIEWER cannot invite
}

/**
 * Middleware to verify user has at least the required role level
 * Must be used after verifyEventAccess
 */
export function verifyPermission(requiredRole: Role) {
  return async (request: EventAccessRequest, reply: FastifyReply) => {
    if (!request.userRole) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Access denied: No role assigned",
      });
    }

    const userRole = request.userRole as Role;

    if (!hasPermission(userRole, requiredRole)) {
      return reply.status(403).send({
        error: "Forbidden",
        message: `Access denied: Requires ${requiredRole} role or higher. You are ${userRole}`,
      });
    }
  };
}

/**
 * Middleware to verify user is OWNER
 * Replacement for verifyEventOwner with proper Role enum support
 */
export async function verifyOwnerRole(
  request: EventAccessRequest,
  reply: FastifyReply
) {
  if (request.userRole !== "OWNER") {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Only event owners can perform this action",
    });
  }
}

/**
 * Middleware to verify user can manage members (OWNER or ADMIN)
 */
export async function verifyCanManageMembers(
  request: EventAccessRequest,
  reply: FastifyReply
) {
  const userRole = request.userRole as Role;
  if (!hasPermission(userRole, "ADMIN")) {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Only owners and admins can manage members",
    });
  }
}

/**
 * Middleware to verify user can edit items (EDITOR or higher)
 */
export async function verifyCanEditItems(
  request: EventAccessRequest,
  reply: FastifyReply
) {
  const userRole = request.userRole as Role;
  if (!hasPermission(userRole, "EDITOR")) {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Only editors, admins, and owners can modify items",
    });
  }
}
