#!/bin/bash

echo "🧹 Cleaning up all processes..."

# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Kill any remaining node/tsx processes related to this project
pkill -f "event-inventory" 2>/dev/null

sleep 2

echo "✓ Cleanup complete"
echo ""
echo "🚀 Starting backend on port 3001..."

cd backend && npm run dev
