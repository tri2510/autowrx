#!/bin/bash
set -e

# full stack startup script

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

die() { log_error "$1"; exit 1; }

# check docker
command -v docker >/dev/null 2>&1 || die "docker not installed. install it first."

# prepare backend .env
prepare_backend_env() {
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_info "creating backend .env from .env.example"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"

        # set reasonable defaults
        sed -i "s|^PORT=.*|PORT=3200|" "$BACKEND_DIR/.env"
        sed -i "s|^MONGODB_URL=.*|MONGODB_URL=mongodb://localhost:27017/autowrx|" "$BACKEND_DIR/.env"
        sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=localhost:3210,localhost:3200,localhost:3000,127.0.0.1:3210,127.0.0.1:3200,127.0.0.1:3000|" "$BACKEND_DIR/.env"
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=dev_secret_change_me_|$RANDOM|" "$BACKEND_DIR/.env"
        sed -i "s|^ADMIN_EMAILS=.*|ADMIN_EMAILS=admin@local.dev|" "$BACKEND_DIR/.env"
        sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=changeme123|" "$BACKEND_DIR/.env"
    else
        log_info "backend .env exists, skipping"
    fi
}

# prepare frontend .env
prepare_frontend_env() {
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        log_info "creating frontend .env from .env.example"
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
        sed -i "s|http://localhost:3200|http://localhost:3200|" "$FRONTEND_DIR/.env"
    else
        log_info "frontend .env exists, skipping"
    fi
}

# install deps if needed
install_deps() {
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        log_info "installing backend dependencies..."
        (cd "$BACKEND_DIR" && npm install --os=linux --cpu=x64 sharp >/dev/null 2>&1 && npm install >/dev/null 2>&1)
    fi

    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        log_info "installing frontend dependencies..."
        (cd "$FRONTEND_DIR" && npm install --legacy-peer-deps >/dev/null 2>&1)
    fi
}

# start mongo if not running
start_mongo() {
    if docker ps --format '{{.Names}}' | grep -q '^autowrx-mongo$'; then
        log_info "mongodb already running"
        return
    fi

    if docker ps -a --format '{{.Names}}' | grep -q '^autowrx-mongo$'; then
        log_info "starting existing mongodb container..."
        docker start autowrx-mongo
    else
        log_info "starting mongodb container..."
        docker run -d --name autowrx-mongo -p 27017:27017 mongo:latest
    fi

    # wait for mongo
    log_info "waiting for mongodb to be ready..."
    for i in {1..30}; do
        if docker exec autowrx-mongo mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            log_info "mongodb is ready"
            return
        fi
        sleep 1
    done
    die "mongodb failed to start"
}

# kill existing processes on ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        log_info "killing process on port $port (pid: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
}

# main
main() {
    log_info "=== autowrx full stack startup ==="

    prepare_backend_env
    prepare_frontend_env
    install_deps
    start_mongo

    kill_port 3200
    kill_port 3210

    # build logs directory
    mkdir -p "$PROJECT_ROOT/logs"

    log_info "starting backend on port 3200..."
    cd "$BACKEND_DIR" && nohup npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!

    log_info "starting frontend on port 3210..."
    cd "$FRONTEND_DIR" && nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    sleep 3

    if kill -0 $BACKEND_PID 2>/dev/null; then
        log_info "backend started (logs: logs/backend.log)"
    else
        log_error "backend failed to start. check logs/backend.log"
        exit 1
    fi

    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_info "frontend started (logs: logs/frontend.log)"
    else
        log_error "frontend failed to start. check logs/frontend.log"
        exit 1
    fi

    echo ""
    log_info "=== all services running ==="
    echo "  frontend:  http://localhost:3210"
    echo "  backend:   http://localhost:3200"
    echo "  mongodb:   mongodb://localhost:27017"
    echo ""
    log_info "logs in: logs/"
    echo ""
    log_info "to stop: pkill -f 'npm run dev' && docker stop autowrx-mongo"
}

main "$@"
