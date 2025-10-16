/**
 * Script to create vector index on items table
 * Run with: node scripts/create-vector-index.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createVectorIndex() {
  console.log('🔧 Creating vector index for semantic search...\n');

  try {
    // Check if vector extension exists
    console.log('1️⃣  Checking pgvector extension...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('   ✅ pgvector extension is enabled\n');

    // Check if column exists
    console.log('2️⃣  Checking if vector_desc column exists...');
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'items' 
      AND column_name = 'vector_desc';
    `;
    
    if (Array.isArray(columnCheck) && columnCheck.length === 0) {
      console.log('   ⚠️  vector_desc column not found');
      console.log('   Creating column...');
      await prisma.$executeRaw`
        ALTER TABLE items 
        ADD COLUMN IF NOT EXISTS vector_desc vector(1536);
      `;
      console.log('   ✅ vector_desc column created\n');
    } else {
      console.log('   ✅ vector_desc column exists\n');
    }

    // Create HNSW index
    console.log('3️⃣  Creating HNSW index...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS items_vector_desc_idx 
      ON items USING hnsw (vector_desc vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `;
    console.log('   ✅ HNSW index created\n');

    // Verify index
    console.log('4️⃣  Verifying index...');
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'items' 
      AND indexname = 'items_vector_desc_idx';
    `;
    
    if (Array.isArray(indexes) && indexes.length > 0) {
      console.log('   ✅ Index verified successfully');
      console.log('   Index definition:', indexes[0].indexdef);
    } else {
      console.log('   ⚠️  Index not found');
    }

    console.log('\n✨ Vector index setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Generate embeddings for existing items');
    console.log('   2. Test semantic search endpoint');
    console.log('   3. Set hnsw.ef_search = 100 before queries for better quality\n');

  } catch (error) {
    console.error('\n❌ Error creating vector index:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createVectorIndex();
