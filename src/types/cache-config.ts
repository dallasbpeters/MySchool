/**
 * Cache configuration type definitions for the performance optimization system
 */

export interface CacheConfig {
  /** Type of data being cached */
  dataType: string
  /** Default time-to-live in milliseconds */
  defaultTTL: number
  /** Maximum cache age before forced refresh */
  maxAge: number
  /** Associated invalidation tags */
  tags?: string[]
  /** Cache eviction priority */
  priority: 'low' | 'medium' | 'high'
  /** Whether to prefetch this data type */
  prefetch: boolean
  /** Whether to refresh in background */
  backgroundRefresh: boolean
  /** Maximum cache size for this data type */
  maxSize?: number
  /** Compression settings */
  compression?: {
    enabled: boolean
    algorithm: 'gzip' | 'brotli' | 'deflate'
    threshold: number
  }
}

export interface CacheConfigMap {
  /** User profile data configuration */
  userProfiles: CacheConfig
  /** Calendar events configuration */
  calendarEvents: CacheConfig
  /** Assignment data configuration */
  assignments: CacheConfig
  /** Real-time data configuration */
  realTimeData: CacheConfig
  /** Static content configuration */
  staticContent: CacheConfig
  /** API responses configuration */
  apiResponses: CacheConfig
  /** Custom cache configurations */
  [key: string]: CacheConfig
}

export interface CacheStrategy {
  /** Strategy name */
  name: string
  /** Cache-first: serve from cache, fallback to network */
  cacheFirst?: boolean
  /** Network-first: try network, fallback to cache */
  networkFirst?: boolean
  /** Stale-while-revalidate: serve from cache, update in background */
  staleWhileRevalidate?: boolean
  /** Cache-only: only serve from cache */
  cacheOnly?: boolean
  /** Network-only: always fetch from network */
  networkOnly?: boolean
  /** Custom strategy function */
  custom?: (request: unknown) => Promise<unknown>
}

export interface CacheInvalidationStrategy {
  /** Time-based invalidation */
  timeBased: {
    enabled: boolean
    interval: number
    maxAge: number
  }
  /** Tag-based invalidation */
  tagBased: {
    enabled: boolean
    patterns: string[]
    cascading: boolean
  }
  /** Dependency-based invalidation */
  dependencyBased: {
    enabled: boolean
    dependencies: Record<string, string[]>
  }
  /** Event-based invalidation */
  eventBased: {
    enabled: boolean
    events: string[]
  }
}

export interface CacheStorageConfig {
  /** Storage adapter type */
  adapter: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'custom'
  /** Maximum storage size in bytes */
  maxSize: number
  /** Encryption settings */
  encryption?: {
    enabled: boolean
    algorithm: 'AES-256-GCM' | 'AES-128-GCM'
    keyDerivation: 'PBKDF2' | 'scrypt'
  }
  /** Persistence settings */
  persistence: {
    enabled: boolean
    version: number
    migrationStrategy: 'clear' | 'migrate' | 'ignore'
  }
}

export interface CacheEvictionPolicy {
  /** Eviction algorithm */
  algorithm: 'LRU' | 'LFU' | 'FIFO' | 'TTL' | 'custom'
  /** Maximum cache entries */
  maxEntries: number
  /** Memory pressure threshold (0-1) */
  memoryThreshold: number
  /** Eviction batch size */
  batchSize: number
  /** Custom eviction function */
  customEvictionFn?: (entries: unknown[]) => unknown[]
}

export interface CachePerformanceConfig {
  /** Performance monitoring settings */
  monitoring: {
    enabled: boolean
    sampleRate: number
    thresholds: {
      hitRate: number
      responseTime: number
      memoryUsage: number
    }
  }
  /** Optimization settings */
  optimization: {
    precompression: boolean
    lazyLoading: boolean
    prefetching: boolean
    backgroundSync: boolean
  }
  /** Debugging settings */
  debug: {
    enabled: boolean
    verbose: boolean
    logLevel: 'error' | 'warn' | 'info' | 'debug'
  }
}

export interface CacheNetworkConfig {
  /** Network retry policy */
  retry: {
    enabled: boolean
    maxAttempts: number
    backoffStrategy: 'linear' | 'exponential' | 'fixed'
    baseDelay: number
    maxDelay: number
  }
  /** Timeout settings */
  timeout: {
    connection: number
    response: number
    total: number
  }
  /** Request deduplication */
  deduplication: {
    enabled: boolean
    keyGenerator: (request: unknown) => string
    windowMs: number
  }
}

export interface CacheSecurityConfig {
  /** Content Security Policy for cached content */
  csp: {
    enabled: boolean
    directives: Record<string, string[]>
  }
  /** CORS settings for cached requests */
  cors: {
    enabled: boolean
    allowedOrigins: string[]
    allowedMethods: string[]
    allowedHeaders: string[]
  }
  /** Data sanitization */
  sanitization: {
    enabled: boolean
    allowedTags: string[]
    allowedAttributes: string[]
  }
}

export interface GlobalCacheConfig {
  /** Default cache configurations */
  defaults: CacheConfig
  /** Strategy configurations */
  strategies: Record<string, CacheStrategy>
  /** Invalidation configuration */
  invalidation: CacheInvalidationStrategy
  /** Storage configuration */
  storage: CacheStorageConfig
  /** Eviction policy */
  eviction: CacheEvictionPolicy
  /** Performance configuration */
  performance: CachePerformanceConfig
  /** Network configuration */
  network: CacheNetworkConfig
  /** Security configuration */
  security: CacheSecurityConfig
  /** Environment-specific overrides */
  environments: {
    development: Partial<GlobalCacheConfig>
    staging: Partial<GlobalCacheConfig>
    production: Partial<GlobalCacheConfig>
  }
}

export interface CacheConfigValidation {
  /** Whether configuration is valid */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
  /** Validated configuration */
  config?: GlobalCacheConfig
}

export interface CacheConfigUpdateRequest {
  /** Configuration updates */
  updates: Partial<GlobalCacheConfig>
  /** Whether to merge with existing config */
  merge: boolean
  /** Validation options */
  validate: boolean
  /** Whether to apply immediately */
  immediate: boolean
}