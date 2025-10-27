/**
 * Presence Metrics Collection
 * Extends MetricsService with presence-specific metrics
 */

import { injectable } from 'inversify';
import { Counter, Gauge, Histogram, register } from 'prom-client';

@injectable()
export class PresenceMetrics {
  // Gauges for current state
  private readonly activeUsersGauge: Gauge<string>;
  private readonly idleUsersGauge: Gauge<string>;
  private readonly awayUsersGauge: Gauge<string>;
  private readonly typingUsersGauge: Gauge<string>;

  // Counters for events
  private readonly presenceEventsCounter: Counter<string>;
  private readonly heartbeatCounter: Counter<string>;
  private readonly timeoutCounter: Counter<string>;
  private readonly reconnectionCounter: Counter<string>;

  // Histograms for performance
  private readonly cursorUpdateLatency: Histogram<string>;
  private readonly heartbeatProcessingTime: Histogram<string>;
  private readonly presenceQueryTime: Histogram<string>;

  // Rate limiting metrics
  private readonly rateLimitCounter: Counter<string>;

  constructor() {
    // Initialize gauges
    this.activeUsersGauge = new Gauge({
      name: 'presence_active_users',
      help: 'Number of active users per room',
      labelNames: ['room_id']
    });

    this.idleUsersGauge = new Gauge({
      name: 'presence_idle_users',
      help: 'Number of idle users per room',
      labelNames: ['room_id']
    });

    this.awayUsersGauge = new Gauge({
      name: 'presence_away_users',
      help: 'Number of away users per room',
      labelNames: ['room_id']
    });

    this.typingUsersGauge = new Gauge({
      name: 'presence_typing_users',
      help: 'Number of users currently typing per room',
      labelNames: ['room_id']
    });

    // Initialize counters
    this.presenceEventsCounter = new Counter({
      name: 'presence_events_total',
      help: 'Total number of presence events',
      labelNames: ['event_type', 'room_id']
    });

    this.heartbeatCounter = new Counter({
      name: 'presence_heartbeats_total',
      help: 'Total number of heartbeats received',
      labelNames: ['status'] // 'success', 'timeout', 'error'
    });

    this.timeoutCounter = new Counter({
      name: 'presence_timeouts_total',
      help: 'Total number of presence timeouts',
      labelNames: ['room_id', 'reason']
    });

    this.reconnectionCounter = new Counter({
      name: 'presence_reconnections_total',
      help: 'Total number of user reconnections',
      labelNames: ['room_id']
    });

    // Initialize histograms
    this.cursorUpdateLatency = new Histogram({
      name: 'presence_cursor_update_latency_ms',
      help: 'Latency of cursor position updates in milliseconds',
      labelNames: ['room_id'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500]
    });

    this.heartbeatProcessingTime = new Histogram({
      name: 'presence_heartbeat_processing_time_ms',
      help: 'Time to process heartbeat in milliseconds',
      labelNames: ['room_id'],
      buckets: [1, 5, 10, 25, 50, 100]
    });

    this.presenceQueryTime = new Histogram({
      name: 'presence_query_time_ms',
      help: 'Time to query presence data in milliseconds',
      labelNames: ['operation'], // 'get_users', 'get_room_stats', etc
      buckets: [1, 5, 10, 25, 50, 100, 250]
    });

    // Initialize rate limiting counter
    this.rateLimitCounter = new Counter({
      name: 'presence_rate_limit_exceeded_total',
      help: 'Number of rate limit exceeded events',
      labelNames: ['user_id', 'event_type']
    });
  }

  /**
   * Update room presence metrics
   */
  public updateRoomMetrics(
    roomId: string,
    stats: {
      activeUsers: number;
      idleUsers: number;
      awayUsers: number;
      typingUsers: number;
    }
  ): void {
    this.activeUsersGauge.set({ room_id: roomId }, stats.activeUsers);
    this.idleUsersGauge.set({ room_id: roomId }, stats.idleUsers);
    this.awayUsersGauge.set({ room_id: roomId }, stats.awayUsers);
    this.typingUsersGauge.set({ room_id: roomId }, stats.typingUsers);
  }

  /**
   * Track presence event
   */
  public trackPresenceEvent(eventType: string, roomId: string): void {
    this.presenceEventsCounter.inc({ event_type: eventType, room_id: roomId });
  }

  /**
   * Track heartbeat
   */
  public trackHeartbeat(status: 'success' | 'timeout' | 'error'): void {
    this.heartbeatCounter.inc({ status });
  }

  /**
   * Track timeout
   */
  public trackTimeout(roomId: string, reason: string): void {
    this.timeoutCounter.inc({ room_id: roomId, reason });
  }

  /**
   * Track reconnection
   */
  public trackReconnection(roomId: string): void {
    this.reconnectionCounter.inc({ room_id: roomId });
  }

  /**
   * Track cursor update latency
   */
  public trackCursorLatency(roomId: string, latencyMs: number): void {
    this.cursorUpdateLatency.observe({ room_id: roomId }, latencyMs);
  }

  /**
   * Track heartbeat processing time
   */
  public trackHeartbeatProcessing(roomId: string, timeMs: number): void {
    this.heartbeatProcessingTime.observe({ room_id: roomId }, timeMs);
  }

  /**
   * Track presence query time
   */
  public trackQueryTime(operation: string, timeMs: number): void {
    this.presenceQueryTime.observe({ operation }, timeMs);
  }

  /**
   * Track rate limit exceeded
   */
  public trackRateLimit(userId: string, eventType: string): void {
    this.rateLimitCounter.inc({ user_id: userId, event_type: eventType });
  }

  /**
   * Get presence-specific metrics for monitoring dashboard
   */
  public async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get presence health status
   */
  public getHealthStatus(): {
    healthy: boolean;
    activeRooms: number;
    totalUsers: number;
    issues: string[];
  } {
    // In production, implement actual health checks
    return {
      healthy: true,
      activeRooms: 0,
      totalUsers: 0,
      issues: []
    };
  }
}