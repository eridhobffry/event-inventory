/**
 * Quick Smoke Test - Fast API validation
 * Tests the most critical invitation flows
 * 
 * Usage: node quick-test.js YOUR_JWT_TOKEN
 */

const API_BASE = "http://localhost:3001/api/v1";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};

async function quickTest() {
  const token = process.argv[2];

  if (!token) {
    console.log(`${colors.yellow}Usage: node quick-test.js YOUR_JWT_TOKEN${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`\n${colors.bright}${colors.cyan}🚀 Quick Smoke Test${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Health Check
    process.stdout.write("1. Health check... ");
    const health = await fetch(`${API_BASE}/health`);
    if (health.ok) {
      console.log(`${colors.green}✓${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Test 2: List Events
    process.stdout.write("2. List events... ");
    const eventsRes = await fetch(`${API_BASE}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const eventsData = await eventsRes.json();
    const events = eventsData.data || [];

    if (eventsRes.ok && events.length > 0) {
      console.log(`${colors.green}✓${colors.reset} (${events.length} events)`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
      throw new Error("No events found");
    }

    const eventId = events[0].id;

    // Test 3: Create Invitation
    process.stdout.write("3. Create invitation... ");
    const inviteRes = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteeEmail: `quicktest-${Date.now()}@example.com`,
        role: "EDITOR",
        message: "Quick test invitation",
      }),
    });
    const inviteData = await inviteRes.json();

    if (inviteRes.ok && inviteData.id) {
      console.log(`${colors.green}✓${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset} (${inviteRes.status})`);
      failed++;
    }

    const invitationId = inviteData.id;

    // Test 4: List Invitations
    process.stdout.write("4. List invitations... ");
    const listRes = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();

    if (listRes.ok && Array.isArray(listData.data)) {
      console.log(`${colors.green}✓${colors.reset} (${listData.data.length} invitations)`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Test 5: Get Pending Invitations
    process.stdout.write("5. Get pending invitations... ");
    const pendingRes = await fetch(`${API_BASE}/invitations/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pendingData = await pendingRes.json();

    if (pendingRes.ok && Array.isArray(pendingData.data)) {
      console.log(`${colors.green}✓${colors.reset} (${pendingData.data.length} pending)`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Test 6: Cancel Invitation
    process.stdout.write("6. Cancel invitation... ");
    const cancelRes = await fetch(`${API_BASE}/invitations/${invitationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (cancelRes.ok) {
      console.log(`${colors.green}✓${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Test 7: List Members
    process.stdout.write("7. List members... ");
    const membersRes = await fetch(`${API_BASE}/events/${eventId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const membersData = await membersRes.json();

    if (membersRes.ok && Array.isArray(membersData.data)) {
      console.log(`${colors.green}✓${colors.reset} (${membersData.data.length} members)`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Test 8: Validation - Duplicate Invitation
    process.stdout.write("8. Prevent duplicate invitation... ");
    const dupEmail = `duplicate-${Date.now()}@example.com`;
    
    // Create first
    await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteeEmail: dupEmail,
        role: "VIEWER",
      }),
    });

    // Try duplicate
    const dupRes = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteeEmail: dupEmail,
        role: "VIEWER",
      }),
    });

    if (dupRes.status === 409) {
      console.log(`${colors.green}✓${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Test 9: Validation - Invalid Email
    process.stdout.write("9. Reject invalid email... ");
    const invalidRes = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteeEmail: "not-an-email",
        role: "EDITOR",
      }),
    });

    if (invalidRes.status === 400) {
      console.log(`${colors.green}✓${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Test 10: Permission - No Auth
    process.stdout.write("10. Reject unauthorized access... ");
    const noAuthRes = await fetch(`${API_BASE}/events/${eventId}/invitations`);

    if (noAuthRes.status === 401) {
      console.log(`${colors.green}✓${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      failed++;
    }

    // Summary
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);

    if (failed === 0) {
      console.log(`\n${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}⚠ Some tests failed${colors.reset}\n`);
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

quickTest();
