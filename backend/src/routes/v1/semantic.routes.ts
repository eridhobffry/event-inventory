import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { aiService } from '../../services/ai.service.js';

const prisma = new PrismaClient();

// Validation schemas
const semanticSearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7), // Minimum similarity score
  eventId: z.string().uuid().optional(),
});

const generateEmbeddingSchema = z.object({
  itemId: z.string().uuid(),
});

const batchEmbeddingsSchema = z.object({
  eventId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

export async function semanticRoutes(fastify: FastifyInstance) {
  // Health check for AI service
  fastify.get('/ai/health', async (request, reply) => {
    const health = await aiService.healthCheck();
    return reply.code(health.status === 'ok' ? 200 : 503).send(health);
  });

  // Semantic search endpoint
  fastify.post(
    '/items/semantic-search',
    {
      schema: {
        description: 'Search items using natural language semantic search',
        tags: ['items', 'ai'],
        body: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', minLength: 1, maxLength: 500 },
            limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
            threshold: { type: 'number', minimum: 0, maximum: 1, default: 0.7 },
            eventId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    quantity: { type: 'number' },
                    location: { type: 'string' },
                    similarity: { type: 'number' },
                  },
                },
              },
              query: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { query, limit, threshold, eventId } = semanticSearchSchema.parse(request.body);

      try {
        // Generate embedding for search query
        const queryEmbedding = await aiService.generateEmbedding(query);

        // Build SQL query with vector similarity search
        const vectorString = `[${queryEmbedding.join(',')}]`;
        
        let sql = `
          SELECT 
            id,
            name,
            description,
            category,
            quantity,
            "unitOfMeasure",
            location,
            status,
            sku,
            "unitPrice",
            bin,
            "lastAudit",
            "eventId",
            "isPerishable",
            "storageType",
            "parLevel",
            "reorderPoint",
            "supplierId",
            "isAlcohol",
            abv,
            allergens,
            "createdAt",
            "updatedAt",
            1 - (vector_desc <=> $1::vector) as similarity
          FROM items
          WHERE vector_desc IS NOT NULL
        `;

        const params: any[] = [vectorString];
        let paramIndex = 2;

        // Filter by event if provided
        if (eventId) {
          sql += ` AND "eventId" = $${paramIndex}`;
          params.push(eventId);
          paramIndex++;
        }

        // Filter by similarity threshold
        sql += ` AND (1 - (vector_desc <=> $1::vector)) >= $${paramIndex}`;
        params.push(threshold);
        paramIndex++;

        // Order by similarity and limit
        sql += ` ORDER BY vector_desc <=> $1::vector LIMIT $${paramIndex}`;
        params.push(limit);

        // Execute query
        const results = await prisma.$queryRawUnsafe(sql, ...params);

        return reply.send({
          results,
          query,
          count: Array.isArray(results) ? results.length : 0,
        });
      } catch (error) {
        fastify.log.error({ err: error }, 'Semantic search error');
        return reply.code(500).send({
          error: 'Semantic search failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Generate embedding for a single item
  fastify.post(
    '/items/:itemId/generate-embedding',
    {
      schema: {
        description: 'Generate and store embedding for an item',
        tags: ['items', 'ai'],
        params: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { itemId } = generateEmbeddingSchema.parse(request.params);

      try {
        // Fetch item
        const item = await prisma.item.findUnique({
          where: { id: itemId },
          select: { id: true, name: true, description: true },
        });

        if (!item) {
          return reply.code(404).send({ error: 'Item not found' });
        }

        // Generate embedding
        const embedding = await aiService.generateItemEmbedding(item);

        // Store embedding in database
        await prisma.$executeRaw`
          UPDATE items 
          SET vector_desc = ${`[${embedding.join(',')}]`}::vector
          WHERE id = ${itemId}
        `;

        return reply.send({
          success: true,
          itemId,
          message: 'Embedding generated and stored',
        });
      } catch (error) {
        fastify.log.error({ err: error }, 'Generate embedding error');
        return reply.code(500).send({
          error: 'Failed to generate embedding',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Batch generate embeddings for multiple items
  fastify.post(
    '/items/batch-generate-embeddings',
    {
      schema: {
        description: 'Generate embeddings for all items without embeddings',
        tags: ['items', 'ai'],
        body: {
          type: 'object',
          properties: {
            eventId: { type: 'string', format: 'uuid' },
            limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
          },
        },
      },
    },
    async (request, reply) => {
      const { eventId, limit } = batchEmbeddingsSchema.parse(request.body);

      try {
        // Fetch items without embeddings using raw SQL
        // (Prisma doesn't support filtering on Unsupported type fields)
        let sql = `
          SELECT id, name, description
          FROM items
          WHERE vector_desc IS NULL
        `;
        
        const params: string[] = [];
        
        if (eventId) {
          sql += ` AND "eventId" = $1`;
          params.push(eventId);
        }
        
        sql += ` LIMIT ${limit}`;
        
        const items = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; description: string | null }>>(
          sql,
          ...params
        );

        if (items.length === 0) {
          return reply.send({
            success: true,
            processed: 0,
            message: 'No items need embeddings',
          });
        }

        // Generate embeddings in batch
        const embeddings = await aiService.generateBatchEmbeddings(items);

        // Update items with embeddings
        const updates = items.map((item, index) => {
          const vectorString = `[${embeddings[index].join(',')}]`;
          return prisma.$executeRaw`
            UPDATE items 
            SET vector_desc = ${vectorString}::vector
            WHERE id = ${item.id}
          `;
        });

        await Promise.all(updates);

        return reply.send({
          success: true,
          processed: items.length,
          message: `Generated embeddings for ${items.length} items`,
        });
      } catch (error) {
        fastify.log.error({ err: error }, 'Batch generate embeddings error');
        return reply.code(500).send({
          error: 'Failed to generate batch embeddings',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Auto-categorize item
  fastify.post(
    '/items/auto-categorize',
    {
      schema: {
        description: 'Auto-categorize an item using AI',
        tags: ['items', 'ai'],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, description } = request.body as { name: string; description?: string };

      try {
        const result = await aiService.categorizeItem(name, description);
        return reply.send(result);
      } catch (error) {
        fastify.log.error({ err: error }, 'Auto-categorize error');
        return reply.code(500).send({
          error: 'Failed to categorize item',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Parse natural language search query
  fastify.post(
    '/items/parse-query',
    {
      schema: {
        description: 'Parse natural language query into structured search',
        tags: ['items', 'ai'],
        body: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { query } = request.body as { query: string };

      try {
        const parsed = await aiService.parseSearchQuery(query);
        return reply.send(parsed);
      } catch (error) {
        fastify.log.error({ err: error }, 'Parse query error');
        return reply.code(500).send({
          error: 'Failed to parse query',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
