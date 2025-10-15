/**
 * Comprehensive API Testing for Invitations & Permissions
 * 360° Testing Script
 * 
 * Usage: node test-invitations-api.js
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:3001
 * - Valid JWT tokens for different users
 * - At least one event in the database
 */

const API_BASE = "http://localhost:3001/api/v1";

// Test configuration - UPDATE THESE WITH VALID VALUES
const TEST_CONFIG = {
  // Valid JWT tokens from Stack Auth (get from browser console after login)
  ownerToken: "eyJhbGciOiJFUzI1NiIsImtpZCI6IjRnQVdTVzduek5wSyJ9.eyJzdWIiOiI4MzBkMjkxNy0yMzU5LTRlYzgtODFkMi01ZDhjMmFmMGE3MWUiLCJwcm9qZWN0X2lkIjoiOGYwNDU1OWEtZjRmMC00MTk4LTliM2UtMDBlNjEzOWY4M2I4IiwiYnJhbmNoX2lkIjoibWFpbiIsInJlZnJlc2hfdG9rZW5faWQiOiI4M2UyYmJhOS03Njc4LTQ2YjAtOGNiZS01NzVmOTEyMzliZDEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsIm5hbWUiOiJFcmlkaG8gQnVmZmVyeSBSb2xsaWFuIiwiZW1haWwiOiJlcmlkaG9iZmZyeUBnb29nbGVtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJzZWxlY3RlZF90ZWFtX2lkIjpudWxsLCJpc19hbm9ueW1vdXMiOmZhbHNlLCJpc3MiOiJodHRwczovL2FwaS5zdGFjay1hdXRoLmNvbS9hcGkvdjEvcHJvamVjdHMvOGYwNDU1OWEtZjRmMC00MTk4LTliM2UtMDBlNjEzOWY4M2I4IiwiaWF0IjoxNzYwNTM0ODE5LCJhdWQiOiI4ZjA0NTU5YS1mNGYwLTQxOTgtOWIzZS0wMGU2MTM5ZjgzYjgiLCJleHAiOjE3NjA1Mzg0MTl9.yypHZAndFKs9oXMJj702S57WKpahrWMfC2GSkkgwj-HEhcL5a3S-3P_J1fkYISvWXsZC56TpyB6IYfQ0LZiqXA",
  adminToken: "YOUR_ADMIN_JWT_TOKEN_HERE", // If available
  memberToken: "YOUR_MEMBER_JWT_TOKEN_HERE", // If available
  
  // Event ID to test with (get from GET /api/v1/events)
  eventId: "0a2f62dd-85f9-45f7-8fb5-a59ec2e71a55",
  
  // Test emails for invitations
  testEmails: {
    newUser: "test-new-user@example.com",
    existingUser: "test-existing@example.com",
    duplicateTest: "test-duplicate@example.com",
  },
};

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Helper: Make HTTP request
async function request(method, path, token, body = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Helper: Log test result
function logTest(name, passed, details = "") {
  const symbol = passed ? "✓" : "✗";
  const color = passed ? colors.green : colors.red;
  const status = passed ? "PASS" : "FAIL";

  console.log(
    `${color}${symbol} ${status}${colors.reset} - ${name}${
      details ? ` ${colors.cyan}(${details})${colors.reset}` : ""
    }`
  );

  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Helper: Log section header
function logSection(title) {
  console.log(
    `\n${colors.bright}${colors.blue}━━━ ${title} ━━━${colors.reset}\n`
  );
}

// Helper: Wait
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test Suite: Health Check
async function testHealthCheck() {
  logSection("Health Check");

  const response = await request("GET", "/health", null);
  logTest(
    "API Health Check",
    response.status === 200 && response.data.status === "ok",
    `Status: ${response.data.status}`
  );
}

// Test Suite: Create Invitations
async function testCreateInvitations() {
  logSection("Create Invitations");

  // Test 1: Create invitation as OWNER
  const invitation1 = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: TEST_CONFIG.testEmails.newUser,
      role: "EDITOR",
      message: "Welcome to the team!",
    }
  );
  logTest(
    "Create invitation as OWNER",
    invitation1.status === 201 && invitation1.data.id,
    `Invitation ID: ${invitation1.data.id?.slice(0, 8)}...`
  );

  // Store invitation ID for later tests
  global.testInvitationId = invitation1.data.id;

  await wait(500);

  // Test 2: Create invitation with VIEWER role
  const invitation2 = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: TEST_CONFIG.testEmails.existingUser,
      role: "VIEWER",
    }
  );
  logTest(
    "Create invitation with VIEWER role",
    invitation2.status === 201,
    `Role: ${invitation2.data.role}`
  );

  await wait(500);

  // Test 3: Duplicate invitation (should fail)
  const duplicate = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: TEST_CONFIG.testEmails.newUser,
      role: "EDITOR",
    }
  );
  logTest(
    "Prevent duplicate pending invitation",
    duplicate.status === 409,
    `Status: ${duplicate.status}`
  );

  await wait(500);

  // Test 4: Invalid email format
  const invalidEmail = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: "not-an-email",
      role: "EDITOR",
    }
  );
  logTest(
    "Reject invalid email format",
    invalidEmail.status === 400,
    `Status: ${invalidEmail.status}`
  );

  await wait(500);

  // Test 5: Missing token (unauthorized)
  const noAuth = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    null,
    {
      inviteeEmail: "test@example.com",
      role: "EDITOR",
    }
  );
  logTest(
    "Reject invitation without authentication",
    noAuth.status === 401,
    `Status: ${noAuth.status}`
  );

  await wait(500);

  // Test 6: ADMIN trying to invite OWNER (should fail if we have admin token)
  if (TEST_CONFIG.adminToken && TEST_CONFIG.adminToken !== "YOUR_ADMIN_JWT_TOKEN_HERE") {
    const adminInviteOwner = await request(
      "POST",
      `/events/${TEST_CONFIG.eventId}/invitations`,
      TEST_CONFIG.adminToken,
      {
        inviteeEmail: "should-fail@example.com",
        role: "OWNER",
      }
    );
    logTest(
      "Prevent ADMIN from inviting OWNER",
      adminInviteOwner.status === 403,
      `Status: ${adminInviteOwner.status}`
    );
  } else {
    console.log(
      `${colors.yellow}⊘ SKIP${colors.reset} - Prevent ADMIN from inviting OWNER (no admin token)`
    );
    results.skipped++;
  }
}

// Test Suite: List Invitations
async function testListInvitations() {
  logSection("List Invitations");

  // Test 1: List all invitations for event
  const allInvitations = await request(
    "GET",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken
  );
  logTest(
    "List all event invitations",
    allInvitations.status === 200 && Array.isArray(allInvitations.data.data),
    `Count: ${allInvitations.data.data?.length || 0}`
  );

  await wait(500);

  // Test 2: Filter by status
  const pendingOnly = await request(
    "GET",
    `/events/${TEST_CONFIG.eventId}/invitations?status=PENDING`,
    TEST_CONFIG.ownerToken
  );
  logTest(
    "Filter invitations by PENDING status",
    pendingOnly.status === 200,
    `Pending: ${pendingOnly.data.data?.length || 0}`
  );

  await wait(500);

  // Test 3: Unauthorized access (no token)
  const noAuth = await request(
    "GET",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    null
  );
  logTest(
    "Reject listing without authentication",
    noAuth.status === 401,
    `Status: ${noAuth.status}`
  );
}

// Test Suite: Get Pending Invitations
async function testGetPendingInvitations() {
  logSection("Get User's Pending Invitations");

  // Test 1: Get pending invitations for current user
  const pending = await request(
    "GET",
    "/invitations/pending",
    TEST_CONFIG.ownerToken
  );
  logTest(
    "Get user's pending invitations",
    pending.status === 200 && Array.isArray(pending.data.data),
    `Count: ${pending.data.data?.length || 0}`
  );

  await wait(500);

  // Test 2: Without authentication
  const noAuth = await request("GET", "/invitations/pending", null);
  logTest(
    "Reject pending invitations without auth",
    noAuth.status === 401,
    `Status: ${noAuth.status}`
  );
}

// Test Suite: Accept/Decline Invitations
async function testAcceptDeclineInvitations() {
  logSection("Accept/Decline Invitations");

  if (!global.testInvitationId) {
    console.log(
      `${colors.yellow}⊘ SKIP${colors.reset} - No invitation ID available for testing`
    );
    results.skipped += 4;
    return;
  }

  // Test 1: Try to accept with wrong user (should fail - email mismatch)
  if (TEST_CONFIG.memberToken && TEST_CONFIG.memberToken !== "YOUR_MEMBER_JWT_TOKEN_HERE") {
    const wrongUser = await request(
      "PUT",
      `/invitations/${global.testInvitationId}/accept`,
      TEST_CONFIG.memberToken
    );
    logTest(
      "Prevent acceptance by wrong user",
      wrongUser.status === 403 || wrongUser.status === 404,
      `Status: ${wrongUser.status}`
    );
  } else {
    console.log(
      `${colors.yellow}⊘ SKIP${colors.reset} - Prevent acceptance by wrong user (no member token)`
    );
    results.skipped++;
  }

  await wait(500);

  // Test 2: Decline invitation (create new one for this test)
  const declineInvite = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: TEST_CONFIG.testEmails.duplicateTest,
      role: "VIEWER",
    }
  );

  if (declineInvite.status === 201) {
    await wait(500);

    // Note: Can't actually decline without matching email in JWT
    // This would need a real user with that email
    console.log(
      `${colors.yellow}⊘ SKIP${colors.reset} - Decline invitation (requires user with matching email)`
    );
    results.skipped++;
  }

  // Test 3: Try to accept already processed invitation
  console.log(
    `${colors.yellow}⊘ INFO${colors.reset} - Accept/decline tests require real user emails matching invitations`
  );
}

// Test Suite: Cancel Invitations
async function testCancelInvitations() {
  logSection("Cancel Invitations");

  // Create a test invitation to cancel
  const inviteToCancel = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: "cancel-test@example.com",
      role: "EDITOR",
    }
  );

  if (inviteToCancel.status === 201) {
    await wait(500);

    // Test 1: Cancel as OWNER
    const cancelled = await request(
      "DELETE",
      `/invitations/${inviteToCancel.data.id}`,
      TEST_CONFIG.ownerToken
    );
    logTest(
      "Cancel invitation as OWNER",
      cancelled.status === 200,
      `Status: ${cancelled.status}`
    );

    await wait(500);

    // Test 2: Try to cancel non-existent invitation
    const notFound = await request(
      "DELETE",
      `/invitations/00000000-0000-0000-0000-000000000000`,
      TEST_CONFIG.ownerToken
    );
    logTest(
      "Return 404 for non-existent invitation",
      notFound.status === 404,
      `Status: ${notFound.status}`
    );
  }

  await wait(500);

  // Test 3: Cancel without auth
  const noAuth = await request(
    "DELETE",
    `/invitations/${inviteToCancel.data?.id || "test"}`,
    null
  );
  logTest(
    "Reject cancellation without auth",
    noAuth.status === 401,
    `Status: ${noAuth.status}`
  );
}

// Test Suite: Member Management
async function testMemberManagement() {
  logSection("Member Management");

  // Test 1: List event members
  const members = await request(
    "GET",
    `/events/${TEST_CONFIG.eventId}/members`,
    TEST_CONFIG.ownerToken
  );
  logTest(
    "List event members",
    members.status === 200 && Array.isArray(members.data.data),
    `Count: ${members.data.data?.length || 0}`
  );

  await wait(500);

  // Test 2: Add member directly (bypass invitation)
  const newMember = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/members`,
    TEST_CONFIG.ownerToken,
    {
      userId: "test-user-id-123",
      role: "VIEWER",
    }
  );
  logTest(
    "Add member directly",
    newMember.status === 201 || newMember.status === 409,
    newMember.status === 409 ? "Already exists" : "Created"
  );

  if (newMember.status === 201) {
    await wait(500);

    // Test 3: Update member role (OWNER only)
    const roleUpdate = await request(
      "PATCH",
      `/events/${TEST_CONFIG.eventId}/members/test-user-id-123/role`,
      TEST_CONFIG.ownerToken,
      {
        role: "EDITOR",
      }
    );
    logTest(
      "Update member role as OWNER",
      roleUpdate.status === 200,
      `New role: ${roleUpdate.data?.role || "N/A"}`
    );

    await wait(500);

    // Test 4: Remove member
    const removed = await request(
      "DELETE",
      `/events/${TEST_CONFIG.eventId}/members/test-user-id-123`,
      TEST_CONFIG.ownerToken
    );
    logTest(
      "Remove member",
      removed.status === 200,
      `Status: ${removed.status}`
    );
  }
}

// Test Suite: Permission Enforcement
async function testPermissionEnforcement() {
  logSection("Permission Enforcement");

  // Test 1: Non-member trying to access event
  const invalidToken = "invalid.jwt.token";
  const noAccess = await request(
    "GET",
    `/events/${TEST_CONFIG.eventId}/members`,
    invalidToken
  );
  logTest(
    "Reject invalid authentication token",
    noAccess.status === 401,
    `Status: ${noAccess.status}`
  );

  await wait(500);

  // Test 2: Member trying OWNER-only action
  if (TEST_CONFIG.memberToken && TEST_CONFIG.memberToken !== "YOUR_MEMBER_JWT_TOKEN_HERE") {
    const memberAsOwner = await request(
      "DELETE",
      `/events/${TEST_CONFIG.eventId}`,
      TEST_CONFIG.memberToken
    );
    logTest(
      "Prevent member from deleting event",
      memberAsOwner.status === 403,
      `Status: ${memberAsOwner.status}`
    );
  } else {
    console.log(
      `${colors.yellow}⊘ SKIP${colors.reset} - Permission test (no member token)`
    );
    results.skipped++;
  }
}

// Test Suite: Edge Cases
async function testEdgeCases() {
  logSection("Edge Cases & Validation");

  // Test 1: Very long message
  const longMessage = "A".repeat(1000);
  const longMsg = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: "long-message@example.com",
      role: "VIEWER",
      message: longMessage,
    }
  );
  logTest(
    "Handle long invitation message",
    longMsg.status === 201 || longMsg.status === 400,
    `Status: ${longMsg.status}`
  );

  await wait(500);

  // Test 2: Invalid role
  const invalidRole = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: "invalid-role@example.com",
      role: "SUPER_ADMIN", // Invalid role
    }
  );
  logTest(
    "Reject invalid role",
    invalidRole.status === 400,
    `Status: ${invalidRole.status}`
  );

  await wait(500);

  // Test 3: Missing required fields
  const missingEmail = await request(
    "POST",
    `/events/${TEST_CONFIG.eventId}/invitations`,
    TEST_CONFIG.ownerToken,
    {
      role: "EDITOR",
      // Missing inviteeEmail
    }
  );
  logTest(
    "Reject missing required fields",
    missingEmail.status === 400,
    `Status: ${missingEmail.status}`
  );

  await wait(500);

  // Test 4: Invalid event ID
  const invalidEvent = await request(
    "POST",
    "/events/invalid-uuid/invitations",
    TEST_CONFIG.ownerToken,
    {
      inviteeEmail: "test@example.com",
      role: "EDITOR",
    }
  );
  logTest(
    "Reject invalid event ID",
    invalidEvent.status === 400 || invalidEvent.status === 403,
    `Status: ${invalidEvent.status}`
  );
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  INVITATION & PERMISSION API TESTS     ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  360° Comprehensive Testing            ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  // Validate configuration
  if (
    TEST_CONFIG.ownerToken === "YOUR_OWNER_JWT_TOKEN_HERE" ||
    TEST_CONFIG.eventId === "YOUR_EVENT_ID_HERE"
  ) {
    console.log(
      `${colors.red}${colors.bright}ERROR: Please update TEST_CONFIG with valid tokens and event ID${colors.reset}\n`
    );
    console.log("Steps to get configuration:");
    console.log("1. Login to your app at http://localhost:3000");
    console.log("2. Open browser console");
    console.log("3. Get JWT token from localStorage or cookie");
    console.log('4. Create an event via POST /api/v1/events\n');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // Run all test suites
    await testHealthCheck();
    await testCreateInvitations();
    await testListInvitations();
    await testGetPendingInvitations();
    await testAcceptDeclineInvitations();
    await testCancelInvitations();
    await testMemberManagement();
    await testPermissionEnforcement();
    await testEdgeCases();

    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.green}✓ Passed:  ${results.passed}${colors.reset}`);
    console.log(`${colors.red}✗ Failed:  ${results.failed}${colors.reset}`);
    console.log(`${colors.yellow}⊘ Skipped: ${results.skipped}${colors.reset}`);
    console.log(`${colors.blue}⧗ Duration: ${duration}s${colors.reset}\n`);

    const total = results.passed + results.failed;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

    if (results.failed === 0) {
      console.log(
        `${colors.green}${colors.bright}🎉 ALL TESTS PASSED! (${successRate}% success rate)${colors.reset}\n`
      );
    } else {
      console.log(
        `${colors.yellow}⚠ ${results.failed} test(s) failed (${successRate}% success rate)${colors.reset}\n`
      );

      // Show failed tests
      console.log(`${colors.red}Failed Tests:${colors.reset}`);
      results.tests
        .filter((t) => !t.passed)
        .forEach((t) => {
          console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
          if (t.details) console.log(`    ${colors.cyan}${t.details}${colors.reset}`);
        });
      console.log();
    }

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}FATAL ERROR:${colors.reset}`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();
