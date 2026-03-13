#!/bin/bash
echo "🚀 Starting MIRU E-commerce Store..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend API  → http://localhost:3001"
echo "  Frontend     → http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start backend
cd "$(dirname "$0")/backend"
node server.js &
BACKEND_PID=$!

# Start frontend (simple static server)
cd "$(dirname "$0")/frontend"
npx --yes serve -l 3000 . &
FRONTEND_PID=$!

echo "✅ Both servers running!"
echo "   Press Ctrl+C to stop"
echo ""

wait
