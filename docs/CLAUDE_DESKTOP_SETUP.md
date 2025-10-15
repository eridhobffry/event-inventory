# Claude Desktop MCP Integration - Complete Setup Guide

## ✅ Current Status

Your MCP server is **FULLY FUNCTIONAL** and ready for Claude Desktop integration!

- ✅ MCP Server: Running at `http://localhost:3001/mcp`
- ✅ Protocol: JSON-RPC 2.0 compliant
- ✅ Tests: 24/24 passing (100%)
- ✅ Authentication: API key-based (`x-api-key` header)
- ✅ Event Context: Multi-event support (`x-event-id` header)

## 📋 Prerequisites

1. **Backend Running**: `http://localhost:3001` (already ✅)
2. **Frontend Running**: `http://localhost:3000` (for creating API key)
3. **Claude Desktop App**: Installed on your Mac

## 🔑 Step 1: Generate API Key

### Option A: Via Frontend UI (Recommended)

1. Open **http://localhost:3000**
2. Login as **eridho** (you mentioned you're logged in)
3. Go to **Settings** page
4. Scroll to **API Keys** section
5. Click **"New API Key"**
6. Enter name: `Claude Desktop`
7. Set expiration: `365 days` (or never expire)
8. Click **"Create Key"**
9. **COPY THE KEY IMMEDIATELY** - it won't be shown again!

### Option B: Via API (Command Line)

```bash
# 1. Login first to get JWT token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eridho@example.com",
    "password": "your_password"
  }'

# 2. Create API key (replace YOUR_JWT_TOKEN)
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Claude Desktop",
    "expiresInDays": 365
  }'

# Response will include: { "key": "your-api-key-here" }
```

## 🧪 Step 2: Test MCP Connection (Before Claude)

Let's verify the MCP endpoint works:

### Test 1: List Available Tools

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

**Expected Response**: List of 5 tools
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "list_inventory_items",
        "description": "Get a list of inventory items..."
      },
      {
        "name": "get_item_details",
        "description": "Get detailed information..."
      },
      {
        "name": "create_audit_log",
        "description": "Create an audit log entry..."
      },
      {
        "name": "get_inventory_stats",
        "description": "Get inventory and audit statistics..."
      },
      {
        "name": "search_items_by_name",
        "description": "Search for items by name..."
      }
    ]
  }
}
```

### Test 2: Get Your Event ID

```bash
# List your events to get an event ID
curl -X GET http://localhost:3001/api/v1/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Copy one of the event IDs from the response.

### Test 3: Call a Tool with Event Context

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "x-event-id: YOUR_EVENT_ID_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_inventory_stats",
      "arguments": {}
    }
  }'
```

**Expected Response**: Statistics for your event
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "eventId": "your-event-id",
    "eventName": "Your Event Name",
    "totalItems": 10,
    "totalQuantity": 150,
    "totalAudits": 5,
    "recentDiscrepancies": 2
  }
}
```

## 🎯 Step 3: Connect Claude Desktop

### Open Claude Desktop Settings

1. Launch **Claude Desktop** app
2. Click your **profile icon** (bottom left)
3. Go to **Settings** → **Developer** (or **Integrations**)

### Add Custom Connector

Click **"Add custom connector"** or **"Add Custom MCP Server"**

Fill in the form as shown in your screenshot:

| Field | Value |
|-------|-------|
| **Name** | `EventForge Inventory` |
| **Remote MCP server URL** | `http://localhost:3001/mcp` |
| **OAuth Client ID** | *(leave empty)* |
| **OAuth Client Secret** | *(leave empty)* |

### Advanced Settings (Click to expand)

Add custom header for authentication:

```json
{
  "headers": {
    "x-api-key": "YOUR_API_KEY_HERE"
  }
}
```

**IMPORTANT**: Replace `YOUR_API_KEY_HERE` with the actual API key from Step 1.

### Optional: Set Default Event Context

To avoid specifying event ID every time, you can also add:

```json
{
  "headers": {
    "x-api-key": "YOUR_API_KEY_HERE",
    "x-event-id": "YOUR_DEFAULT_EVENT_ID"
  }
}
```

This will make Claude automatically query your default event.

### Save and Connect

1. Click **"Add"** or **"Connect"**
2. Wait for connection status to show **✅ Connected**
3. If it fails, check:
   - Backend is running (`http://localhost:3001/api/v1/health`)
   - API key is correct
   - No typos in the URL

## 💬 Step 4: Test with Claude

### Test 1: List Inventory

In Claude Desktop, type:

```
List all items in my event inventory
```

Claude should respond with your inventory items!

### Test 2: Search for Items

```
Search for items with "chair" in the name
```

### Test 3: Get Statistics

```
What are my inventory statistics?
```

```
Give me an overview of my event inventory
```

### Test 4: Create an Audit

```
Create an audit log for item [ITEM_ID] with actual quantity 45 and expected quantity 50
```

(Replace `[ITEM_ID]` with an actual item ID from your inventory)

### Test 5: Natural Language Queries

The beauty of MCP is natural language! Try:

```
How many items do I have in total?
```

```
Show me all furniture items
```

```
What items are located in "Warehouse A"?
```

```
I counted 7 projectors but expected 8, can you record this?
```

## 🔧 Troubleshooting

### ❌ "Connection Failed"

**Solution**:
1. Verify backend is running:
   ```bash
   curl http://localhost:3001/api/v1/health
   ```
2. Check URL is exactly: `http://localhost:3001/mcp` (no trailing slash)
3. Restart Claude Desktop

### ❌ "Unauthorized" or "Invalid API Key"

**Solution**:
1. Generate a new API key in Settings
2. Verify the key was copied correctly (no extra spaces)
3. Check API key is active in Settings
4. Make sure header name is exactly `x-api-key` (lowercase)

### ❌ "No event context available"

**Solution**:
1. Add `x-event-id` header in Advanced Settings
2. Or explicitly mention event ID in queries: "Get stats for event [EVENT_ID]"
3. Verify you have access to the event

### ❌ Tools Not Showing Up

**Solution**:
1. Test the endpoint manually:
   ```bash
   curl -X POST http://localhost:3001/mcp \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_KEY" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```
2. Check backend logs for errors
3. Restart backend server

## 🎨 Advanced: Multiple Events

If you manage multiple events, you can:

### Option 1: Set Event Per Query

Don't set `x-event-id` in headers. Instead, ask Claude:

```
Get inventory stats for event abc-123-def
```

Claude will pass the eventId in the tool arguments.

### Option 2: Switch Event Context

Create multiple connectors in Claude Desktop:

- **EventForge - Event A** → with `x-event-id: event-a-id`
- **EventForge - Event B** → with `x-event-id: event-b-id`

Then select which connector to use for each conversation.

## 📊 What You Can Do with MCP

### Inventory Management
- ✅ List all items
- ✅ Search items by name
- ✅ Filter by category (FURNITURE, AV_EQUIPMENT, DECOR, SUPPLIES, OTHER)
- ✅ Filter by location
- ✅ Get item details with audit history

### Audit Logging
- ✅ Create audit logs via conversation
- ✅ Track discrepancies
- ✅ View audit history
- ✅ Get recent discrepancy counts

### Analytics & Insights
- ✅ Get total items and quantities
- ✅ View items by category breakdown
- ✅ Track total audits conducted
- ✅ Monitor recent discrepancies (last 30 days)

### AI-Powered Features
- ✅ Natural language queries
- ✅ Context-aware responses
- ✅ Multi-turn conversations
- ✅ Automated audit recording
- ✅ Smart search and filtering

## 🚀 Example Workflows

### Workflow 1: Pre-Event Audit

**You**: "I'm doing a pre-event audit. Let's start with all furniture items."

**Claude**: [Lists all furniture]

**You**: "I counted 48 folding chairs instead of 50"

**Claude**: [Creates audit log with discrepancy]

**You**: "What else needs auditing?"

**Claude**: [Lists items without recent audits]

### Workflow 2: Inventory Overview

**You**: "Give me a complete overview of my event inventory"

**Claude**: [Provides stats, breakdown by category, recent issues]

**You**: "What items have discrepancies?"

**Claude**: [Lists items with audit discrepancies]

### Workflow 3: Quick Search

**You**: "Do we have any projectors?"

**Claude**: [Searches and lists projector items]

**You**: "How many do we have in total?"

**Claude**: [Sums up quantities]

## 📱 Next Steps

After successful setup:

1. **Create More API Keys**: For different devices/integrations
2. **Monitor Usage**: Check "Last Used" timestamps in Settings
3. **Rotate Keys**: Generate new keys every 90 days for security
4. **Explore Tools**: Try all 5 MCP tools
5. **Build Workflows**: Create custom audit procedures with Claude

## 🔐 Security Best Practices

1. ✅ **Never Share API Keys**: Treat them like passwords
2. ✅ **Use Descriptive Names**: "Claude Desktop - MacBook Pro"
3. ✅ **Set Expiration**: 90-365 days maximum
4. ✅ **Monitor Last Used**: Detect unauthorized access
5. ✅ **Revoke Unused Keys**: Delete old/inactive keys
6. ✅ **One Key Per Device**: Don't reuse keys
7. ✅ **HTTPS in Production**: Always use TLS/SSL for deployed apps

## 📚 Additional Resources

- **MCP Guide**: `/docs/MCP_GUIDE.md`
- **MCP Test Results**: `/docs/MCP_TEST_RESULTS.md`
- **API Documentation**: `http://localhost:3001/docs`
- **Model Context Protocol**: https://modelcontextprotocol.io
- **Claude MCP Docs**: https://docs.claude.com/en/docs/mcp

## 🎉 Success!

Once connected, you can manage your entire event inventory through **natural conversation** with Claude! No need to navigate UIs or remember API endpoints.

Just talk to Claude like a team member:
- "How many chairs do we have?"
- "Create an audit for the projectors"
- "What's our inventory status?"

**Your MCP server is production-ready and waiting for Claude to connect!** 🚀
