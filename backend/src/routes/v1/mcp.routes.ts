import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../server";
import { ApiKeyRequest } from "../../middleware/apiKeyAuth";
import bcrypt from "bcryptjs";

/**
 * MCP (Model Context Protocol) Server Implementation
 * Allows AI assistants like Claude to connect and interact with the inventory system
 *
 * Implements JSON-RPC 2.0 protocol with these methods:
 * - tools/list: List available tools
 * - tools/call: Execute a tool
 * - resources/list: List available resources
 * - resources/read: Read a resource
 */

interface MCPRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: any;
}

interface MCPRequestWithContext extends MCPRequest {
  userId: string;
  eventId?: string;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

const mcpRoutes: FastifyPluginAsync = async (server) => {
  // Main MCP endpoint - handles JSON-RPC 2.0 requests
  server.post(
    "/",
    {
      schema: {
        tags: ["mcp"],
        description:
          "Model Context Protocol endpoint for AI assistants (JSON-RPC 2.0). Supports event context via x-event-id header.",
        security: [{ apiKey: [] }],
        body: {
          type: "object",
          required: ["jsonrpc", "method"],
          properties: {
            jsonrpc: { type: "string", const: "2.0" },
            id: { type: ["string", "number"] },
            method: { type: "string" },
            params: { type: "object" },
          },
        },
      },
    },
    async (request: ApiKeyRequest & { eventId?: string }, reply) => {
      const mcpRequest: MCPRequest = request.body as any;

      try {
        // Authenticate API key inline to return JSON-RPC formatted errors
        const apiKeyHeader = request.headers["x-api-key"] as string;

        if (!apiKeyHeader) {
          throw {
            code: -32603,
            message: "Missing x-api-key header",
          };
        }

        // Find and verify API key
        const activeKeys = await prisma.apiKey.findMany({
          where: { isActive: true },
        });

        let matchedKey = null;
        for (const key of activeKeys) {
          const isMatch = await bcrypt.compare(apiKeyHeader, key.keyHash);
          if (isMatch) {
            matchedKey = key;
            break;
          }
        }

        if (!matchedKey) {
          throw {
            code: -32603,
            message: "Invalid API key",
          };
        }

        // Check expiration
        if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
          throw {
            code: -32603,
            message: "API key has expired",
          };
        }

        // Update last used timestamp
        await prisma.apiKey.update({
          where: { id: matchedKey.id },
          data: { lastUsed: new Date() },
        });

        const userId = matchedKey.userId;

        // Get event context from x-event-id header if provided
        let eventId: string | undefined;
        const eventIdHeader = request.headers["x-event-id"] as string;

        if (eventIdHeader) {
          // Verify user has access to this event
          const membership = await prisma.eventMember.findUnique({
            where: {
              userId_eventId: {
                userId: userId,
                eventId: eventIdHeader,
              },
            },
          });

          if (!membership) {
            throw {
              code: -32603,
              message: "Access denied to the specified event",
              data: { eventId: eventIdHeader },
            };
          }

          eventId = eventIdHeader;
        }

        const mcpRequestWithContext: MCPRequestWithContext = {
          ...mcpRequest,
          userId,
          eventId,
        };

        let result: any;

        switch (mcpRequest.method) {
          case "tools/list":
            result = await handleToolsList(mcpRequestWithContext);
            break;

          case "tools/call":
            result = await handleToolsCall(
              mcpRequestWithContext,
              mcpRequest.params
            );
            break;

          case "resources/list":
            result = await handleResourcesList(mcpRequestWithContext);
            break;

          case "resources/read":
            result = await handleResourcesRead(
              mcpRequestWithContext,
              mcpRequest.params
            );
            break;

          default:
            throw {
              code: -32601,
              message: `Method not found: ${mcpRequest.method}`,
            };
        }

        const response: MCPResponse = {
          jsonrpc: "2.0",
          id: mcpRequest.id,
          result,
        };

        return response;
      } catch (error: any) {
        const response: MCPResponse = {
          jsonrpc: "2.0",
          id: mcpRequest.id,
          error: {
            code: error.code || -32603,
            message: error.message || "Internal error",
            data: error.data,
          },
        };

        return reply.status(200).send(response); // JSON-RPC errors still return 200
      }
    }
  );
};

// MCP Method Handlers

async function handleToolsList(context: MCPRequestWithContext) {
  return {
    tools: [
      {
        name: "list_inventory_items",
        description:
          "Get a list of inventory items with optional filters (filtered by current event)",
        inputSchema: {
          type: "object",
          properties: {
            eventId: {
              type: "string",
              description:
                "Event ID to filter by (optional, uses current event context if not provided)",
            },
            category: {
              type: "string",
              enum: ["FURNITURE", "AV_EQUIPMENT", "DECOR", "SUPPLIES", "OTHER"],
              description: "Filter by category",
            },
            location: {
              type: "string",
              description: "Filter by location (partial match)",
            },
            search: {
              type: "string",
              description: "Search in item names",
            },
            limit: {
              type: "number",
              description:
                "Maximum number of items to return (default: 20, max: 100)",
              default: 20,
            },
          },
        },
      },
      {
        name: "get_item_details",
        description:
          "Get detailed information about a specific inventory item (verifies event access)",
        inputSchema: {
          type: "object",
          required: ["itemId"],
          properties: {
            itemId: {
              type: "string",
              description: "The UUID of the item",
            },
            eventId: {
              type: "string",
              description:
                "Event ID for access verification (optional, uses current event context if not provided)",
            },
          },
        },
      },
      {
        name: "create_audit_log",
        description:
          "Create an audit log entry for an inventory item (verifies event access)",
        inputSchema: {
          type: "object",
          required: ["itemId", "actualQuantity", "expectedQuantity"],
          properties: {
            itemId: {
              type: "string",
              description: "The UUID of the item being audited",
            },
            eventId: {
              type: "string",
              description:
                "Event ID for access verification (optional, uses current event context if not provided)",
            },
            actualQuantity: {
              type: "number",
              description: "The actual counted quantity",
            },
            expectedQuantity: {
              type: "number",
              description: "The expected quantity from records",
            },
            notes: {
              type: "string",
              description: "Optional notes about the audit",
            },
            contextId: {
              type: "string",
              description: "Optional context ID for tracking MCP sessions",
            },
          },
        },
      },
      {
        name: "get_inventory_stats",
        description:
          "Get inventory and audit statistics for dashboard (filtered by current event)",
        inputSchema: {
          type: "object",
          properties: {
            eventId: {
              type: "string",
              description:
                "Event ID to filter statistics by (optional, uses current event context if not provided)",
            },
          },
        },
      },
      {
        name: "search_items_by_name",
        description:
          "Search for items by name (fuzzy match, filtered by current event)",
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            eventId: {
              type: "string",
              description:
                "Event ID to search within (optional, uses current event context if not provided)",
            },
            limit: {
              type: "number",
              description: "Maximum results (default: 10)",
              default: 10,
            },
          },
        },
      },
    ],
  };
}

async function handleToolsCall(context: MCPRequestWithContext, params: any) {
  const { name, arguments: args } = params;

  // Determine the eventId to use - either from params or context
  const eventId = args.eventId || context.eventId;

  const enrichedContext = { ...context, eventId };

  switch (name) {
    case "list_inventory_items":
      return await toolListInventoryItems(enrichedContext, args);

    case "get_item_details":
      return await toolGetItemDetails(enrichedContext, args);

    case "create_audit_log":
      return await toolCreateAuditLog(enrichedContext, args);

    case "get_inventory_stats":
      return await toolGetInventoryStats(enrichedContext, args);

    case "search_items_by_name":
      return await toolSearchItems(enrichedContext, args);

    default:
      throw {
        code: -32602,
        message: `Unknown tool: ${name}`,
      };
  }
}

async function handleResourcesList(context: MCPRequestWithContext) {
  const eventName = context.eventId
    ? (
        await prisma.event.findUnique({
          where: { id: context.eventId },
          select: { name: true },
        })
      )?.name || "Current Event"
    : "Available Events";

  return {
    resources: [
      {
        uri: `inventory://events/${context.eventId || "list"}/items`,
        name: `Inventory Items - ${eventName}`,
        mimeType: "application/json",
        description: `Complete list of inventory items${
          context.eventId ? " for " + eventName : ""
        }`,
      },
      {
        uri: `inventory://events/${context.eventId || "list"}/audits`,
        name: `Audit Logs - ${eventName}`,
        mimeType: "application/json",
        description: `Audit log entries${
          context.eventId ? " for " + eventName : ""
        }`,
      },
      {
        uri: `inventory://events/${context.eventId || "list"}/stats`,
        name: `Statistics - ${eventName}`,
        mimeType: "application/json",
        description: `Inventory and audit statistics${
          context.eventId ? " for " + eventName : ""
        }`,
      },
    ],
  };
}

async function handleResourcesRead(
  context: MCPRequestWithContext,
  params: any
) {
  const { uri } = params;

  // Parse URI format: inventory://events/{eventId}/resource
  const uriMatch = uri.match(/^inventory:\/\/events\/([^\/]+)\/(.+)$/);
  if (!uriMatch) {
    throw {
      code: -32602,
      message: `Invalid URI format: ${uri}. Expected: inventory://events/{eventId}/resource`,
    };
  }

  const [, eventIdFromUri, resource] = uriMatch;
  const effectiveEventId =
    eventIdFromUri === "list" ? context.eventId : eventIdFromUri;

  if (!effectiveEventId) {
    throw {
      code: -32602,
      message: "No event context available for resource access",
    };
  }

  switch (resource) {
    case "items":
      const items = await prisma.item.findMany({
        where: { eventId: effectiveEventId },
        take: 100,
      });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                eventId: effectiveEventId,
                items,
                count: items.length,
              },
              null,
              2
            ),
          },
        ],
      };

    case "audits":
      const audits = await prisma.auditLog.findMany({
        where: { eventId: effectiveEventId },
        take: 100,
        orderBy: { timestamp: "desc" },
      });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                eventId: effectiveEventId,
                audits,
                count: audits.length,
              },
              null,
              2
            ),
          },
        ],
      };

    case "stats":
      const stats = await toolGetInventoryStats(
        { ...context, eventId: effectiveEventId },
        {}
      );
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };

    default:
      throw {
        code: -32602,
        message: `Unknown resource: ${resource}`,
      };
  }
}

// Tool Implementations

async function toolListInventoryItems(
  context: MCPRequestWithContext,
  args: any
) {
  if (!context.eventId) {
    throw {
      code: -32602,
      message:
        "No event context available. Please specify an eventId or set x-event-id header.",
    };
  }

  const limit = Math.min(args.limit || 20, 100);
  const where: any = { eventId: context.eventId };

  if (args.category) where.category = args.category;
  if (args.location)
    where.location = { contains: args.location, mode: "insensitive" };
  if (args.search) where.name = { contains: args.search, mode: "insensitive" };

  const items = await prisma.item.findMany({
    where,
    take: limit,
    orderBy: { name: "asc" },
  });

  return {
    items,
    count: items.length,
    eventId: context.eventId,
    contextId: args.contextId || null,
  };
}

async function toolGetItemDetails(context: MCPRequestWithContext, args: any) {
  // Verify the item belongs to an event the user has access to
  const item = await prisma.item.findUnique({
    where: { id: args.itemId },
    include: {
      auditLogs: {
        where: { eventId: context.eventId },
        orderBy: { timestamp: "desc" },
        take: 10,
      },
      event: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!item) {
    throw {
      code: -32602,
      message: "Item not found",
      data: { itemId: args.itemId },
    };
  }

  // Check if user has access to this item's event
  if (context.eventId && item.eventId !== context.eventId) {
    // If specific event context is set, item must belong to that event
    throw {
      code: -32602,
      message: "Item not found in current event context",
      data: { itemId: args.itemId },
    };
  } else if (!context.eventId) {
    // If no event context, verify user has access to this item's event
    const userAccess = await prisma.eventMember.findUnique({
      where: {
        userId_eventId: {
          userId: context.userId,
          eventId: item.eventId,
        },
      },
    });

    if (!userAccess) {
      throw {
        code: -32602,
        message: "Access denied to this item",
        data: { itemId: args.itemId },
      };
    }
  }

  return {
    item,
    eventName: item.event.name,
    contextId: args.contextId || null,
  };
}

async function toolCreateAuditLog(context: MCPRequestWithContext, args: any) {
  if (!context.eventId) {
    throw {
      code: -32602,
      message:
        "No event context available. Please specify an eventId or set x-event-id header.",
    };
  }

  const { itemId, actualQuantity, expectedQuantity, notes, contextId } = args;
  const discrepancy = actualQuantity - expectedQuantity;

  // Verify item exists and belongs to the current event
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      event: {
        select: { name: true },
      },
    },
  });

  if (!item) {
    throw {
      code: -32602,
      message: "Item not found",
      data: { itemId },
    };
  }

  if (item.eventId !== context.eventId) {
    throw {
      code: -32602,
      message: "Item does not belong to the current event",
      data: { itemId, eventId: item.eventId },
    };
  }

  // Create audit log with event context
  const audit = await prisma.auditLog.create({
    data: {
      itemId,
      eventId: context.eventId,
      actualQuantity,
      expectedQuantity,
      discrepancy,
      notes,
      contextId,
    },
  });

  // Update item's last audit timestamp
  await prisma.item.update({
    where: { id: itemId },
    data: { lastAudit: new Date() },
  });

  return {
    audit,
    eventName: item.event.name,
    message:
      discrepancy === 0
        ? "Audit completed: quantities match"
        : `Audit completed: discrepancy of ${Math.abs(discrepancy)} ${
            discrepancy > 0 ? "extra" : "missing"
          } items`,
    contextId: contextId || null,
  };
}

async function toolGetInventoryStats(
  context: MCPRequestWithContext,
  args: any
) {
  if (!context.eventId) {
    throw {
      code: -32602,
      message:
        "No event context available. Please specify an eventId or set x-event-id header.",
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalItems, totalQuantity, totalAudits, recentDiscrepancies] =
    await Promise.all([
      prisma.item.count({ where: { eventId: context.eventId } }),
      prisma.item.aggregate({
        where: { eventId: context.eventId },
        _sum: { quantity: true },
      }),
      prisma.auditLog.count({ where: { eventId: context.eventId } }),
      prisma.auditLog.count({
        where: {
          eventId: context.eventId,
          discrepancy: { not: 0 },
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
    ]);

  const itemsByCategory = await prisma.item.groupBy({
    by: ["category"],
    where: { eventId: context.eventId },
    _count: true,
    _sum: { quantity: true },
  });

  // Get event name
  const event = await prisma.event.findUnique({
    where: { id: context.eventId },
    select: { name: true },
  });

  return {
    eventId: context.eventId,
    eventName: event?.name || "Unknown Event",
    totalItems,
    totalQuantity: totalQuantity._sum.quantity || 0,
    totalAudits,
    recentDiscrepancies,
    itemsByCategory,
  };
}

async function toolSearchItems(context: MCPRequestWithContext, args: any) {
  if (!context.eventId) {
    throw {
      code: -32602,
      message:
        "No event context available. Please specify an eventId or set x-event-id header.",
    };
  }

  const limit = Math.min(args.limit || 10, 50);

  const items = await prisma.item.findMany({
    where: {
      eventId: context.eventId,
      name: {
        contains: args.query,
        mode: "insensitive",
      },
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  // Get event name
  const event = await prisma.event.findUnique({
    where: { id: context.eventId },
    select: { name: true },
  });

  return {
    items,
    count: items.length,
    eventId: context.eventId,
    eventName: event?.name || "Unknown Event",
    query: args.query,
  };
}

export default mcpRoutes;
