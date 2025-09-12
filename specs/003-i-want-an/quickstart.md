# Quickstart: Performance Optimization with Caching and Loading States

**Feature**: 003-i-want-an  
**Date**: 2025-01-14  
**Phase**: 1 - Integration Test Scenarios

## Overview

This quickstart guide provides step-by-step scenarios to validate the performance optimization feature. Each scenario corresponds to a user story from the feature specification and can be used as integration test cases.

## Prerequisites

- Next.js application running locally
- React Query configured and integrated
- Performance monitoring tools installed
- Test data available (users, assignments, calendar events)

## Test Scenarios

### Scenario 1: Initial Page Load Performance

**User Story**: As a user navigating to any page for the first time, I want it to load within 2 seconds.

**Test Steps**:
1. Clear browser cache and local storage
2. Navigate to the application root URL
3. Measure First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
4. Verify loading skeleton appears immediately
5. Confirm page content loads within 2 seconds

**Expected Results**:
- ColourfulText loading animation displays within 100ms
- FCP < 1.2 seconds
- LCP < 2.5 seconds
- Time to Interactive (TTI) < 3 seconds
- No JavaScript errors in console

**Performance Metrics**:
```bash
# Run performance audit
npm run test:performance -- --route="/dashboard"

# Expected output:
# ✓ FCP: 1.1s (target: <1.2s)
# ✓ LCP: 2.2s (target: <2.5s)
# ✓ TTI: 2.8s (target: <3.0s)
```

### Scenario 2: Cached Page Navigation

**User Story**: As a user who has previously visited a page, I want it to load faster than the first visit due to caching.

**Test Steps**:
1. Visit dashboard page (warm up cache)
2. Navigate to calendar page
3. Return to dashboard page
4. Measure navigation time and verify cache hit

**Expected Results**:
- Navigation time < 500ms
- Cache hit rate > 70%
- No loading animation on cached content (immediate display)
- Background refresh occurs if data is stale

**Cache Validation**:
```bash
# Check cache status
curl http://localhost:3000/api/cache/health

# Expected response:
# {
#   "status": "healthy",
#   "cacheHitRate": 85.3,
#   "memoryUsage": { "percentage": 45.2 }
# }
```

### Scenario 3: Smooth Loading States

**User Story**: As a user navigating between different sections, I want loading indicators to appear immediately and data to populate smoothly.

**Test Steps**:
1. Navigate from dashboard to assignments page
2. Verify immediate loading state display
3. Confirm smooth transition when data loads
4. Test error state handling with network failure
5. Verify retry functionality

**Expected Results**:
- ColourfulText loading indicator appears within 50ms of navigation
- Smooth color animations during loading states
- Smooth transitions between loading and loaded states
- Error states are user-friendly with retry options
- ARIA live regions announce state changes

**Accessibility Test**:
```bash
# Run accessibility audit
npm run test:a11y -- --route="/assignments"

# Verify:
# ✓ ColourfulText loading animations have proper ARIA labels
# ✓ Screen reader announcements work for loading states
# ✓ Keyboard navigation during loading
# ✓ Reduced motion preferences respected
```

### Scenario 4: Slow Network Performance

**User Story**: As a user on a slow network connection, I want cached data to display immediately while fresh data loads in the background.

**Test Steps**:
1. Simulate slow 3G connection in browser
2. Navigate to a previously visited page
3. Verify cached content appears immediately
4. Confirm background refresh occurs
5. Test offline mode functionality

**Network Simulation**:
```bash
# Throttle network speed
# Chrome DevTools > Network > Slow 3G

# Or programmatically:
npm run test:network -- --speed=slow-3g --route="/calendar"
```

**Expected Results**:
- Cached content displays < 200ms
- Background refresh indicator visible
- No jarring content replacement
- Graceful offline mode with clear messaging

### Scenario 5: Cache Invalidation

**User Story**: As a user who makes changes to data, I want the cache to update appropriately so I see fresh information.

**Test Steps**:
1. Load assignments page (cache assignment data)
2. Create a new assignment
3. Verify cache invalidation occurs
4. Confirm fresh data loads without full page refresh
5. Test dependency-based invalidation

**API Test**:
```bash
# Create assignment and verify cache invalidation
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Assignment", "dueDate": "2025-01-20"}'

# Check cache invalidation
curl http://localhost:3000/api/cache/entries?tags=assignments

# Expected: Empty result or updated timestamp
```

**Expected Results**:
- Related cache entries invalidated immediately
- Fresh data loads automatically
- No manual refresh required
- Optimistic updates where appropriate

## Performance Benchmarks

### Load Time Targets
- **Initial Page Load**: < 2 seconds (75th percentile)
- **Cached Navigation**: < 500ms (95th percentile)
- **API Response**: < 200ms (95th percentile)
- **Cache Hit Rate**: > 70% for repeated visits

### Memory Usage
- **Cache Memory**: < 50MB for typical session
- **JavaScript Bundle**: < 500KB compressed
- **Image Assets**: Optimized and lazy-loaded

### Network Efficiency
- **Request Reduction**: 50% fewer API calls with caching
- **Data Transfer**: Minimal duplicate data fetching
- **Connection Pooling**: Efficient resource usage

## Integration Test Commands

### Run All Performance Tests
```bash
npm run test:performance
```

### Run Cache Tests
```bash
npm run test:cache
```

### Run Loading State Tests
```bash
npm run test:loading-states
```

### Run Network Simulation Tests
```bash
npm run test:network-simulation
```

## Monitoring and Alerts

### Real-time Monitoring
```bash
# Start performance monitoring
npm run monitor:performance

# View live metrics
open http://localhost:3000/dev/performance-dashboard
```

### Automated Alerts
- Cache hit rate drops below 50%
- Average load time exceeds 3 seconds
- High error rates in loading operations
- Memory usage exceeds 80% of limit

## Troubleshooting

### Common Issues

1. **High Cache Miss Rate**
   - Check cache key generation logic
   - Verify cache duration settings
   - Review invalidation patterns

2. **Slow Loading Times**
   - Analyze bundle size
   - Check for memory leaks
   - Review critical rendering path

3. **Loading State Flickers**
   - Implement minimum loading duration
   - Use skeleton loading for better UX
   - Optimize state transition timing

### Debug Commands
```bash
# Clear cache manually
curl -X DELETE http://localhost:3000/api/cache/entries

# View cache entries
curl http://localhost:3000/api/cache/entries

# Get performance metrics
curl http://localhost:3000/api/cache/metrics
```

## Success Criteria

The feature is considered successful when:

✅ All test scenarios pass consistently  
✅ Performance benchmarks are met  
✅ Cache hit rate exceeds 70%  
✅ Loading states are accessible and smooth  
✅ Network failure handling works properly  
✅ No regression in existing functionality  

## Next Steps

After successful quickstart validation:

1. Deploy to staging environment
2. Run extended performance testing
3. Gather user feedback on loading experience
4. Monitor production metrics
5. Iterate on cache strategies based on usage patterns