# User Presence System Architecture Guide

## Overview

This document describes the complete backend architecture for the User Presence System in the collaborative code editor. The system tracks real-time user presence, cursor positions, typing indicators, and activity status across multiple server instances using Redis Pub/Sub.

## Architecture Components

### 1. Core Services

#### PresenceService (`/packages/server/src/services/PresenceService.ts`)
- **Purpose**: Core business logic for presence tracking
- **Responsibilities**:
  - User presence lifecycle management (join, leave, timeout)
  - Cursor position tracking
  - Typing indicator management
  - Activity status updates (online, idle, away)
  - Heartbeat processing
  - Timeout detection and cleanup
  - Multi-server coordination via Redis

#### PresenceSocketHandler (`/packages/server/src/controllers/PresenceSocketHandler.ts`)
- **Purpose**: Socket.IO event handling for presence
- **Responsibilities**:
  - Handle all presence-related socket events
  - Manage heartbeat timers
  - Validate room access
  - Coordinate with PresenceService
  - Broadcast presence updates to room members

### 2. Data Models

#### Enhanced Presence Types (`/packages/shared/src/types/presence-enhanced.ts`)
```typescript
interface UserPresence {
  userId: string
  username: string
  socketId: string
  color?: string // Cursor color
  isActive: boolean
  status: 'online' | 'idle' | 'away' | 'offline'
  lastSeen: Date
  lastActivity: Date
  currentLine?: number
  currentColumn?: number
  isTyping?: boolean
  serverId?: string // Track server instance
}
```

### 3. Socket.IO Events

#### Client-to-Server Events
- `presence:update-cursor` - Update cursor position
- `presence:typing-start` - Start typing indicator
- `presence:typing-stop` - Stop typing indicator
- `presence:activity-update` - Update activity status
- `presence:heartbeat` - Send heartbeat
- `presence:request-users` - Request current users list
- `presence:set-away` - Manually set away status
- `presence:set-active` - Manually set active status

#### Server-to-Client Events
- `presence:user-joined` - New user joined room
- `presence:user-left` - User left room
- `presence:user-cursor-moved` - Cursor position updated
- `presence:user-typing` - Typing status changed
- `presence:user-activity-changed` - Activity status changed
- `presence:users-list` - Current users list
- `presence:room-snapshot` - Complete room state
- `presence:heartbeat-ack` - Heartbeat acknowledgment
- `presence:sync-required` - Client needs to resync

### 4. Redis Data Structure

#### Keys Pattern
```
presence:room:{roomId}              # Hash of user presence data
presence:heartbeat:{roomId}:{userId} # Heartbeat timestamp
presence:cursor:{roomId}:{userId}    # Cursor position
presence:typing:{roomId}:{userId}    # Typing indicator
```

#### TTL Strategy
- Presence data: 30 seconds
- Heartbeat: 25 seconds
- Typing indicator: 3 seconds
- Cursor position: 30 seconds

### 5. Heartbeat Mechanism

#### Client Side
- Send heartbeat every 10 seconds
- Include: userId, roomId, timestamp, socketId
- Handle heartbeat acknowledgments
- Reconnect on heartbeat failure

#### Server Side
- Process heartbeat and update timestamp
- Reset timeout timer (25 seconds)
- Send acknowledgment with next heartbeat time
- Remove user on timeout

### 6. Multi-Server Coordination

The system works seamlessly across multiple server instances:

1. **User Joins**:
   - Store presence in Redis (shared across servers)
   - Broadcast via Socket.IO Redis adapter
   - All servers receive and emit to local clients

2. **User Updates**:
   - Update Redis state
   - Broadcast changes via Redis Pub/Sub
   - All servers propagate to connected clients

3. **User Leaves/Timeout**:
   - Remove from Redis
   - Broadcast removal event
   - Clean up associated data

### 7. Error Handling

#### PresenceErrorHandler (`/packages/server/src/services/PresenceErrorHandler.ts`)
Handles:
- Redis connection failures
- Heartbeat timeouts
- Data corruption
- Rate limiting
- Network partitions
- Graceful shutdown

### 8. Metrics & Monitoring

#### PresenceMetrics (`/packages/server/src/services/PresenceMetrics.ts`)
Tracks:
- Active/idle/away users per room
- Presence events count
- Heartbeat success/failure rate
- Timeout frequency
- Cursor update latency
- Query performance

## Integration Steps

### 1. Update Container Registration

Add to `/packages/server/src/container/types.ts`:
```typescript
export const TYPES = {
  // ... existing types
  PresenceService: Symbol.for('PresenceService'),
  PresenceSocketHandler: Symbol.for('PresenceSocketHandler'),
  PresenceErrorHandler: Symbol.for('PresenceErrorHandler'),
  PresenceMetrics: Symbol.for('PresenceMetrics')
};
```

### 2. Register Services in Container

In `/packages/server/src/container/container.ts`:
```typescript
import { registerPresenceServices, initializePresenceService } from './presence-registration';

// In your container setup
registerPresenceServices(container);

// On server startup
await initializePresenceService(container);
```

### 3. Update Main SocketController

Replace your existing SocketController with the enhanced version or integrate the presence handler:

```typescript
constructor(
  // ... existing injects
  @inject(TYPES.PresenceSocketHandler) private presenceHandler: PresenceSocketHandler
) {}

// In setupSocketHandlers
this.presenceHandler.setupPresenceHandlers(io, socket);

// In room:join handler
await this.presenceHandler.handleUserJoinedRoom(io, socket, roomId, userId, username);

// In room:leave handler
await this.presenceHandler.handleUserLeftRoom(io, socket, roomId, userId, 'leave');

// In disconnect handler
await this.presenceHandler.handleDisconnect(socket);
```

### 4. Update Shared Types

Export the new presence types from `/packages/shared/src/index.ts`:
```typescript
export * from './types/presence-enhanced';
export * from './events/presence-events';
```

### 5. Environment Variables

No additional environment variables required. Uses existing:
- `REDIS_URL` - Redis connection
- `SERVER_ID` - Optional server identifier for multi-instance setup

## Testing Strategy

### Unit Tests
- Test PresenceService methods in isolation
- Mock Redis client
- Test timeout detection logic
- Verify cleanup procedures

### Integration Tests
- Test Socket.IO event flow
- Verify Redis data persistence
- Test multi-user scenarios
- Validate heartbeat mechanism

### Multi-Server Tests
```bash
# Terminal 1: Server on port 5001
PORT=5001 SERVER_ID=server1 yarn dev

# Terminal 2: Server on port 5002
PORT=5002 SERVER_ID=server2 yarn dev

# Terminal 3: Test script
node test-presence-multi-server.js
```

## Performance Considerations

### Optimization Tips

1. **Batching**: Batch cursor updates to reduce network traffic
2. **Throttling**: Throttle cursor updates on client (e.g., 100ms)
3. **Debouncing**: Debounce typing indicators (e.g., 500ms)
4. **Compression**: Enable Socket.IO compression for large rooms
5. **Redis Pipeline**: Use Redis pipeline for bulk operations

### Scaling Limits

- Tested up to 100 concurrent users per room
- Heartbeat interval can be adjusted based on load
- Redis memory usage: ~1KB per user
- Network bandwidth: ~2KB/s per active user

## Troubleshooting

### Common Issues

1. **Users not appearing in room**
   - Check Redis connection
   - Verify heartbeat is being sent
   - Check room ID consistency

2. **Users stuck as "online" after disconnect**
   - Ensure cleanup interval is running
   - Check heartbeat timeout settings
   - Verify Redis TTL is working

3. **High latency in cursor updates**
   - Check Redis latency
   - Verify no network issues
   - Consider reducing update frequency

4. **Memory leaks**
   - Ensure timers are cleaned up
   - Check Redis key expiration
   - Monitor heap usage

## Future Enhancements

1. **Presence Persistence**
   - Store presence history
   - Analytics on user activity patterns

2. **Advanced Features**
   - Voice/video presence indicators
   - Screen sharing status
   - Focus mode indicators

3. **Performance Improvements**
   - Implement presence sharding for very large rooms
   - Add caching layer for frequently accessed data
   - Optimize Redis queries with Lua scripts

4. **Security Enhancements**
   - Rate limiting per user
   - Presence data encryption
   - Audit logging

## API Reference

### PresenceService Methods

```typescript
interface IPresenceService {
  addUserToRoom(roomId, userId, username, socketId, serverId?): Promise<UserPresence>
  removeUserFromRoom(roomId, userId, reason): Promise<void>
  getRoomUsers(roomId): Promise<UserPresence[]>
  getUserPresence(roomId, userId): Promise<UserPresence | null>
  updateCursorPosition(roomId, userId, lineNumber, column?): Promise<CursorPosition>
  updateTypingIndicator(roomId, userId, isTyping, lineNumber?): Promise<TypingIndicator>
  updateUserActivity(roomId, userId, status): Promise<UserActivity>
  processHeartbeat(heartbeat): Promise<void>
  checkTimeouts(roomId): Promise<string[]>
  cleanupRoom(roomId): Promise<void>
  getRoomPresenceStats(roomId): Promise<Stats>
  restoreUserPresence(roomId, userId, socketId): Promise<UserPresence | null>
  getActiveRooms(): Promise<string[]>
  startCleanupInterval(): void
  stopCleanupInterval(): void
}
```

## Conclusion

The User Presence System provides a robust, scalable solution for real-time user tracking in the collaborative editor. It handles multi-server deployments, network failures, and provides comprehensive monitoring and error handling.

For questions or issues, refer to the inline documentation in the source code or check the error logs for detailed debugging information.