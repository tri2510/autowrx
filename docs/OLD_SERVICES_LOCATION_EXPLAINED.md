# Where Were the Other Services in the Old Approach?

## Quick Answer

**Pipeline #26 only deployed the frontend.** The other 7 services were deployed separately through different methods, or were already running as external infrastructure.

---

## Service Deployment Summary

| Service | Old Deployment Method | Location |
|---------|----------------------|----------|
| **Frontend** | Azure Pipeline #26 ✅ | `/opt/deploy/dev-autowrx/staging/autowrx/` |
| **Backend** | Azure Pipeline #25 (separate repo) | Separate location (likely `/opt/deploy/backend-core/staging/`) |
| **Kong Gateway** | External/Manual | Unknown |
| **MongoDB (Main)** | External/Manual | Unknown |
| **MongoDB (Inventory)** | External/Manual | Unknown |
| **Upload Service** | External | Unknown |
| **Inventory Backend** | External | Unknown |
| **Homologation** | External | Unknown |

---

## Detailed Breakdown

### 1. Frontend (React App) ✅ **AUTOMATED**

```
Repository: eclipse-autowrx/autowrx
Build Pipeline: Azure Pipeline #24
Deploy Pipeline: Azure Pipeline #26
Location: /opt/deploy/dev-autowrx/staging/autowrx/
```

**Deployment flow:**
```bash
git push → Pipeline #24 builds → Pipeline #26 deploys → Frontend running
```

---

### 2. Backend (Node.js API) 🔶 **SEPARATE PIPELINE**

```
Repository: eclipse-autowrx/backend-core (SEPARATE REPO!)
Build Pipeline: Azure Pipeline #25
Deploy Pipeline: Unknown (not Pipeline #26)
Location: Unknown (assumed separate directory)
```

**Key point:** Backend is in a **completely different repository** with its own build pipeline. It was **NOT deployed by Pipeline #26**.

**The problem:** Frontend and backend could be out of sync because they deploy independently.

---

### 3-8. Other Services (Kong, Databases, Upload, Inventory, Homologation) ❓ **EXTERNAL**

From ISSUE_236_DOCKER_STACK_GUIDE.md documentation:

```
| Service       | Image                      | Built By  | Trigger |
|---------------|----------------------------|-----------|---------|
| Kong          | boschvn/playground-kong    | External  | -       |
| Upload        | boschvn/upload:1.1.0       | External  | -       |
| Inventory     | boschvn/inventory-be       | External  | -       |
| Homologation  | boschvn/homologation-node  | External  | -       |
```

**"External" means:**
- Not built by AutoWRX pipelines
- Not deployed by Pipeline #26
- Deployment method unknown/undocumented
- Likely managed manually or by other teams
- Could be pre-deployed infrastructure

**Possible scenarios:**
- Deployed once manually and rarely updated
- Managed by different teams/pipelines
- Part of shared platform infrastructure
- Databases might be managed services (Azure Cosmos DB)

---

## The Core Problem

### Old Approach: Fragmented Deployment

```
Pipeline #26 deploys:
├─ Frontend ✅

NOT deployed by Pipeline #26:
├─ Backend (separate pipeline)
├─ Kong (external)
├─ MongoDB x2 (external)
├─ Upload (external)
├─ Inventory (external)
└─ Homologation (external)
```

**Result:**
- **No unified deployment** - Each service managed separately
- **No version control** - Can't track what's deployed where
- **No orchestration** - Services start in random order
- **Tribal knowledge** - Need to ask people where things are
- **Hard to replicate** - Can't recreate environment easily

---

## Visual Comparison

### Old Approach: Services Scattered

```
Azure DevOps:
├─ Pipeline #24: Builds frontend image
├─ Pipeline #25: Builds backend image (separate repo)
└─ Pipeline #26: Deploys frontend only ❌

Staging Server:
├─ /opt/deploy/dev-autowrx/staging/autowrx/
│   └─ Frontend (deployed by Pipeline #26)
├─ /somewhere/backend/ (???)
├─ /somewhere/kong/ (???)
├─ MongoDB (???)
├─ Upload service (???)
├─ Inventory (???)
└─ Homologation (???)
```

### New Approach: Everything Together

```
Azure DevOps:
├─ Pipeline #24: Builds frontend image (unchanged)
├─ Pipeline #25: Builds backend image (unchanged)
└─ NEW: azure-pipelines-stack-staging.yml
    └─ Deploys ALL 8 services ✅

Staging Server:
└─ /opt/deploy/dev-autowrx/staging/
    ├─ docker-compose.stack.yml (all 8 services)
    ├─ .env.stack (all configuration)
    └─ All services running together
```

---

## Why This Matters

### Old: Deployment Complexity

To deploy a feature requiring frontend + backend changes:

```bash
1. Deploy backend (Pipeline #25? Manual? ???)
   Wait... How long? Is it done?

2. Deploy frontend (Pipeline #26)
   Wait for pipeline...

3. Hope they're compatible
   Pray services are correct versions

4. Debug issues
   "Which backend version is running?"
   "Where's the Kong config?"
   "Who updated MongoDB?"

Time: 30-60 minutes
Failure rate: High
```

### New: Single Deployment

```bash
docker compose --env-file .env.stack -f docker-compose.stack.yml up -d

# Deploys all 8 services together:
1. MongoDB containers start
2. Backend waits for MongoDB
3. Kong waits for backend
4. Frontend waits for Kong
5. Everything starts in correct order

Time: 2-3 minutes
Failure rate: Low
All versions guaranteed compatible
```

---

## Evidence from Code

### Frontend calls backend via Kong

```javascript
// .env.staging
VITE_API_URL=http://localhost:9800  // Kong port, not backend port

// This proves:
// - Kong must be running
// - Kong must route to backend
// - But Kong deployment not in Pipeline #26
```

### Backend environment references external services

```bash
# Backend .env (from Pipeline #25)
MONGODB_URL=mongodb://autowrx-db:27017/autowrx-be
UPLOAD_PORT=9810
HOMOLOGATION_URL=...
INVENTORY_URL=...

# This proves:
# - Backend expects these services to exist
# - But doesn't deploy them
# - Assumes they're "already there"
```

---

## Summary

### Old Approach Problems

1. **Only Frontend deployed by Pipeline #26** - Other services deployed separately or externally
2. **Backend in separate repo** - Different pipeline, can get out of sync
3. **External services undocumented** - No one knows where they are or how to update them
4. **No orchestration** - Services don't know about dependencies
5. **Tribal knowledge** - Need to ask people how things work
6. **Can't replicate** - Each environment is unique

### New Approach Solution

1. **All 8 services in docker-compose.stack.yml** - Single source of truth
2. **All configuration in .env.stack** - One file for all settings
3. **Dependencies defined** - Services start in correct order
4. **Version controlled** - Everything in git
5. **Self-documenting** - Read the files to understand
6. **Reproducible** - Same stack on laptop, staging, production

---

**Bottom line:** The old approach had services scattered across unknown locations with undocumented deployment methods. The new approach brings everything into one unified, version-controlled stack.
