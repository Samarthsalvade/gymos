#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          🏋️  GymOS — Full Stack Gym Management SaaS          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

pkill -f "ts-node\|nodemon\|vite" 2>/dev/null || true
sleep 1

echo "⚖️  Starting NGINX (load balancer on :8080)..."
nginx -s stop 2>/dev/null || true; sleep 0.3
nginx -c /Users/samarthgupta1812/GYM/nginx.conf
echo "✅ NGINX ready"

echo "🐢 Starting Node.js backend (:3001)..."
cd /Users/samarthgupta1812/GYM/backend
npm run dev > /tmp/gymos_backend.log 2>&1 &
BACKEND_PID=$!

echo "⚛️  Starting React frontend (:5173)..."
cd /Users/samarthgupta1812/GYM/frontend
npm run dev > /tmp/gymos_frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 4

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ALL SYSTEMS GO!                        ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  🌐 App (via NGINX)  → http://localhost:8080                 ║"
echo "║  ⚛️  Frontend direct  → http://localhost:5173                 ║"
echo "║  🔧 Node.js API      → http://localhost:3001/api             ║"
echo "║  🐘 Database         → PostgreSQL (gymos db)                 ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  📋 DEMO CREDENTIALS                                         ║"
echo "║  Gym Code  : DEMO01                                          ║"
echo "║  Admin     : admin@fitzone.com  / admin123                   ║"
echo "║  Trainer   : trainer@fitzone.com / trainer123                ║"
echo "║  Member    : arjun@example.com  / member123                  ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  🔐 SECURITY                                                  ║"
echo "║  5 login attempts → 2-min account lockout                    ║"
echo "║  DB-stored refresh tokens with rotation                      ║"
echo "║  Helmet + NGINX rate limiting + JWT auth on every route      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  🤖 AI (Groq): add gsk_... key to backend/.env               ║"
echo "║  Get free key → https://console.groq.com                     ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  🏗️  .NET 10 API: cd GymOS.Api && dotnet run                 ║"
echo "║  Swagger → http://localhost:5000/swagger                     ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  🛑 STOP: pkill -f 'ts-node|vite' && nginx -s stop           ║"
echo "╚══════════════════════════════════════════════════════════════╝"

wait
