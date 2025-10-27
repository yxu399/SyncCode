/**
 * Metrics Service Implementation
 * Collects Prometheus metrics for monitoring application health and performance
 */

import { injectable } from 'inversify';
import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import { IMetricsService } from './interfaces/IMetricsService';

@injectable()
export class MetricsService implements IMetricsService {
  private registry: Registry;

  // Counters - monotonically increasing values
  private socketEventsCounter: Counter;
  private documentOperationsCounter: Counter;
  private httpRequestsCounter: Counter;
  private databaseQueriesCounter: Counter;

  // Gauges - values that can go up or down
  private activeConnectionsGauge: Gauge;
  private activeRoomsGauge: Gauge;
  private documentsInCacheGauge: Gauge;

  // Histograms - distributions of values (latency, size, etc.)
  private httpRequestDuration: Histogram;
  private databaseQueryDuration: Histogram;
  private socketEventDuration: Histogram;

  constructor() {
    // Create a new registry
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, event loop, etc.)
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'synccode_',
    });

    // Initialize counters
    this.socketEventsCounter = new Counter({
      name: 'synccode_socket_events_total',
      help: 'Total number of Socket.IO events processed',
      labelNames: ['event_type'],
      registers: [this.registry],
    });

    this.documentOperationsCounter = new Counter({
      name: 'synccode_document_operations_total',
      help: 'Total number of document operations',
      labelNames: ['operation'],
      registers: [this.registry],
    });

    this.httpRequestsCounter = new Counter({
      name: 'synccode_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.databaseQueriesCounter = new Counter({
      name: 'synccode_database_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation'],
      registers: [this.registry],
    });

    // Initialize gauges
    this.activeConnectionsGauge = new Gauge({
      name: 'synccode_active_websocket_connections',
      help: 'Current number of active WebSocket connections',
      registers: [this.registry],
    });

    this.activeRoomsGauge = new Gauge({
      name: 'synccode_active_rooms',
      help: 'Current number of active rooms',
      registers: [this.registry],
    });

    this.documentsInCacheGauge = new Gauge({
      name: 'synccode_documents_in_cache',
      help: 'Current number of documents in Redis cache',
      registers: [this.registry],
    });

    // Initialize histograms
    this.httpRequestDuration = new Histogram({
      name: 'synccode_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.registry],
    });

    this.databaseQueryDuration = new Histogram({
      name: 'synccode_database_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    this.socketEventDuration = new Histogram({
      name: 'synccode_socket_event_duration_seconds',
      help: 'Socket.IO event processing duration in seconds',
      labelNames: ['event_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    console.log('📊 Metrics service initialized');
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  incrementActiveConnections(): void {
    this.activeConnectionsGauge.inc();
  }

  decrementActiveConnections(): void {
    this.activeConnectionsGauge.dec();
  }

  trackDocumentOperation(operation: 'create' | 'read' | 'update'): void {
    this.documentOperationsCounter.inc({ operation });
  }

  trackSocketEvent(eventType: string): void {
    this.socketEventsCounter.inc({ event_type: eventType });
  }

  trackHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestsCounter.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });

    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode.toString(),
      },
      duration / 1000 // Convert ms to seconds
    );
  }

  trackDatabaseQuery(operation: string, duration: number): void {
    this.databaseQueriesCounter.inc({ operation });
    this.databaseQueryDuration.observe({ operation }, duration / 1000);
  }

  setActiveRooms(count: number): void {
    this.activeRoomsGauge.set(count);
  }

  setDocumentsInCache(count: number): void {
    this.documentsInCacheGauge.set(count);
  }

  /**
   * Track Socket.IO event duration
   * Call this at the start of event processing, returns a function to call when done
   */
  startSocketEventTimer(eventType: string): () => void {
    const end = this.socketEventDuration.startTimer({ event_type: eventType });
    return end;
  }
}
