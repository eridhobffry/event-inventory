#!/bin/bash

# MCP Connection Test Script
# This script tests the MCP server endpoints before connecting Claude Desktop

set -e

echo "🧪 Testing MCP Connection"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
MCP_ENDPOINT="${BACKEND_URL}/mcp"

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test 1: Backend Health Check
echo "1️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s -X GET "${BACKEND_URL}/api/v1/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    success "Backend is running and healthy"
    echo "   Response: $HEALTH_RESPONSE"
else
    error "Backend health check failed"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi
echo ""

# Test 2: Check if API key is provided
echo "2️⃣  Checking API Key..."
if [ -z "$API_KEY" ]; then
    warning "API_KEY environment variable not set"
    echo ""
    echo "📝 To test with an API key, run:"
    echo "   export API_KEY='your-api-key-here'"
    echo "   ./test-mcp-connection.sh"
    echo ""
    echo "📋 To create an API key:"
    echo "   1. Open http://localhost:3000"
    echo "   2. Login as eridho"
    echo "   3. Go to Settings"
    echo "   4. Create a new API key"
    echo ""
    exit 0
else
    success "API_KEY is set"
fi
echo ""

# Test 3: MCP tools/list endpoint
echo "3️⃣  Testing MCP tools/list..."
TOOLS_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list"
    }')

if echo "$TOOLS_RESPONSE" | grep -q '"tools"'; then
    success "tools/list endpoint working"
    TOOL_COUNT=$(echo "$TOOLS_RESPONSE" | grep -o '"name"' | wc -l)
    echo "   Found $TOOL_COUNT tools"
    
    # Extract tool names
    echo "$TOOLS_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read -r tool; do
        echo "     • $tool"
    done
else
    error "tools/list endpoint failed"
    echo "   Response: $TOOLS_RESPONSE"
    exit 1
fi
echo ""

# Test 4: MCP resources/list endpoint
echo "4️⃣  Testing MCP resources/list..."
RESOURCES_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
        "jsonrpc": "2.0",
        "id": 2,
        "method": "resources/list"
    }')

if echo "$RESOURCES_RESPONSE" | grep -q '"resources"'; then
    success "resources/list endpoint working"
    RESOURCE_COUNT=$(echo "$RESOURCES_RESPONSE" | grep -o '"uri"' | wc -l)
    echo "   Found $RESOURCE_COUNT resources"
    
    # Extract resource names
    echo "$RESOURCES_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read -r resource; do
        echo "     • $resource"
    done
else
    error "resources/list endpoint failed"
    echo "   Response: $RESOURCES_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Check if event ID is provided
echo "5️⃣  Testing with Event Context..."
if [ -z "$EVENT_ID" ]; then
    warning "EVENT_ID not set, skipping tool execution test"
    echo ""
    echo "📝 To test with an event context:"
    echo "   export EVENT_ID='your-event-id-here'"
    echo "   export API_KEY='your-api-key-here'"
    echo "   ./test-mcp-connection.sh"
    echo ""
    echo "📋 To get your event ID:"
    echo "   curl -X GET ${BACKEND_URL}/api/v1/events \\"
    echo "     -H 'Authorization: Bearer YOUR_JWT_TOKEN'"
    echo ""
else
    success "EVENT_ID is set"
    
    # Test get_inventory_stats tool
    echo "   Testing get_inventory_stats tool..."
    STATS_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -H "x-event-id: $EVENT_ID" \
        -d '{
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "get_inventory_stats",
                "arguments": {}
            }
        }')
    
    if echo "$STATS_RESPONSE" | grep -q '"totalItems"'; then
        success "get_inventory_stats tool working"
        echo "   Stats Preview:"
        echo "$STATS_RESPONSE" | grep -o '"totalItems":[^,]*' | head -1
        echo "$STATS_RESPONSE" | grep -o '"totalQuantity":[^,]*' | head -1
        echo "$STATS_RESPONSE" | grep -o '"totalAudits":[^,]*' | head -1
    else
        error "get_inventory_stats tool failed"
        echo "   Response: $STATS_RESPONSE"
        exit 1
    fi
fi
echo ""

# Final summary
echo "=========================="
echo "🎉 MCP Server Test Complete!"
echo ""
success "Your MCP server is ready for Claude Desktop!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open Claude Desktop"
echo "   2. Go to Settings → Developer"
echo "   3. Add custom connector:"
echo "      • Name: EventForge Inventory"
echo "      • URL: $MCP_ENDPOINT"
echo "      • Headers: {\"x-api-key\": \"$API_KEY\"}"
if [ -n "$EVENT_ID" ]; then
    echo "      • Optional: {\"x-event-id\": \"$EVENT_ID\"}"
fi
echo ""
echo "📚 Full setup guide: docs/CLAUDE_DESKTOP_SETUP.md"
echo ""
