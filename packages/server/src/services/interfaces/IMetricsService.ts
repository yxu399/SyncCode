/**
 * Metrics Service Interface
 * Prometheus metrics collection for monitoring
 */

export interface IMetricsService {
  /**
   * Get Prometheus metrics in text format
   */
  getMetrics(): Promise<string>;

  /**
   * Increment active WebSocket connections
   */
  incrementActiveConnections(): void;

  /**
   * Decrement active WebSocket connections
   */
  decrementActiveConnections(): void;

  /**
   * Track document operation (create, read, update)
   */
  trackDocumentOperation(operation: 'create' | 'read' | 'update'): void;

  /**
   * Track Socket.IO event
   */
  trackSocketEvent(eventType: string): void;

  /**
   * Track HTTP request duration
   */
  trackHttpRequest(method: string, route: string, statusCode: number, duration: number): void;

  /**
   * Track database query duration
   */
  trackDatabaseQuery(operation: string, duration: number): void;

  /**
   * Set gauge value for active rooms
   */
  setActiveRooms(count: number): void;

  /**
   * Set gauge value for documents in cache
   */
  setDocumentsInCache(count: number): void;

  /**
   * Start timer for Socket.IO event duration tracking
   * Returns a function to call when the event processing is complete
   */
  startSocketEventTimer(eventType: string): () => void;
}
