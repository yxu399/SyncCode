# Prometheus & Grafana Monitoring Setup

## Overview

This document describes the comprehensive monitoring infrastructure for SyncCode using Prometheus metrics collection and Grafana dashboards.

## Architecture

```
┌─────────────────┐
│  Node.js Server │
│  (Express +     │
│  Socket.IO)     │
│   Port 5000     │
└────────┬────────┘
         │
         │ /metrics endpoint
         │ (Prometheus format)
         ↓
┌─────────────────┐
│   Prometheus    │
│   Port 9090     │
│  - Scrapes every│
│    5 seconds    │
│  - Stores time  │
│    series data  │
└────────┬────────┘
         │
         │ PromQL queries
         ↓
┌─────────────────┐
│    Grafana      │
│   Port 3002     │
│  - Visualizes   │
│    metrics      │
│  - Dashboards   │
└─────────────────┘
```

## Metrics Collected

### Counters (Monotonically Increasing)

**1. Socket.IO Events**
- **Metric**: `synccode_socket_events_total{event_type}`
- **Labels**: `event_type` (connection, disconnect, room:join, document:edit-line, presence:update-cursor)
- **Description**: Total number of Socket.IO events processed
- **Use case**: Track WebSocket activity patterns

**2. Document Operations**
- **Metric**: `synccode_document_operations_total{operation}`
- **Labels**: `operation` (create, read, update)
- **Description**: Total number of document operations
- **Use case**: Track document access patterns

**3. HTTP Requests**
- **Metric**: `synccode_http_requests_total{method,route,status_code}`
- **Labels**: `method`, `route`, `status_code`
- **Description**: Total number of HTTP requests by endpoint
- **Use case**: Track API usage and error rates

**4. Database Queries**
- **Metric**: `synccode_database_queries_total{operation}`
- **Labels**: `operation`
- **Description**: Total number of database queries
- **Use case**: Monitor database load

### Gauges (Values That Go Up or Down)

**1. Active WebSocket Connections**
- **Metric**: `synccode_active_websocket_connections`
- **Description**: Current number of active WebSocket connections
- **Use case**: Real-time connection monitoring

**2. Active Rooms**
- **Metric**: `synccode_active_rooms`
- **Description**: Current number of active collaboration rooms
- **Use case**: Track active editing sessions

**3. Documents in Cache**
- **Metric**: `synccode_documents_in_cache`
- **Description**: Current number of documents stored in Redis cache
- **Use case**: Monitor cache utilization

### Histograms (Distribution of Values)

**1. HTTP Request Duration**
- **Metric**: `synccode_http_request_duration_seconds{method,route,status_code}`
- **Labels**: `method`, `route`, `status_code`
- **Buckets**: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10] seconds
- **Description**: HTTP request latency distribution
- **Use case**: Track API performance, calculate p50/p95/p99 percentiles

**2. Database Query Duration**
- **Metric**: `synccode_database_query_duration_seconds{operation}`
- **Labels**: `operation`
- **Buckets**: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1] seconds
- **Description**: Database query latency distribution
- **Use case**: Identify slow queries

**3. Socket.IO Event Duration**
- **Metric**: `synccode_socket_event_duration_seconds{event_type}`
- **Labels**: `event_type`
- **Buckets**: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1] seconds
- **Description**: WebSocket event processing latency
- **Use case**: Monitor real-time performance

### Default Node.js Metrics

Collected automatically by `prom-client`:
- `synccode_process_cpu_user_seconds_total` - User CPU time
- `synccode_process_cpu_system_seconds_total` - System CPU time
- `synccode_process_resident_memory_bytes` - Memory usage
- `synccode_process_heap_bytes` - Heap size
- `synccode_nodejs_eventloop_lag_seconds` - Event loop lag
- `synccode_nodejs_active_handles` - Active handles
- `synccode_nodejs_active_requests` - Active requests

## Implementation

### 1. MetricsService (src/services/MetricsService.ts)

The MetricsService is a singleton service that manages all Prometheus metrics:

```typescript
@injectable()
export class MetricsService implements IMetricsService {
  private registry: Registry;
  private socketEventsCounter: Counter;
  private documentOperationsCounter: Counter;
  private httpRequestsCounter: Counter;
  private databaseQueriesCounter: Counter;
  private activeConnectionsGauge: Gauge;
  private activeRoomsGauge: Gauge;
  private documentsInCacheGauge: Gauge;
  private httpRequestDuration: Histogram;
  private databaseQueryDuration: Histogram;
  private socketEventDuration: Histogram;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry, prefix: 'synccode_' });
    // Initialize all metrics...
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

### 2. Socket.IO Integration (src/controllers/SocketController.ts)

Socket.IO events are tracked with counters and duration histograms:

```typescript
io.on('connection', (socket) => {
  // Track connection
  metricsService.incrementActiveConnections();
  metricsService.trackSocketEvent('connection');

  socket.on('document:edit-line', async (data) => {
    const endTimer = metricsService.startSocketEventTimer('document:edit-line');
    metricsService.trackSocketEvent('document:edit-line');

    try {
      // Process edit...
      metricsService.trackDocumentOperation('update');
      endTimer();
    } catch (error) {
      endTimer();
      throw error;
    }
  });

  socket.on('disconnect', () => {
    metricsService.decrementActiveConnections();
    metricsService.trackSocketEvent('disconnect');
  });
});
```

### 3. HTTP Middleware (src/index.ts)

HTTP requests are tracked automatically via middleware:

```typescript
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const metricsService = container.get<IMetricsService>(TYPES.MetricsService);

    metricsService.trackHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    );
  });

  next();
});
```

### 4. Metrics Endpoint (src/index.ts)

Prometheus scrapes the `/metrics` endpoint:

```typescript
app.get('/metrics', async (req, res) => {
  try {
    const metricsService = container.get<IMetricsService>(TYPES.MetricsService);
    const metrics = await metricsService.getMetrics();

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});
```

## Configuration

### Prometheus (tools/prometheus.yml)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'synccode-dev'
    replica: 'prometheus-1'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'synccode-server'
    metrics_path: '/metrics'
    scrape_interval: 5s       # More frequent for real-time app
    static_configs:
      - targets: ['host.docker.internal:5000']
        labels:
          instance: 'synccode-server-1'
          env: 'development'
```

**Key Configuration:**
- **scrape_interval**: 5 seconds for real-time metrics
- **host.docker.internal**: Allows Prometheus container to access host machine
- **metrics_path**: `/metrics` endpoint on the Node.js server

### Grafana Datasource (tools/grafana/provisioning/datasources/prometheus.yml)

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      httpMethod: POST
      timeInterval: 5s
```

### Docker Compose (tools/docker-compose.yml)

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: collab-editor-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    extra_hosts:
      - "host.docker.internal:host-gateway"

  grafana:
    image: grafana/grafana:latest
    container_name: collab-editor-grafana
    ports:
      - "3002:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://localhost:3002
    depends_on:
      - prometheus

volumes:
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
```

## Getting Started

### 1. Start Infrastructure

```bash
cd /Users/xuy4/collaborative-editor/tools
docker-compose up -d prometheus grafana
```

### 2. Start Node.js Server

```bash
cd /Users/xuy4/collaborative-editor/packages/server
npm start
```

### 3. Access Dashboards

**Prometheus:**
- URL: http://localhost:9090
- Query metrics directly using PromQL
- View targets: http://localhost:9090/targets

**Grafana:**
- URL: http://localhost:3002
- Username: `admin`
- Password: `admin`
- Dashboard: "SyncCode - Real-Time Collaborative Editor"

### 4. Verify Metrics

Test the metrics endpoint:

```bash
curl http://localhost:5000/metrics
```

Expected output (excerpt):
```
# HELP synccode_active_websocket_connections Current number of active WebSocket connections
# TYPE synccode_active_websocket_connections gauge
synccode_active_websocket_connections 0

# HELP synccode_socket_events_total Total number of Socket.IO events processed
# TYPE synccode_socket_events_total counter
synccode_socket_events_total{event_type="connection"} 5
synccode_socket_events_total{event_type="disconnect"} 3
synccode_socket_events_total{event_type="document:edit-line"} 42
```

## Grafana Dashboard

### Dashboard Panels

**1. Active WebSocket Connections (Time Series)**
- **Query**: `synccode_active_websocket_connections`
- **Description**: Real-time view of connected clients
- **Alert**: Can set alert when > 100 connections

**2. Current Connections (Gauge)**
- **Query**: `synccode_active_websocket_connections`
- **Description**: Current connection count
- **Thresholds**: Green (0-10), Yellow (10-50), Red (>50)

**3. Active Rooms (Stat)**
- **Query**: `synccode_active_rooms`
- **Description**: Number of active collaboration sessions

**4. Socket.IO Events Rate (Time Series)**
- **Query**: `rate(synccode_socket_events_total[1m])`
- **Description**: Events per second by type
- **Use case**: Identify activity spikes

**5. Document Operations Rate (Time Series)**
- **Query**: `rate(synccode_document_operations_total[1m])`
- **Description**: Document operations per second
- **Use case**: Track editing activity

**6. HTTP Request Duration - p50, p95 (Time Series)**
- **Query p95**: `histogram_quantile(0.95, rate(synccode_http_request_duration_seconds_bucket[5m]))`
- **Query p50**: `histogram_quantile(0.50, rate(synccode_http_request_duration_seconds_bucket[5m]))`
- **Description**: API latency percentiles
- **Use case**: Identify slow endpoints

**7. Socket.IO Event Duration - p50, p95 (Time Series)**
- **Query p95**: `histogram_quantile(0.95, rate(synccode_socket_event_duration_seconds_bucket[5m]))`
- **Query p50**: `histogram_quantile(0.50, rate(synccode_socket_event_duration_seconds_bucket[5m]))`
- **Description**: WebSocket event processing latency
- **Use case**: Monitor real-time performance

**8. Node.js Memory Usage (Time Series)**
- **Query**: `synccode_process_resident_memory_bytes`
- **Description**: Server memory consumption
- **Alert**: Can set alert for memory leaks

**9. CPU Usage (Time Series)**
- **Query User**: `rate(synccode_process_cpu_user_seconds_total[1m])`
- **Query System**: `rate(synccode_process_cpu_system_seconds_total[1m])`
- **Description**: CPU utilization
- **Alert**: Can set alert when CPU > 80%

### Useful PromQL Queries

**Average request rate per minute:**
```promql
rate(synccode_http_requests_total[1m])
```

**Error rate (HTTP 5xx responses):**
```promql
rate(synccode_http_requests_total{status_code=~"5.."}[1m])
```

**Success rate percentage:**
```promql
sum(rate(synccode_http_requests_total{status_code=~"2.."}[1m]))
/
sum(rate(synccode_http_requests_total[1m]))
* 100
```

**p99 latency for document edits:**
```promql
histogram_quantile(0.99,
  rate(synccode_socket_event_duration_seconds_bucket{event_type="document:edit-line"}[5m])
)
```

**Memory growth rate:**
```promql
deriv(synccode_process_resident_memory_bytes[5m])
```

## Production Deployment

### Multi-Server Configuration

For multi-server deployments (with Redis pub/sub), configure Prometheus to scrape all instances:

```yaml
scrape_configs:
  - job_name: 'synccode-cluster'
    metrics_path: '/metrics'
    scrape_interval: 5s
    static_configs:
      - targets:
          - 'server1:5001'
          - 'server2:5002'
          - 'server3:5003'
        labels:
          env: 'production'
          cluster: 'us-east-1'
```

### Alerting

Create Prometheus alert rules (prometheus-alerts.yml):

```yaml
groups:
  - name: synccode_alerts
    interval: 30s
    rules:
      - alert: HighMemoryUsage
        expr: synccode_process_resident_memory_bytes > 500000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ $value }} bytes"

      - alert: HighErrorRate
        expr: rate(synccode_http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP error rate"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: SlowEventProcessing
        expr: histogram_quantile(0.95, rate(synccode_socket_event_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow Socket.IO event processing"
          description: "p95 latency is {{ $value }} seconds"
```

### Long-Term Storage

For production, configure Prometheus remote write to a long-term storage solution:

**Options:**
- **Thanos**: Long-term Prometheus storage
- **Cortex**: Multi-tenant Prometheus system
- **VictoriaMetrics**: High-performance TSDB
- **Grafana Cloud**: Managed service

## Monitoring Best Practices

### 1. Metric Naming Conventions

✅ **Good:**
- `synccode_socket_events_total`
- `synccode_http_request_duration_seconds`
- `synccode_active_websocket_connections`

❌ **Bad:**
- `socket_events` (no namespace)
- `request_time_ms` (inconsistent units)
- `connections_current` (unclear type)

### 2. Label Usage

✅ **Good:**
- Use labels for dimensions: `{event_type="connection"}`
- Keep cardinality low (<100 unique values per label)
- Avoid user IDs or timestamps as labels

❌ **Bad:**
- High cardinality labels: `{user_id="123456"}`
- Dynamic labels: `{timestamp="2025-01-26"}`

### 3. Histogram Bucket Selection

Current buckets (seconds): `[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]`

- **0.001 - 0.01**: Fast operations (cache hits)
- **0.01 - 0.1**: Normal operations (database queries)
- **0.1 - 1.0**: Slow operations (complex queries)
- **1.0 - 10**: Very slow (should investigate)

### 4. Dashboard Organization

- **Overview**: High-level KPIs (connections, rooms, events/sec)
- **Performance**: Latency percentiles (p50, p95, p99)
- **Resources**: CPU, memory, event loop lag
- **Errors**: Error rates, failed operations

## Troubleshooting

### Issue: Prometheus Can't Scrape Server

**Symptoms:**
- Target shows "DOWN" in Prometheus
- Error: "context deadline exceeded"

**Solutions:**
1. Verify server is running: `curl http://localhost:5000/metrics`
2. Check Prometheus config: `host.docker.internal` instead of `localhost`
3. Verify firewall rules
4. Check Prometheus logs: `docker logs collab-editor-prometheus`

### Issue: No Metrics Appearing

**Symptoms:**
- Dashboard panels show "No data"
- Metrics endpoint returns empty response

**Solutions:**
1. Verify MetricsService is registered in DI container
2. Check that events are actually happening (generate some activity)
3. Wait 5-10 seconds for Prometheus to scrape
4. Verify query syntax in Grafana

### Issue: High Memory Usage

**Symptoms:**
- Prometheus memory usage keeps growing
- Out of memory errors

**Solutions:**
1. Reduce retention period: `--storage.tsdb.retention.time=15d`
2. Reduce scrape frequency: `scrape_interval: 15s`
3. Limit cardinality (reduce unique label values)
4. Use recording rules for expensive queries

## Performance Impact

### Resource Overhead

- **Memory**: ~10-20 MB for prom-client in Node.js
- **CPU**: <1% for metrics collection
- **Network**: ~5-10 KB/scrape (every 5 seconds = ~1-2 MB/minute)

### Optimization Tips

1. **Use counters over gauges** when possible (lower overhead)
2. **Batch metrics updates** for high-frequency events
3. **Avoid high-cardinality labels** (user IDs, timestamps)
4. **Use recording rules** for expensive PromQL queries

## Next Steps

1. **✅ Metrics collection implemented**
2. **✅ Prometheus configured**
3. **✅ Grafana dashboards created**
4. **⏭️ Set up alerting rules**
5. **⏭️ Configure long-term storage**
6. **⏭️ Implement SLO tracking**
7. **⏭️ Add custom business metrics**
8. **⏭️ Deploy to production with Nginx**

## Resources

- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/
- **prom-client**: https://github.com/siimon/prom-client
- **PromQL**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Best Practices**: https://prometheus.io/docs/practices/naming/

## Conclusion

The monitoring infrastructure provides:

✅ **Real-time visibility** into application performance
✅ **Historical trending** for capacity planning
✅ **Proactive alerting** for issues before users notice
✅ **Performance optimization** data for bottleneck identification
✅ **Production-ready** monitoring with industry-standard tools

The system is now ready for production deployment with comprehensive observability.
