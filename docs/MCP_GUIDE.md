# MCP Integration Guide

## What is Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that enables AI assistants like Claude to connect to external data sources and tools. EventForge Inventory implements a full MCP server, allowing AI assistants to:

- Query your inventory in natural language
- Create and manage audit logs
- Retrieve statistics and analytics
- Search for specific items

## Why Use MCP with EventForge?

- **Natural Language Interface**: Ask questions like "How many folding chairs do we have?" instead of writing API calls
- **AI-Powered Insights**: Let Claude analyze your inventory trends and suggest optimizations
- **Hands-Free Management**: Create audits and manage items through conversation
- **Context Retention**: MCP tracks conversation context for multi-turn interactions

## Quick Start

### Step 1: Generate an API Key

1. Log into EventForge Inventory at `http://localhost:3000` (or your deployed URL)
2. Navigate to **Settings**
3. Click **"New API Key"** in the API Keys section
4. Enter a name (e.g., "Claude Desktop")
5. Click **"Create Key"**
6. **Copy the key immediately** - it won't be shown again!

### Step 2: Connect Claude Desktop

1. Open Claude Desktop app
2. Click on your profile → Settings
3. Go to **"Developers"** or **"Integrations"**
4. Click **"Add Custom Connector"**
5. Fill in the details:
   - **Name**: `EventForge Inventory`
   - **Remote MCP server URL**: `http://localhost:3001/mcp` (or your backend URL)
   - **Authentication Type**: Custom Header
   - **Header Name**: `x-api-key`
   - **Header Value**: [Paste your API key]
6. Click **"Add"** or **"Connect"**

### Step 3: Test the Connection

Try asking Claude:

```
"List all items in my event inventory"
```

or

```
"What furniture do I have in stock?"
```

Claude should now be able to access your inventory!

## Available MCP Tools

EventForge provides 5 MCP tools that Claude can use:

### 1. list_inventory_items

**Description**: Get a list of inventory items with optional filters

**Parameters**:

- `category` (optional): Filter by category (FURNITURE, AV_EQUIPMENT, DECOR, SUPPLIES, OTHER)
- `location` (optional): Filter by location (partial match)
- `search` (optional): Search in item names
- `limit` (optional): Maximum results (default: 20, max: 100)

**Example Query**: "Show me all AV equipment in Warehouse A"

### 2. get_item_details

**Description**: Get detailed information about a specific item including audit history

**Parameters**:

- `itemId` (required): The UUID of the item

**Example Query**: "Get details for item [item-id]"

### 3. create_audit_log

**Description**: Create an audit log entry for an inventory item

**Parameters**:

- `itemId` (required): The UUID of the item being audited
- `actualQuantity` (required): The physically counted quantity
- `expectedQuantity` (required): The expected quantity from records
- `notes` (optional): Additional observations
- `contextId` (optional): MCP session ID for tracking

**Example Query**: "Create an audit for the folding chairs with actual count 45 and expected 50"

### 4. get_inventory_stats

**Description**: Get inventory and audit statistics for dashboard insights

**Parameters**: None

**Example Query**: "What are my inventory statistics?"

### 5. search_items_by_name

**Description**: Search for items by name with fuzzy matching

**Parameters**:

- `query` (required): Search term
- `limit` (optional): Maximum results (default: 10)

**Example Query**: "Search for items with 'chair' in the name"

## Example Conversations

### Inventory Query

**You**: "How many folding chairs do I have?"

**Claude**: _Uses `search_items_by_name` with query="folding chair"_

**Claude**: "You have 150 folding chairs in stock, located in Warehouse A."

### Creating an Audit

**You**: "I just counted the projectors and found 7 instead of 8"

**Claude**: _Uses `search_items_by_name` to find projectors, then `create_audit_log`_

**Claude**: "I've created an audit log showing a discrepancy of -1 for the 4K Projectors. The audit has been recorded in the system."

### Getting Statistics

**You**: "Give me an overview of my inventory"

**Claude**: _Uses `get_inventory_stats`_

**Claude**: "Here's your inventory overview:

- Total Items: 30 different items
- Total Audits: 15 conducted
- Recent Discrepancies: 3 items with issues in the last 30 days"

## Advanced: ChatGPT Integration (OpenAI Actions)

EventForge can also be integrated with ChatGPT using OpenAI Actions/GPTs.

### 1. Create a Custom GPT

1. Go to https://chat.openai.com/gpts/editor
2. Click **"Create a GPT"**
3. Name it "EventForge Assistant"
4. Add description: "Manages event inventory via EventForge API"

### 2. Configure Actions

Click **"Configure"** → **"Actions"** → **"Create new action"**

**OpenAPI Schema**:

```yaml
openapi: 3.0.0
info:
  title: EventForge Inventory MCP
  version: 1.0.0
servers:
  - url: http://localhost:3001
paths:
  /mcp:
    post:
      operationId: callMCPTool
      summary: Call an MCP tool
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                jsonrpc:
                  type: string
                  default: "2.0"
                method:
                  type: string
                  enum: [tools/call]
                id:
                  type: number
                params:
                  type: object
                  properties:
                    name:
                      type: string
                      enum:
                        - list_inventory_items
                        - get_item_details
                        - create_audit_log
                        - get_inventory_stats
                        - search_items_by_name
                    arguments:
                      type: object
      responses:
        "200":
          description: Successful response
      security:
        - ApiKeyAuth: []
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
```

### 3. Add Authentication

1. Click **"Authentication"**
2. Select **"API Key"**
3. Auth Type: **"Custom"**
4. Custom Header Name: `x-api-key`
5. Paste your API key

### 4. Test

Ask your GPT:

```
"What items do I have in my inventory?"
```

## MCP Function Schemas (for Claude)

If you need to manually configure function calling:

```json
{
  "name": "list_inventory_items",
  "description": "Get a list of inventory items with optional filters",
  "parameters": {
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "enum": ["FURNITURE", "AV_EQUIPMENT", "DECOR", "SUPPLIES", "OTHER"],
        "description": "Filter by category"
      },
      "location": {
        "type": "string",
        "description": "Filter by location (partial match)"
      },
      "search": {
        "type": "string",
        "description": "Search in item names"
      },
      "limit": {
        "type": "number",
        "description": "Maximum results (default: 20, max: 100)"
      }
    }
  }
}
```

## Testing with curl

Test the MCP endpoint directly:

### List Tools

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Call a Tool

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_inventory_items",
      "arguments": {
        "category": "FURNITURE",
        "limit": 5
      }
    }
  }'
```

### List Resources

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "resources/list"
  }'
```

## Troubleshooting

### Issue: "Connection failed" in Claude Desktop

**Solutions**:

- Verify backend is running (`http://localhost:3001/api/v1/health` should return `{"status":"ok"}`)
- Check API key is valid and active in Settings
- Ensure URL is correct (include `/mcp` at the end)
- Try restarting Claude Desktop

### Issue: "Unauthorized" errors

**Solutions**:

- Generate a new API key in Settings
- Copy the key immediately when created
- Verify the key wasn't accidentally revoked
- Check that header name is exactly `x-api-key`

### Issue: Tools not showing up

**Solutions**:

- Call `/mcp` with `{"method": "tools/list"}` to verify tools are available
- Check backend logs for errors
- Verify MCP server is properly initialized

### Issue: CORS errors

**Solutions**:

- Backend CORS is configured to allow all origins by default
- For production, set `CORS_ORIGIN` environment variable
- Ensure preflight requests are allowed

## Security Best Practices

1. **Rotate API Keys Regularly**: Create new keys and revoke old ones every 90 days
2. **Use Descriptive Names**: Name keys clearly (e.g., "Claude Desktop - Work Laptop")
3. **Never Share Keys**: Treat API keys like passwords
4. **Monitor Usage**: Check "Last Used" in Settings to detect unauthorized access
5. **Revoke Unused Keys**: Delete keys you're no longer using
6. **Use HTTPS in Production**: Always use TLS/SSL for production deployments

## Production Deployment

When deploying to production:

1. **Update MCP URL**:

   ```
   https://your-api.example.com/mcp
   ```

2. **Enable CORS** (backend `env`):

   ```
   CORS_ORIGIN=https://your-frontend.example.com
   ```

3. **Use Environment Variables**:

   - Never hardcode API keys
   - Store keys in Claude Desktop securely
   - Use secrets management in production

4. **Monitor Rate Limits**:
   - Default: 100 requests per 15 minutes
   - Adjust in `backend/src/server.ts` if needed

## Future Enhancements

Coming soon to MCP integration:

- **Vector Context Storage**: Persistent conversation memory using pgvector
- **Multi-turn Planning**: Complex workflows across multiple tools
- **Real-time Updates**: WebSocket notifications for inventory changes
- **Automated Forecasting**: AI-powered predictions for restocking
- **Smart Suggestions**: Proactive insights based on patterns

## Support

For questions or issues:

- Check the main [README.md](../README.md)
- Review API docs at `/docs`
- Join our Discord community
- Open an issue on GitHub

---

**Built with ❤️ for the event management community**
