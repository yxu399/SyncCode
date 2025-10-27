# GitHub Actions Workflows

Quick reference for all automated workflows in this repository.

## Workflows Overview

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **CI Pipeline** | Push/PR | Build, test, type check | ~5 min |
| **Docker Build** | Push/Tag | Build and scan Docker images | ~10 min |
| **Deploy Staging** | Push to develop | Deploy to staging environment | ~8 min |
| **Deploy Production** | Tag (v*) | Deploy to production | ~15 min |
| **Release** | Push to main | Create semantic release | ~3 min |
| **Health Check** | Schedule (15m) | Monitor service health | ~1 min |
| **Code Review** | PR | AI-powered code review | ~2 min |

## Quick Commands

### Trigger Workflows Manually

```bash
# CI Pipeline
gh workflow run ci.yml

# Docker Build
gh workflow run docker-build.yml

# Deploy to Staging
gh workflow run deploy-staging.yml

# Deploy to Production (requires approval)
gh workflow run deploy-production.yml -f version=v1.0.0

# Health Check
gh workflow run health-check.yml -f environment=production

# Release
gh workflow run release.yml
```

### View Workflow Status

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log

# Watch running workflow
gh run watch
```

### Cancel Running Workflow

```bash
gh run cancel <run-id>
```

## Workflow Details

### CI Pipeline (`ci.yml`)

**Runs on:**
- Every push to `main` or `develop`
- Every pull request

**Jobs:**
- Code quality checks
- TypeScript type checking
- Security audit
- Package building
- Database tests

**Artifacts:**
- Build outputs (7 days retention)

### Docker Build & Push (`docker-build.yml`)

**Runs on:**
- Push to `main` or `develop`
- New version tags
- Docker file changes

**Outputs:**
- Multi-platform Docker images
- Security scan results (SARIF)
- SBOM (Software Bill of Materials)

**Images:**
- `ghcr.io/{owner}/{repo}-server:{tag}`
- `ghcr.io/{owner}/{repo}-client:{tag}`

### Deploy Staging (`deploy-staging.yml`)

**Runs on:**
- Push to `develop` branch

**Steps:**
1. Pre-deployment tests
2. Database migration
3. ECS service update
4. Post-deployment verification
5. Notification

**Environment:** staging

### Deploy Production (`deploy-production.yml`)

**Runs on:**
- New tags matching `v*.*.*`
- Manual trigger

**Features:**
- Manual approval required
- Database backup before migration
- Blue-green deployment
- Automatic rollback on failure

**Environment:** production

### Release (`release.yml`)

**Runs on:**
- Push to `main` branch

**Creates:**
- Semantic version tag
- CHANGELOG.md update
- GitHub release
- Triggers Docker build

**Versioning:**
- `feat:` → Minor (1.0.0 → 1.1.0)
- `fix:` → Patch (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → Major (1.0.0 → 2.0.0)

### Health Check (`health-check.yml`)

**Runs on:**
- Schedule (every 15 minutes)
- Manual trigger

**Monitors:**
- API health endpoint
- Client health endpoint
- Response times
- Database connectivity

**Alerts:**
- GitHub issues
- Slack notifications

## Environment Variables

Configure in: Settings → Secrets and variables → Actions

### Secrets

```
ANTHROPIC_API_KEY          # For Claude Code Review
AWS_ACCESS_KEY_ID          # AWS deployment
AWS_SECRET_ACCESS_KEY      # AWS deployment
AWS_ACCOUNT_ID             # AWS account number
STAGING_DATABASE_URL       # Staging DB connection
PRODUCTION_DATABASE_URL    # Production DB connection
SNYK_TOKEN                 # Security scanning (optional)
NPM_TOKEN                  # NPM publishing (optional)
```

### Variables

```
AWS_REGION                 # AWS region (e.g., us-east-1)
SLACK_WEBHOOK_URL          # Slack notifications (optional)
```

## Common Issues

### Build Failures

**Type errors:**
```bash
# Run type check locally
cd packages/server && npx tsc --noEmit
cd packages/client && npx tsc --noEmit
```

**Dependency issues:**
```bash
# Clean and reinstall
yarn cache clean
rm -rf node_modules
yarn install
```

### Deployment Failures

**Migration errors:**
```bash
# Check migration status
cd packages/server
npx prisma migrate status
```

**ECS service issues:**
```bash
# Check service status
aws ecs describe-services --cluster <cluster> --services <service>
```

### Docker Build Failures

**Cache issues:**
```bash
# Clear Docker cache
docker builder prune
```

**Multi-platform issues:**
```bash
# Setup buildx
docker buildx create --use
```

## Best Practices

1. **Always** use conventional commits for automatic versioning
2. **Test** changes locally before pushing
3. **Review** CI logs for failed jobs
4. **Monitor** health checks after deployments
5. **Document** any workflow changes in this file

## Workflow Badges

Add to README.md:

```markdown
![CI](https://github.com/{owner}/{repo}/actions/workflows/ci.yml/badge.svg)
![Docker](https://github.com/{owner}/{repo}/actions/workflows/docker-build.yml/badge.svg)
![Deploy](https://github.com/{owner}/{repo}/actions/workflows/deploy-production.yml/badge.svg)
```

## Debugging Workflows

### Enable Debug Logging

1. Go to Settings → Secrets
2. Add secret: `ACTIONS_RUNNER_DEBUG` = `true`
3. Add secret: `ACTIONS_STEP_DEBUG` = `true`
4. Re-run workflow

### Download Artifacts

```bash
gh run download <run-id>
```

### View Workflow Syntax

```bash
# Validate workflow syntax
action-validator .github/workflows/*.yml
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub CLI](https://cli.github.com/manual/)
- [AUTOMATION.md](../../AUTOMATION.md) - Detailed automation guide
