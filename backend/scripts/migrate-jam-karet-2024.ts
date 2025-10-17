/**
 * Migrate Jam Karet Festival 2024 beverage inventory to 2025 event
 * Run with: npx tsx scripts/migrate-jam-karet-2024.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Event ID from the URL
const TARGET_EVENT_ID = '107d61d9-2647-4ed1-b559-0d666c629834';

// Jam Karet 2024 beverage inventory (German beverages)
const jamKaret2024Beverages = [
  {
    name: 'Apfelsaft',
    quantity: 5,
    description: 'Apple juice - German beverage',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Pellegrino',
    quantity: 2,
    description: 'Sparkling mineral water',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Kiez',
    quantity: 5,
    description: 'Kiez beverage',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Urtyp',
    quantity: 1,
    description: 'Urtyp beverage',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Kräuter',
    quantity: 3,
    description: 'Herbal beverage (Kräuter)',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Fritzkola',
    quantity: 3,
    description: 'Fritz-Kola - German cola brand',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Vio still',
    quantity: 2,
    description: 'Vio still water',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Classic',
    quantity: 2,
    description: 'Classic beverage',
    isAlcohol: false,
    unitOfMeasure: 'LITER' as const,
  },
  {
    name: 'Ratsherrn',
    quantity: 3,
    description: 'Ratsherrn - German craft beer from Hamburg',
    isAlcohol: true,
    abv: 5.0, // Typical beer ABV
    unitOfMeasure: 'LITER' as const,
  },
];

async function migrateJamKaretInventory() {
  console.log('🍺 Migrating Jam Karet Festival 2024 beverage inventory...\n');

  try {
    // 1. Verify event exists
    console.log('1️⃣  Verifying target event...');
    const event = await prisma.event.findUnique({
      where: { id: TARGET_EVENT_ID },
    });

    if (!event) {
      console.error(`❌ Event not found: ${TARGET_EVENT_ID}`);
      console.error('   Please verify the event ID from the URL');
      process.exit(1);
    }

    console.log(`   ✅ Found event: "${event.name}"`);
    console.log(`   📅 Date: ${event.startDate || 'Not set'}`);
    console.log(`   📍 Location: ${event.location || 'Not set'}\n`);

    // 2. Check for existing items to avoid duplicates
    console.log('2️⃣  Checking for existing items...');
    const existingItems = await prisma.item.findMany({
      where: { eventId: TARGET_EVENT_ID },
      select: { name: true, sku: true },
    });

    const existingNames = new Set(existingItems.map(item => item.name));
    console.log(`   Found ${existingItems.length} existing items\n`);

    // 3. Create beverage items
    console.log('3️⃣  Creating beverage items...');
    let created = 0;
    let skipped = 0;

    for (const beverage of jamKaret2024Beverages) {
      // Skip if already exists
      if (existingNames.has(beverage.name)) {
        console.log(`   ⏭️  Skipped (exists): ${beverage.name}`);
        skipped++;
        continue;
      }

      // Generate SKU: JK2025-BEV-XXX
      const sku = `JK2025-BEV-${String(created + 1).padStart(3, '0')}`;

      // Create item
      await prisma.item.create({
        data: {
          name: beverage.name,
          sku,
          category: 'FOOD_BEVERAGE',
          quantity: beverage.quantity,
          unitOfMeasure: beverage.unitOfMeasure,
          status: 'AVAILABLE',
          location: 'Main Storage',
          description: beverage.description,
          eventId: TARGET_EVENT_ID,
          
          // F&B specific fields
          isPerishable: true, // Beverages are perishable
          storageType: 'CHILL', // Most beverages should be refrigerated
          isAlcohol: beverage.isAlcohol,
          abv: beverage.abv || null,
          
          // Procurement fields (using 2024 data as baseline)
          parLevel: beverage.quantity, // Target stock level based on 2024
          reorderPoint: Math.ceil(beverage.quantity * 0.3), // Reorder at 30%
        },
      });

      created++;
      const alcoholFlag = beverage.isAlcohol ? '🍺' : '🥤';
      console.log(`   ✅ ${alcoholFlag} Created: ${beverage.name} (${beverage.quantity} ${beverage.unitOfMeasure})`);
    }

    // 4. Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Created: ${created} items`);
    console.log(`   ⏭️  Skipped: ${skipped} items (already exist)`);
    console.log(`   📦 Total beverages: ${jamKaret2024Beverages.length}`);
    console.log(`   🎯 Event: ${event.name}`);
    
    if (created > 0) {
      console.log('\n💡 Next Steps:');
      console.log('   1. Review the imported items in the frontend');
      console.log('   2. Adjust quantities based on 2025 requirements');
      console.log('   3. Update storage locations if needed');
      console.log('   4. Add supplier information for procurement');
    }

    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateJamKaretInventory();
