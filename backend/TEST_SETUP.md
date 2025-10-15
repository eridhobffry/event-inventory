# API Testing Setup Guide

## Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```

Server should be running on `http://localhost:3001`

### 2. Get Your JWT Token

#### Option A: From Browser
1. Open your app at `http://localhost:3000`
2. Sign in with Stack Auth
3. Open Browser Console (F12)
4. Run this command:
```javascript
// Get token from Stack
const user = await window.stackServerApp.getUser();
console.log('JWT Token:', user.getAuthJson().accessToken);
```

#### Option B: From API Response
1. Make a login request to Stack Auth
2. Copy the JWT token from the response

### 3. Get an Event ID

#### Option A: List Existing Events
```bash
curl -X GET http://localhost:3001/api/v1/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Option B: Create a New Event
```bash
curl -X POST http://localhost:3001/api/v1/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event for API Testing",
    "description": "Created for testing invitations",
    "location": "Test Location"
  }'
```

Copy the `id` from the response.

### 4. Update Test Configuration

Edit `test-invitations-api.js` and update the `TEST_CONFIG` object:

```javascript
const TEST_CONFIG = {
  ownerToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", // Your JWT
  adminToken: "YOUR_ADMIN_JWT_TOKEN_HERE", // Optional
  memberToken: "YOUR_MEMBER_JWT_TOKEN_HERE", // Optional
  
  eventId: "4d57cc55-b822-408a-a87a-8a84e30949cc", // Your event ID
  
  testEmails: {
    newUser: "test-new-user@example.com",
    existingUser: "test-existing@example.com",
    duplicateTest: "test-duplicate@example.com",
  },
};
```

### 5. Run the Tests

```bash
cd backend
node test-invitations-api.js
```

## Test Coverage

The test suite covers:

### ✅ Invitation Creation
- Create invitation as OWNER
- Create invitation with different roles
- Prevent duplicate pending invitations
- Validate email format
- Reject unauthorized requests
- Prevent ADMIN from inviting OWNER

### ✅ Invitation Listing
- List all event invitations
- Filter by status (PENDING, ACCEPTED, etc.)
- Permission-based access control

### ✅ User Pending Invitations
- Get user's pending invitations by email
- Automatic expiry of old invitations
- Email matching from JWT

### ✅ Accept/Decline Flow
- Accept invitation (creates EventMember)
- Decline invitation
- Email validation
- Expiry checking
- Duplicate member prevention

### ✅ Invitation Cancellation
- Cancel invitation as OWNER/ADMIN
- Handle non-existent invitations
- Permission enforcement

### ✅ Member Management
- List event members
- Add member directly
- Update member role (OWNER only)
- Remove member
- Role hierarchy enforcement

### ✅ Permission Enforcement
- Invalid token rejection
- Role-based action restrictions
- OWNER-only operations
- ADMIN-only operations

### ✅ Edge Cases
- Long messages
- Invalid roles
- Missing required fields
- Invalid UUIDs
- Malformed requests

## Expected Output

```
╔════════════════════════════════════════╗
║  INVITATION & PERMISSION API TESTS     ║
║  360° Comprehensive Testing            ║
╚════════════════════════════════════════╝

━━━ Health Check ━━━

✓ PASS - API Health Check (Status: ok)

━━━ Create Invitations ━━━

✓ PASS - Create invitation as OWNER (Invitation ID: 4d57cc55...)
✓ PASS - Create invitation with VIEWER role (Role: VIEWER)
✓ PASS - Prevent duplicate pending invitation (Status: 409)
✓ PASS - Reject invalid email format (Status: 400)
✓ PASS - Reject invitation without authentication (Status: 401)
⊘ SKIP - Prevent ADMIN from inviting OWNER (no admin token)

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Passed:  25
✗ Failed:  0
⊘ Skipped: 5
⧗ Duration: 3.45s

🎉 ALL TESTS PASSED! (100.0% success rate)
```

## Troubleshooting

### Error: "Cannot connect to API"
- Ensure backend server is running on port 3001
- Check `API_BASE` in test file matches your server URL

### Error: "401 Unauthorized"
- Your JWT token may have expired (Stack Auth tokens expire after 1 hour)
- Get a fresh token from the browser console
- Ensure token is copied completely without line breaks

### Error: "403 Forbidden"
- Token is valid but user doesn't have permission for the event
- Ensure the event was created by the user whose token you're using
- Or ensure the user is a member of the event

### Error: "404 Event not found"
- The event ID doesn't exist
- Use `GET /api/v1/events` to list available events
- Or create a new event for testing

### Some tests are skipped
- This is normal if you don't have multiple user tokens
- The test suite adapts to available configuration
- Core functionality is still tested

## Advanced: Testing with Multiple Users

For complete testing, you can:

1. **Create multiple Stack Auth accounts**
   - Sign up with different emails
   - Get JWT tokens for each

2. **Assign different roles**
   ```bash
   # Make user2 an ADMIN
   curl -X POST http://localhost:3001/api/v1/events/{eventId}/members \
     -H "Authorization: Bearer OWNER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId": "user2-id", "role": "ADMIN"}'
   ```

3. **Update test config with all tokens**
   ```javascript
   ownerToken: "token-for-owner",
   adminToken: "token-for-admin",
   memberToken: "token-for-member",
   ```

4. **Run full test suite**
   ```bash
   node test-invitations-api.js
   ```

## Manual Testing with cURL

### Create Invitation
```bash
curl -X POST http://localhost:3001/api/v1/events/{eventId}/invitations \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "inviteeEmail": "user@example.com",
    "role": "EDITOR",
    "message": "Welcome!"
  }'
```

### Get Pending Invitations
```bash
curl -X GET http://localhost:3001/api/v1/invitations/pending \
  -H "Authorization: Bearer YOUR_JWT"
```

### Accept Invitation
```bash
curl -X PUT http://localhost:3001/api/v1/invitations/{invitationId}/accept \
  -H "Authorization: Bearer YOUR_JWT"
```

### List Event Members
```bash
curl -X GET http://localhost:3001/api/v1/events/{eventId}/members \
  -H "Authorization: Bearer YOUR_JWT"
```

## API Documentation

View the full Swagger/OpenAPI documentation at:
```
http://localhost:3001/docs
```

This provides an interactive interface to test all endpoints.
