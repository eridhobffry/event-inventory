import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Create Fastify instance
const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

// Configure CORS
server.register(cors, {
  origin: process.env.CORS_ORIGIN || [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-event-id"],
});

// Security headers
server.register(helmet, {
  contentSecurityPolicy: false,
});

// Rate limiting
server.register(rateLimit, {
  max: 100,
  timeWindow: "15 minutes",
});

// Swagger/OpenAPI documentation
server.register(swagger, {
  openapi: {
    info: {
      title: "EventForge Inventory API",
      description: "AI-ready inventory management API with MCP support",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Neon Auth JWT token",
        },
        apiKey: {
          type: "apiKey",
          name: "x-api-key",
          in: "header",
          description: "API key for AI/MCP access",
        },
      },
    },
    tags: [
      { name: "health", description: "Health check endpoints" },
      { name: "events", description: "Event management operations" },
      { name: "event-members", description: "Event member management" },
      { name: "items", description: "Inventory item operations" },
      { name: "audits", description: "Audit log operations" },
      { name: "api-keys", description: "API key management" },
      { name: "mcp", description: "Model Context Protocol endpoints" },
    ],
  },
});

server.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
  },
  staticCSP: true,
});

// Health check endpoint
server.get(
  "/api/v1/health",
  {
    schema: {
      tags: ["health"],
      description: "Health check endpoint",
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            timestamp: { type: "string" },
            version: { type: "string" },
          },
        },
      },
    },
  },
  async (request, reply) => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }
);

// Register routes
import eventsRoutes from "./routes/v1/events.routes";
import eventMembersRoutes from "./routes/v1/eventMembers.routes";
import itemsRoutes from "./routes/v1/items.routes";
import auditRoutes from "./routes/v1/audit.routes";
import apiKeysRoutes from "./routes/v1/apiKeys.routes";
import mcpRoutes from "./routes/v1/mcp.routes";

server.register(eventsRoutes, { prefix: "/api/v1" });
server.register(eventMembersRoutes, { prefix: "/api/v1" });
server.register(itemsRoutes, { prefix: "/api/v1" });
server.register(auditRoutes, { prefix: "/api/v1" });
server.register(apiKeysRoutes, { prefix: "/api/v1" });
server.register(mcpRoutes, { prefix: "/mcp" });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3001");
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📚 API docs available at http://localhost:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
