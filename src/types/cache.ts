/**
 * Cache-related type definitions for the performance optimization system
 */

export interface CacheEntry {
  /** Unique identifier for cached data */
  key: string
  /** The cached payload */
  data: unknown
  /** When data was cached */
  timestamp: Date
  /** When cache entry becomes stale */
  expiresAt: Date
  /** Tags for dependency-based invalidation */
  tags?: string[]
  /** Data origin */
  source: 'api' | 'user' | 'computed'
  /** Usage metrics */
  hitCount: number
}

export interface CacheEntryWithMetadata extends CacheEntry {
  /** Cache metadata for React Query integration */
  queryKey?: string[]
  /** Query hash for React Query */
  queryHash?: string
  /** When this entry was last invalidated */
  invalidatedAt?: Date
  /** Whether this is a static generation cache entry */
  staticGeneration?: boolean
  /** Associated middleware for this cache entry */
  middleware?: string[]
}

export interface CacheStats {
  /** Total number of cache entries */
  totalEntries: number
  /** Total memory usage in bytes */
  memoryUsage: number
  /** Cache hit rate percentage */
  hitRate: number
  /** Cache miss count */
  missCount: number
  /** Total hit count */
  hitCount: number
  /** Average age of cache entries in milliseconds */
  averageAge: number
}

export interface CacheFilter {
  /** Filter by cache tags */
  tags?: string[]
  /** Filter by data type */
  dataType?: string
  /** Filter by source */
  source?: CacheEntry['source']
  /** Filter by expiration status */
  expired?: boolean
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

export interface CacheInvalidationRequest {
  /** Tags to invalidate */
  tags?: string[]
  /** Specific keys to invalidate */
  keys?: string[]
  /** Invalidate all cache entries */
  invalidateAll?: boolean
  /** Reason for invalidation */
  reason?: 'manual' | 'automatic' | 'dependency' | 'expiration'
}

export interface CacheInvalidationResponse {
  /** Number of entries invalidated */
  invalidatedCount: number
  /** Success message */
  message: string
  /** List of invalidated keys */
  invalidatedKeys?: string[]
  /** Timestamp of invalidation */
  timestamp: Date
}

export interface CacheHealthStatus {
  /** Overall cache system status */
  status: 'healthy' | 'degraded' | 'critical'
  /** Cache hit rate percentage */
  cacheHitRate: number
  /** Memory usage information */
  memoryUsage: {
    /** Used memory in bytes */
    used: number
    /** Total available memory in bytes */
    total: number
    /** Usage percentage */
    percentage: number
  }
  /** Number of active cache operations */
  activeOperations: number
  /** List of current errors */
  errors: string[]
  /** Last health check timestamp */
  lastChecked: Date
}

export type CacheEventType = 
  | 'cache_hit'
  | 'cache_miss'
  | 'cache_set'
  | 'cache_invalidate'
  | 'cache_expire'
  | 'cache_evict'

export interface CacheEvent {
  /** Type of cache event */
  type: CacheEventType
  /** Cache key involved */
  key: string
  /** Event timestamp */
  timestamp: Date
  /** Additional event metadata */
  metadata?: Record<string, unknown>
}