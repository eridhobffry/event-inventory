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
  async generateItemEmbedding(item: Pick<Item, 'name' | 'description' | 'category' | 'isAlcohol' | 'isPerishable'>): Promise<number[]> {
    const text = this.createItemText(item);
    return this.generateEmbedding(text);
  }

  /**
   * Generate embeddings for multiple items in batch
   * More efficient than individual calls
   */
  async generateBatchEmbeddings(items: Pick<Item, 'name' | 'description' | 'category' | 'isAlcohol' | 'isPerishable'>[]): Promise<number[][]> {
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
   * Includes semantic metadata to improve search relevance
   */
  private createItemText(item: Pick<Item, 'name' | 'description' | 'category' | 'isAlcohol' | 'isPerishable'>): string {
    const parts = [item.name];
    
    if (item.description) {
      parts.push(item.description);
    }
    
    // Add category as semantic context
    parts.push(`Category: ${item.category.toLowerCase().replace('_', ' ')}`);
    
    // Add alcohol status for better filtering
    if (item.isAlcohol) {
      parts.push('alcoholic beverage contains alcohol');
    } else {
      parts.push('non-alcoholic beverage no alcohol alcohol-free');
    }
    
    // Add perishable status
    if (item.isPerishable) {
      parts.push('perishable requires refrigeration');
    } else {
      parts.push('non-perishable shelf-stable');
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
    isAlcohol?: boolean;
    isPerishable?: boolean;
    filters?: Record<string, any>;
  }> {
    try {
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `You are a search query parser. Convert natural language queries into structured search parameters.

Available fields:
- searchTerm: the main search keywords (string)
- category: FURNITURE, AV_EQUIPMENT, DECOR, SUPPLIES, FOOD_BEVERAGE, OTHER
- status: AVAILABLE, RESERVED, OUT_OF_STOCK, MAINTENANCE, DAMAGED, RETIRED
- location: storage location (string)
- isAlcohol: true/false for alcoholic beverages
- isPerishable: true/false for perishable items

Important rules:
- ONLY include fields that are explicitly mentioned or clearly implied in the query
- For "non-alcoholic", "no alcohol", "alcohol-free" → set isAlcohol: false
- For "alcoholic", "with alcohol", "beer", "wine", "spirits" → set isAlcohol: true
- For "perishable" or "needs refrigeration" → set isPerishable: true
- For "non-perishable" or "shelf-stable" → set isPerishable: false
- Extract the semantic search term (what the user is looking for), NOT negations or filters
- DO NOT include category, status, location unless explicitly mentioned
- DO NOT make assumptions - only extract what's clearly stated

Examples:
- "list all non alcohol" → {"searchTerm": "beverages", "isAlcohol": false}
- "find beer" → {"searchTerm": "beer", "isAlcohol": true}
- "available chairs" → {"searchTerm": "chairs", "status": "AVAILABLE", "category": "FURNITURE"}
- "water" → {"searchTerm": "water"}

Return JSON with only the relevant extracted parameters.`
        }, {
          role: 'user',
          content: query
        }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const parsed = JSON.parse(response.choices[0].message.content || '{}');

      // Ensure booleans are actual booleans, not strings
      if (parsed.isAlcohol === 'true') parsed.isAlcohol = true;
      if (parsed.isAlcohol === 'false') parsed.isAlcohol = false;
      if (parsed.isPerishable === 'true') parsed.isPerishable = true;
      if (parsed.isPerishable === 'false') parsed.isPerishable = false;

      return parsed;
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
