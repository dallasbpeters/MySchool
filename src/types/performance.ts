/**
 * Performance monitoring type definitions for the performance optimization system
 */

export type PerformanceMetricType = 
  | 'page_load'
  | 'navigation'
  | 'api_response'
  | 'cache_hit'
  | 'cache_miss'

export interface PerformanceMetric {
  /** Unique metric identifier */
  id: string
  /** Type of performance metric */
  metricType: PerformanceMetricType
  /** Measured value (milliseconds, percentage, etc.) */
  value: number
  /** When measurement was taken */
  timestamp: Date
  /** Associated page/route */
  route?: string
  /** User who triggered the measurement */
  userId?: string
  /** Additional context */
  metadata?: Record<string, unknown>
}

export interface PerformanceMetricInput {
  /** Type of performance metric */
  metricType: PerformanceMetricType
  /** Measured value */
  value: number
  /** Associated page/route */
  route?: string
  /** Additional context */
  metadata?: Record<string, unknown>
}

export interface PerformanceMetricSummary {
  /** Average value across all metrics */
  averageValue: number
  /** Median value */
  medianValue: number
  /** 95th percentile value */
  p95Value: number
  /** Total number of metrics */
  totalCount: number
  /** Minimum value */
  minValue?: number
  /** Maximum value */
  maxValue?: number
  /** Standard deviation */
  standardDeviation?: number
}

export interface PerformanceMetricsResponse {
  /** Array of performance metrics */
  metrics: PerformanceMetric[]
  /** Summary statistics */
  summary: PerformanceMetricSummary
  /** Query filters applied */
  filters?: PerformanceMetricsFilter
  /** Pagination info */
  pagination?: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export interface PerformanceMetricsFilter {
  /** Filter by metric type */
  metricType?: PerformanceMetricType
  /** Filter by date range start */
  from?: Date
  /** Filter by date range end */
  to?: Date
  /** Filter by route */
  route?: string
  /** Filter by user */
  userId?: string
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

export interface WebVitalsMetric {
  /** Metric name (FCP, LCP, CLS, etc.) */
  name: string
  /** Metric value */
  value: number
  /** Metric delta from previous measurement */
  delta: number
  /** Unique metric ID */
  id: string
  /** Navigation type */
  navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender'
  /** Whether metric is final */
  isFinal: boolean
}

export interface PageLoadMetrics {
  /** First Contentful Paint */
  fcp?: number
  /** Largest Contentful Paint */
  lcp?: number
  /** First Input Delay */
  fid?: number
  /** Cumulative Layout Shift */
  cls?: number
  /** Time to Interactive */
  tti?: number
  /** Time to First Byte */
  ttfb?: number
  /** DOM Content Loaded */
  domContentLoaded?: number
  /** Load event */
  loadEvent?: number
  /** Total page size in bytes */
  pageSize?: number
  /** JavaScript bundle size */
  jsSize?: number
  /** CSS size */
  cssSize?: number
  /** Image size */
  imageSize?: number
}

export interface NavigationMetrics {
  /** Navigation start time */
  startTime: number
  /** Navigation end time */
  endTime: number
  /** Total navigation duration */
  duration: number
  /** From route */
  fromRoute: string
  /** To route */
  toRoute: string
  /** Navigation type */
  type: 'push' | 'replace' | 'back' | 'forward'
  /** Whether data was cached */
  cached: boolean
  /** Cache hit rate during navigation */
  cacheHitRate?: number
}

export interface ApiResponseMetrics {
  /** API endpoint */
  endpoint: string
  /** HTTP method */
  method: string
  /** Response time in milliseconds */
  responseTime: number
  /** HTTP status code */
  statusCode: number
  /** Response size in bytes */
  responseSize?: number
  /** Whether response was cached */
  cached: boolean
  /** Error message if failed */
  error?: string
  /** Request timestamp */
  timestamp: Date
}

export interface PerformanceThreshold {
  /** Metric type */
  metricType: PerformanceMetricType
  /** Warning threshold value */
  warning: number
  /** Critical threshold value */
  critical: number
  /** Threshold unit */
  unit: 'ms' | 'percentage' | 'bytes'
  /** Whether threshold is enabled */
  enabled: boolean
}

export interface PerformanceAlert {
  /** Alert ID */
  id: string
  /** Metric that triggered alert */
  metric: PerformanceMetric
  /** Threshold that was exceeded */
  threshold: PerformanceThreshold
  /** Alert severity */
  severity: 'warning' | 'critical'
  /** Alert timestamp */
  timestamp: Date
  /** Whether alert is acknowledged */
  acknowledged: boolean
  /** Alert message */
  message: string
}

export interface PerformanceMonitorConfig {
  /** Whether to track page views */
  trackPageViews: boolean
  /** Whether to track navigation */
  trackNavigation: boolean
  /** Whether to track API calls */
  trackApiCalls: boolean
  /** Whether to track cache performance */
  trackCache: boolean
  /** Whether to track Web Vitals */
  trackWebVitals: boolean
  /** Debug mode enabled */
  debugMode: boolean
  /** Sampling rate (0-1) */
  samplingRate: number
  /** Report interval in milliseconds */
  reportInterval: number
  /** Maximum metrics to store locally */
  maxLocalMetrics: number
}

export interface PerformanceMonitorHookOptions {
  /** Whether monitoring is enabled */
  enabled?: boolean
  /** Current route */
  route?: string
  /** Additional context */
  context?: Record<string, unknown>
}

export interface PerformanceMonitorHookResult {
  /** Track a custom event */
  trackEvent: (metricType: PerformanceMetricType, value: number, metadata?: Record<string, unknown>) => void
  /** Get current metrics */
  getMetrics: () => PerformanceMetric[]
  /** Whether monitoring is active */
  isTracking: boolean
  /** Start a performance measurement */
  startMeasurement: (name: string) => void
  /** End a performance measurement */
  endMeasurement: (name: string) => number | undefined
  /** Track page load metrics */
  trackPageLoad: (metrics: PageLoadMetrics) => void
  /** Track navigation metrics */
  trackNavigation: (metrics: NavigationMetrics) => void
  /** Track API response metrics */
  trackApiResponse: (metrics: ApiResponseMetrics) => void
}

export interface PerformanceBudget {
  /** Budget name */
  name: string
  /** Maximum page load time */
  maxPageLoad: number
  /** Maximum navigation time */
  maxNavigation: number
  /** Maximum API response time */
  maxApiResponse: number
  /** Maximum bundle size */
  maxBundleSize: number
  /** Maximum cache miss rate */
  maxCacheMissRate: number
  /** Whether budget is enforced */
  enforced: boolean
}