#!/bin/bash

# Script to start multiple server instances for testing Redis Pub/Sub
# Each server runs on a different port but shares the same Redis instance

echo "🚀 Starting Multi-Server Setup for Redis Pub/Sub Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Redis is running
if ! docker ps | grep -q collab-editor-redis; then
    echo "❌ Redis is not running!"
    echo "   Please start Redis with: docker-compose up -d"
    exit 1
fi

echo "✅ Redis is running"
echo ""

# Kill any existing servers
echo "🧹 Cleaning up existing server processes..."
pkill -f "PORT=500" || true
sleep 2

# Start Server 1 on port 5001
echo "🟢 Starting Server 1 on port 5001..."
PORT=5001 npm run dev > /tmp/server-5001.log 2>&1 &
SERVER1_PID=$!
echo "   Server 1 PID: $SERVER1_PID"

# Start Server 2 on port 5002
echo "🟢 Starting Server 2 on port 5002..."
PORT=5002 npm run dev > /tmp/server-5002.log 2>&1 &
SERVER2_PID=$!
echo "   Server 2 PID: $SERVER2_PID"

echo ""
echo "⏳ Waiting for servers to start..."
sleep 6

# Check if servers are responding
echo ""
echo "🔍 Checking server health..."

if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "   ✅ Server 1 (port 5001) is healthy"
else
    echo "   ❌ Server 1 (port 5001) is not responding"
    echo "      Check logs: tail -f /tmp/server-5001.log"
fi

if curl -s http://localhost:5002/health > /dev/null 2>&1; then
    echo "   ✅ Server 2 (port 5002) is healthy"
else
    echo "   ❌ Server 2 (port 5002) is not responding"
    echo "      Check logs: tail -f /tmp/server-5002.log"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Server Status:"
echo "   Server 1: http://localhost:5001 (PID: $SERVER1_PID)"
echo "   Server 2: http://localhost:5002 (PID: $SERVER2_PID)"
echo ""
echo "📝 Logs:"
echo "   Server 1: tail -f /tmp/server-5001.log"
echo "   Server 2: tail -f /tmp/server-5002.log"
echo ""
echo "🧪 Run test:"
echo "   node test-multi-server.js"
echo ""
echo "🛑 Stop servers:"
echo "   kill $SERVER1_PID $SERVER2_PID"
echo ""
echo "Press Ctrl+C to stop all servers and exit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $SERVER1_PID $SERVER2_PID 2>/dev/null; echo '✅ Servers stopped'; exit 0" INT

# Keep script running
wait
