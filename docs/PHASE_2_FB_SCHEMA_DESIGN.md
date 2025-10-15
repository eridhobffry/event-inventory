# Phase 2: Food & Beverage Schema Design

**Date**: October 15, 2025  
**Status**: Draft - Awaiting Review  
**Migration**: Not yet created

## Overview

Phase 2 extends the inventory system to support **Food & Beverage** management for events, including perishables tracking, FIFO batch management, supplier relationships, par levels, waste logging, and alcohol compliance.

## Business Requirements

### Core F&B Needs
1. **Perishables Management**: Track expiration dates, lot numbers, FIFO consumption
2. **Procurement**: Par levels, reorder points, supplier tracking
3. **Compliance**: Alcohol flag, ABV tracking, allergen information
4. **Operations**: Waste/spoilage tracking with reasons
5. **Forecasting**: Calculate requirements from guest count + menu

### Key Workflows
- **Receiving**: Create batches with lot numbers and expiration dates
- **FIFO Picking**: Consume oldest batches first (by expiration → received date)
- **Reordering**: Alert when stock < reorder point; suggest order to par level
- **Waste Tracking**: Log spoilage, overproduction, damage with reasons
- **Forecasting**: Input guest count + menu → required quantities vs current stock

## Data Model Changes

### 1. Extend `Item` Model (Phase 2 Fields)

Add F&B-specific fields to existing `Item` model:

```prisma
model Item {
  // ... existing Phase 1 fields ...
  
  // === PHASE 2: Food & Beverage Fields ===
  
  // Perishable Management
  isPerishable   Boolean       @default(false)
  storageType    StorageType?  // DRY, CHILL, FREEZE
  
  // Procurement
  parLevel       Int?          // Target stock level
  reorderPoint   Int?          // Trigger reorder when below this
  supplierId     String?       // FK to Supplier
  
  // Compliance
  isAlcohol      Boolean       @default(false)
  abv            Decimal?      @db.Decimal(5, 2) // Alcohol by volume (0-100%)
  allergens      String[]      // Array of allergen codes
  
  // Relations
  supplier       Supplier?     @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  batches        ItemBatch[]
  wasteLogs      WasteLog[]
  
  @@index([isPerishable])
  @@index([supplierId])
  @@index([isAlcohol])
}
```

**Notes**:
- `quantity` remains denormalized sum of all open batches
- `isPerishable` gates batch/expiration requirements
- `allergens` stored as string array (e.g., `["DAIRY", "NUTS", "GLUTEN"]`)

### 2. New Model: `Supplier`

Tracks vendors/suppliers for procurement:

```prisma
model Supplier {
  id            String   @id @default(uuid())
  name          String
  contactName   String?
  contactEmail  String?
  contactPhone  String?
  leadTimeDays  Int?     // Typical delivery lead time
  notes         String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  items         Item[]
  
  @@index([name])
  @@index([isActive])
  @@map("suppliers")
}
```

### 3. New Model: `ItemBatch`

Tracks individual lots/batches for FIFO management:

```prisma
model ItemBatch {
  id              String    @id @default(uuid())
  itemId          String
  lotNumber       String?   // Supplier lot/batch number
  quantity        Int       // Current quantity in this batch
  initialQuantity Int       // Original received quantity
  
  // Dates for FIFO
  manufacturedAt  DateTime?
  receivedAt      DateTime  @default(now())
  expirationDate  DateTime? // Critical for perishables
  
  // Status
  isOpen          Boolean   @default(true) // false when fully consumed
  notes           String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  item            Item      @relation(fields: [itemId], references: [id], onDelete: Cascade)
  wasteLogs       WasteLog[]
  
  @@index([itemId])
  @@index([expirationDate])
  @@index([receivedAt])
  @@index([isOpen])
  @@map("item_batches")
}
```

**FIFO Logic**:
- Order by: `expirationDate ASC NULLS LAST`, then `receivedAt ASC`
- Consume from oldest batch first
- Mark `isOpen = false` when `quantity = 0`

### 4. New Model: `WasteLog`

Tracks waste/spoilage for reporting and cost analysis:

```prisma
model WasteLog {
  id          String     @id @default(uuid())
  itemId      String
  batchId     String?    // Optional: specific batch
  quantity    Int        // Amount wasted
  reason      WasteReason
  notes       String?
  costImpact  Decimal?   @db.Decimal(10, 2) // Calculated from unitPrice
  createdBy   String?    // User ID from Stack Auth
  timestamp   DateTime   @default(now())
  
  // Relations
  item        Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  batch       ItemBatch? @relation(fields: [batchId], references: [id], onDelete: SetNull)
  
  @@index([itemId])
  @@index([batchId])
  @@index([timestamp])
  @@index([reason])
  @@map("waste_logs")
}

enum WasteReason {
  SPOILAGE       // Expired or went bad
  OVERPRODUCTION // Made too much
  DAMAGE         // Physical damage
  CONTAMINATION  // Food safety issue
  OTHER          // Other reasons
}
```

### 5. New Enum: `StorageType`

```prisma
enum StorageType {
  DRY     // Dry storage (ambient)
  CHILL   // Refrigerated (0-5°C)
  FREEZE  // Frozen (-18°C or below)
}
```

## Migration Strategy

### Phase 2A: Core Extensions (Safe)
1. Add new fields to `Item` with safe defaults:
   - `isPerishable = false`
   - `isAlcohol = false`
   - `storageType = null`
   - `parLevel = null`
   - `reorderPoint = null`
   - `supplierId = null`
   - `abv = null`
   - `allergens = []`

2. Create new tables:
   - `Supplier`
   - `ItemBatch`
   - `WasteLog`

3. Add enums:
   - `StorageType`
   - `WasteReason`

### Phase 2B: Data Backfill (Optional)
- Identify existing food/beverage items by category or name patterns
- Set `isPerishable = true` for likely candidates
- Create initial batches from current `Item.quantity`

### Rollback Plan
- All new fields are nullable or have defaults
- New tables can be dropped without affecting core functionality
- Feature flag controls UI visibility

## Indexes

Critical indexes for performance:

```prisma
// Item
@@index([isPerishable])
@@index([supplierId])
@@index([isAlcohol])

// ItemBatch
@@index([itemId])
@@index([expirationDate]) // Critical for "expiring soon" queries
@@index([receivedAt])     // FIFO ordering
@@index([isOpen])         // Filter active batches

// WasteLog
@@index([itemId])
@@index([timestamp])
@@index([reason])

// Supplier
@@index([name])
@@index([isActive])
```

## Validation Rules

### Item Level
- If `isAlcohol = true` → `abv` must be between 0 and 100
- If `isPerishable = true` → recommend `storageType` is set
- If `parLevel` set → must be > 0
- If `reorderPoint` set → must be > 0 and < `parLevel`

### Batch Level
- If `item.isPerishable = true` → `expirationDate` should be set (warning if missing)
- `quantity` must be ≥ 0
- `initialQuantity` must be > 0
- `expirationDate` must be in future (warning if past)

### Waste Log
- `quantity` must be > 0
- `quantity` cannot exceed available batch/item quantity
- `reason` is required

## Computed Fields (Backend)

These are calculated at query time, not stored:

```typescript
interface ItemWithComputed extends Item {
  daysToExpire: number | null;      // Days until earliest batch expires
  expiringSoon: boolean;             // Expires within threshold (e.g., 7 days)
  needsReorder: boolean;             // quantity < reorderPoint
  suggestedOrderQty: number | null; // parLevel - quantity
  totalWasteCost: Decimal;           // Sum of waste costImpact
}
```

## API Endpoints (Preview)

### Items
- `GET /items?perishable=true&expiringSoon=7` - Filter perishables expiring in 7 days
- `GET /items?supplier=<id>` - Items from specific supplier
- `GET /items?alcohol=true` - Alcoholic items only
- `GET /items/:id/batches` - List batches for item (FIFO ordered)

### Batches
- `POST /items/:id/batches` - Create new batch (receiving)
- `POST /items/:id/consume` - Consume quantity (FIFO automatic)
- `PATCH /batches/:id` - Update batch (adjust quantity, notes)
- `DELETE /batches/:id` - Delete batch (if unused)

### Waste
- `POST /waste` - Log waste event
- `GET /waste?itemId=<id>` - Waste history for item
- `GET /waste/summary` - Aggregate waste stats

### Suppliers
- `GET /suppliers` - List all suppliers
- `POST /suppliers` - Create supplier
- `PATCH /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier (sets items.supplierId to null)

## Testing Scenarios

### Unit Tests
- FIFO batch selection algorithm
- Expiring soon calculation
- Reorder point logic
- Waste cost calculation

### Integration Tests
- Create item with F&B fields
- Create multiple batches → consume FIFO order
- Log waste → verify quantity deduction
- Supplier CRUD operations

### E2E Tests
1. **Receiving Flow**: Create item → add 3 batches with different expiration dates
2. **FIFO Consumption**: Consume quantity → verify oldest batch consumed first
3. **Waste Tracking**: Log spoilage → verify quantity and cost impact
4. **Reorder Alert**: Set par/reorder → consume below reorder → verify alert
5. **Forecasting**: Input guest count + menu → verify suggested quantities

## Security Considerations

- **Supplier data**: Restrict to ADMIN+ roles
- **Waste logs**: Track `createdBy` for accountability
- **Batch manipulation**: Require EDITOR+ role
- **Cost data**: Mask `unitPrice` and `costImpact` for VIEWER role

## Performance Considerations

- **Batch queries**: Index on `itemId`, `expirationDate`, `isOpen`
- **Expiring soon**: Materialized view or cached query for dashboard
- **Denormalization**: Keep `Item.quantity` in sync with sum of batch quantities
- **Archival**: Consider archiving old waste logs (>1 year)

## Future Enhancements (Phase 3+)

- **Recipe/Menu Management**: Map menu items → ingredient items with portions
- **Automated Forecasting**: ML-based demand prediction
- **Supplier Integration**: API connections for automated ordering
- **Barcode Scanning**: Mobile app for receiving/picking
- **Temperature Monitoring**: IoT integration for cold chain compliance
- **Nutrition Info**: Calories, macros per serving
- **Cost Analysis**: COGS tracking, waste cost reports

---

## Approval Checklist

- [ ] Schema reviewed by team
- [ ] Migration plan approved
- [ ] Rollback strategy confirmed
- [ ] Performance impact assessed
- [ ] Security review completed
- [ ] Documentation updated

**Next Steps**: Generate Prisma migration and test in development environment.
