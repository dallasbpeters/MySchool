import { NextRequest, NextResponse } from 'next/server'
import type { CacheEntry, CacheFilter, CacheInvalidationRequest, CacheInvalidationResponse } from '@/types/cache'
import { filterCacheEntries, createCacheEvent } from '@/lib/cache/cache-utils'

// Mock cache storage (in production, this would be Redis, etc.)
const mockCache = new Map<string, CacheEntry>()

/**
 * GET /api/cache/entries - Retrieve cache entries with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const dataType = searchParams.get('dataType') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    
    const filter: CacheFilter = {
      tags: tags.length > 0 ? tags : undefined,
      dataType,
      limit
    }
    
    // Get all cache entries
    const allEntries = Array.from(mockCache.values())
    
    // Apply filters
    const filteredEntries = filterCacheEntries(allEntries, filter)
    
    // Calculate pagination
    const total = allEntries.length
    const hasMore = filteredEntries.length === limit && total > limit
    
    return NextResponse.json({
      entries: filteredEntries,
      total,
      hasMore
    })
    
  } catch (error) {
    console.error('Cache entries GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cache entries' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cache/entries - Invalidate cache entries
 */
export async function DELETE(request: NextRequest) {
  try {
    const body: CacheInvalidationRequest = await request.json()
    
    if (!body.tags && !body.keys && !body.invalidateAll) {
      return NextResponse.json(
        { error: 'Must specify tags, keys, or invalidateAll' },
        { status: 400 }
      )
    }
    
    let invalidatedCount = 0
    const invalidatedKeys: string[] = []
    
    if (body.invalidateAll) {
      // Clear all cache entries
      invalidatedCount = mockCache.size
      invalidatedKeys.push(...mockCache.keys())
      mockCache.clear()
    } else {
      // Invalidate by tags or keys
      for (const [key, entry] of mockCache.entries()) {
        let shouldInvalidate = false
        
        // Check tags
        if (body.tags && entry.tags) {
          shouldInvalidate = body.tags.some(tag => entry.tags!.includes(tag))
        }
        
        // Check specific keys
        if (body.keys) {
          shouldInvalidate = shouldInvalidate || body.keys.includes(key)
        }
        
        if (shouldInvalidate) {
          mockCache.delete(key)
          invalidatedKeys.push(key)
          invalidatedCount++
        }
      }
    }
    
    // Create invalidation event
    const _event = createCacheEvent('cache_invalidate', 'bulk', {
      reason: body.reason || 'manual',
      invalidatedCount,
      tags: body.tags,
      keys: body.keys
    })
    
    const response: CacheInvalidationResponse = {
      invalidatedCount,
      message: `Successfully invalidated ${invalidatedCount} cache entries`,
      invalidatedKeys,
      timestamp: new Date()
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache entries' },
      { status: 500 }
    )
  }
}