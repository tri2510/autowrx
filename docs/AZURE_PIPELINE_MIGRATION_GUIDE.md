# Old Azure Pipeline vs New Structure - Migration Explanation

## Understanding the Old Azure DevOps Pipeline Structure

### **The 3-Pipeline System (Currently Running)**

#### **Pipeline #24: dev-autowrx-docker** (Frontend Build)
**Purpose**: Builds the frontend Docker images
- **Repository**: `eclipse-autowrx/autowrx` (this repo)
- **Trigger**: Automatic on push to `main` branch
- **What it builds**:
  - Staging image: `boschvn/playground-fe:$(short_hash)-staging`
  - Production image: `boschvn/playground-fe:$(short_hash)` + `latest` tag
- **Build method**: Runs `npm run build` → creates static files → packages into nginx container
- **Environment variables**: Injected at build time (VITE_SERVER_BASE_URL, etc.)

#### **Pipeline #25: dev-backend-core-docker** (Backend Build)
**Purpose**: Builds the backend Docker images
- **Repository**: `eclipse-autowrx/backend-core` (separate repo)
- **Trigger**: Automatic on push to `main` branch
- **What it builds**: `boschvn/playground-be:$(short_hash)` + `latest` tag
- **Build method**: Uses docker-compose build
- **Status**: ⚠️ Recently failing (as of 2025-10-21)

#### **Pipeline #26: dev-staging-to-prod** (Deployment)
**Purpose**: Classic deployment pipeline with 2 phases
- **Phase 1 - Deploy to Staging**: Automatic
- **Phase 2 - Deploy to Production**: Manual approval required

---

## Old Deployment Flow (Before Issue #236)

### **Step-by-Step Old Process**

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes code to main branch                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──► Pipeline #24 triggers (Frontend)
             │    ├─ Builds staging image with short hash
             │    ├─ Builds production image with short hash
             │    └─ Pushes to Docker Hub (boschvn/playground-fe)
             │
             └──► Pipeline #25 triggers (Backend - separate repo)
                  ├─ Builds backend image
                  └─ Pushes to Docker Hub (boschvn/playground-be)

             ┌────────────────────────────────────────────────┐
             │  Pipeline #26 (Deployment) starts             │
             └────────┬───────────────────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │  PHASE 1: STAGING         │
        └─────────────┬─────────────┘
                      │
                      ├─ SSH to staging server
                      ├─ cd /opt/deploy/dev-autowrx/staging/autowrx
                      ├─ Get git short hash
                      ├─ Set IMAGE_TAG=$short_hash-staging
                      ├─ Modify docker-compose.yml (sed)
                      ├─ docker stop staging-autowrx
                      ├─ docker rm -f staging-autowrx
                      ├─ docker compose pull
                      └─ docker compose up -d --remove-orphans

        ┌─────────────▼─────────────┐
        │  MANUAL APPROVAL GATE     │  ◄── Someone clicks "Approve"
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │  PHASE 2: PRODUCTION      │
        └─────────────┬─────────────┘
                      │
                      ├─ SSH to production server
                      ├─ cd /opt/deploy/dev-autowrx/production/autowrx
                      ├─ Similar deployment steps
                      └─ docker compose up -d
```

### **Old docker-compose.yml Structure**

Located at: `/opt/deploy/dev-autowrx/staging/autowrx/docker-compose.yml`

```yaml
services:
  playground-fe:
    container_name: ${ENV:-dev}-playground-fe
    image: boschvn/playground-fe:${IMAGE_TAG:-latest}
    ports:
      - "${APP_PORT:-8090}:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    restart: always
```

**Problems with this approach**:
1. ❌ **Only deploys frontend** - Backend, Kong, databases deployed separately (or manually)
2. ❌ **Configuration scattered** - Environment variables passed via export in deployment script
3. ❌ **No unified stack** - Each service managed independently
4. ❌ **Hard to replicate** - Different setups for dev/staging/prod
5. ❌ **Manual intervention** - Editing docker-compose.yml with sed during deployment
6. ❌ **No service orchestration** - Dependencies between services not defined

---

## New Structure (Issue #236 Implementation)

### **What Changed**

#### **1. Build Pipelines (#24 & #25) - NO CHANGE**
✅ These continue to work as before:
- Frontend builds → `boschvn/playground-fe:xxx`
- Backend builds → `boschvn/playground-be:xxx`
- Still push to Docker Hub
- Still trigger on push to main

#### **2. New Deployment Approach**

Instead of modifying Pipeline #26, created **2 new YAML pipelines**:

##### **New Pipeline: azure-pipelines-stack-staging.yml**
Replaces Phase 1 of Pipeline #26

**Key differences**:
```bash
OLD STAGING DEPLOYMENT:
- cd /opt/deploy/dev-autowrx/staging/autowrx
- Only deploys frontend container
- Uses export for env vars
- Modifies docker-compose.yml with sed
- docker compose up playground-fe

NEW STAGING DEPLOYMENT:
- cd /opt/deploy/dev-autowrx/staging/
- Deploys ENTIRE STACK (8 services)
- Uses .env.stack file for configuration
- No modification to docker-compose.stack.yml
- docker compose --env-file .env.stack -f docker-compose.stack.yml up -d
```

##### **New Pipeline: azure-pipelines-stack-production.yml**
Replaces Phase 2 of Pipeline #26

**Key differences**:
```bash
OLD PRODUCTION DEPLOYMENT:
- Similar to staging but different directory
- Manual approval in Azure DevOps UI
- Deployment coupled with staging

NEW PRODUCTION DEPLOYMENT:
- Completely independent pipeline
- Manual trigger (doesn't auto-run)
- Manual approval stage (YAML-defined)
- Zero-downtime deployment with --no-recreate
- Health checks with automatic rollback
```

---

## Side-by-Side Comparison

| Aspect | OLD (Pipeline #26) | NEW (Stack Pipelines) |
|--------|-------------------|----------------------|
| **Type** | Classic Pipeline (UI-based) | YAML Pipeline (code-based) |
| **Services Deployed** | Frontend only | All 8 services |
| **Configuration** | Environment variables exported in script | .env.stack file |
| **File Location** | `/opt/deploy/dev-autowrx/staging/autowrx/` | `/opt/deploy/dev-autowrx/staging/` |
| **Docker Compose** | docker-compose.yml (modified by sed) | docker-compose.stack.yml (immutable) |
| **Dependencies** | No orchestration | Full service dependencies defined |
| **Secrets** | Injected via exports | Merged into .env.stack from secure file |
| **Health Checks** | None | HTTP checks for frontend & Kong |
| **Rollback** | Manual | Documented procedure |
| **Version Control** | Classic pipeline (not in repo) | YAML files committed to repo |

---

## Migration Strategy: How to Move Without Breaking Anything

### **Phase 1: Parallel Deployment (Risk-Free Testing)**

**Goal**: Run new stack alongside old deployment without interfering

```bash
# Current structure
/opt/deploy/dev-autowrx/
   staging/
      autowrx/              ← OLD deployment (running on port 8090)
          docker-compose.yml

# During Phase 1 - Add new structure
/opt/deploy/dev-autowrx/
   staging/
      autowrx/              ← OLD (still running)
          docker-compose.yml
   staging-new/             ← NEW (test on different ports)
      docker-compose.stack.yml
      .env.stack            ← Modified to use ports 8091, 9801, etc.
      data/upload/
```

**Steps**:
1. ✅ Create new directory: `/opt/deploy/dev-autowrx/staging-new/`
2. ✅ Copy `docker-compose.stack.yml` and `.env.stack.example`
3. ✅ Edit `.env.stack` to use different ports:
   ```bash
   FRONTEND_PORT=8091      # Instead of 8090
   KONG_PROXY_PORT=9801    # Instead of 9800
   ENV=staging-new
   ```
4. ✅ Deploy new stack: `docker compose --env-file .env.stack -f docker-compose.stack.yml up -d`
5. ✅ Test everything on new ports
6. ✅ OLD deployment still running on original ports → **NO DOWNTIME**

**Validation**:
- Old frontend: http://server:8090 ✅ Still works
- New frontend: http://server:8091 ✅ Test this
- Compare functionality, performance, database access

---

### **Phase 2: Staging Cutover**

**Goal**: Replace old staging deployment with new stack

**Prerequisites**:
- ✅ Phase 1 testing completed successfully
- ✅ All services working in parallel deployment
- ✅ Database connectivity verified
- ✅ File uploads working
- ✅ Team notified of planned cutover

**Steps**:

1. **Backup old deployment**:
   ```bash
   cd /opt/deploy/dev-autowrx/
   cp -r staging/autowrx staging-backup/
   ```

2. **Stop old deployment**:
   ```bash
   cd /opt/deploy/dev-autowrx/staging/autowrx
   docker compose down
   ```

3. **Move new stack to production location**:
   ```bash
   cd /opt/deploy/dev-autowrx/
   mv staging/autowrx staging/autowrx-old
   mv staging-new/* staging/
   ```

4. **Update .env.stack to use original ports**:
   ```bash
   cd /opt/deploy/dev-autowrx/staging/
   sed -i "s|FRONTEND_PORT=8091|FRONTEND_PORT=8090|" .env.stack
   sed -i "s|KONG_PROXY_PORT=9801|KONG_PROXY_PORT=9800|" .env.stack
   sed -i "s|ENV=staging-new|ENV=staging|" .env.stack
   ```

5. **Deploy**:
   ```bash
   docker compose --env-file .env.stack -f docker-compose.stack.yml up -d
   ```

6. **Verify**:
   ```bash
   docker compose ps
   curl http://localhost:8090
   curl http://localhost:9800/v2/health
   ```

7. **Update Azure DevOps Pipeline #26**:
   - Option A: Disable Phase 1 (staging deployment)
   - Option B: Point Phase 1 to new deployment script
   - Option C: Create new YAML pipeline to replace it

**Rollback if needed** (< 5 minutes):
```bash
cd /opt/deploy/dev-autowrx/staging
docker compose down
cd /opt/deploy/dev-autowrx/staging-backup
docker compose up -d
```

---

### **Phase 3: Production Cutover**

**Goal**: Move production to new stack

**Prerequisites**:
- ✅ Staging running on new stack for at least 1 week
- ✅ No critical issues found
- ✅ User acceptance testing passed
- ✅ Backup of production database taken
- ✅ Maintenance window scheduled
- ✅ Rollback procedure tested in staging

**Steps**: Same as Phase 2, but for production directory

**Additional safety measures**:
- Announce maintenance window to users
- Have team on standby during deployment
- Monitor error logs actively for 1 hour post-deployment
- Keep old deployment available for quick rollback

---

### **Phase 4: Cleanup & Azure DevOps Migration**

**Goal**: Replace Classic Pipeline #26 with new YAML pipelines

**Option A: Keep Pipeline #26, Update Scripts**
```bash
# Modify the existing Classic Pipeline tasks in Azure DevOps UI to:

# Staging Phase Script:
cd /opt/deploy/dev-autowrx/staging
short_hash=$(git rev-parse --short=7 HEAD)
sed -i "s|^FRONTEND_IMAGE_TAG=.*|FRONTEND_IMAGE_TAG=${short_hash}-staging|" .env.stack
sed -i "s|^BACKEND_IMAGE_TAG=.*|BACKEND_IMAGE_TAG=${short_hash}|" .env.stack
# ... merge secrets ...
docker compose --env-file .env.stack -f docker-compose.stack.yml up -d
```

**Option B: Create New YAML Pipelines** (RECOMMENDED)
1. Create new pipeline in Azure DevOps from `azure-pipelines-stack-staging.yml`
2. Create new pipeline from `azure-pipelines-stack-production.yml`
3. Set up SSH service connections
4. Upload `.env.stack.secrets` to Azure DevOps Library
5. Test new pipelines
6. Disable old Pipeline #26
7. Archive for reference

---

## Why This Migration is Safe

### **Zero Breaking Changes to Build Process**
- ✅ Frontend build (Pipeline #24) untouched
- ✅ Backend build (Pipeline #25) untouched
- ✅ Same Docker images used
- ✅ Same image tags
- ✅ Same Docker Hub registry

### **Incremental Rollout**
```
Week 1: Parallel deployment (testing)
Week 2: Staging cutover (validation)
Week 3-4: Monitoring staging
Week 5: Production cutover
Week 6: Cleanup
```

### **Multiple Rollback Points**
- During Phase 1: Just stop new containers
- During Phase 2: Rollback script (5 minutes)
- During Phase 3: Keep staging on new stack as proven reference
- After Phase 4: Old pipeline archived, can be re-enabled

### **No Database Migration Required**
- ✅ Same MongoDB containers
- ✅ Same connection strings
- ✅ Volumes preserved
- ✅ Data remains intact

---

## Key Differences Summary

### **What's Better in New Structure**

1. **Complete Stack Orchestration**
   - OLD: Frontend only
   - NEW: All 8 services orchestrated together

2. **Configuration Management**
   - OLD: Scattered exports, sed modifications
   - NEW: Single .env.stack file

3. **Infrastructure as Code**
   - OLD: Classic pipeline (click-ops)
   - NEW: YAML pipelines in version control

4. **Service Dependencies**
   - OLD: Manual startup order
   - NEW: Docker Compose `depends_on`

5. **Environment Parity**
   - OLD: Different setup per environment
   - NEW: Same docker-compose.stack.yml everywhere

6. **Developer Experience**
   - OLD: Can't replicate production locally
   - NEW: Same stack runs on laptop

7. **Disaster Recovery**
   - OLD: Manual reconstruction
   - NEW: Git clone + docker compose up

---

## Final Answer: How to Migrate Without Breaking

**The secret**: Use the old deployment structure's directory layout, but replace the contents:

```bash
# OLD structure (what Pipeline #26 expects)
/opt/deploy/dev-autowrx/staging/autowrx/docker-compose.yml

# NEW structure (backward compatible)
/opt/deploy/dev-autowrx/staging/docker-compose.stack.yml
/opt/deploy/dev-autowrx/staging/.env.stack
```

**Pipeline #26 can continue deploying** - just update its scripts to:
1. Use new file location (`staging/` instead of `staging/autowrx/`)
2. Use `docker-compose.stack.yml` instead of `docker-compose.yml`
3. Use `.env.stack` instead of environment exports

This way, you get all the benefits of the new structure while maintaining compatibility with existing infrastructure!

---

## Services Overview

### **8 Services in New Stack**

1. **Kong Gateway** (Port 9800)
   - API Gateway and reverse proxy
   - Routes all API requests to backend services

2. **Frontend** (Port 8090)
   - React + Vite application
   - Served by Nginx
   - Image: `boschvn/playground-fe`

3. **Backend Core** (Port 8080)
   - Node.js + Express API
   - Main application backend
   - Image: `boschvn/playground-be`

4. **Upload Service** (Port 9810)
   - Handles file uploads
   - Persistent storage via volume
   - Image: `boschvn/upload:1.1.0`

5. **Inventory Backend**
   - Vehicle inventory management
   - Image: `boschvn/inventory-be`

6. **Homologation Service**
   - Vehicle homologation workflows
   - Image: `boschvn/homologation-node`

7. **MongoDB (Main)**
   - Main application database
   - Named volume: `autowrx-dbdata`

8. **MongoDB (Inventory)**
   - Inventory database
   - Named volume: `autowrx-inventorydata`

### **Service Dependencies**

```
Kong → Backend, Inventory-BE
Backend → MongoDB (Main), Upload
Frontend → Kong
Inventory-BE → MongoDB (Inventory)
```

---

## Environment Configuration

### **Critical Environment Variables**

| Variable | Purpose | Example |
|----------|---------|---------|
| `FRONTEND_IMAGE_TAG` | Frontend Docker image tag | `abc1234-staging` |
| `BACKEND_IMAGE_TAG` | Backend Docker image tag | `abc1234` |
| `ENV` | Environment name | `staging` or `prod` |
| `KONG_PROXY_PORT` | Kong gateway port | `9800` |
| `FRONTEND_PORT` | Frontend port | `8090` |
| `MONGODB_URL` | MongoDB connection | `mongodb://autowrx-db:27017/autowrx-be` |
| `JWT_SECRET` | JWT signing key | (from secure file) |
| `ADMIN_PASSWORD` | Admin password | (from secure file) |
| `CORS_ORIGINS` | Allowed origins | Regex pattern |

### **Secrets Management**

Secrets are stored in Azure DevOps Library as `.env.stack.secrets`:
- Downloaded during pipeline execution
- Merged into `.env.stack` via sed commands
- File cleaned up after deployment
- Never committed to repository

---

## Troubleshooting

### **Common Issues During Migration**

#### **Port Conflicts**
```bash
# Check what's using the port
sudo lsof -i :8090

# If old deployment running, stop it
cd /opt/deploy/dev-autowrx/staging/autowrx
docker compose down
```

#### **Database Connection Issues**
```bash
# Verify MongoDB is running
docker ps | grep mongo

# Check MongoDB logs
docker logs staging-autowrx-db

# Test connection
docker exec staging-autowrx-backend curl mongodb://autowrx-db:27017
```

#### **Image Pull Failures**
```bash
# Login to Docker Hub
docker login

# Manually pull images
docker pull boschvn/playground-fe:abc1234-staging
docker pull boschvn/playground-be:abc1234

# Check image exists on Docker Hub
curl https://hub.docker.com/v2/repositories/boschvn/playground-fe/tags/abc1234-staging
```

#### **Old Containers Interfering**
```bash
# List all containers
docker ps -a

# Stop and remove old containers
docker stop $(docker ps -a -q --filter name=autowrx)
docker rm $(docker ps -a -q --filter name=autowrx)

# Clean up networks
docker network prune
```

---

## Quick Reference Commands

### **Deployment Commands**

```bash
# Deploy new stack
docker compose --env-file .env.stack -f docker-compose.stack.yml up -d

# View logs
docker compose -f docker-compose.stack.yml logs -f

# Check status
docker compose -f docker-compose.stack.yml ps

# Stop stack
docker compose -f docker-compose.stack.yml down

# Restart specific service
docker compose -f docker-compose.stack.yml restart frontend
```

### **Verification Commands**

```bash
# Check all containers running
docker ps

# Test frontend
curl http://localhost:8090

# Test Kong gateway
curl http://localhost:9800

# Test backend API
curl http://localhost:9800/v2/health

# Check MongoDB
docker exec staging-autowrx-db mongo --eval "db.stats()"
```

### **Rollback Commands**

```bash
# Quick rollback to previous image tag
cd /opt/deploy/dev-autowrx/staging/
sed -i "s|^FRONTEND_IMAGE_TAG=.*|FRONTEND_IMAGE_TAG=previous_hash|" .env.stack
docker compose --env-file .env.stack -f docker-compose.stack.yml up -d --force-recreate

# Full rollback to old deployment
cd /opt/deploy/dev-autowrx/staging
docker compose down
cd /opt/deploy/dev-autowrx/staging-backup
docker compose up -d
```

---

## Timeline Recommendation

### **Conservative Migration Timeline**

| Week | Phase | Activities |
|------|-------|-----------|
| 1 | Planning | Team review, Azure DevOps setup, create `.env.stack.secrets` |
| 2 | Phase 1 Start | Deploy parallel stack on staging server, different ports |
| 3 | Phase 1 Testing | Full functional testing, performance testing, bug fixes |
| 4 | Phase 2 Prep | Team training, final testing, backup verification |
| 5 | Phase 2 Execute | Staging cutover during maintenance window |
| 6-7 | Monitoring | Monitor staging, fix any issues |
| 8 | Phase 3 Prep | Production deployment preparation, final approvals |
| 9 | Phase 3 Execute | Production cutover during maintenance window |
| 10 | Phase 4 | Update/replace Pipeline #26, cleanup old files |

### **Aggressive Migration Timeline**

| Week | Phase | Activities |
|------|-------|-----------|
| 1 | Planning + Phase 1 | Setup and parallel deployment |
| 2 | Phase 1 Testing + Phase 2 | Testing and staging cutover |
| 3 | Monitoring | Monitor staging |
| 4 | Phase 3 + Phase 4 | Production cutover and cleanup |

---

## Success Criteria

### **Phase 1 Success**
- [ ] New stack running on different ports
- [ ] All 8 services healthy
- [ ] Frontend accessible and functional
- [ ] Backend API responding
- [ ] Database read/write working
- [ ] File uploads working
- [ ] No errors in logs

### **Phase 2 Success**
- [ ] New stack running on original ports
- [ ] Old deployment cleanly stopped
- [ ] Zero downtime achieved
- [ ] All functionality preserved
- [ ] Performance meets baseline
- [ ] No user-reported issues for 1 week

### **Phase 3 Success**
- [ ] Production on new stack
- [ ] All production services healthy
- [ ] User acceptance testing passed
- [ ] Performance monitoring green
- [ ] Rollback procedure tested and ready

### **Phase 4 Success**
- [ ] New YAML pipelines operational
- [ ] Old Pipeline #26 archived
- [ ] Team trained on new process
- [ ] Documentation updated
- [ ] Old deployment files cleaned up

---

## Contact and Support

### **Before Migration**
- Review this guide with team
- Get approval from tech lead
- Set up test environment
- Practice rollback procedures

### **During Migration**
- Have team on standby
- Monitor logs actively
- Keep communication channels open
- Document any issues

### **After Migration**
- Update team documentation
- Share lessons learned
- Archive old configurations
- Plan regular review cycles

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Related Documents**:
- `ISSUE_236_DOCKER_STACK_GUIDE.md` - Complete stack implementation guide
- `docker-compose.stack.yml` - Stack orchestration file
- `.env.stack.example` - Environment configuration template
- `azure-pipelines-stack-staging.yml` - Staging deployment pipeline
- `azure-pipelines-stack-production.yml` - Production deployment pipeline
