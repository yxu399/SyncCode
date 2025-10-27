# Quick Start Guide

Get SyncCode up and running in under 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Yarn** - `npm install -g yarn`
- **Docker & Docker Compose** - [Download](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/)

## Quick Setup (Automated)

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/yourusername/collaborative-editor.git
cd collaborative-editor

# Run automated setup
./scripts/setup-dev.sh

# Start development servers
yarn dev
```

That's it! Your development environment is ready.

## Manual Setup

If you prefer step-by-step:

### 1. Install Dependencies

```bash
yarn install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, Prometheus, Grafana
yarn docker:up

# Verify services are running
docker ps
```

### 3. Setup Database

```bash
# Run migrations
yarn db:migrate

# (Optional) Open Prisma Studio to view database
yarn db:studio
```

### 4. Build Packages

```bash
# Build all packages
yarn build
```

### 5. Start Development

```bash
# Start both client and server
yarn dev
```

## Access Your Application

Once running, access:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Client** | http://localhost:3000 | - |
| **API** | http://localhost:5000 | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3002 | admin/admin |
| **Database UI** | Run `yarn db:studio` | - |

## Verify Installation

### Test API Health

```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

### Test WebSocket Connection

Open http://localhost:3000 in your browser and check the console for connection messages.

### View Metrics

```bash
curl http://localhost:5000/metrics
# Expected: Prometheus metrics output
```

## Common Commands

### Development

```bash
# Start development servers
yarn dev

# Build all packages
yarn build

# Run type checking
yarn typecheck

# Clean build artifacts
yarn clean
```

### Database

```bash
# Create new migration
yarn db:migrate

# Open database GUI
yarn db:studio

# Reset database (DESTRUCTIVE)
yarn db:reset

# Deploy migrations (production)
yarn db:migrate:deploy
```

### Docker

```bash
# Build Docker images locally
yarn docker:build

# Start infrastructure services
yarn docker:up

# Stop infrastructure services
yarn docker:down

# View logs
yarn docker:logs

# Build specific image
yarn docker:build:server
yarn docker:build:client
```

### Testing & CI

```bash
# Run all tests (when implemented)
yarn test

# Run CI checks locally
yarn ci
```

## Development Workflow

### 1. Create a Feature

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature
```

### 2. Test Locally

```bash
# Type check
yarn typecheck

# Build
yarn build

# Run tests (when implemented)
yarn test
```

### 3. Create Pull Request

```bash
# Using GitHub CLI
gh pr create --title "Add my feature" --body "Description of changes"

# Or use GitHub web interface
```

### 4. CI Pipeline Runs

The following checks run automatically:
- ✓ Type checking
- ✓ Build verification
- ✓ Database tests
- ✓ Security audit
- ✓ Docker image build (on merge)

### 5. Deploy

**To Staging:**
- Merge to `develop` branch
- Automatic deployment to staging
- Health checks run automatically

**To Production:**
- Create release tag: `git tag v1.0.0`
- Push tag: `git push origin v1.0.0`
- Approve production deployment in GitHub Actions
- Monitor health checks

## Project Structure

```
collaborative-editor/
├── .github/workflows/      # CI/CD workflows
├── packages/
│   ├── shared/            # Shared TypeScript types
│   ├── server/            # Node.js + Express + Socket.IO backend
│   └── client/            # React frontend
├── tools/                 # Docker compose and configs
│   ├── docker-compose.yml # Infrastructure services
│   └── .env               # Environment variables
├── scripts/               # Automation scripts
│   ├── setup-dev.sh       # Development setup
│   └── clean.sh           # Clean build artifacts
└── AUTOMATION.md          # Detailed automation guide
```

## Environment Configuration

### Development

Environment files are created automatically by `setup-dev.sh`:

**`tools/.env`**:
```env
DATABASE_URL=postgresql://synccode_user:synccode_dev_password@localhost:5433/synccode_dev
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
JWT_SECRET=dev_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production
```

**`packages/client/.env.local`**:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

### Production

Set environment variables in your deployment platform (AWS ECS, Kubernetes, etc.):

```env
DATABASE_URL=<production-database-url>
REDIS_URL=<production-redis-url>
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
NODE_ENV=production
PORT=5000
```

## Troubleshooting

### Port Already in Use

If ports 3000, 5000, 5433, 6379, 9090, or 3002 are in use:

```bash
# Check what's using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change ports in tools/.env
```

### Docker Services Won't Start

```bash
# Check Docker is running
docker info

# Restart Docker Desktop (macOS/Windows)
# Or restart Docker daemon (Linux)

# Check logs
docker logs collab-editor-postgres
docker logs collab-editor-redis
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection manually
docker exec -it collab-editor-postgres psql -U synccode_user -d synccode_dev

# Restart PostgreSQL
docker restart collab-editor-postgres
```

### Build Errors

```bash
# Clean everything
yarn clean

# Remove node_modules
rm -rf node_modules packages/*/node_modules

# Reinstall
yarn install

# Rebuild
yarn build
```

### Type Errors

```bash
# Rebuild shared package first
cd packages/shared
yarn build

# Then check server
cd ../server
npx tsc --noEmit

# Then check client
cd ../client
npx tsc --noEmit
```

## Next Steps

Now that you're set up:

1. **Read the Architecture**: Check `CLAUDE.md` for architecture details
2. **Explore the Code**: Start with `packages/server/src/index.ts`
3. **Review Automation**: Read `AUTOMATION.md` for CI/CD details
4. **Check Monitoring**: Open Grafana at http://localhost:3002
5. **Make Changes**: Create a feature branch and start coding!

## Useful Resources

- [CLAUDE.md](./CLAUDE.md) - Project architecture and conventions
- [AUTOMATION.md](./AUTOMATION.md) - CI/CD and automation guide
- [ROADMAP.md](./ROADMAP.md) - Project roadmap and status
- [MONITORING.md](./MONITORING.md) - Monitoring and metrics guide
- [Prisma Docs](https://www.prisma.io/docs) - Database ORM
- [Socket.IO Docs](https://socket.io/docs) - Real-time communication
- [React Docs](https://react.dev) - Frontend framework

## Getting Help

- **Issues**: Create a GitHub issue
- **Questions**: Check existing issues or documentation
- **Contributing**: See `CONTRIBUTING.md` (if available)

## What's Next?

### Implement Testing

```bash
# Add Jest or Vitest
# Create test files: *.test.ts
# Run: yarn test
```

### Add Linting

```bash
# Add ESLint
yarn add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Add Prettier
yarn add -D prettier

# Configure and run
yarn lint:check
```

### Deploy to Cloud

1. Set up AWS account
2. Configure GitHub Secrets
3. Push to develop → Deploy to staging
4. Tag release → Deploy to production

### Monitor Production

1. Configure Grafana alerts
2. Set up Slack notifications
3. Review health check results
4. Monitor Prometheus metrics

---

**Happy coding!** 🚀

For detailed information, see [AUTOMATION.md](./AUTOMATION.md)
