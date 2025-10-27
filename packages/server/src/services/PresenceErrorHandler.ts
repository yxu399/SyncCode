/**
 * Presence Error Handler
 * Handles error scenarios and edge cases in the presence system
 */

import { injectable } from 'inversify';

export class PresenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PresenceError';
  }
}

export class PresenceTimeoutError extends PresenceError {
  constructor(userId: string, roomId: string) {
    super(
      `User ${userId} timed out in room ${roomId}`,
      'PRESENCE_TIMEOUT',
      408,
      { userId, roomId }
    );
  }
}

export class PresenceAuthError extends PresenceError {
  constructor(userId: string, roomId: string) {
    super(
      `User ${userId} not authorized for room ${roomId}`,
      'PRESENCE_AUTH_ERROR',
      403,
      { userId, roomId }
    );
  }
}

export class PresenceRoomNotFoundError extends PresenceError {
  constructor(roomId: string) {
    super(
      `Room ${roomId} not found`,
      'ROOM_NOT_FOUND',
      404,
      { roomId }
    );
  }
}

@injectable()
export class PresenceErrorHandler {
  /**
   * Handle Redis connection errors
   */
  public handleRedisError(error: Error): void {
    console.error('Redis error in presence system:', error);

    // Log to metrics/monitoring
    // Could implement circuit breaker pattern here

    if (error.message.includes('ECONNREFUSED')) {
      throw new PresenceError(
        'Redis connection failed',
        'REDIS_CONNECTION_ERROR',
        503,
        { originalError: error.message }
      );
    }

    throw error;
  }

  /**
   * Handle heartbeat timeout scenarios
   */
  public handleHeartbeatTimeout(
    userId: string,
    roomId: string,
    lastHeartbeat: number
  ): PresenceTimeoutError {
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;

    console.warn(
      `Heartbeat timeout for user ${userId} in room ${roomId}. ` +
      `Last heartbeat was ${timeSinceLastHeartbeat}ms ago`
    );

    return new PresenceTimeoutError(userId, roomId);
  }

  /**
   * Handle concurrent connection scenarios (same user, multiple tabs)
   */
  public handleConcurrentConnections(
    userId: string,
    existingSocketId: string,
    newSocketId: string
  ): void {
    console.info(
      `User ${userId} has concurrent connections. ` +
      `Existing: ${existingSocketId}, New: ${newSocketId}`
    );

    // This is actually allowed - users can have multiple tabs open
    // Each connection gets tracked separately
  }

  /**
   * Handle data corruption scenarios
   */
  public handleDataCorruption(
    key: string,
    value: string,
    error: Error
  ): PresenceError {
    console.error(`Data corruption detected for key ${key}:`, error);

    return new PresenceError(
      'Corrupted presence data detected',
      'DATA_CORRUPTION',
      500,
      {
        key,
        value: value.substring(0, 100), // Truncate for logging
        error: error.message
      }
    );
  }

  /**
   * Handle rate limiting scenarios
   */
  public handleRateLimit(
    userId: string,
    eventType: string,
    limit: number,
    window: number
  ): PresenceError {
    console.warn(
      `Rate limit exceeded for user ${userId} on event ${eventType}. ` +
      `Limit: ${limit} requests per ${window}ms`
    );

    return new PresenceError(
      `Rate limit exceeded for ${eventType}`,
      'RATE_LIMIT_EXCEEDED',
      429,
      {
        userId,
        eventType,
        limit,
        window,
        retryAfter: window
      }
    );
  }

  /**
   * Handle network partition scenarios
   */
  public handleNetworkPartition(serverId: string, error: Error): void {
    console.error(
      `Possible network partition detected on server ${serverId}:`,
      error
    );

    // In a production system, you might:
    // 1. Trigger alerts
    // 2. Initiate failover procedures
    // 3. Mark server as unhealthy
    // 4. Redirect clients to healthy servers
  }

  /**
   * Handle graceful shutdown scenarios
   */
  public async handleGracefulShutdown(
    activeRooms: string[],
    activeUsers: number
  ): Promise<void> {
    console.info(
      `Initiating graceful shutdown. ` +
      `Active rooms: ${activeRooms.length}, Active users: ${activeUsers}`
    );

    // In production:
    // 1. Stop accepting new connections
    // 2. Notify connected clients about shutdown
    // 3. Save state to persistent storage
    // 4. Wait for in-flight operations to complete
    // 5. Clean up resources
  }

  /**
   * Determine if error is recoverable
   */
  public isRecoverableError(error: Error): boolean {
    const recoverableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EHOSTUNREACH'
    ];

    return recoverableErrors.some(code =>
      error.message.includes(code)
    );
  }

  /**
   * Get user-friendly error message
   */
  public getUserFriendlyMessage(error: PresenceError): string {
    const messages: Record<string, string> = {
      'PRESENCE_TIMEOUT': 'Connection timed out. Please refresh to reconnect.',
      'PRESENCE_AUTH_ERROR': 'You do not have access to this room.',
      'ROOM_NOT_FOUND': 'The requested room does not exist.',
      'REDIS_CONNECTION_ERROR': 'Service temporarily unavailable. Please try again.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please slow down.',
      'DATA_CORRUPTION': 'An error occurred. Please refresh the page.'
    };

    return messages[error.code] || 'An unexpected error occurred.';
  }
}