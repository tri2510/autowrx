# Modern Deployment Architecture

## Overview

AutoWRX v3 uses a modern container registry-based deployment approach following GitOps principles.

### Key Principles

✅ **Container Registry as Source of Truth** - Images are built once, deployed many times
✅ **Immutable Deployments** - Same image across environments
✅ **Webhook-Based Deployment** - No SSH access from CI
✅ **Pull-Based Updates** - Server pulls images, not pushed to
✅ **Health Checks** - Automated verification
✅ **Rollback Support** - Deploy any previous version

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Actions (CI)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Build & Test                                           │
│     ├─> Build Frontend (yarn build → dist/)                │
│     ├─> Build Backend                                      │
│     └─> Run Tests                                          │
│                                                             │
│  2. Push to Registry                                       │
│     ├─> Docker Build (with cache)                         │
│     └─> Push to ghcr.io                                   │
│                                                             │
│  3. Trigger Deployment                                     │
│     └─> Call Webhook with image tags                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS Webhook
┌─────────────────────────────────────────────────────────────┐
│ Deployment Server                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Webhook Receiver                                          │
│     ↓                                                       │
│  Deploy Script                                             │
│     ├─> Pull images from ghcr.io                          │
│     ├─> Update docker-compose                             │
│     ├─> Zero-downtime deployment                          │
│     └─> Health check                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflows

### 1. Build and Push (`build-and-push.yml`)

**Triggers:**
- Push to `main` or `v3-base`
- Pull request (build only, no push)
- Git tags (`v*`)

**Process:**
```
1. Checkout code
2. Build frontend (yarn build)
3. Docker build with BuildKit cache
4. Push to ghcr.io/$REPO/frontend:$TAG
5. Docker build backend
6. Push to ghcr.io/$REPO/backend:$TAG
```

**Image Tags:**
- Branch: `v3-base`, `main`
- PR: `pr-123`
- Commit: `v3-base-abc1234`
- Semver: `v1.0.0`, `v1.0`, `v1`

**Best Practices:**
- ✅ Parallel builds (frontend + backend)
- ✅ Docker layer caching (GitHub Actions Cache)
- ✅ Multi-platform support ready
- ✅ Automatic semantic versioning
- ✅ PR validation without deployment

---

### 2. Deploy to Staging (`deploy-staging.yml`)

**Triggers:**
- After successful "Build and Push" on `v3-base`

**Process:**
```
1. Wait for build completion
2. Call staging webhook with image tags
3. Server pulls images and deploys
4. Health check verification
```

**Secrets Required:**
- `STAGING_WEBHOOK_URL` - Webhook endpoint
- `STAGING_WEBHOOK_TOKEN` - Authentication token
- `STAGING_URL` - For health checks

---

### 3. Deploy to Production (`deploy-production.yml`)

**Triggers:**
- Manual dispatch only
- Requires version tag + "deploy" confirmation

**Process:**
```
1. Validate inputs
2. Require GitHub environment approval
3. Call production webhook
4. Server pulls images and deploys
5. Health check verification
6. Create GitHub deployment record
```

**Secrets Required:**
- `PRODUCTION_WEBHOOK_URL`
- `PRODUCTION_WEBHOOK_TOKEN`
- `PRODUCTION_URL`

---

## Server Setup

### 1. Install Webhook Receiver

Use a lightweight webhook receiver like [webhook](https://github.com/adnanh/webhook) or create custom endpoint.

**Example webhook config:**
```json
[
  {
    "id": "deploy-staging",
    "execute-command": "/opt/deploy/scripts/deploy-server.sh",
    "pass-arguments-to-command": [
      {
        "source": "payload",
        "name": "environment"
      },
      {
        "source": "payload",
        "name": "images.frontend"
      },
      {
        "source": "payload",
        "name": "images.backend"
      }
    ],
    "trigger-rule": {
      "match": {
        "type": "value",
        "value": "staging",
        "parameter": {
          "source": "payload",
          "name": "environment"
        }
      }
    }
  }
]
```

### 2. Setup Environment

```bash
# Install webhook receiver
sudo apt-get install webhook

# Setup deploy directory
sudo mkdir -p /opt/deploy/autowrx/{staging,production}
sudo mkdir -p /opt/deploy/scripts

# Copy deploy script
sudo cp scripts/deploy-server.sh /opt/deploy/scripts/
sudo chmod +x /opt/deploy/scripts/deploy-server.sh

# Configure environment
export GHCR_USERNAME="github-username"
export GHCR_TOKEN="github-pat"  # GitHub Personal Access Token with packages:read

# Start webhook receiver
webhook -hooks webhook.json -verbose -port 9000
```

### 3. Configure Secrets on Server

```bash
# Create secrets file
sudo mkdir -p /opt/deploy/secrets
sudo nano /opt/deploy/secrets/.env.stack.secrets

# Add:
JWT_SECRET=your-secret
ADMIN_PASSWORD=your-password
# ... other secrets
```

---

## Deployment Flow

### Staging (Automatic)

```bash
# Developer pushes to v3-base
git push origin v3-base

# GitHub Actions automatically:
# 1. Builds images
# 2. Pushes to ghcr.io
# 3. Triggers staging deployment
# 4. Verifies health
```

### Production (Manual)

```bash
# 1. Go to GitHub Actions → Deploy to Production
# 2. Click "Run workflow"
# 3. Enter version (e.g., v1.0.0 or commit SHA)
# 4. Type "deploy" to confirm
# 5. Click "Run workflow"
# 6. Wait for approval (if configured)
# 7. Deployment proceeds automatically
```

---

## Rollback

To rollback to a previous version:

```bash
# Option 1: Via GitHub Actions
# Run "Deploy to Production" with old version tag

# Option 2: Directly on server
cd /opt/deploy/autowrx/production
./deploy-server.sh production \
  ghcr.io/eclipse-autowrx/autowrx/frontend:v1.0.0 \
  ghcr.io/eclipse-autowrx/autowrx/backend:v1.0.0
```

---

## Security

✅ **No SSH from CI** - CI never SSHes into servers
✅ **Token-based auth** - Webhook uses Bearer tokens
✅ **Pull-based** - Server pulls images (not pushed)
✅ **Immutable images** - Tagged by commit SHA
✅ **Audit trail** - GitHub deployment records
✅ **Environment protection** - Approval gates for production

---

## Monitoring

### Health Checks

Workflows automatically verify:
- HTTP 200 from `/health` endpoint
- Services running (`docker compose ps`)
- Image tags match deployment

### Deployment Records

GitHub tracks:
- Who deployed
- What version
- When deployed
- Deployment status

View in: Repository → Deployments tab

---

## Advantages Over Old Approach

| Aspect | Old (Azure + SSH) | New (GitHub + Webhooks) |
|--------|------------------|-------------------------|
| **Security** | SSH keys in CI | Webhook tokens only |
| **Separation** | CI pushes to server | Server pulls images |
| **Rollback** | Manual/difficult | Deploy any version |
| **Immutability** | Builds on server | Build once, deploy many |
| **Caching** | None | Docker layer cache |
| **Audit** | Limited | Full GitHub records |
| **Scale** | One server only | Multiple servers easy |
| **GitOps** | ❌ | ✅ |

---

## Required GitHub Secrets

### Repository Secrets
None required (uses `GITHUB_TOKEN`)

### Environment Secrets

**Staging:**
- `STAGING_WEBHOOK_URL`
- `STAGING_WEBHOOK_TOKEN`
- `STAGING_URL`

**Production:**
- `PRODUCTION_WEBHOOK_URL`
- `PRODUCTION_WEBHOOK_TOKEN`
- `PRODUCTION_URL`

---

## Troubleshooting

### Build Fails

```bash
# Check workflow logs in GitHub Actions
# Common issues:
# - Frontend build errors → Check frontend/yarn.lock
# - Docker build fails → Check Dockerfile syntax
```

### Deployment Fails

```bash
# Check server logs
journalctl -u webhook -f

# Check deploy script
/opt/deploy/scripts/deploy-server.sh staging \
  ghcr.io/.../frontend:test \
  ghcr.io/.../backend:test

# Check docker logs
cd /opt/deploy/autowrx/staging
docker compose logs -f
```

### Image Pull Fails

```bash
# Verify GHCR token
echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USERNAME --password-stdin

# Test pull
docker pull ghcr.io/eclipse-autowrx/autowrx/frontend:v3-base
```

---

## Migration from Azure DevOps

If migrating from old Azure pipelines:

1. **Setup GitHub Container Registry** - Already configured
2. **Install webhook receiver on server** - See setup above
3. **Configure secrets** - Add webhook URLs/tokens
4. **Test staging first** - Push to v3-base
5. **Verify everything works** - Check logs
6. **Remove Azure pipelines** - Already done
7. **Update documentation** - ✅ Complete

---

## Future Enhancements

- **Kubernetes support** - Ready for K8s deployment
- **Multi-region** - Webhook to multiple servers
- **Canary deployments** - Gradual rollout
- **Automated rollback** - On health check failure
- **Slack notifications** - Deployment alerts
