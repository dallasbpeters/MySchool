# Data Model: Performance Optimization with Caching and Loading States

**Feature**: 003-i-want-an  
**Date**: 2025-01-14  
**Phase**: 1 - Data Model Design

## Core Entities

### 1. CacheEntry
**Purpose**: Represents cached data with metadata for invalidation and freshness
**Fields**:
- `key: string` - Unique identifier for cached data
- `data: unknown` - The cached payload
- `timestamp: Date` - When data was cached
- `expiresAt: Date` - When cache entry becomes stale
- `tags: string[]` - For dependency-based invalidation
- `source: 'api' | 'user' | 'computed'` - Data origin
- `hitCount: number` - Usage metrics

**Relationships**:
- Associated with PerformanceMetric for cache analytics
- Related to LoadingState during cache operations

**Validation Rules**:
- `key` must be non-empty and unique
- `timestamp` must not be in the future
- `expiresAt` must be after `timestamp`
- `tags` must contain valid tag names (alphanumeric + hyphens)

### 2. LoadingState
**Purpose**: Represents the current status of asynchronous operations
**Fields**:
- `id: string` - Unique identifier for the operation
- `status: 'idle' | 'loading' | 'success' | 'error'` - Current state
- `progress?: number` - Completion percentage (0-100)
- `startTime: Date` - When operation began
- `endTime?: Date` - When operation completed
- `errorMessage?: string` - Error details if status is 'error'
- `retryCount: number` - Number of retry attempts

**State Transitions**:
- `idle` → `loading` (operation starts)
- `loading` → `success` (operation completes successfully)
- `loading` → `error` (operation fails)
- `error` → `loading` (retry attempt)

**Validation Rules**:
- `progress` must be between 0 and 100 when present
- `endTime` must be after `startTime` when present
- `errorMessage` required when status is 'error'
- `retryCount` must be non-negative

### 3. PerformanceMetric
**Purpose**: Tracks performance measurements for optimization analysis
**Fields**:
- `id: string` - Unique metric identifier
- `metricType: 'page_load' | 'navigation' | 'api_response' | 'cache_hit' | 'cache_miss'`
- `value: number` - Measured value (milliseconds, percentage, etc.)
- `timestamp: Date` - When measurement was taken
- `route?: string` - Associated page/route
- `userId?: string` - User who triggered the measurement
- `metadata: Record<string, unknown>` - Additional context

**Relationships**:
- Can reference CacheEntry for cache-related metrics
- Associated with specific user sessions

**Validation Rules**:
- `value` must be non-negative
- `metricType` must be from defined enum
- `route` must be valid application route when present

### 4. CacheConfig
**Purpose**: Configuration settings for different types of cached data
**Fields**:
- `dataType: string` - Type of data being cached
- `defaultTTL: number` - Default time-to-live in milliseconds
- `maxAge: number` - Maximum cache age before forced refresh
- `tags: string[]` - Associated invalidation tags
- `priority: 'low' | 'medium' | 'high'` - Cache eviction priority
- `prefetch: boolean` - Whether to prefetch this data type
- `backgroundRefresh: boolean` - Whether to refresh in background

**Validation Rules**:
- `defaultTTL` and `maxAge` must be positive numbers
- `maxAge` must be greater than or equal to `defaultTTL`
- `dataType` must be non-empty

## Data Relationships

### Cache Hierarchy
```
CacheConfig (1) → (many) CacheEntry
CacheEntry (1) → (many) PerformanceMetric
LoadingState (1) → (0..1) CacheEntry
```

### Performance Tracking
```
User Session → (many) PerformanceMetric
PerformanceMetric → (0..1) CacheEntry (for cache metrics)
PerformanceMetric → (0..1) LoadingState (for operation metrics)
```

## Cache Invalidation Patterns

### Tag-Based Invalidation
- **User Data**: `user:${userId}` - Invalidate all user-specific cache
- **Assignment Data**: `assignment:${assignmentId}` - Specific assignment updates
- **Calendar Data**: `calendar:${date}` - Date-specific calendar data
- **Global**: `auth`, `settings` - System-wide invalidation

### Time-Based Invalidation
- **Static Data**: 24 hours (user profiles, system settings)
- **Dynamic Data**: 5-10 minutes (assignments, calendar events)
- **Real-time Data**: 30 seconds (live updates, notifications)

### Dependency-Based Invalidation
- User logout → Invalidate all `user:${userId}` tags
- Assignment update → Invalidate `assignment:${id}` and `calendar:${dueDate}` tags
- Calendar event change → Invalidate `calendar:${date}` and related `user:${userId}` tags

## Performance Optimization Strategies

### Cache Warming
- Prefetch commonly accessed data on login
- Background refresh of expired cache during idle time
- Predictive loading based on user navigation patterns

### Cache Eviction
- LRU (Least Recently Used) for memory management
- Priority-based eviction (preserve high-priority cache longer)
- Size-based limits with automatic cleanup

### Data Freshness
- Stale-while-revalidate for better user experience
- Background refresh for frequently accessed data
- Manual refresh capability for user-initiated updates

## Integration Points

### React Query Integration
```typescript
interface QueryCacheEntry extends CacheEntry {
  queryKey: string[]
  queryHash: string
  invalidatedAt?: Date
}
```

### Next.js Cache Integration
```typescript
interface NextCacheEntry extends CacheEntry {
  revalidateAt?: Date
  staticGeneration: boolean
  middleware?: string[]
}
```

### Supabase Integration
```typescript
interface SupabaseCacheEntry extends CacheEntry {
  table: string
  filters: Record<string, unknown>
  realtime: boolean
}
```

## Monitoring & Analytics

### Key Metrics
- Cache hit rate by data type
- Average response time by operation
- Cache memory usage and eviction rates
- User experience metrics (load times, navigation speed)

### Performance Thresholds
- Cache hit rate: >70% target
- Page load time: <2s target
- Navigation time: <500ms target
- API response time: <200ms target

### Alerting Conditions
- Cache hit rate drops below 50%
- Average load time exceeds 3 seconds
- High error rates in loading operations
- Cache memory usage exceeds 80% of limit