import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import type { Category } from '@prisma/client';
import { aiService } from '../../services/ai.service.js';

const prisma = new PrismaClient();

// Validation schemas
const semanticSearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.3), // Minimum similarity score (lowered for better recall)
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
            threshold: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
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
                  additionalProperties: true, // Allow all fields from Prisma
                },
              },
              query: { type: 'string' },
              parsedQuery: {
                type: 'object',
                additionalProperties: true,
              },
              count: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { query, limit, threshold, eventId } = semanticSearchSchema.parse(request.body);

      try {
        // Parse the query to extract filters
        const parsedQuery = await aiService.parseSearchQuery(query);
        const searchTerm = parsedQuery.searchTerm || query;

        // Generate embedding for search query
        const queryEmbedding = await aiService.generateEmbedding(searchTerm);

        // Build SQL query with vector similarity search
        const vectorString = `[${queryEmbedding.join(',')}]`;

        // Build WHERE conditions
        let whereConditions = [`"vectorDesc" IS NOT NULL`];
        let havingConditions = [`(1 - ("vectorDesc" <=> '${vectorString}'::vector)) >= ${threshold}`];

        if (eventId) {
          whereConditions.push(`"eventId" = '${eventId}'`);
        }

        // Apply parsed filters
        if (parsedQuery.category) {
          whereConditions.push(`"category" = '${parsedQuery.category}'`);
        }
        if (parsedQuery.status) {
          whereConditions.push(`"status" = '${parsedQuery.status}'`);
        }
        if (parsedQuery.location) {
          whereConditions.push(`"location" ILIKE '%${parsedQuery.location}%'`);
        }
        if (parsedQuery.isAlcohol !== undefined) {
          whereConditions.push(`"isAlcohol" = ${parsedQuery.isAlcohol}`);
        }
        if (parsedQuery.isPerishable !== undefined) {
          whereConditions.push(`"isPerishable" = ${parsedQuery.isPerishable}`);
        }

        // First, get IDs and similarity scores
        const similarityQuery = `
          SELECT
            id,
            (1 - ("vectorDesc" <=> '${vectorString}'::vector)) as similarity
          FROM items
          WHERE ${whereConditions.join(' AND ')}
          AND ${havingConditions.join(' AND ')}
          ORDER BY "vectorDesc" <=> '${vectorString}'::vector
          LIMIT ${limit}
        `;

        const similarityResults = await prisma.$queryRawUnsafe<Array<{ id: string; similarity: number }>>(similarityQuery);

        if (similarityResults.length === 0) {
          return reply.send({
            results: [],
            query,
            parsedQuery,
            count: 0,
          });
        }

        // Fetch full item details using Prisma
        const itemIds = similarityResults.map(r => r.id);
        const items = await prisma.item.findMany({
          where: { id: { in: itemIds } },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            quantity: true,
            unitOfMeasure: true,
            location: true,
            status: true,
            sku: true,
            unitPrice: true,
            bin: true,
            lastAudit: true,
            eventId: true,
            isPerishable: true,
            storageType: true,
            parLevel: true,
            reorderPoint: true,
            supplierId: true,
            isAlcohol: true,
            abv: true,
            allergens: true,
            createdAt: true,
            updatedAt: true,
            bottlesPerCrate: true,
            bottleVolumeMl: true,
          },
        });

        // Merge similarity scores with item data and sort by similarity
        const results = items.map(item => {
          const simResult = similarityResults.find(r => r.id === item.id);

          // Compute pricing fields if needed
          const computed: any = {};
          if (item.unitPrice && item.bottlesPerCrate) {
            const unitPrice = Number(item.unitPrice);
            const bottlesPerCrate = item.bottlesPerCrate;

            if (item.unitOfMeasure === "CRATE") {
              computed.pricePerBottle = Number((unitPrice / bottlesPerCrate).toFixed(2));
              computed.pricePerCrate = unitPrice;
            } else if (item.unitOfMeasure === "BOTTLE") {
              computed.pricePerCrate = Number((unitPrice * bottlesPerCrate).toFixed(2));
              computed.pricePerBottle = unitPrice;
            }
          }

          if (item.bottlesPerCrate && item.unitOfMeasure === "CRATE") {
            computed.totalBottles = item.quantity * item.bottlesPerCrate;
          }

          return {
            ...item,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            abv: item.abv ? Number(item.abv) : null,
            similarity: simResult?.similarity || 0,
            _computed: Object.keys(computed).length > 0 ? computed : undefined,
          };
        }).sort((a, b) => b.similarity - a.similarity);

        return reply.send({
          results,
          query,
          parsedQuery,
          count: results.length,
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
          select: { 
            id: true, 
            name: true, 
            description: true,
            category: true,
            isAlcohol: true,
            isPerishable: true,
          },
        });

        if (!item) {
          return reply.code(404).send({ error: 'Item not found' });
        }

        // Generate embedding
        const embedding = await aiService.generateItemEmbedding(item);

        // Store embedding in database
        await prisma.$executeRaw`
          UPDATE items 
          SET "vectorDesc" = ${`[${embedding.join(',')}]`}::vector
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
          SELECT id, name, description, category, "isAlcohol", "isPerishable"
          FROM items
          WHERE "vectorDesc" IS NULL
        `;
        
        const params: string[] = [];
        
        if (eventId) {
          sql += ` AND "eventId" = $1`;
          params.push(eventId);
        }
        
        sql += ` LIMIT ${limit}`;
        
        const rawItems = await prisma.$queryRawUnsafe<Array<{ 
          id: string; 
          name: string; 
          description: string | null;
          category: string;
          isAlcohol: boolean;
          isPerishable: boolean;
        }>>(
          sql,
          ...params
        );

        if (rawItems.length === 0) {
          return reply.send({
            success: true,
            processed: 0,
            message: 'No items need embeddings',
          });
        }

        const items = rawItems.map((item) => ({
          ...item,
          category: item.category as Category,
        }));

        // Generate embeddings in batch
        const embeddings = await aiService.generateBatchEmbeddings(items);

        // Update items with embeddings
        const updates = items.map((item, index) => {
          const vectorString = `[${embeddings[index].join(',')}]`;
          return prisma.$executeRaw`
            UPDATE items 
            SET "vectorDesc" = ${vectorString}::vector
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
