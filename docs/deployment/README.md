# AutoWRX v3 Docker Stack Deployment

Unified Docker stack deployment for AutoWRX v3 monorepo architecture.

---

## Quick Start

```bash
# 1. Configure environment
cp .env.stack.example .env.stack
nano .env.stack  # Edit configuration

# 2. Deploy all services
docker compose -f docker-compose.stack.yml --env-file .env.stack up -d

# 3. Access services
# Frontend: http://localhost:8090
# Kong API: http://localhost:9800
```

---

## Before vs After

### Architecture Comparison

| Aspect | v2 (Before) | v3 (After) |
|--------|-------------|------------|
| **Repositories** | 2 separate repos | 1 monorepo |
| **Services in compose** | 1 (frontend only) | 8 (complete stack) |
| **Backend build** | Pre-built image | Builds from ./backend/ |
| **Frontend build** | Pre-built image | CI/CD builds dist/ → Docker |
| **Frontend deploy time** | ~5-10 min (full build) | ~30 seconds (copy dist) |
| **Configuration** | Multiple .env files | Single .env.stack |
| **Deployment** | Multiple manual steps | One command |
| **Orchestration** | None | Automatic (depends_on) |
| **Local testing** | ✗ Cannot replicate | ✓ Exact production |

### Visual Comparison

**v2 - Scattered Services:**
```
Frontend Repo     Backend Repo      Other Services
(separate)        (separate)        (unknown location)
    ↓                 ↓                    ↓
Frontend:8090     Backend:8080      Kong:9800 + 5 others
                                    (manual deployment)

Problems: 2 repos, unclear locations, no orchestration
```

**v3 - Unified Stack:**
```
Single Monorepo (autowrx-fork)
    ↓
docker-compose.stack.yml
    ↓
┌─────────────────────────────────────────┐
│ Kong:9800 (API Gateway)                 │
├─────────────────────────────────────────┤
│ Frontend:8090  Backend:8080  Upload:9810│
│ Homologation   Inventory-BE             │
│ MongoDB x2     (all 8 services)         │
└─────────────────────────────────────────┘

Benefits: 1 repo, 1 command, automatic orchestration
```

---

## Port Configuration

| Service | v2 Port | v3 Port | Public Access |
|---------|---------|---------|---------------|
| Frontend | 8090 | 8090 | ✓ Yes |
| Kong API Gateway | 9800 | 9800 | ✓ Yes |
| Backend | 8080 | 8080 | ✗ Internal only |
| Upload | 9810 | 9810 | ✗ Internal only |
| MongoDB (main) | 27017 | 27017 | ✗ Internal only |
| MongoDB (inventory) | 27017 | 27017 | ✗ Internal only |

**For Parallel Testing:** Deploy v3 on ports 8091/9801 to avoid conflict with v2 (8090/9800).

---

## v3 Services Stack

1. **Kong Gateway** - API reverse proxy (Port 9800)
2. **Frontend** - React/Vite + Nginx (Port 8090)
3. **Backend** - Node.js/Express API (Port 8080)
4. **Upload Service** - File upload handling (Port 9810)
5. **Homologation Service** - Vehicle workflows
6. **Inventory Backend** - Inventory management
7. **MongoDB (main)** - Application database
8. **MongoDB (inventory)** - Inventory database

---

## Optimized Build Strategy

**Frontend (Fast Deployment)**:
- ✅ CI/CD pipeline: `yarn build` → generates `dist/` folder
- ✅ Docker: Copies `dist/` into lightweight Nginx image
- ✅ Result: **30 seconds deployment** (vs 5-10 minutes)

**Backend (Builds from Source)**:
- Builds from `./backend/` directory during Docker image creation
- Standard Node.js build process (~2-3 minutes)

---

## Zero-Downtime Migration

Deploy v3 alongside existing v2 for safe testing:

```bash
# v2 continues running on ports 8090, 9800
# v3 runs on different ports 8091, 9801

# 1. Edit .env.stack
FRONTEND_PORT=8091      # v2 uses 8090
KONG_PROXY_PORT=9801    # v2 uses 9800
ENV=staging-new

# 2. Deploy v3 (no conflict)
docker compose --env-file .env.stack -f docker-compose.stack.yml up -d

# 3. Test both versions side-by-side
# v2: http://server:8090
# v3: http://server:8091

# 4. When ready, stop v2 and move v3 to production ports
```

---

## CI/CD Workflows (Modern Approach)

AutoWRX v3 uses container registry-based deployment with server-side polling.

**Build & Push** (`.github/workflows/build-and-push.yml`):
- Trigger: Push to main/v3-base, PRs, tags
- Process: Build images → Push to GitHub Container Registry (ghcr.io)
- Features: Docker layer caching, parallel builds, semantic versioning

**Staging Notification** (`.github/workflows/deploy-staging.yml`):
- Trigger: After successful build on main
- Process: Notifies that images are ready
- Deployment: Server polls registry every 5 minutes and auto-deploys

**Production Release** (`.github/workflows/deploy-production.yml`):
- Trigger: Manual dispatch (requires version + "deploy" confirmation)
- Process: Tags release for production deployment
- Deployment: Update .env.stack on server, auto-deploys on next poll

**Key Benefits:**
- ✅ Enterprise network friendly - Only outbound HTTPS connections
- ✅ Zero GitHub secrets - No credentials in public repository
- ✅ Firewall compatible - No inbound webhook ports required
- ✅ Immutable images - Build once, deploy many times
- ✅ Easy rollback - Change version tag in .env.stack
- ✅ Full audit trail - Server logs and GitHub deployment records

See [SERVER-POLLING.md](./SERVER-POLLING.md) for detailed setup and configuration.

---

## Key Improvements in v3

✅ **Single repository** - All code in one place
✅ **Unified deployment** - One command for all services
✅ **Faster frontend** - 30s deployment vs 5-10 min
✅ **Automatic orchestration** - Services start in correct order
✅ **Parallel testing** - Run v2 and v3 simultaneously
✅ **Production-ready** - Local env matches production exactly
✅ **Clear configuration** - Single .env.stack file
✅ **Zero-downtime migration** - Safe transition path

---

## Additional Documentation

- **[SERVER-POLLING.md](./SERVER-POLLING.md)** - Server polling deployment setup and configuration guide
