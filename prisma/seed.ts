import {
  PrismaClient,
  Category,
  ChangeOperation,
} from "@prisma/client";

const prisma = new PrismaClient();

// Sample user IDs (these should match Stack Auth user IDs in real use)
const SAMPLE_USER_1 = "sample-user-eridho-123";
const SAMPLE_USER_2 = "sample-user-jane-456";

async function main() {
  console.log("🌱 Starting database seed...");

  // Log the seed operation
  const seedLog = await prisma.databaseChangeLog.create({
    data: {
      operation: ChangeOperation.SEED,
      description:
        "Initial database seed with events, members, inventory items and audit logs",
      metadata: {
        eventCount: 2,
        itemCount: 30,
        auditLogCount: 15,
        timestamp: new Date().toISOString(),
      },
      createdBy: "system",
      status: "in_progress",
    },
  });

  try {
    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.item.deleteMany();
    await prisma.eventMember.deleteMany();
    await prisma.event.deleteMany();
    await prisma.apiKey.deleteMany();

    console.log("✓ Cleared existing data");

    // Create sample events
    const event1 = await prisma.event.create({
      data: {
        name: "Jam Karet Festival 2025",
        description:
          "Annual music and arts festival featuring local and international artists",
        startDate: new Date("2025-07-15"),
        endDate: new Date("2025-07-17"),
        location: "Jakarta, Indonesia",
        createdById: SAMPLE_USER_1,
      },
    });

    const event2 = await prisma.event.create({
      data: {
        name: "Pasar Hamburg",
        description:
          "Community market event showcasing local artisans and food vendors",
        startDate: new Date("2025-08-20"),
        endDate: new Date("2025-08-21"),
        location: "Hamburg, Germany",
        createdById: SAMPLE_USER_2,
      },
    });

    console.log(`✓ Created 2 events`);

    // Create event memberships
    // Eridho owns Jam Karet Festival
    await prisma.eventMember.create({
      data: {
        userId: SAMPLE_USER_1,
        eventId: event1.id,
        role: "owner",
      },
    });

    // Eridho is a member of Pasar Hamburg
    await prisma.eventMember.create({
      data: {
        userId: SAMPLE_USER_1,
        eventId: event2.id,
        role: "member",
      },
    });

    // Jane owns Pasar Hamburg
    await prisma.eventMember.create({
      data: {
        userId: SAMPLE_USER_2,
        eventId: event2.id,
        role: "owner",
      },
    });

    console.log(`✓ Created event memberships`);

    // Create sample inventory items for Jam Karet Festival
    const jamKaretItems = await prisma.item.createMany({
      data: [
        // Furniture
        {
          name: "Folding Chair",
          category: Category.FURNITURE,
          quantity: 150,
          location: "Warehouse A",
          description: "Standard metal folding chairs",
          eventId: event1.id,
        },
        {
          name: "Round Table (6ft)",
          category: Category.FURNITURE,
          quantity: 40,
          location: "Warehouse A",
          description: "6-foot round tables for events",
          eventId: event1.id,
        },
        {
          name: "Bar Stool",
          category: Category.FURNITURE,
          quantity: 60,
          location: "Warehouse B",
          description: "High bar stools for cocktail events",
          eventId: event1.id,
        },
        {
          name: "Lounge Sofa",
          category: Category.FURNITURE,
          quantity: 12,
          location: "Storage Room 1",
          description: "Modern lounge sofas",
          eventId: event1.id,
        },

        // AV Equipment
        {
          name: "Projector (4K)",
          category: Category.AV_EQUIPMENT,
          quantity: 8,
          location: "AV Storage",
          description: "4K resolution projectors",
          eventId: event1.id,
        },
        {
          name: "Wireless Microphone",
          category: Category.AV_EQUIPMENT,
          quantity: 20,
          location: "AV Storage",
          description: "Professional wireless mics",
          eventId: event1.id,
        },
        {
          name: "PA Speaker System",
          category: Category.AV_EQUIPMENT,
          quantity: 6,
          location: "AV Storage",
          description: "Complete PA systems with mixer",
          eventId: event1.id,
        },
        {
          name: "LED Stage Light",
          category: Category.AV_EQUIPMENT,
          quantity: 30,
          location: "AV Storage",
          description: "RGB LED stage lighting",
          eventId: event1.id,
        },

        // Decor
        {
          name: "String Lights (50ft)",
          category: Category.DECOR,
          quantity: 40,
          location: "Decor Room",
          description: "Decorative string lights",
          eventId: event1.id,
        },
        {
          name: "Backdrop Stand",
          category: Category.DECOR,
          quantity: 10,
          location: "Storage Room 2",
          description: "Adjustable backdrop stands",
          eventId: event1.id,
        },
        {
          name: "Floor Uplighting",
          category: Category.DECOR,
          quantity: 45,
          location: "Decor Room",
          description: "LED color-changing uplights",
          eventId: event1.id,
        },

        // Supplies
        {
          name: "Extension Cord (25ft)",
          category: Category.SUPPLIES,
          quantity: 50,
          location: "Supply Closet",
          description: "Heavy-duty extension cords",
          eventId: event1.id,
        },
        {
          name: "Power Strip",
          category: Category.SUPPLIES,
          quantity: 30,
          location: "Supply Closet",
          description: "6-outlet power strips",
          eventId: event1.id,
        },

        // Other
        {
          name: "Crowd Control Barrier",
          category: Category.OTHER,
          quantity: 40,
          location: "Warehouse C",
          description: "Retractable barrier systems",
          eventId: event1.id,
        },
        {
          name: "Dance Floor (per sqft)",
          category: Category.OTHER,
          quantity: 500,
          location: "Warehouse C",
          description: "Modular dance floor tiles",
          eventId: event1.id,
        },
      ],
    });

    // Create sample inventory items for Pasar Hamburg
    const pasarHamburgItems = await prisma.item.createMany({
      data: [
        {
          name: "Market Stall Tent (10x10)",
          category: Category.OTHER,
          quantity: 50,
          location: "Main Storage",
          description: "Pop-up tents for vendor stalls",
          eventId: event2.id,
        },
        {
          name: "Folding Table (6ft)",
          category: Category.FURNITURE,
          quantity: 75,
          location: "Main Storage",
          description: "Display tables for vendors",
          eventId: event2.id,
        },
        {
          name: "Director's Chair",
          category: Category.FURNITURE,
          quantity: 100,
          location: "Main Storage",
          description: "Folding chairs for vendors",
          eventId: event2.id,
        },
        {
          name: "Table Cloth (Colorful)",
          category: Category.SUPPLIES,
          quantity: 80,
          location: "Supply Room",
          description: "Assorted colored tablecloths",
          eventId: event2.id,
        },
        {
          name: "Banner Stand",
          category: Category.DECOR,
          quantity: 20,
          location: "Supply Room",
          description: "Retractable banner displays",
          eventId: event2.id,
        },
        {
          name: "Portable Speaker",
          category: Category.AV_EQUIPMENT,
          quantity: 15,
          location: "Equipment Room",
          description: "Bluetooth portable speakers",
          eventId: event2.id,
        },
        {
          name: "Cash Box",
          category: Category.SUPPLIES,
          quantity: 60,
          location: "Supply Room",
          description: "Lockable cash boxes for vendors",
          eventId: event2.id,
        },
        {
          name: "Signage Board",
          category: Category.OTHER,
          quantity: 40,
          location: "Supply Room",
          description: "Chalkboard signs for pricing",
          eventId: event2.id,
        },
      ],
    });

    console.log(
      `✓ Created ${
        jamKaretItems.count + pasarHamburgItems.count
      } inventory items`
    );

    // Get some items for audit logs (Jam Karet Festival)
    const jamKaretAllItems = await prisma.item.findMany({
      where: { eventId: event1.id },
      take: 5,
    });

    // Create sample audit logs for Jam Karet Festival
    const auditLogs: any[] = [];
    for (const item of jamKaretAllItems) {
      const auditCount = Math.random() > 0.5 ? 2 : 1;
      for (let i = 0; i < auditCount; i++) {
        const discrepancy = Math.floor(Math.random() * 11) - 5; // -5 to +5
        auditLogs.push({
          itemId: item.id,
          eventId: event1.id,
          expectedQuantity: item.quantity,
          actualQuantity: item.quantity + discrepancy,
          discrepancy,
          notes:
            discrepancy !== 0
              ? `Discrepancy found: ${Math.abs(discrepancy)} ${
                  discrepancy > 0 ? "extra" : "missing"
                } items`
              : "Count matches records",
          timestamp: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ), // Random date within last 30 days
        });
      }
    }

    await prisma.auditLog.createMany({
      data: auditLogs,
    });

    console.log(`✓ Created ${auditLogs.length} audit logs`);

    // Update seed log status
    await prisma.databaseChangeLog.update({
      where: { id: seedLog.id },
      data: {
        status: "completed",
        metadata: {
          eventCount: 2,
          itemCount: jamKaretItems.count + pasarHamburgItems.count,
          auditLogCount: auditLogs.length,
          completedAt: new Date().toISOString(),
        },
      },
    });

    console.log("✅ Database seeded successfully!");
    console.log("\n📋 Summary:");
    console.log(`  - Events: 2`);
    console.log(`  - Event Members: 3`);
    console.log(`  - Items: ${jamKaretItems.count + pasarHamburgItems.count}`);
    console.log(`  - Audit Logs: ${auditLogs.length}`);
  } catch (error) {
    // Update seed log with error
    await prisma.databaseChangeLog.update({
      where: { id: seedLog.id },
      data: {
        status: "failed",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          failedAt: new Date().toISOString(),
        },
      },
    });
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
