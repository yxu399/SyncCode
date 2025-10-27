# SyncCode

A real-time collaborative code editor built with modern web technologies. Edit code together with your team in real-time with conflict resolution, authentication, and horizontal scaling support.

## Features

- **Real-time Collaboration** - Multiple users can edit the same document simultaneously
- **User Presence System** - See who's online with live cursor tracking, typing indicators, and activity status
- **Version-based Conflict Resolution** - Automatic conflict detection and resolution for concurrent edits
- **JWT Authentication** - Secure user authentication with access and refresh tokens
- **Horizontal Scaling** - Scale across multiple server instances with Redis Pub/Sub
- **Room-based Collaboration** - Create public or private rooms with role-based access control
- **Production Monitoring** - Built-in Prometheus metrics and Grafana dashboards
- **WebSocket Communication** - Low-latency real-time updates via Socket.IO
- **Type-safe** - Full TypeScript coverage across frontend and backend

## Tech Stack

### Backend
- **Node.js 20** with TypeScript
- **Express** for REST API
- **Socket.IO** for real-time WebSocket communication
- **Prisma ORM** with PostgreSQL database
- **Redis** for caching and Pub/Sub
- **InversifyJS** for dependency injection
- **JWT** for authentication
- **Prometheus** for metrics collection

### Frontend
- **React 18** with TypeScript
- **Socket.IO Client** for real-time communication
- **Nginx** for production serving

### DevOps
- **Docker** and Docker Compose
- **GitHub Actions** CI/CD
- **Semantic Release** for automated versioning
- **Grafana** for metrics visualization

## Prerequisites

- **Node.js** 20.8.1 or higher
- **Yarn** 1.22.x
- **Docker** and Docker Compose (for infrastructure)
- **PostgreSQL** 16 (via Docker or local)
- **Redis** 7 (via Docker or local)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/collaborative-editor.git
cd collaborative-editor
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Start Infrastructure (PostgreSQL, Redis, Prometheus, Grafana)

```bash
cd tools
docker-compose up -d
cd ..
```

### 4. Configure Environment

Copy the example environment file and configure:

```bash
cp tools/.env.example tools/.env
```

Required environment variables:
```bash
# Database
DATABASE_URL=postgresql://synccode_user:synccode_dev_password@localhost:5433/synccode_dev

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=development

# JWT Secrets (use strong secrets in production)
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

### 5. Setup Database

```bash
cd packages/server
npx prisma migrate dev
npx prisma generate
cd ../..
```

### 6. Start Development Servers

```bash
# Start both server and client in watch mode
yarn dev
```

Or start them individually:

```bash
# Terminal 1: Server (http://localhost:5000)
cd packages/server
yarn dev

# Terminal 2: Client (http://localhost:3000)
cd packages/client
yarn dev
```

### 7. Access the Application

- **Client**: http://localhost:3000
- **Server API**: http://localhost:5000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin)
- **Prisma Studio**: `cd packages/server && npx prisma studio`

## Project Structure

```
collaborative-editor/
├── packages/
│   ├── client/              # React frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── server/              # Node.js backend
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── middleware/
│   │   │   ├── container/   # DI container
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── shared/              # Shared TypeScript types
│       ├── src/
│       │   ├── types/
│       │   └── events/
│       └── package.json
├── tools/
│   ├── docker-compose.yml   # Infrastructure services
│   ├── prometheus.yml
│   └── grafana/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── CLAUDE.md                # AI assistant context
├── CONFLICT_RESOLUTION.md   # Conflict resolution spec
├── REDIS_PUBSUB.md         # Multi-server architecture
├── MONITORING.md           # Monitoring guide
└── README.md               # This file
```

## Available Scripts

### Root Level

```bash
yarn dev              # Start all services in development mode
yarn build            # Build all packages
yarn clean            # Clean build artifacts
```

### Server (`packages/server`)

```bash
yarn dev              # Start server with hot reload
yarn build            # Build TypeScript to dist/
yarn start            # Start production server
yarn prisma:migrate   # Run database migrations
yarn prisma:studio    # Open Prisma Studio GUI
```

### Client (`packages/client`)

```bash
yarn dev              # Start React dev server
yarn build            # Build production bundle
yarn start            # Serve production build
```

## Development Workflow

### 1. Creating a New Feature

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and test locally
yarn dev

# Build and verify
yarn build

# Commit using conventional commits
git commit -m "feat: add new feature description"

# Push and create PR
git push origin feature/my-feature
```

### 2. Database Changes

When modifying the database schema:

```bash
cd packages/server

# Edit prisma/schema.prisma
# Then create and apply migration
npx prisma migrate dev --name describe_your_changes

# Generate Prisma Client
npx prisma generate
```

### 3. Adding Shared Types

When adding types used by both client and server:

```bash
# Add types to packages/shared/src/types/
cd packages/shared
yarn build

# Other packages will automatically use the updated types
```

## Docker Deployment

### Build Docker Images

```bash
# Build server image
docker build -f packages/server/Dockerfile -t synccode-server:latest .

# Build client image
docker build -f packages/client/Dockerfile -t synccode-client:latest .
```

### Run with Docker Compose

```bash
# Start all services (app + infrastructure)
docker-compose -f tools/docker-compose.yml up -d

# View logs
docker-compose -f tools/docker-compose.yml logs -f

# Stop all services
docker-compose -f tools/docker-compose.yml down
```

## Testing Multi-Server Setup

To test horizontal scaling with Redis Pub/Sub:

```bash
# Terminal 1: Start server on port 5001
cd packages/server
PORT=5001 yarn dev

# Terminal 2: Start server on port 5002
PORT=5002 yarn dev

# Terminal 3: Run multi-server test
node test-multi-server.js
```

Clients connected to different server instances will see each other's edits in real-time via Redis Pub/Sub.

## Monitoring

### Prometheus Metrics

The server exposes metrics at `http://localhost:5000/metrics`:

- WebSocket connection counts
- Document operation counts
- HTTP request latency (p50, p95, p99)
- CPU and memory usage
- Event loop lag

### Grafana Dashboards

1. Open Grafana: http://localhost:3002
2. Login: admin/admin
3. Navigate to "SyncCode Dashboard"

Pre-configured panels show:
- Active connections over time
- Document operations rate
- HTTP latency percentiles
- System resource usage

## API Documentation

### Authentication Endpoints

```bash
# Sign up
POST /auth/signup
Body: { "email": "user@example.com", "username": "user", "password": "password" }

# Login
POST /auth/login
Body: { "email": "user@example.com", "password": "password" }

# Refresh token
POST /auth/refresh
Body: { "refreshToken": "..." }

# Get current user
GET /auth/me
Headers: { "Authorization": "Bearer <access_token>" }

# Logout
POST /auth/logout
Headers: { "Authorization": "Bearer <access_token>" }
```

### WebSocket Events

```javascript
// Client to Server
socket.emit('document:join', { documentId: 'doc-id' });
socket.emit('document:edit', { lineNumber: 1, content: 'new content', version: 5 });
socket.emit('cursor:move', { line: 1, column: 10 });

// Server to Client
socket.on('document:load', (document) => { /* ... */ });
socket.on('document:update', (update) => { /* ... */ });
socket.on('document:conflict-detected', (conflict) => { /* ... */ });
socket.on('user:joined', (user) => { /* ... */ });
socket.on('cursor:update', (cursor) => { /* ... */ });
```

## Architecture

### Dependency Injection

The server uses InversifyJS for dependency injection:

```typescript
// Controllers → Services → Repositories → External Systems

@injectable()
class DocumentService {
  constructor(
    @inject(TYPES.DocumentRepository) private repo: IDocumentRepository,
    @inject(TYPES.CacheService) private cache: ICacheService
  ) {}
}
```

All dependencies are configured in `src/container/container.ts`.

### Conflict Resolution

Version-based optimistic concurrency control:

1. Each document has a `version` number
2. Client sends edit with their known `clientVersion`
3. Server compares to current `serverVersion`
4. If versions match: apply edit, increment version
5. If mismatch: reject edit, emit `document:conflict-detected`

See `CONFLICT_RESOLUTION.md` for detailed specification.

### Multi-Server Coordination

Redis Pub/Sub enables horizontal scaling:

- Each server instance connects to Redis
- Socket.IO uses `@socket.io/redis-adapter`
- Events broadcast across all instances
- Clients can connect to any server

See `REDIS_PUBSUB.md` for architecture details.

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Access token secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

## CI/CD Pipeline

GitHub Actions workflows:

### CI Pipeline (`.github/workflows/ci.yml`)
- Code quality checks (TypeScript, linting)
- Build all packages
- Database tests with PostgreSQL and Redis
- Matrix builds for shared, server, client

### Release Pipeline (`.github/workflows/release.yml`)
- Semantic versioning with conventional commits
- Automated CHANGELOG generation
- GitHub release creation
- Docker image builds
- Slack notifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit using conventional commits:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code refactoring
   - `test:` for test additions
   - `chore:` for maintenance tasks
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Write meaningful commit messages
- Document public APIs
- Add tests for new features

## Troubleshooting

### Yarn Workspace Issues

If you see workspace-related errors:
```bash
# Clean and reinstall
rm -rf node_modules packages/*/node_modules
yarn install
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
cd packages/server
npx prisma db pull
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Port Conflicts

If ports are already in use, modify in:
- Server: `tools/.env` → `PORT=5000`
- Client: `packages/client/package.json` → `start` script
- PostgreSQL: `tools/docker-compose.yml` → `5433:5432`
- Redis: `tools/docker-compose.yml` → `6379:6379`

## Performance

- **Horizontal Scaling**: Add more server instances behind a load balancer
- **Redis Caching**: Active documents cached for fast access
- **Connection Pooling**: Prisma connection pooling for database efficiency
- **Lazy Loading**: Documents loaded on-demand, not preloaded
- **Metrics-driven**: Prometheus metrics identify bottlenecks

## Security

- **Password Hashing**: Bcrypt with 10 rounds
- **JWT Tokens**: Short-lived access tokens (15m), refresh tokens (7d)
- **Environment Secrets**: Never commit `.env` files
- **Input Validation**: Validate all user inputs
- **CORS Configuration**: Restrict origins in production
- **Rate Limiting**: Add rate limiting middleware for production
- **SQL Injection**: Prisma ORM prevents SQL injection
- **XSS Protection**: React escapes output by default

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/collaborative-editor/issues)
- **Documentation**: See `docs/` folder for detailed guides
- **User Presence System**: See `PRESENCE.md`
- **Monitoring Guide**: See `MONITORING.md`
- **Conflict Resolution**: See `CONFLICT_RESOLUTION.md`
- **Redis Pub/Sub**: See `REDIS_PUBSUB.md`

## Acknowledgments

Built with:
- [Socket.IO](https://socket.io/)
- [Prisma](https://www.prisma.io/)
- [React](https://react.dev/)
- [Express](https://expressjs.com/)
- [InversifyJS](https://inversify.io/)
- [Redis](https://redis.io/)

---

**SyncCode** - Collaborate in real-time, code together.
