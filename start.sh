#!/usr/bin/env bash

# AutoWRX Launcher - Main entry point to start services
# This interactive script helps you start AutoWRX in different configurations
# based on your development or testing needs.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers/common.sh"

print_header "AutoWRX Stack Launcher"

cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════╗
║                    Choose Your Development Mode                          ║
╚══════════════════════════════════════════════════════════════════════════╝

📋 RECOMMENDED OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1) 🚀 Full Stack with Extension Registry (Complete System)
     ────────────────────────────────────────────────────────
     Starts: Backend (3200) + Frontend (3210) + Registry (4400)
     Best for: Testing complete plugin/extension system
     Features: Plugin marketplace, extension installation, full features
     Use when: You need to test plugin installation from registry

  2) ⚡ Isolated Development Environment (Fastest - RECOMMENDED)
     ────────────────────────────────────────────────────────
     Starts: Backend (3200) + Frontend (3210)
     Best for: Daily development work, quick testing
     Features: In-memory DB, local auth, no external dependencies
     Use when: Developing features, testing without external services
     Login: admin@autowrx.local / AutoWRX2025!

  3) 🔧 Basic AutoWRX (Standard Stack)
     ────────────────────────────────────────────────────────
     Starts: Backend (3200) + Frontend (3210)
     Best for: Production-like testing without registry
     Features: Standard backend + frontend setup
     Use when: Testing core functionality without plugins

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 ADVANCED OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  4) 🔌 Registry Service Only
     ────────────────────────────────────────────────────────
     Starts: Registry Service (4400)
     Best for: Testing extension registry independently
     Use when: Developing or debugging registry service

  5) 🔙 Backend Only
     ────────────────────────────────────────────────────────
     Starts: Backend API (3200)
     Best for: API development, testing endpoints
     Use when: Working on backend features without UI

  6) 🎨 Frontend Only
     ────────────────────────────────────────────────────────
     Starts: Frontend (3210)
     Best for: UI/UX development
     Use when: Working on frontend with separate backend

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK TIPS:
   • First time? Choose option 2 (Isolated Environment) - fastest setup!
   • Testing plugins? Choose option 1 (Full Stack)
   • Stop services anytime with: ./stop.sh
   • View logs in: logs/ directory

EOF

read -p "👉 Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        print_header "Starting Full Stack with Extension Registry"
        echo "🚀 This will start all three services:"
        echo "   • Backend API on http://localhost:3200"
        echo "   • Frontend on http://localhost:3210"
        echo "   • Extension Registry on http://localhost:4400"
        echo ""
        echo "📋 You'll be able to:"
        echo "   • Develop and test plugins"
        echo "   • Install extensions from registry"
        echo "   • Test complete plugin marketplace"
        echo ""
        echo "🔄 Starting services..."
        echo ""
        "$SCRIPT_DIR/helpers/utils/launch-extension-stack.sh"
        ;;
    2)
        echo ""
        print_header "Starting Isolated Development Environment"
        echo "⚡ This will start:"
        echo "   • Backend API on http://localhost:3200"
        echo "   • Frontend on http://localhost:3210"
        echo "   • In-memory MongoDB (no external DB needed)"
        echo "   • Local authentication service"
        echo ""
        echo "👤 Test users available:"
        echo "   • admin@autowrx.local / AutoWRX2025!"
        echo "   • dev@autowrx.local / AutoWRX2025!"
        echo "   • user@autowrx.local / password123"
        echo ""
        echo "🔄 Starting services..."
        echo ""
        "$SCRIPT_DIR/helpers/start/start-isolated.sh"
        ;;
    3)
        echo ""
        print_header "Starting Basic AutoWRX"
        echo "🔧 This will start:"
        echo "   • Backend API on http://localhost:3200"
        echo "   • Frontend on http://localhost:3210"
        echo ""
        echo "📋 Standard configuration without extension registry"
        echo ""
        echo "🔄 Starting services..."
        echo ""
        "$SCRIPT_DIR/helpers/start/start-autowrx.sh"
        ;;
    4)
        echo ""
        print_header "Starting Registry Service Only"
        echo "🔌 This will start:"
        echo "   • Extension Registry on http://localhost:4400"
        echo ""
        echo "📋 Use this for testing the registry service independently"
        echo "💡 You'll need to start backend/frontend separately if needed"
        echo ""
        echo "🔄 Starting registry..."
        echo ""
        "$SCRIPT_DIR/helpers/start/start-registry.sh"
        ;;
    5)
        echo ""
        print_header "Starting Backend Only"
        echo "🔙 This will start:"
        echo "   • Backend API on http://localhost:3200"
        echo ""
        echo "💡 You'll need to start the frontend separately"
        echo ""
        echo "🔄 Starting backend..."
        echo ""
        cd "$SCRIPT_DIR/backend"
        npm run dev
        ;;
    6)
        echo ""
        print_header "Starting Frontend Only"
        echo "🎨 This will start:"
        echo "   • Frontend on http://localhost:3210"
        echo ""
        echo "💡 Make sure the backend is running on port 3200"
        echo ""
        echo "🔄 Starting frontend..."
        echo ""
        cd "$SCRIPT_DIR/frontend"
        npm run dev
        ;;
    *)
        echo ""
        print_error "❌ Invalid choice '$choice'. Please enter a number between 1-6."
        echo ""
        echo "💡 Tip: Run ./start.sh again to see the menu"
        exit 1
        ;;
esac
