import OpenAI from 'openai';
import type { Item } from '@prisma/client';

// Initialize OpenAI client lazily to avoid startup errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 3,
    });
  }
  return openai;
}

export class AIService {
  /**
   * Generate embedding for text using OpenAI's text-embedding-3-small
   * Returns 1536-dimension vector compatible with pgvector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const client = getOpenAIClient();
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536, // Match pgvector schema
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embedding for an item by combining name and description
   */
  async generateItemEmbedding(item: Pick<Item, 'name' | 'description'>): Promise<number[]> {
    const text = this.createItemText(item);
    return this.generateEmbedding(text);
  }

  /**
   * Generate embeddings for multiple items in batch
   * More efficient than individual calls
   */
  async generateBatchEmbeddings(items: Pick<Item, 'name' | 'description'>[]): Promise<number[][]> {
    try {
      const client = getOpenAIClient();
      const texts = items.map(item => this.createItemText(item));
      
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 1536,
      });

      return response.data.map(d => d.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  }

  /**
   * Create searchable text from item fields
   */
  private createItemText(item: Pick<Item, 'name' | 'description'>): string {
    const parts = [item.name];
    if (item.description) {
      parts.push(item.description);
    }
    return parts.join(' ');
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   */
  calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Auto-categorize an item based on name and description
   * Returns category and confidence score
   */
  async categorizeItem(name: string, description?: string): Promise<{
    category: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const client = getOpenAIClient();
      const prompt = `Categorize this inventory item into ONE of these categories:
- FURNITURE (chairs, tables, desks, etc.)
- AV_EQUIPMENT (audio/visual equipment, microphones, projectors, speakers, etc.)
- DECOR (decorations, plants, artwork, etc.)
- SUPPLIES (general supplies, materials, consumables, etc.)
- FOOD_BEVERAGE (food, drinks, catering items, etc.)
- OTHER (anything that doesn't fit above)

Item Name: ${name}
${description ? `Description: ${description}` : ''}

Respond in JSON format with: category, confidence (0-1), reasoning`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are an inventory categorization expert. Always respond with valid JSON.'
        }, {
          role: 'user',
          content: prompt
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        category: result.category || 'OTHER',
        confidence: result.confidence || 0,
        reasoning: result.reasoning || 'No reasoning provided'
      };
    } catch (error) {
      console.error('Error categorizing item:', error);
      return {
        category: 'OTHER',
        confidence: 0,
        reasoning: 'Failed to categorize'
      };
    }
  }

  /**
   * Parse natural language query into structured search parameters
   */
  async parseSearchQuery(query: string): Promise<{
    searchTerm?: string;
    category?: string;
    status?: string;
    location?: string;
    filters?: Record<string, any>;
  }> {
    try {
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `You are a search query parser. Convert natural language queries into structured search parameters.
Available categories: FURNITURE, AV_EQUIPMENT, DECOR, SUPPLIES, FOOD_BEVERAGE, OTHER
Available statuses: AVAILABLE, RESERVED, OUT_OF_STOCK, MAINTENANCE, DAMAGED, RETIRED
Return JSON with: searchTerm, category, status, location, filters`
        }, {
          role: 'user',
          content: query
        }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error parsing query:', error);
      return { searchTerm: query };
    }
  }

  /**
   * Check if OpenAI API is configured and working
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return { status: 'error', message: 'OpenAI API key not configured' };
      }

      // Test with a simple embedding
      await this.generateEmbedding('test');
      
      return { status: 'ok', message: 'OpenAI API is working' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
