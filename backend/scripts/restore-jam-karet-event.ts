/**
 * Restore Jam Karet Festival 2025 event after database reset
 * Run with: npx tsx scripts/restore-jam-karet-event.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Fixed event ID from the URL
const EVENT_ID = '107d61d9-2647-4ed1-b559-0d666c629834';

async function restoreEvent() {
  console.log('🔄 Restoring Jam Karet Festival 2025 event...\n');

  try {
    // Check if event already exists
    const existing = await prisma.event.findUnique({
      where: { id: EVENT_ID },
    });

    if (existing) {
      console.log('✅ Event already exists!');
      console.log(`   Name: ${existing.name}`);
      console.log(`   ID: ${existing.id}\n`);
      return;
    }

    // Try to get user ID from existing events or use environment variable
    let userId = process.env.USER_ID;
    
    if (!userId) {
      // Try to find an existing event to get the user ID
      const existingEvent = await prisma.event.findFirst({
        select: { createdById: true },
      });
      
      if (existingEvent) {
        userId = existingEvent.createdById;
        console.log(`✅ Found user ID from existing event: ${userId}\n`);
      } else {
        console.error('❌ No user ID found!');
        console.error('   Please provide USER_ID in .env file or create an event first\n');
        process.exit(1);
      }
    } else {
      console.log(`✅ Using user ID from environment: ${userId}\n`);
    }

    // Create the event with the exact same ID
    const event = await prisma.event.create({
      data: {
        id: EVENT_ID, // Use the exact same ID from the URL
        name: 'Jam Karet Festival 2025',
        description: 'Jam Karet Festival 2025 - German beverage inventory',
        startDate: new Date('2025-06-01'), // Adjust as needed
        endDate: new Date('2025-06-03'),
        location: 'Germany',
        createdById: userId,
      },
    });

    console.log('✅ Event created successfully!');
    console.log(`   Name: ${event.name}`);
    console.log(`   ID: ${event.id}`);
    console.log(`   Location: ${event.location}`);
    console.log(`   Start Date: ${event.startDate}\n`);

    console.log('📝 Next Steps:');
    console.log('   1. The beverage data was already inserted via migration');
    console.log('   2. Check your frontend - the event should now appear');
    console.log('   3. Verify the 9 beverage items are linked to this event\n');

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✅ Event already exists (unique constraint)');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

restoreEvent();
