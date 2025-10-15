/**
 * Helper script to get test configuration values
 * Run this to easily extract JWT token and event ID for testing
 * 
 * Usage: node get-test-config.js YOUR_JWT_TOKEN
 */

const API_BASE = "http://localhost:3001/api/v1";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

async function getConfig() {
  const token = process.argv[2];

  if (!token) {
    console.log(`${colors.yellow}Usage: node get-test-config.js YOUR_JWT_TOKEN${colors.reset}\n`);
    console.log("Steps to get your JWT token:");
    console.log("1. Login to your app at http://localhost:3000");
    console.log("2. Open browser console (F12)");
    console.log("3. Paste this code:");
    console.log(`${colors.cyan}   localStorage.getItem('stack-session')${colors.reset}`);
    console.log("4. Copy the token and run:");
    console.log(`${colors.green}   node get-test-config.js YOUR_TOKEN_HERE${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`\n${colors.bright}${colors.blue}Fetching configuration...${colors.reset}\n`);

  try {
    // Fetch user's events
    const response = await fetch(`${API_BASE}/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const events = data.data || [];

    console.log(`${colors.green}✓ Token is valid!${colors.reset}\n`);
    console.log(`${colors.bright}Your Events:${colors.reset}`);

    if (events.length === 0) {
      console.log(`${colors.yellow}No events found. Creating a test event...${colors.reset}\n`);

      // Create a test event
      const createResponse = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "API Test Event",
          description: "Created automatically for API testing",
          location: "Test Location",
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create event: ${createResponse.statusText}`);
      }

      const newEvent = await createResponse.json();
      events.push({
        id: newEvent.id,
        name: newEvent.name,
        role: "OWNER",
        memberCount: 1,
      });

      console.log(`${colors.green}✓ Created test event!${colors.reset}\n`);
    }

    events.forEach((event, index) => {
      console.log(`${colors.cyan}${index + 1}.${colors.reset} ${event.name}`);
      console.log(`   ID: ${colors.yellow}${event.id}${colors.reset}`);
      console.log(`   Role: ${event.role}`);
      console.log(`   Members: ${event.memberCount || 0}\n`);
    });

    // Generate test config
    const selectedEvent = events[0];

    console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Copy this configuration to test-invitations-api.js:${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.cyan}const TEST_CONFIG = {`);
    console.log(`  ownerToken: "${token.substring(0, 50)}...",`);
    console.log(`  adminToken: "YOUR_ADMIN_JWT_TOKEN_HERE",`);
    console.log(`  memberToken: "YOUR_MEMBER_JWT_TOKEN_HERE",`);
    console.log(``);
    console.log(`  eventId: "${selectedEvent.id}",`);
    console.log(``);
    console.log(`  testEmails: {`);
    console.log(`    newUser: "test-new-user@example.com",`);
    console.log(`    existingUser: "test-existing@example.com",`);
    console.log(`    duplicateTest: "test-duplicate@example.com",`);
    console.log(`  },`);
    console.log(`};${colors.reset}\n`);

    console.log(`${colors.green}✓ Configuration ready!${colors.reset}`);
    console.log(`${colors.yellow}Now run: node test-invitations-api.js${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.yellow}Error:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log("1. Ensure backend server is running on port 3001");
    console.log("2. Check that your JWT token is valid and not expired");
    console.log("3. Make sure you copied the complete token\n");
    process.exit(1);
  }
}

getConfig();
