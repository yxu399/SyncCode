# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SyncCode is a real-time collaborative code editor built with TypeScript, Node.js, Express, Socket.IO, React, PostgreSQL, Redis, Docker, and Prometheus/Grafana monitoring. It features JWT-based authentication, version-based conflict resolution, horizontal scaling via Redis Pub/Sub, and production monitoring.

## Monorepo Structure

This is a **Yarn workspaces** monorepo with three packages:

- **@collab/server**: Node.js backend (Express + Socket.IO + Prisma + Redis)
- **@collab/client**: React frontend (Socket.IO client)
- **@collab/shared**: Shared TypeScript types and utilities

All packages reference each other using `workspace:*` protocol.

## Essential Commands

### Development

```bash
# Start all services (server + client in watch mode)
yarn dev

# Start only the server
cd packages/server && yarn dev

# Start only the client
cd packages/client && yarn dev

# Build all packages
yarn build

# Build single package
cd packages/server && yarn build
```

### Infrastructure

```bash
# Start PostgreSQL, Redis, Prometheus, Grafana
cd tools && docker-compose up -d

# Stop all containers
cd tools && docker-compose down

# View container logs
docker logs -f collab-editor-postgres
docker logs -f collab-editor-redis
docker logs -f collab-editor-prometheus
docker logs -f collab-editor-grafana
```

### Database

```bash
# Run migrations (creates/updates database schema)
cd packages/server && npx prisma migrate dev

# Reset database (DESTRUCTIVE - deletes all data)
cd packages/server && npx prisma migrate reset --force

# Generate Prisma client after schema changes
cd packages/server && npx prisma generate

# Open Prisma Studio (GUI for database)
cd packages/server && npx prisma studio
```

### Production

```bash
# Build and start production server
cd packages/server && yarn build && yarn start

# Check metrics endpoint
curl http://localhost:5000/metrics

# Access monitoring
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002 (admin/admin)
```

## Architecture Overview

### Dependency Injection Pattern

The server uses **InversifyJS** for dependency injection:

- **Container**: `src/container/container.ts` - registers all services, repositories, and controllers
- **Types**: `src/container/types.ts` - defines symbols for dependency resolution
- **Usage**: All classes are decorated with `@injectable()` and injected with `@inject(TYPES.ServiceName)`

**Key Pattern**: Controllers and services never instantiate dependencies directly. The container manages all object creation and lifecycle.

### Layered Architecture

```
Controllers (Socket.IO/Express handlers)
    ↓ inject
Services (Business logic)
    ↓ inject
Repositories (Data access)
    ↓ use
External Systems (PostgreSQL via Prisma, Redis)
```

**Important**: Always follow this layering. Controllers call services, services call repositories. Never skip layers (e.g., controller → repository directly).

### Real-Time Communication Flow

1. **Client** connects via Socket.IO to any server instance
2. **SocketController** handles events (join room, edit document, cursor updates)
3. **DocumentService** processes business logic, checks for conflicts
4. **Redis Cache** stores active documents for fast access
5. **Redis Pub/Sub** (via @socket.io/redis-adapter) broadcasts events to all server instances
6. **All servers** emit to their locally connected clients

**Critical**: Events must be emitted to `io.to(roomId)` not `socket.emit()` to work with Redis Pub/Sub.

## Key Subsystems

### Authentication (JWT + Bcrypt)

- **Routes**: `src/routes/auth.ts` - /auth/signup, /auth/login, /auth/refresh, /auth/logout, /auth/me
- **Service**: `src/services/AuthService.ts` - handles signup, login, token generation
- **Middleware**: `src/middleware/auth.ts` - `authenticate` and `optionalAuthenticate`
- **Tokens**:
  - Access token (15 min) - for API authentication
  - Refresh token (7 days) - stored in database for session management

**Important**: Always hash passwords with bcrypt (10 rounds). Never log tokens. Use refresh tokens for persistent sessions.

### Version-Based Conflict Resolution

- **Implementation**: `src/services/DocumentService.ts:updateLine()`
- **Flow**:
  1. Client sends edit with `clientVersion`
  2. Server compares to `serverVersion`
  3. If `clientVersion < serverVersion`: reject, emit `document:conflict-detected`
  4. If versions match: apply edit, increment version
- **Events**:
  - `document:conflict-detected` - conflict details + current document
  - `document:sync-required` - client must resync

**See**: `CONFLICT_RESOLUTION.md` for full specification

### Redis Pub/Sub for Multi-Server Coordination

- **Setup**: `src/index.ts:setupRedisPubSub()`
- **Adapter**: `@socket.io/redis-adapter` with dedicated pub/sub clients
- **Purpose**: Enables horizontal scaling - multiple server instances coordinate via Redis
- **Testing**: `packages/server/test-multi-server.js` - test script for multi-server setup

**Important**: Pub/sub clients are SEPARATE from cache client. Don't reuse connections.

**See**: `REDIS_PUBSUB.md` for architecture and deployment guide

### Prometheus Metrics & Grafana Dashboards

- **Service**: `src/services/MetricsService.ts` - collects all metrics
- **Endpoint**: `GET /metrics` - Prometheus scrape target
- **Integration**:
  - Socket.IO events tracked in `src/controllers/SocketController.ts`
  - HTTP requests tracked via middleware in `src/index.ts`
- **Infrastructure**: `tools/prometheus.yml`, `tools/docker-compose.yml`
- **Dashboard**: `tools/grafana/provisioning/dashboards/synccode-dashboard.json`

**Metrics collected**: WebSocket connections, document operations, HTTP latency (p50/p95), CPU, memory, event loop lag

**See**: `MONITORING.md` for comprehensive monitoring guide

## Database Schema (Prisma)

**Location**: `packages/server/prisma/schema.prisma`

**Models**:
- **User**: Authentication (email, username, passwordHash)
- **Room**: Collaboration spaces (name, ownerId, isPublic, maxUsers)
- **RoomMember**: User-Room relationship with roles (OWNER, EDITOR, VIEWER)
- **RefreshToken**: JWT refresh tokens (token, userId, expiresAt)

**After schema changes**: Always run `npx prisma migrate dev --name <description>`

## Configuration

### Environment Variables

**Location**: `tools/.env` (loaded by `src/config/environment.ts`)

**Required variables**:
```bash
DATABASE_URL=postgresql://synccode_user:synccode_dev_password@localhost:5433/synccode_dev
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

**Important**: Config is loaded at server startup. Changes require restart.

## Type System

### Shared Types

**Location**: `packages/shared/src/types/`

- **document.ts**: `Document`, `LineEdit`, `ConflictError`, `ConflictResolution`
- **auth.ts**: `LoginCredentials`, `SignupCredentials`, `AuthResponse`, `AccessTokenPayload`
- **room.ts**: Room and membership types
- **user.ts**: User types

### Socket.IO Events

**Location**: `packages/shared/src/events/index.ts`

**Pattern**: Type-safe Socket.IO with `ServerToClientEvents` and `ClientToServerEvents` interfaces

**Important**: When adding new events, update both interfaces and ensure type safety.

## Common Patterns

### Adding a New Service

1. Create interface in `src/services/interfaces/IMyService.ts`
2. Implement in `src/services/MyService.ts` with `@injectable()` decorator
3. Add symbol to `src/container/types.ts`: `MyService: Symbol.for('MyService')`
4. Register in `src/container/container.ts`: `container.bind<IMyService>(TYPES.MyService).to(MyService).inSingletonScope()`
5. Inject via constructor: `@inject(TYPES.MyService) private myService: IMyService`

### Adding a New Repository

Same pattern as services. All repositories extend interfaces in `src/repositories/interfaces/`.

**Important**: Repositories should be stateless and only handle data access.

### Adding a New Socket.IO Event

1. Add event types to `packages/shared/src/events/index.ts`
2. Handle in `src/controllers/SocketController.ts:setupSocketHandlers()`
3. Add metrics tracking: `this.metricsService.trackSocketEvent('event-name')`
4. Use timer for duration: `const endTimer = this.metricsService.startSocketEventTimer('event-name'); ... endTimer();`

## Testing Multi-Server Setup

```bash
# Terminal 1: Start server on port 5001
cd packages/server && PORT=5001 yarn dev

# Terminal 2: Start server on port 5002
cd packages/server && PORT=5002 yarn dev

# Terminal 3: Run test
cd packages/server && node test-multi-server.js
```

**Expected**: Clients on different servers can see each other's edits via Redis Pub/Sub

## Production Deployment Considerations

1. **Redis Persistence**: Use `redis-server --appendonly yes` for data durability
2. **Redis Pub/Sub**: Requires Redis Sentinel or Cluster for HA in production
3. **JWT Secrets**: Use strong secrets in production, rotate regularly
4. **Database Migrations**: Run `npx prisma migrate deploy` in production (non-interactive)
5. **Monitoring**: Prometheus scrapes `/metrics` every 5 seconds, Grafana visualizes
6. **Load Balancer**: Use Nginx with `ip_hash` for sticky sessions (optional but recommended)

## Documentation Files

- **CONFLICT_RESOLUTION.md**: Version-based concurrency control specification
- **REDIS_PUBSUB.md**: Multi-server coordination architecture and deployment
- **MONITORING.md**: Prometheus/Grafana setup and metrics reference
- **ROADMAP.md**: Project implementation status and timeline

## Important Notes

- **Redis is required**: Server will fail to start if Redis is not running
- **PostgreSQL is required**: Database must be running and migrated
- **Build before production**: Always run `yarn build` before `yarn start`
- **Shared package changes**: Rebuild shared package after type changes (`cd packages/shared && yarn build`)
- **Port conflicts**: Default ports are 5000 (server), 3000 (client), 5433 (postgres), 6379 (redis), 9090 (prometheus), 3002 (grafana)

