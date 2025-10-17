# Jam Karet Festival 2024 Beverage Migration

## Overview
This migration adds beverage crate tracking capabilities and imports the Jam Karet Festival 2024 beverage inventory into the 2025 event.

## Migration Details

### Schema Changes

#### 1. New UnitOfMeasure Enum Values
- `CRATE` - For tracking beverage crates
- `BOTTLE` - For tracking individual bottles

#### 2. New Item Fields
```sql
bottlesPerCrate  INT             -- Number of bottles in one crate (e.g., 20, 24)
bottleVolumeMl   INT             -- Volume of each bottle in mL (e.g., 330, 500)
pricePerCrate    DECIMAL(10,2)   -- Cost per crate for procurement
pricePerBottle   DECIMAL(10,2)   -- Calculated: pricePerCrate / bottlesPerCrate
```

### German Beverage Crate Standards

Based on industry research:

| Beverage Type | Bottle Size | Bottles per Crate |
|--------------|-------------|-------------------|
| Beer | 0.5L | 20 |
| Beer | 0.33L | 24 |
| Soft Drinks | 0.33L | 24 |
| Water (large) | 1L | 6 |

### Pricing Strategy

**Best Practice:** Track both per-crate and per-bottle pricing
- **Procurement:** Purchase by crate (supplier invoicing)
- **Usage Tracking:** Track by bottle (actual consumption)
- **Inventory:** Store in crates, report in bottles

## Jam Karet 2024 Inventory

Event ID: `107d61d9-2647-4ed1-b559-0d666c629834`

### Beverages Imported

| SKU | Name | Crates | Bottles | Type | Price/Crate | Price/Bottle |
|-----|------|--------|---------|------|-------------|--------------|
| JK2025-BEV-001 | Apfelsaft | 5 | 100 (20x0.5L) | Juice | €15.00 | €0.75 |
| JK2025-BEV-002 | Pellegrino | 2 | 12 (6x1L) | Water | €24.00 | €4.00 |
| JK2025-BEV-003 | Kiez | 5 | 120 (24x0.33L) | Beverage | €12.00 | €0.50 |
| JK2025-BEV-004 | Urtyp | 1 | 24 (24x0.33L) | Beverage | €12.00 | €0.50 |
| JK2025-BEV-005 | Kräuter | 3 | 72 (24x0.33L) | Herbal | €14.00 | €0.58 |
| JK2025-BEV-006 | Fritzkola | 3 | 72 (24x0.33L) | Cola | €16.00 | €0.67 |
| JK2025-BEV-007 | Vio still | 2 | 12 (6x1L) | Water | €8.00 | €1.33 |
| JK2025-BEV-008 | Classic | 2 | 48 (24x0.33L) | Beverage | €12.00 | €0.50 |
| JK2025-BEV-009 | Ratsherrn | 3 | 60 (20x0.5L) | Beer 🍺 | €22.00 | €1.10 |

### Summary
- **Total Items:** 9 beverages
- **Total Crates:** 26
- **Total Bottles:** ~580
- **Alcoholic:** 1 (Ratsherrn - 5% ABV)
- **Non-Alcoholic:** 8
- **Storage:** All set to CHILL (refrigerated)

### Inventory Calculations

**Example: Apfelsaft**
- Quantity: 5 crates
- Bottles per crate: 20
- Total bottles: 5 × 20 = 100 bottles
- Price per crate: €15.00
- Price per bottle: €15.00 ÷ 20 = €0.75
- Total value: 5 × €15.00 = €75.00

## Running the Migration

### Option 1: Apply Migration (Recommended)
```bash
cd /Users/eridhobufferyrollian/Documents/Project/event-inventory
npx prisma migrate dev
```

This will:
1. Add CRATE and BOTTLE to UnitOfMeasure enum
2. Add beverage tracking fields to items table
3. Insert all 9 Jam Karet beverages
4. Update Prisma Client

### Option 2: Manual SQL Execution
```bash
psql $DATABASE_URL -f prisma/migrations/20251017091328_add_beverage_crate_tracking/migration.sql
```

## Verification

After migration, verify the data:

```sql
-- Check all Jam Karet beverages
SELECT 
    name,
    quantity as crates,
    bottles_per_crate,
    (quantity * bottles_per_crate) as total_bottles,
    price_per_crate,
    price_per_bottle,
    is_alcohol
FROM items 
WHERE sku LIKE 'JK2025-BEV-%'
ORDER BY sku;

-- Calculate total inventory value
SELECT 
    COUNT(*) as total_items,
    SUM(quantity) as total_crates,
    SUM(quantity * bottles_per_crate) as total_bottles,
    SUM(quantity * price_per_crate) as total_value_eur
FROM items 
WHERE sku LIKE 'JK2025-BEV-%';
```

## Next Steps

1. ✅ **Review imported data** in the frontend
2. **Adjust quantities** based on 2025 requirements
3. **Update pricing** with actual supplier quotes
4. **Add supplier information** for procurement
5. **Set up reorder alerts** based on par levels
6. **Configure batch tracking** for FIFO management

## Notes

- Prices are **estimates** based on German market research
- Actual prices should be updated with supplier quotes
- `parLevel` is set based on 2024 usage (same as quantity)
- `reorderPoint` is set at ~30% of par level
- All beverages marked as `isPerishable: true`
- Storage type set to `CHILL` (refrigerated)

## References

- Perplexity Research: German beverage crate standards
- Industry standard: 20-24 bottles per crate
- Pricing strategy: Track both per-crate and per-bottle costs
