-- Add HNSW index for fast vector similarity search
-- This index enables efficient nearest-neighbor queries on 1536-dimension embeddings

-- First, ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index for cosine similarity search
-- m = 16: number of connections per layer (higher = better recall, more memory)
-- ef_construction = 64: size of dynamic candidate list (higher = better quality, slower build)
-- Note: Column name is vectorDesc (camelCase) in the database
CREATE INDEX IF NOT EXISTS items_vector_desc_idx 
ON items USING hnsw ("vectorDesc" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Set search quality parameter (can be adjusted per query)
-- Higher ef_search = better recall but slower queries
-- Default is 40, we set to 100 for better quality
-- Run this before semantic search queries: SET hnsw.ef_search = 100;

-- Verify the index was created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'items' AND indexname = 'items_vector_desc_idx';
