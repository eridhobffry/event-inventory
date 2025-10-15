# 🚀 Quick MCP Test for Claude Desktop

## ✅ Your MCP Server is READY!

Your backend is running and the MCP server is fully functional. Now you just need to:

1. **Create an API Key** (1 minute)
2. **Connect Claude Desktop** (2 minutes)
3. **Start Chatting!** (natural language)

---

## Step 1: Create API Key (in Frontend)

1. Open: **http://localhost:3000**
2. Login as: **eridho**
3. Click: **Settings** (in sidebar)
4. Scroll to: **API Keys** section
5. Click: **"New API Key"**
6. Fill in:
   - Name: `Claude Desktop`
   - Expires: `365 days` (or your preference)
7. Click: **"Create Key"**
8. **📋 COPY THE KEY NOW!** (you can't see it again)

## Step 2: Connect Claude Desktop

1. Open **Claude Desktop** app
2. Click your **profile** (bottom left corner)
3. Go to: **Settings** → **Developer** (or **Integrations**)
4. Click: **"Add custom connector"**

### Fill in the form:

```
Name: EventForge Inventory
Remote MCP server URL: http://localhost:3001/mcp
```

### Click "Advanced settings" and add:

```json
{
  "headers": {
    "x-api-key": "paste-your-api-key-here"
  }
}
```

**Replace** `paste-your-api-key-here` with the actual key from Step 1.

### Click "Add" or "Connect"

✅ You should see "Connected" status!

---

## Step 3: Test in Claude Desktop

Try these natural language queries:

### Query 1: Get Overview
```
What's in my event inventory?
```

### Query 2: Get Statistics
```
Give me my inventory statistics
```

### Query 3: Search Items
```
Search for items with "table" in the name
```

### Query 4: List Items
```
List all furniture items
```

### Query 5: Create Audit
```
I counted 45 chairs but expected 50, please record this audit
```

---

## 🎯 What You Can Ask Claude

### Natural Language Examples:

- "How many items do I have?"
- "Show me all AV equipment"
- "What items are in Warehouse A?"
- "List items that need auditing"
- "Create an audit for [item name]"
- "What's my total inventory value?"
- "Show items by category"
- "Search for projectors"

### The AI Will Automatically:

1. **Call MCP Tools** to get data
2. **Filter Results** based on your request
3. **Format Responses** in natural language
4. **Track Context** across multiple questions
5. **Execute Actions** like creating audits

---

## 🔧 Test Script (Optional)

You can test the MCP connection before using Claude:

```bash
# 1. Export your API key
export API_KEY='your-api-key-here'

# 2. Run the test script
./test-mcp-connection.sh
```

This will verify:
- ✅ Backend is running
- ✅ MCP endpoint is accessible
- ✅ API key is valid
- ✅ Tools are listed correctly
- ✅ Resources are available

---

## 📋 Available MCP Tools

Claude can use these 5 tools:

1. **list_inventory_items** - Get items with filters (category, location, search)
2. **get_item_details** - Get full item info + audit history
3. **create_audit_log** - Record physical counts vs expected
4. **get_inventory_stats** - Get totals, categories, discrepancies
5. **search_items_by_name** - Fuzzy search by item name

---

## 🎨 Multi-Event Support (Optional)

If you have multiple events:

### Option A: Set Default Event
Add to Claude Desktop headers:
```json
{
  "headers": {
    "x-api-key": "your-api-key",
    "x-event-id": "your-default-event-id"
  }
}
```

### Option B: Specify Per Query
Ask Claude:
```
Get inventory stats for event abc-123-def
```

### Option C: Multiple Connectors
Create separate connectors for each event:
- EventForge - Wedding 2024
- EventForge - Conference 2024
- EventForge - Festival 2024

---

## 🐛 Troubleshooting

### "Connection Failed"
```bash
# Check backend is running
curl http://localhost:3001/api/v1/health

# Should return: {"status":"ok",...}
```

### "Unauthorized"
- Verify API key was copied correctly
- Check it's active in Settings
- Regenerate if needed

### "No event context"
- Add `x-event-id` header in Advanced Settings
- Or mention event ID in your queries

---

## 📚 Full Documentation

- **Complete Guide**: `docs/CLAUDE_DESKTOP_SETUP.md`
- **MCP Architecture**: `docs/MCP_GUIDE.md`
- **Test Results**: `docs/MCP_TEST_RESULTS.md`
- **API Docs**: http://localhost:3001/docs

---

## ✨ That's It!

Your system is **100% ready** for Claude Desktop integration.

The MCP server has been tested and verified:
- ✅ 24/24 tests passing
- ✅ JSON-RPC 2.0 compliant
- ✅ API key authentication working
- ✅ Event context support
- ✅ All tools functional

**Just create an API key and connect Claude Desktop!** 🎉
