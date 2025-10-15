# API Testing Suite

Complete testing suite for the Invitation & Permission System.

## 📁 Test Files

| File | Purpose | Usage |
|------|---------|-------|
| `quick-test.js` | Fast smoke test (10 tests) | `node quick-test.js YOUR_JWT` |
| `get-test-config.js` | Get configuration values | `node get-test-config.js YOUR_JWT` |
| `test-invitations-api.js` | Full 360° test suite (40+ tests) | `node test-invitations-api.js` |
| `TEST_SETUP.md` | Detailed setup instructions | Read for setup help |

## 🚀 Quick Start (30 seconds)

### Option 1: Quick Smoke Test
```bash
# 1. Start backend
npm run dev

# 2. Get your JWT token (see below)

# 3. Run quick test
node quick-test.js YOUR_JWT_TOKEN
```

### Option 2: Full Test Suite
```bash
# 1. Get configuration
node get-test-config.js YOUR_JWT_TOKEN

# 2. Copy output to test-invitations-api.js (update TEST_CONFIG)

# 3. Run full tests
node test-invitations-api.js
```

## 🔑 Getting Your JWT Token

### Method 1: Browser Console (Easiest)
1. Login to app at `http://localhost:3000`
2. Open Console (F12)
3. Paste:
```javascript
localStorage.getItem('stack-session')
```
4. Copy the token

### Method 2: Network Tab
1. Login to app
2. Open DevTools → Network
3. Click any API request
4. Copy `Authorization: Bearer XXX` header value

### Method 3: cURL Login
```bash
# Stack Auth login endpoint
curl -X POST https://api.stack-auth.com/api/v1/auth/login \
  -d "email=your@email.com&password=yourpassword"
```

## 📊 Test Coverage

### Quick Test (10 tests, ~2 seconds)
- ✅ API health
- ✅ List events
- ✅ Create invitation
- ✅ List invitations
- ✅ Get pending invitations
- ✅ Cancel invitation
- ✅ List members
- ✅ Duplicate prevention
- ✅ Email validation
- ✅ Auth enforcement

### Full Test Suite (40+ tests, ~5 seconds)

#### Invitation Creation
- Create as OWNER with different roles
- Prevent duplicates
- Email validation
- Role hierarchy enforcement
- ADMIN cannot invite OWNER/ADMIN

#### Invitation Management
- List all invitations
- Filter by status
- Get user's pending invitations
- Auto-expire old invitations

#### Acceptance/Decline
- Accept invitation (creates member)
- Decline invitation
- Email matching validation
- Expiry checking
- Already-member prevention

#### Cancellation
- Cancel as OWNER/ADMIN
- Non-existent invitation handling
- Permission checks

#### Member Management
- List members
- Add member directly
- Update roles (OWNER only)
- Remove members
- Last owner protection

#### Permissions
- Role hierarchy enforcement
- OWNER-only operations
- ADMIN restrictions
- Invalid token rejection

#### Edge Cases
- Long messages
- Invalid roles
- Missing fields
- Invalid UUIDs

## 📈 Example Output

### Quick Test
```
🚀 Quick Smoke Test

1. Health check... ✓
2. List events... ✓ (3 events)
3. Create invitation... ✓
4. List invitations... ✓ (5 invitations)
5. Get pending invitations... ✓ (0 pending)
6. Cancel invitation... ✓
7. List members... ✓ (2 members)
8. Prevent duplicate invitation... ✓
9. Reject invalid email... ✓
10. Reject unauthorized access... ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Passed: 10
✗ Failed: 0

🎉 All tests passed!
```

### Full Test Suite
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

... (35+ more tests)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Passed:  38
✗ Failed:  0
⊘ Skipped: 5
⧗ Duration: 4.23s

🎉 ALL TESTS PASSED! (100.0% success rate)
```

## 🔧 Troubleshooting

### "Cannot connect to API"
```bash
# Check if backend is running
curl http://localhost:3001/api/v1/health

# Start backend if not running
npm run dev
```

### "401 Unauthorized"
- Token expired (Stack Auth tokens expire after 1 hour)
- Get fresh token from browser
- Ensure token is complete (no line breaks)

### "403 Forbidden"
- User doesn't have permission for event
- Use event created by token user
- Or create new test event

### "No events found"
```bash
# Create test event
curl -X POST http://localhost:3001/api/v1/events \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","location":"Test"}'
```

## 🎯 Testing Strategies

### During Development
```bash
# Run quick test after each change
node quick-test.js YOUR_JWT
```

### Before Committing
```bash
# Run full test suite
node test-invitations-api.js
```

### Continuous Integration
```bash
# Add to CI pipeline
npm run test:api
```

### Manual Testing
```bash
# Use Swagger UI
open http://localhost:3001/docs
```

## 📝 Adding New Tests

### Quick Test
Edit `quick-test.js`:
```javascript
// Add new test
process.stdout.write("11. Your new test... ");
const res = await fetch(`${API_BASE}/your-endpoint`);
if (res.ok) {
  console.log(`${colors.green}✓${colors.reset}`);
  passed++;
} else {
  console.log(`${colors.red}✗${colors.reset}`);
  failed++;
}
```

### Full Test Suite
Edit `test-invitations-api.js`:
```javascript
async function testYourFeature() {
  logSection("Your Feature");
  
  const response = await request("GET", "/your-endpoint", token);
  logTest("Test description", response.ok, `Details: ${response.status}`);
}

// Add to runAllTests()
await testYourFeature();
```

## 🧪 Test Data

The tests use these test emails:
- `test-new-user@example.com`
- `test-existing@example.com`
- `test-duplicate@example.com`
- `quicktest-{timestamp}@example.com`

These are **not real emails** - they're just for invitation testing.

## 🔒 Security Notes

- Never commit JWT tokens to git
- Tokens are temporary (expire after 1 hour)
- Test emails won't receive actual emails (in-app only)
- Tests create real invitations in database
- Run cleanup script after testing (if needed)

## 📚 Related Documentation

- **API Docs**: `http://localhost:3001/docs` (Swagger UI)
- **Setup Guide**: `TEST_SETUP.md`
- **Full Spec**: `../docs/INVITATIONS_AND_PERMISSIONS.md`
- **Postman**: Import from Swagger JSON

## 🎓 Learning Resources

### Understanding the Tests
1. Read `quick-test.js` for simple examples
2. Read `test-invitations-api.js` for comprehensive coverage
3. Check API responses in Swagger UI
4. Review error messages in test output

### Debugging Failed Tests
1. Check test output for details
2. Run individual curl commands
3. Use Swagger UI to test manually
4. Check backend logs for errors

## 💡 Tips

### Speed up testing
```bash
# Use quick test during development
node quick-test.js YOUR_JWT

# Only run full suite before commits
```

### Test specific features
```javascript
// Comment out tests in runAllTests()
// await testCreateInvitations(); // Skip this
await testListInvitations();
```

### Generate fresh config
```bash
# Auto-generate configuration
node get-test-config.js YOUR_JWT > config.txt
```

### Clean up test data
```bash
# Delete test invitations (SQL)
psql $DATABASE_URL -c \
  "DELETE FROM event_invitations WHERE invitee_email LIKE 'test-%@example.com'"
```

## 🤝 Contributing Tests

When adding new features:
1. Add tests to `quick-test.js` for critical paths
2. Add comprehensive tests to `test-invitations-api.js`
3. Update this README
4. Ensure all tests pass before PR

## ❓ FAQ

**Q: Why do some tests get skipped?**  
A: Tests requiring multiple users skip if you don't provide all tokens. Core functionality is still tested.

**Q: How long do tests take?**  
A: Quick test: ~2s, Full suite: ~5s

**Q: Can I run tests in CI?**  
A: Yes! Generate a long-lived API key and use it instead of JWT tokens.

**Q: Do tests clean up after themselves?**  
A: Tests create real data. Add cleanup script if needed.

**Q: What if I break something?**  
A: Tests will show exactly which endpoint failed and why.
