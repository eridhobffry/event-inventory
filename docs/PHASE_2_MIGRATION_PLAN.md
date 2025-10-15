# Phase 2: Food & Beverage Migration Plan

**Date**: October 15, 2025  
**Status**: Ready for Review  
**Risk Level**: Medium (adds new tables + extends existing)

## Overview

This migration adds Food & Beverage inventory management capabilities to the existing system. It extends the `Item` model with F&B-specific fields and introduces three new tables: `Supplier`, `ItemBatch`, and `WasteLog`.

## Migration Strategy

### Approach: Additive & Safe
- All new `Item` fields have safe defaults (`false`, `null`, or `[]`)
- New tables are independent (no required foreign keys from existing data)
- Existing functionality remains unchanged
- Can be rolled back without data loss

## Changes Summary

### 1. Enum Extensions

#### `Category` enum
```sql
-- Add new category
ALTER TYPE "Category" ADD VALUE 'FOOD_BEVERAGE';
```

#### `UnitOfMeasure` enum
```sql
-- Add F&B-specific units
ALTER TYPE "UnitOfMeasure" ADD VALUE 'KILOGRAM';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'GRAM';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'LITER';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'MILLILITER';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'SERVING';
```

### 2. New Enums

#### `StorageType`
```sql
CREATE TYPE "StorageType" AS ENUM ('DRY', 'CHILL', 'FREEZE');
```

#### `WasteReason`
```sql
CREATE TYPE "WasteReason" AS ENUM (
  'SPOILAGE',
  'OVERPRODUCTION',
  'DAMAGE',
  'CONTAMINATION',
  'OTHER'
);
```

### 3. Extend `items` Table

```sql
-- Perishable management
ALTER TABLE "items" ADD COLUMN "isPerishable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "items" ADD COLUMN "storageType" "StorageType";

-- Procurement
ALTER TABLE "items" ADD COLUMN "parLevel" INTEGER;
ALTER TABLE "items" ADD COLUMN "reorderPoint" INTEGER;
ALTER TABLE "items" ADD COLUMN "supplierId" TEXT;

-- Compliance
ALTER TABLE "items" ADD COLUMN "isAlcohol" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "items" ADD COLUMN "abv" DECIMAL(5,2);
ALTER TABLE "items" ADD COLUMN "allergens" TEXT[] DEFAULT '{}';

-- Indexes
CREATE INDEX "items_isPerishable_idx" ON "items"("isPerishable");
CREATE INDEX "items_supplierId_idx" ON "items"("supplierId");
CREATE INDEX "items_isAlcohol_idx" ON "items"("isAlcohol");
```

### 4. Create `suppliers` Table

```sql
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "leadTimeDays" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");
```

### 5. Create `item_batches` Table

```sql
CREATE TABLE "item_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "lotNumber" TEXT,
    "quantity" INTEGER NOT NULL,
    "initialQuantity" INTEGER NOT NULL,
    "manufacturedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "item_batches_itemId_fkey" 
        FOREIGN KEY ("itemId") 
        REFERENCES "items"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

CREATE INDEX "item_batches_itemId_idx" ON "item_batches"("itemId");
CREATE INDEX "item_batches_expirationDate_idx" ON "item_batches"("expirationDate");
CREATE INDEX "item_batches_receivedAt_idx" ON "item_batches"("receivedAt");
CREATE INDEX "item_batches_isOpen_idx" ON "item_batches"("isOpen");
```

### 6. Create `waste_logs` Table

```sql
CREATE TABLE "waste_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" INTEGER NOT NULL,
    "reason" "WasteReason" NOT NULL,
    "notes" TEXT,
    "costImpact" DECIMAL(10,2),
    "createdBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "waste_logs_itemId_fkey" 
        FOREIGN KEY ("itemId") 
        REFERENCES "items"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "waste_logs_batchId_fkey" 
        FOREIGN KEY ("batchId") 
        REFERENCES "item_batches"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX "waste_logs_itemId_idx" ON "waste_logs"("itemId");
CREATE INDEX "waste_logs_batchId_idx" ON "waste_logs"("batchId");
CREATE INDEX "waste_logs_timestamp_idx" ON "waste_logs"("timestamp");
CREATE INDEX "waste_logs_reason_idx" ON "waste_logs"("reason");
```

### 7. Add Foreign Key Constraint

```sql
-- Link items to suppliers
ALTER TABLE "items" 
    ADD CONSTRAINT "items_supplierId_fkey" 
    FOREIGN KEY ("supplierId") 
    REFERENCES "suppliers"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
```

## Pre-Migration Checklist

- [ ] **Backup database** - Full backup before migration
- [ ] **Review schema changes** - Team approval on design
- [ ] **Test in development** - Run migration on dev database first
- [ ] **Check disk space** - Ensure adequate space for new tables
- [ ] **Verify Prisma version** - Compatible with array types and enums
- [ ] **Update .env** - Ensure DATABASE_URL is correct

## Migration Commands

### Generate Migration
```bash
cd backend
npx prisma migrate dev --name phase_2_food_beverage --create-only
```

### Review Generated SQL
```bash
# Check the migration file in prisma/migrations/
cat prisma/migrations/[timestamp]_phase_2_food_beverage/migration.sql
```

### Apply Migration (Development)
```bash
npx prisma migrate dev
```

### Apply Migration (Production)
```bash
npx prisma migrate deploy
```

### Generate Prisma Client
```bash
npx prisma generate
```

## Post-Migration Verification

### 1. Schema Verification
```sql
-- Verify new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'items'
AND column_name IN ('isPerishable', 'storageType', 'parLevel', 'reorderPoint', 'supplierId', 'isAlcohol', 'abv', 'allergens');

-- Verify new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('suppliers', 'item_batches', 'waste_logs');

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('items', 'suppliers', 'item_batches', 'waste_logs')
AND indexname LIKE '%Phase2%' OR indexname LIKE '%isPerishable%' OR indexname LIKE '%supplierId%';
```

### 2. Data Integrity Checks
```sql
-- Verify all items have safe defaults
SELECT COUNT(*) FROM items WHERE "isPerishable" IS NULL; -- Should be 0
SELECT COUNT(*) FROM items WHERE "isAlcohol" IS NULL; -- Should be 0
SELECT COUNT(*) FROM items WHERE "allergens" IS NULL; -- Should be 0

-- Verify no orphaned foreign keys
SELECT COUNT(*) FROM items WHERE "supplierId" IS NOT NULL 
AND "supplierId" NOT IN (SELECT id FROM suppliers); -- Should be 0
```

### 3. Application Tests
```bash
# Run backend tests
cd backend
npm test

# Test Prisma client generation
npx prisma generate
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Prisma client loaded successfully');"
```

## Rollback Plan

### Option 1: Revert Migration (Clean)
```bash
# If no data has been added to new tables
npx prisma migrate resolve --rolled-back [migration_name]
```

### Option 2: Manual Rollback (If data exists)
```sql
-- Drop foreign key first
ALTER TABLE "items" DROP CONSTRAINT IF EXISTS "items_supplierId_fkey";

-- Drop new tables
DROP TABLE IF EXISTS "waste_logs" CASCADE;
DROP TABLE IF EXISTS "item_batches" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;

-- Drop new enums
DROP TYPE IF EXISTS "WasteReason";
DROP TYPE IF EXISTS "StorageType";

-- Remove new columns from items
ALTER TABLE "items" DROP COLUMN IF EXISTS "isPerishable";
ALTER TABLE "items" DROP COLUMN IF EXISTS "storageType";
ALTER TABLE "items" DROP COLUMN IF EXISTS "parLevel";
ALTER TABLE "items" DROP COLUMN IF EXISTS "reorderPoint";
ALTER TABLE "items" DROP COLUMN IF EXISTS "supplierId";
ALTER TABLE "items" DROP COLUMN IF EXISTS "isAlcohol";
ALTER TABLE "items" DROP COLUMN IF EXISTS "abv";
ALTER TABLE "items" DROP COLUMN IF EXISTS "allergens";

-- Note: Cannot remove enum values once added (PostgreSQL limitation)
-- FOOD_BEVERAGE, KILOGRAM, etc. will remain in enums but unused
```

## Risk Assessment

### Low Risk ✅
- New tables are independent
- New columns have safe defaults
- No data transformation required
- Existing queries unaffected

### Medium Risk ⚠️
- Enum extensions (cannot be removed easily)
- Multiple table creation in single migration
- Foreign key constraints add complexity

### Mitigation
- Test thoroughly in development
- Full database backup before production
- Deploy during low-traffic window
- Monitor application logs post-deployment
- Have rollback script ready

## Performance Considerations

### Index Strategy
- All foreign keys are indexed
- `expirationDate` indexed for "expiring soon" queries
- `receivedAt` indexed for FIFO ordering
- Composite indexes may be added later based on query patterns

### Expected Impact
- **Disk Space**: ~10-20MB for new tables (empty)
- **Migration Time**: ~5-10 seconds (dev), ~30-60 seconds (prod with data)
- **Query Performance**: No impact on existing queries
- **Write Performance**: Minimal impact (new indexes on new columns)

## Timeline

1. **Day 1**: Generate and review migration (this document)
2. **Day 2**: Test in development environment
3. **Day 3**: Update backend Zod schemas and types
4. **Day 4**: Deploy to staging, run integration tests
5. **Day 5**: Deploy to production (during maintenance window)

## Success Criteria

- [ ] Migration completes without errors
- [ ] All verification queries pass
- [ ] Existing items remain unchanged
- [ ] New tables are accessible
- [ ] Prisma client regenerates successfully
- [ ] Backend tests pass
- [ ] Application starts without errors
- [ ] No performance degradation observed

## Next Steps After Migration

1. **Backend**: Update Zod schemas in `backend/src/routes/v1/items.routes.ts`
2. **Backend**: Add supplier CRUD endpoints
3. **Backend**: Add batch management endpoints
4. **Backend**: Add waste logging endpoints
5. **Frontend**: Update Item interface in `frontend/lib/api.ts`
6. **Frontend**: Add F&B fields to ItemForm
7. **Frontend**: Create Supplier management UI
8. **Testing**: E2E tests for F&B workflows

---

**Prepared by**: AI Assistant  
**Reviewed by**: [Pending]  
**Approved by**: [Pending]  
**Executed on**: [Pending]
