/**
 * Cache utility functions for the performance optimization system
 */

import type { CacheEntry, CacheFilter, CacheStats, CacheEvent } from '@/types/cache'
import type { CacheConfig } from '@/types/cache-config'

/**
 * Generate a cache key from components
 */
export function generateCacheKey(components: (string | number | boolean)[]): string {
  return components
    .map(component => String(component))
    .filter(Boolean)
    .join(':')
}

/**
 * Parse a cache key into components
 */
export function parseCacheKey(key: string): string[] {
  return key.split(':').filter(Boolean)
}

/**
 * Generate tags for a cache entry based on its key and data
 */
export function generateCacheTags(key: string, data?: unknown): string[] {
  const components = parseCacheKey(key)
  const tags: string[] = []
  
  // Add hierarchical tags
  for (let i = 1; i <= components.length; i++) {
    tags.push(components.slice(0, i).join(':'))
  }
  
  // Add data-specific tags if applicable
  if (data && typeof data === 'object' && data !== null) {
    const dataObj = data as Record<string, unknown>
    
    // Add user-specific tags
    if (dataObj.userId) {
      tags.push(`user:${dataObj.userId}`)
    }
    
    // Add date-specific tags
    if (dataObj.date || dataObj.dueDate) {
      const date = new Date(dataObj.date || dataObj.dueDate)
      tags.push(`date:${date.toISOString().split('T')[0]}`)
    }
    
    // Add type-specific tags
    if (dataObj.type) {
      tags.push(`type:${dataObj.type}`)
    }
  }
  
  return [...new Set(tags)] // Remove duplicates
}

/**
 * Check if a cache entry is expired
 */
export function isCacheEntryExpired(entry: CacheEntry): boolean {
  return new Date() > entry.expiresAt
}

/**
 * Check if a cache entry is stale (expired but within max age)
 */
export function isCacheEntryStale(entry: CacheEntry, maxAge: number = 24 * 60 * 60 * 1000): boolean {
  const now = new Date()
  const age = now.getTime() - entry.timestamp.getTime()
  return age > maxAge || isCacheEntryExpired(entry)
}

/**
 * Calculate cache entry age in milliseconds
 */
export function getCacheEntryAge(entry: CacheEntry): number {
  return new Date().getTime() - entry.timestamp.getTime()
}

/**
 * Filter cache entries based on criteria
 */
export function filterCacheEntries(entries: CacheEntry[], filter: CacheFilter): CacheEntry[] {
  let filtered = entries
  
  // Filter by tags
  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter(entry => 
      entry.tags && filter.tags!.some(tag => entry.tags!.includes(tag))
    )
  }
  
  // Filter by data type (inferred from key)
  if (filter.dataType) {
    filtered = filtered.filter(entry => 
      entry.key.toLowerCase().includes(filter.dataType!.toLowerCase())
    )
  }
  
  // Filter by source
  if (filter.source) {
    filtered = filtered.filter(entry => entry.source === filter.source)
  }
  
  // Filter by expiration status
  if (filter.expired !== undefined) {
    filtered = filtered.filter(entry => 
      isCacheEntryExpired(entry) === filter.expired
    )
  }
  
  // Apply pagination
  if (filter.offset) {
    filtered = filtered.slice(filter.offset)
  }
  
  if (filter.limit) {
    filtered = filtered.slice(0, filter.limit)
  }
  
  return filtered
}

/**
 * Calculate cache statistics
 */
export function calculateCacheStats(entries: CacheEntry[]): CacheStats {
  const totalEntries = entries.length
  const hitCount = entries.reduce((sum, entry) => sum + entry.hitCount, 0)
  const missCount = 0 // This would come from external tracking
  const hitRate = hitCount + missCount > 0 ? (hitCount / (hitCount + missCount)) * 100 : 0
  
  // Calculate memory usage (rough estimate)
  const memoryUsage = entries.reduce((sum, entry) => {
    const entrySize = JSON.stringify(entry).length * 2 // Rough byte estimate
    return sum + entrySize
  }, 0)
  
  // Calculate average age
  const now = new Date().getTime()
  const totalAge = entries.reduce((sum, entry) => sum + (now - entry.timestamp.getTime()), 0)
  const averageAge = totalEntries > 0 ? totalAge / totalEntries : 0
  
  return {
    totalEntries,
    memoryUsage,
    hitRate,
    missCount,
    hitCount,
    averageAge
  }
}

/**
 * Create a cache entry
 */
export function createCacheEntry(
  key: string, 
  data: unknown, 
  config: Partial<CacheConfig> = {}
): CacheEntry {
  const now = new Date()
  const ttl = config.defaultTTL || 5 * 60 * 1000 // 5 minutes default
  
  return {
    key,
    data,
    timestamp: now,
    expiresAt: new Date(now.getTime() + ttl),
    tags: config.tags || generateCacheTags(key, data),
    source: 'api', // Default source
    hitCount: 0
  }
}

/**
 * Update cache entry hit count
 */
export function updateHitCount(entry: CacheEntry): CacheEntry {
  return {
    ...entry,
    hitCount: entry.hitCount + 1
  }
}

/**
 * Serialize cache entry for storage
 */
export function serializeCacheEntry(entry: CacheEntry): string {
  return JSON.stringify({
    ...entry,
    timestamp: entry.timestamp.toISOString(),
    expiresAt: entry.expiresAt.toISOString()
  })
}

/**
 * Deserialize cache entry from storage
 */
export function deserializeCacheEntry(serialized: string): CacheEntry {
  const parsed = JSON.parse(serialized)
  return {
    ...parsed,
    timestamp: new Date(parsed.timestamp),
    expiresAt: new Date(parsed.expiresAt)
  }
}

/**
 * Validate cache key format
 */
export function isValidCacheKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  if (key.length === 0 || key.length > 250) return false
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
  return !invalidChars.test(key)
}

/**
 * Sanitize cache key
 */
export function sanitizeCacheKey(key: string): string {
  return key
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .substring(0, 250)
    .trim()
}

/**
 * Get cache entry priority weight for eviction
 */
export function getCacheEntryWeight(entry: CacheEntry): number {
  const age = getCacheEntryAge(entry)
  const hitCount = entry.hitCount
  const size = JSON.stringify(entry.data).length
  
  // Higher weight = more likely to be evicted
  // Factor in age (older = higher weight), hit count (less used = higher weight), size (larger = higher weight)
  const ageWeight = age / (24 * 60 * 60 * 1000) // Normalize to days
  const hitWeight = hitCount > 0 ? 1 / hitCount : 10 // Less hits = higher weight
  const sizeWeight = size / (1024 * 1024) // Normalize to MB
  
  return ageWeight + hitWeight + sizeWeight
}

/**
 * Sort entries for LRU eviction
 */
export function sortForLRUEviction(entries: CacheEntry[]): CacheEntry[] {
  return [...entries].sort((a, b) => {
    // Sort by last access time (timestamp + hit activity)
    const aScore = a.timestamp.getTime() + (a.hitCount * 1000)
    const bScore = b.timestamp.getTime() + (b.hitCount * 1000)
    return aScore - bScore // Oldest/least used first
  })
}

/**
 * Create a cache event
 */
export function createCacheEvent(
  type: CacheEvent['type'], 
  key: string, 
  metadata?: Record<string, unknown>
): CacheEvent {
  return {
    type,
    key,
    timestamp: new Date(),
    metadata
  }
}

/**
 * Compress cache data if beneficial
 */
export function compressIfBeneficial(data: unknown, threshold: number = 1024): unknown {
  const serialized = JSON.stringify(data)
  
  // Only compress if data is larger than threshold
  if (serialized.length < threshold) {
    return data
  }
  
  // Simple compression simulation (in real implementation, use actual compression)
  // For now, just return the original data
  return data
}

/**
 * Generate cache key for React Query
 */
export function generateQueryKey(
  resource: string, 
  id?: string | number, 
  params?: Record<string, unknown>
): (string | number | Record<string, unknown>)[] {
  const key: (string | number | Record<string, unknown>)[] = [resource]
  
  if (id !== undefined) {
    key.push(id)
  }
  
  if (params && Object.keys(params).length > 0) {
    // Sort params for consistent keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, k) => {
        acc[k] = params[k]
        return acc
      }, {} as Record<string, unknown>)
    key.push(sortedParams)
  }
  
  return key
}

/**
 * Calculate cache effectiveness score
 */
export function calculateCacheEffectiveness(stats: CacheStats): number {
  const hitRateScore = stats.hitRate / 100 // 0-1
  const memoryEfficiencyScore = Math.max(0, 1 - (stats.memoryUsage / (50 * 1024 * 1024))) // Assume 50MB ideal max
  const ageEfficiencyScore = Math.max(0, 1 - (stats.averageAge / (24 * 60 * 60 * 1000))) // Prefer fresher data
  
  // Weighted average
  return (hitRateScore * 0.5) + (memoryEfficiencyScore * 0.3) + (ageEfficiencyScore * 0.2)
}