"use strict";
/**
 * Metrics Service Implementation
 * Collects Prometheus metrics for monitoring application health and performance
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const inversify_1 = require("inversify");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    registry;
    // Counters - monotonically increasing values
    socketEventsCounter;
    documentOperationsCounter;
    httpRequestsCounter;
    databaseQueriesCounter;
    // Gauges - values that can go up or down
    activeConnectionsGauge;
    activeRoomsGauge;
    documentsInCacheGauge;
    // Histograms - distributions of values (latency, size, etc.)
    httpRequestDuration;
    databaseQueryDuration;
    socketEventDuration;
    constructor() {
        // Create a new registry
        this.registry = new prom_client_1.Registry();
        // Collect default metrics (CPU, memory, event loop, etc.)
        (0, prom_client_1.collectDefaultMetrics)({
            register: this.registry,
            prefix: 'synccode_',
        });
        // Initialize counters
        this.socketEventsCounter = new prom_client_1.Counter({
            name: 'synccode_socket_events_total',
            help: 'Total number of Socket.IO events processed',
            labelNames: ['event_type'],
            registers: [this.registry],
        });
        this.documentOperationsCounter = new prom_client_1.Counter({
            name: 'synccode_document_operations_total',
            help: 'Total number of document operations',
            labelNames: ['operation'],
            registers: [this.registry],
        });
        this.httpRequestsCounter = new prom_client_1.Counter({
            name: 'synccode_http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });
        this.databaseQueriesCounter = new prom_client_1.Counter({
            name: 'synccode_database_queries_total',
            help: 'Total number of database queries',
            labelNames: ['operation'],
            registers: [this.registry],
        });
        // Initialize gauges
        this.activeConnectionsGauge = new prom_client_1.Gauge({
            name: 'synccode_active_websocket_connections',
            help: 'Current number of active WebSocket connections',
            registers: [this.registry],
        });
        this.activeRoomsGauge = new prom_client_1.Gauge({
            name: 'synccode_active_rooms',
            help: 'Current number of active rooms',
            registers: [this.registry],
        });
        this.documentsInCacheGauge = new prom_client_1.Gauge({
            name: 'synccode_documents_in_cache',
            help: 'Current number of documents in Redis cache',
            registers: [this.registry],
        });
        // Initialize histograms
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'synccode_http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
            registers: [this.registry],
        });
        this.databaseQueryDuration = new prom_client_1.Histogram({
            name: 'synccode_database_query_duration_seconds',
            help: 'Database query duration in seconds',
            labelNames: ['operation'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.registry],
        });
        this.socketEventDuration = new prom_client_1.Histogram({
            name: 'synccode_socket_event_duration_seconds',
            help: 'Socket.IO event processing duration in seconds',
            labelNames: ['event_type'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.registry],
        });
        console.log('📊 Metrics service initialized');
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    incrementActiveConnections() {
        this.activeConnectionsGauge.inc();
    }
    decrementActiveConnections() {
        this.activeConnectionsGauge.dec();
    }
    trackDocumentOperation(operation) {
        this.documentOperationsCounter.inc({ operation });
    }
    trackSocketEvent(eventType) {
        this.socketEventsCounter.inc({ event_type: eventType });
    }
    trackHttpRequest(method, route, statusCode, duration) {
        this.httpRequestsCounter.inc({
            method,
            route,
            status_code: statusCode.toString(),
        });
        this.httpRequestDuration.observe({
            method,
            route,
            status_code: statusCode.toString(),
        }, duration / 1000 // Convert ms to seconds
        );
    }
    trackDatabaseQuery(operation, duration) {
        this.databaseQueriesCounter.inc({ operation });
        this.databaseQueryDuration.observe({ operation }, duration / 1000);
    }
    setActiveRooms(count) {
        this.activeRoomsGauge.set(count);
    }
    setDocumentsInCache(count) {
        this.documentsInCacheGauge.set(count);
    }
    /**
     * Track Socket.IO event duration
     * Call this at the start of event processing, returns a function to call when done
     */
    startSocketEventTimer(eventType) {
        const end = this.socketEventDuration.startTimer({ event_type: eventType });
        return end;
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], MetricsService);
//# sourceMappingURL=MetricsService.js.map