# CI/CD Automation Guide

This document describes all automation workflows and scripts for the SyncCode collaborative editor project.

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Development Scripts](#development-scripts)
4. [Docker Automation](#docker-automation)
5. [Database Automation](#database-automation)
6. [Release Automation](#release-automation)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

## Overview

The automation infrastructure includes:

- **CI/CD Pipelines**: Automated testing, building, and deployment
- **Docker Images**: Multi-stage builds with security scanning
- **Database Migrations**: Automated schema management with Prisma
- **Semantic Versioning**: Automatic version management and changelog generation
- **Health Monitoring**: Scheduled health checks and alerting
- **Development Tools**: Environment setup and utility scripts

## GitHub Actions Workflows

### CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger via workflow_dispatch

**Jobs:**
1. **quality**: Type checking and security audits
2. **build**: Build all packages (shared, server, client)
3. **database-tests**: Test database migrations and connectivity
4. **integration-tests**: Run integration tests (when implemented)
5. **build-success**: Final status check

**Usage:**
```bash
# Automatically runs on push/PR
# Manual trigger:
gh workflow run ci.yml
```

### Docker Build & Push (`.github/workflows/docker-build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- New tags (v*)
- Pull requests affecting Docker files
- Manual trigger

**Features:**
- Multi-platform builds (linux/amd64, linux/arm64)
- Vulnerability scanning with Trivy and Grype
- SBOM (Software Bill of Materials) generation
- Automatic push to GitHub Container Registry

**Images:**
- `ghcr.io/{owner}/{repo}-server:latest`
- `ghcr.io/{owner}/{repo}-client:latest`

**Usage:**
```bash
# Pull images
docker pull ghcr.io/yourusername/collaborative-editor-server:latest
docker pull ghcr.io/yourusername/collaborative-editor-client:latest

# Run server
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  ghcr.io/yourusername/collaborative-editor-server:latest

# Run client
docker run -p 80:80 \
  ghcr.io/yourusername/collaborative-editor-client:latest
```

### Deploy to Staging (`.github/workflows/deploy-staging.yml`)

**Triggers:**
- Push to `develop` branch
- Manual trigger with options

**Flow:**
1. Pre-deployment tests (optional skip)
2. Database migration
3. Deploy to ECS (server + client)
4. Post-deployment verification
5. Smoke tests
6. Notification

**Usage:**
```bash
# Automatic on develop push

# Manual with skip tests:
gh workflow run deploy-staging.yml -f skip_tests=true
```

### Deploy to Production (`.github/workflows/deploy-production.yml`)

**Triggers:**
- New tags (v*.*.*)
- Manual trigger with version input

**Flow:**
1. Approval gate (requires manual approval)
2. Database backup (RDS snapshot)
3. Database migration with rollback capability
4. Blue-green deployment
5. Production verification
6. Cleanup old resources
7. Notifications

**Usage:**
```bash
# Tag-based deployment
git tag v1.0.0
git push origin v1.0.0

# Manual deployment
gh workflow run deploy-production.yml -f version=v1.0.0
```

**Rollback:**
If deployment fails, it automatically rolls back to the previous version.

### Release (`.github/workflows/release.yml`)

**Triggers:**
- Push to `main` branch
- Manual trigger

**Features:**
- Semantic versioning based on conventional commits
- Automatic CHANGELOG.md generation
- GitHub release creation
- NPM package publishing (optional)
- Trigger Docker builds for new releases

**Commit Convention:**
```bash
feat: add new feature          # Minor version bump
fix: fix bug                   # Patch version bump
perf: improve performance      # Patch version bump
feat!: breaking change         # Major version bump
docs: update documentation     # No version bump
```

**Example Commits:**
```bash
# Feature (1.0.0 -> 1.1.0)
git commit -m "feat: add real-time cursor tracking"

# Bug fix (1.1.0 -> 1.1.1)
git commit -m "fix: resolve WebSocket reconnection issue"

# Breaking change (1.1.1 -> 2.0.0)
git commit -m "feat!: redesign authentication API"
```

### Health Check (`.github/workflows/health-check.yml`)

**Triggers:**
- Scheduled (every 15 minutes)
- Manual trigger with environment selection

**Checks:**
- API health endpoint
- Client health endpoint
- WebSocket connectivity
- Database connectivity
- Response time monitoring

**Alerting:**
- Creates GitHub issues for failures
- Sends Slack notifications (if configured)
- Triggers auto-healing (optional)

**Usage:**
```bash
# Check staging
gh workflow run health-check.yml -f environment=staging

# Check production
gh workflow run health-check.yml -f environment=production
```

### Code Review (`.github/workflows/claude-code-review.yml`)

**Triggers:**
- Pull request opened or updated

**Features:**
- AI-powered code review with Claude
- Checks code quality, security, performance
- Comments directly on PRs

## Development Scripts

### Setup Development Environment (`scripts/setup-dev.sh`)

Automated setup of complete development environment.

**Features:**
- Prerequisites checking (Node.js, Docker, etc.)
- Dependency installation
- Infrastructure services startup (PostgreSQL, Redis, Prometheus, Grafana)
- Database setup and migrations
- Package building
- Git hooks configuration

**Usage:**
```bash
./scripts/setup-dev.sh
```

**What it does:**
1. ✓ Check prerequisites (Node, Yarn, Docker)
2. ✓ Create environment files
3. ✓ Install dependencies
4. ✓ Start Docker services
5. ✓ Run database migrations
6. ✓ Build packages
7. ✓ Setup git hooks

**After setup:**
```bash
# Start development servers
yarn dev

# Access services:
# - Client:     http://localhost:3000
# - API:        http://localhost:5000
# - Prometheus: http://localhost:9090
# - Grafana:    http://localhost:3002 (admin/admin)
```

### Clean Script (`scripts/clean.sh`)

Clean build artifacts and caches.

**Usage:**
```bash
./scripts/clean.sh
```

**What it removes:**
- Build artifacts (`dist/`, `build/`)
- TypeScript build info
- Prisma generated client
- (Optional) node_modules

## Docker Automation

### Server Dockerfile (`packages/server/Dockerfile`)

**Multi-stage build:**
1. **deps**: Install dependencies
2. **builder**: Build TypeScript code and Prisma client
3. **prod-deps**: Production dependencies only
4. **runner**: Final production image

**Features:**
- Non-root user (synccode:nodejs)
- Health checks
- Dumb-init for proper signal handling
- Optimized layer caching
- Security labels and metadata

**Build locally:**
```bash
docker build -f packages/server/Dockerfile -t synccode-server .
```

### Client Dockerfile (`packages/client/Dockerfile`)

**Multi-stage build:**
1. **deps**: Install dependencies
2. **builder**: Build React application
3. **runner**: Nginx serving static files

**Features:**
- Optimized Nginx configuration
- Non-root user
- Gzip compression
- React Router support
- Security headers

**Build locally:**
```bash
docker build -f packages/client/Dockerfile \
  --build-arg REACT_APP_API_URL=http://localhost:5000 \
  --build-arg REACT_APP_WS_URL=ws://localhost:5000 \
  -t synccode-client .
```

### Nginx Configuration (`packages/client/nginx.conf`)

**Features:**
- Gzip compression
- Static file caching
- React Router support (SPA)
- Security headers
- Health check endpoint

## Database Automation

### Prisma Migrations

**Development:**
```bash
cd packages/server

# Create new migration
npx prisma migrate dev --name add_user_roles

# Reset database (DESTRUCTIVE)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

**Production:**
```bash
# Deploy migrations (non-interactive)
npx prisma migrate deploy

# Verify schema
npx prisma validate
```

**CI/CD Integration:**
- Migrations run automatically in deployment workflows
- Pre-deployment backups created in production
- Rollback capability on failure

## Release Automation

### Semantic Release Configuration (`.releaserc.json`)

**Release Types:**
- `feat:` → Minor version (1.0.0 → 1.1.0)
- `fix:` → Patch version (1.0.0 → 1.0.1)
- `feat!:` or `BREAKING CHANGE:` → Major version (1.0.0 → 2.0.0)

**Generated Files:**
- CHANGELOG.md (automatic updates)
- GitHub releases
- Git tags

**Workflow:**
1. Commit with conventional commit message
2. Push to `main` branch
3. Semantic Release analyzes commits
4. Determines next version
5. Updates CHANGELOG.md
6. Creates Git tag
7. Creates GitHub release
8. Triggers Docker build

**Example Workflow:**
```bash
# Feature branch
git checkout -b feature/new-feature
git commit -m "feat: add collaborative cursor tracking"
git push origin feature/new-feature

# Create PR and merge to main
gh pr create --title "Add collaborative cursor tracking"

# After merge, release workflow runs automatically
# New version: v1.1.0 created
```

## Monitoring & Health Checks

### Automated Health Checks

**Schedule:** Every 15 minutes

**Endpoints Monitored:**
- API: `/health`
- Client: `/health`
- Database connectivity
- WebSocket connectivity
- Response time

**Alert Conditions:**
- HTTP status != 200
- Response time > 2s
- Service unavailable

**Incident Response:**
1. Health check detects failure
2. GitHub issue created automatically
3. Slack notification sent (if configured)
4. On-call team alerted
5. Auto-healing triggered (optional)

### Prometheus Metrics

**Available at:** `http://localhost:5000/metrics`

**Metrics collected:**
- WebSocket connections
- Document operations
- HTTP request latency (p50, p95, p99)
- CPU and memory usage
- Event loop lag

### Grafana Dashboards

**Access:** http://localhost:3002 (admin/admin)

**Dashboards:**
- System Overview
- WebSocket Connections
- Database Performance
- HTTP Request Metrics
- Error Rates

## Configuration

### Required Secrets (GitHub)

**For CI/CD:**
```bash
ANTHROPIC_API_KEY          # Claude Code Review
```

**For Docker:**
```bash
DOCKER_USERNAME            # Docker Hub (optional)
DOCKER_PASSWORD            # Docker Hub (optional)
```

**For Deployment:**
```bash
AWS_ACCESS_KEY_ID          # AWS credentials
AWS_SECRET_ACCESS_KEY      # AWS credentials
AWS_ACCOUNT_ID             # AWS account
STAGING_DATABASE_URL       # Staging database
PRODUCTION_DATABASE_URL    # Production database
```

**For Release:**
```bash
NPM_TOKEN                  # NPM publishing (optional)
SEMANTIC_RELEASE_TOKEN     # GitHub token with write access
```

**For Monitoring:**
```bash
SNYK_TOKEN                 # Snyk security scanning (optional)
```

### Required Variables (GitHub)

```bash
AWS_REGION                 # e.g., us-east-1
SLACK_WEBHOOK_URL          # Slack notifications (optional)
```

### Environment Files

**`tools/.env`** (created by setup script):
```env
DATABASE_URL=postgresql://synccode_user:synccode_dev_password@localhost:5433/synccode_dev
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
JWT_SECRET=dev_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production
CORS_ORIGIN=http://localhost:3000
```

**`packages/client/.env.local`**:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

## Troubleshooting

### CI Pipeline Issues

**Build failures:**
```bash
# Check logs in GitHub Actions
gh run view --log

# Run locally
yarn build

# Clean and rebuild
./scripts/clean.sh
yarn install
yarn build
```

**Type errors:**
```bash
# Check server types
cd packages/server && npx tsc --noEmit

# Check client types
cd packages/client && npx tsc --noEmit
```

### Docker Build Issues

**Build cache issues:**
```bash
# Clear build cache
docker builder prune

# Build without cache
docker build --no-cache -f packages/server/Dockerfile .
```

**Multi-platform build issues:**
```bash
# Setup buildx
docker buildx create --use

# Build for specific platform
docker buildx build --platform linux/amd64 -f packages/server/Dockerfile .
```

### Database Migration Issues

**Migration failures:**
```bash
# Check migration status
npx prisma migrate status

# Reset database (DESTRUCTIVE)
npx prisma migrate reset

# Apply migrations manually
npx prisma migrate deploy
```

**Connection issues:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
docker exec -it collab-editor-postgres psql -U synccode_user -d synccode_dev

# View logs
docker logs collab-editor-postgres
```

### Deployment Issues

**ECS deployment stuck:**
```bash
# Check ECS service status
aws ecs describe-services --cluster production --services synccode-server

# Check task logs
aws ecs describe-tasks --cluster production --tasks <task-id>

# Force new deployment
aws ecs update-service --cluster production --service synccode-server --force-new-deployment
```

**Rollback deployment:**
```bash
# List previous task definitions
aws ecs list-task-definitions --family-prefix synccode-server

# Update service to previous version
aws ecs update-service \
  --cluster production \
  --service synccode-server \
  --task-definition synccode-server:previous-revision
```

### Health Check Failures

**False positives:**
```bash
# Check service manually
curl -v https://api.synccode.example.com/health

# Check from multiple locations
# Use https://downforeveryoneorjustme.com
```

**Investigate failures:**
```bash
# Check CloudWatch logs
aws logs tail /ecs/synccode-server --follow

# Check Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up

# Check Grafana dashboards
open http://localhost:3002
```

## Best Practices

### Commit Messages

Use conventional commits for automatic versioning:

```bash
# Feature
git commit -m "feat(auth): add OAuth2 support"

# Bug fix
git commit -m "fix(websocket): resolve connection timeout"

# Performance
git commit -m "perf(db): optimize query with index"

# Breaking change
git commit -m "feat(api)!: redesign user endpoints"
git commit -m "feat(api): redesign user endpoints

BREAKING CHANGE: User endpoints now return different format"
```

### Pull Requests

1. Create feature branch
2. Make changes with conventional commits
3. Run tests locally: `yarn test`
4. Create PR to `develop` (for features) or `main` (for hotfixes)
5. Wait for CI to pass
6. Request code review
7. Merge after approval

### Deployments

**To Staging:**
1. Merge to `develop` branch
2. Automatic deployment to staging
3. Verify in staging environment
4. Run smoke tests

**To Production:**
1. Merge to `main` branch (via PR from develop)
2. Create release tag: `git tag v1.0.0`
3. Push tag: `git push origin v1.0.0`
4. Approve production deployment
5. Monitor deployment
6. Verify health checks pass

### Monitoring

1. Set up Grafana alerts for critical metrics
2. Configure Slack webhook for notifications
3. Monitor health check workflow results
4. Review Prometheus metrics regularly
5. Set up PagerDuty for on-call rotation (optional)

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [AWS ECS Deployment](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)

## Support

For issues or questions:
1. Check this documentation
2. Review GitHub Actions logs
3. Check CLAUDE.md for project-specific guidance
4. Create an issue in GitHub
