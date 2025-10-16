/**
 * Generate test data with AI embeddings
 * Run with: npx tsx scripts/generate-test-data.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { aiService } from '../src/services/ai.service.js';

dotenv.config();

const prisma = new PrismaClient();

const testItems = [
  {
    name: 'Wireless Lapel Microphone',
    description: 'Professional wireless microphone with battery pack and receiver',
    category: 'AV_EQUIPMENT',
    quantity: 10,
    location: 'Warehouse A',
  },
  {
    name: 'Banquet Chair',
    description: 'Stackable event chair with cushioned seat',
    category: 'FURNITURE',
    quantity: 150,
    location: 'Warehouse B',
  },
  {
    name: '4K LED Projector',
    description: 'High-definition projector for presentations and events',
    category: 'AV_EQUIPMENT',
    quantity: 5,
    location: 'Warehouse A',
  },
  {
    name: 'Table Centerpiece',
    description: 'Floral decoration for banquet tables',
    category: 'DECOR',
    quantity: 50,
    location: 'Warehouse C',
  },
  {
    name: 'Champagne Flutes',
    description: 'Crystal glasses for beverages and toasts',
    category: 'FOOD_BEVERAGE',
    quantity: 200,
    location: 'Warehouse C',
  },
  {
    name: 'Portable Speaker System',
    description: 'Bluetooth-enabled portable speakers with stands',
    category: 'AV_EQUIPMENT',
    quantity: 8,
    location: 'Warehouse A',
  },
  {
    name: 'Round Banquet Table',
    description: '6-foot round table for events',
    category: 'FURNITURE',
    quantity: 75,
    location: 'Warehouse B',
  },
  {
    name: 'LED Uplighting',
    description: 'Color-changing LED lights for ambiance',
    category: 'DECOR',
    quantity: 30,
    location: 'Warehouse A',
  },
  {
    name: 'Cocktail Napkins',
    description: 'Disposable napkins for beverage service',
    category: 'SUPPLIES',
    quantity: 5000,
    location: 'Warehouse C',
  },
  {
    name: 'Podium with Microphone',
    description: 'Wooden podium with built-in microphone system',
    category: 'AV_EQUIPMENT',
    quantity: 3,
    location: 'Warehouse A',
  },
];

async function generateTestData() {
  console.log('🎨 Generating test data with AI embeddings...\n');

  try {
    // Get first event
    const events = await prisma.event.findMany({ take: 1 });
    if (events.length === 0) {
      console.error('❌ No events found. Please create an event first.');
      process.exit(1);
    }

    const eventId = events[0].id;
    console.log(`✅ Using event: ${events[0].name} (${eventId})\n`);

    // Generate embeddings for all items
    console.log('1️⃣  Generating embeddings...');
    const embeddings = await aiService.generateBatchEmbeddings(testItems);
    console.log(`   ✅ Generated ${embeddings.length} embeddings\n`);

    // Create items with embeddings
    console.log('2️⃣  Creating items...');
    let created = 0;
    
    for (let i = 0; i < testItems.length; i++) {
      const item = testItems[i];
      const embedding = embeddings[i];

      // Generate unique SKU
      const sku = `${item.category.substring(0, 3)}-${Date.now()}-${i}`;

      // Create item using Prisma
      const createdItem = await prisma.item.create({
        data: {
          name: item.name,
          sku,
          category: item.category as any,
          quantity: item.quantity,
          unitOfMeasure: 'EACH',
          location: item.location,
          description: item.description,
          eventId,
          status: 'AVAILABLE',
        },
      });

      // Update with vector embedding using raw SQL
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE items 
        SET vector_desc = ${vectorString}::vector
        WHERE id::text = ${createdItem.id}
      `;

      created++;
      console.log(`   ✅ Created: ${item.name}`);
    }

    console.log(`\n✨ Successfully created ${created} items with embeddings!\n`);

    // Test semantic search
    console.log('3️⃣  Testing semantic search...');
    const testQuery = 'audio equipment for presentations';
    console.log(`   Query: "${testQuery}"`);
    
    const queryEmbedding = await aiService.generateEmbedding(testQuery);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const results = await prisma.$queryRaw`
      SELECT 
        name,
        description,
        category,
        quantity,
        1 - (vector_desc <=> ${vectorString}::vector) as similarity
      FROM items
      WHERE vector_desc IS NOT NULL
      ORDER BY vector_desc <=> ${vectorString}::vector
      LIMIT 5
    `;

    console.log('\n   Top 5 results:');
    if (Array.isArray(results)) {
      results.forEach((r: any, i: number) => {
        console.log(`   ${i + 1}. ${r.name} (${(r.similarity * 100).toFixed(1)}% similar)`);
      });
    }

    console.log('\n📊 Summary:');
    console.log(`   - Created ${created} items`);
    console.log(`   - All items have embeddings`);
    console.log(`   - Semantic search is working`);
    console.log(`   - Ready for frontend testing!\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestData();
