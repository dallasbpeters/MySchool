/**
 * Integration test for initial page load performance
 * Tests the performance requirements from quickstart scenarios
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock the performance monitoring utilities
const mockPerformanceMonitor = {
  startMeasurement: jest.fn(),
  endMeasurement: jest.fn(),
  getMetrics: jest.fn(),
  recordMetric: jest.fn(),
}

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  asPath: '/',
  pathname: '/',
  query: {},
  isReady: true,
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

// Mock React Query
const mockQueryClient = {
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  prefetchQuery: jest.fn(),
  getQueryCache: jest.fn(() => ({
    getAll: jest.fn(() => []),
  })),
}

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
  useQuery: jest.fn(),
}))

describe('Initial Page Load Performance - Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup performance API mock
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: jest.fn(() => []),
        getEntriesByName: jest.fn(() => []),
        timing: {
          navigationStart: Date.now() - 2000,
          loadEventEnd: Date.now() - 200,
          domContentLoadedEventEnd: Date.now() - 500,
          fetchStart: Date.now() - 1800,
          responseEnd: Date.now() - 800,
        },
      },
      writable: true,
    })
    
    // Mock Intersection Observer for lazy loading
    Object.defineProperty(window, 'IntersectionObserver', {
      value: jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      })),
      writable: true,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should measure and record initial page load time', async () => {
    // This test MUST FAIL initially - performance monitoring not integrated
    
    // Mock a page load scenario
    const startTime = performance.now()
    
    // Simulate page navigation
    await mockRouter.push('/dashboard')
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    // Should record performance metric
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: expect.any(Number),
      route: '/dashboard',
      metadata: expect.objectContaining({
        timestamp: expect.any(String),
      }),
    })
    
    // Load time should be within acceptable range for initial load
    expect(loadTime).toBeLessThan(2000) // Target: <2 seconds
  })

  it('should track First Contentful Paint (FCP)', async () => {
    // This test MUST FAIL initially - FCP tracking not implemented
    
    // Mock Performance Observer for paint metrics
    const mockPaintEntries = [
      {
        name: 'first-contentful-paint',
        startTime: 1200,
        entryType: 'paint',
      },
    ]
    
    Object.defineProperty(window, 'PerformanceObserver', {
      value: jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(() => {
          // Simulate paint metric being captured
          callback({
            getEntries: () => mockPaintEntries,
          })
        }),
        disconnect: jest.fn(),
      })),
      writable: true,
    })
    
    // Trigger page load measurement
    const observer = new window.PerformanceObserver(() => {})
    observer.observe({ entryTypes: ['paint'] })
    
    // Should capture FCP metric
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: 1200,
      route: expect.any(String),
      metadata: expect.objectContaining({
        paintType: 'first-contentful-paint',
      }),
    })
    
    // FCP should be under target
    expect(mockPaintEntries[0].startTime).toBeLessThan(1200) // Target: <1.2s
  })

  it('should track Largest Contentful Paint (LCP)', async () => {
    // This test MUST FAIL initially - LCP tracking not implemented
    
    const mockLCPEntries = [
      {
        startTime: 2200,
        entryType: 'largest-contentful-paint',
        element: document.createElement('div'),
        size: 50000,
      },
    ]
    
    Object.defineProperty(window, 'PerformanceObserver', {
      value: jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(() => {
          callback({
            getEntries: () => mockLCPEntries,
          })
        }),
        disconnect: jest.fn(),
      })),
      writable: true,
    })
    
    // Trigger LCP measurement
    const observer = new window.PerformanceObserver(() => {})
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
    
    // Should capture LCP metric
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: 2200,
      route: expect.any(String),
      metadata: expect.objectContaining({
        paintType: 'largest-contentful-paint',
        elementSize: 50000,
      }),
    })
    
    // LCP should be under target
    expect(mockLCPEntries[0].startTime).toBeLessThan(2500) // Target: <2.5s
  })

  it('should track Time to Interactive (TTI)', async () => {
    // This test MUST FAIL initially - TTI calculation not implemented
    
    // Mock navigation timing data
    const mockTiming = {
      navigationStart: 1000,
      domContentLoadedEventEnd: 2500,
      loadEventEnd: 2800,
      fetchStart: 1100,
      responseEnd: 1800,
    }
    
    Object.defineProperty(window.performance, 'timing', {
      value: mockTiming,
      writable: true,
    })
    
    // Calculate TTI (simplified calculation for test)
    const tti = mockTiming.domContentLoadedEventEnd - mockTiming.navigationStart
    
    // Should record TTI metric
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: tti,
      route: expect.any(String),
      metadata: expect.objectContaining({
        metricName: 'time-to-interactive',
      }),
    })
    
    // TTI should be under target
    expect(tti).toBeLessThan(3000) // Target: <3s
  })

  it('should show loading indicators immediately on page navigation', async () => {
    // This test MUST FAIL initially - immediate loading states not implemented
    
    const loadingStartTime = performance.now()
    
    // Mock loading state change
    const mockLoadingStateChange = jest.fn()
    
    // Simulate navigation start
    await mockRouter.push('/calendar')
    
    const loadingShowTime = performance.now() - loadingStartTime
    
    // Loading indicator should appear within 100ms
    expect(loadingShowTime).toBeLessThan(100)
    
    // Should record loading state timing
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'navigation',
      value: loadingShowTime,
      route: '/calendar',
      metadata: expect.objectContaining({
        action: 'loading_indicator_shown',
      }),
    })
  })

  it('should handle slow network conditions gracefully', async () => {
    // This test MUST FAIL initially - slow network handling not implemented
    
    // Mock slow network response
    const mockSlowResponse = new Promise(resolve => 
      setTimeout(resolve, 3000)
    )
    
    global.fetch = jest.fn().mockImplementation(() => mockSlowResponse)
    
    const startTime = performance.now()
    
    try {
      // Simulate slow API call
      await fetch('/api/calendar/events')
    } catch (error) {
      // Should handle timeouts gracefully
    }
    
    const responseTime = performance.now() - startTime
    
    // Should record slow response time
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'api_response',
      value: responseTime,
      route: expect.any(String),
      metadata: expect.objectContaining({
        endpoint: '/api/calendar/events',
        slow: true,
      }),
    })
    
    // Should show appropriate loading states for slow connections
    expect(responseTime).toBeGreaterThan(1000)
  })

  it('should optimize bundle size for initial load', async () => {
    // This test MUST FAIL initially - bundle optimization not measured
    
    // Mock bundle size measurement
    const mockBundleSize = {
      javascript: 450000, // 450KB
      css: 50000, // 50KB
      total: 500000, // 500KB
    }
    
    // Should track bundle sizes
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: mockBundleSize.total,
      route: expect.any(String),
      metadata: expect.objectContaining({
        bundleBreakdown: mockBundleSize,
      }),
    })
    
    // Bundle should be under target size
    expect(mockBundleSize.javascript).toBeLessThan(500000) // <500KB JS
    expect(mockBundleSize.total).toBeLessThan(600000) // <600KB total
  })

  it('should prefetch critical resources', async () => {
    // This test MUST FAIL initially - resource prefetching not implemented
    
    // Mock resource prefetching
    const prefetchedResources = [
      '/api/user/profile',
      '/api/calendar/events',
      '/static/fonts/primary.woff2',
    ]
    
    // Should prefetch critical resources
    for (const resource of prefetchedResources) {
      expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([resource]),
        })
      )
    }
    
    // Should record prefetch performance
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: expect.any(Number),
      route: expect.any(String),
      metadata: expect.objectContaining({
        action: 'resources_prefetched',
        resourceCount: prefetchedResources.length,
      }),
    })
  })

  it('should handle JavaScript errors without breaking performance tracking', async () => {
    // This test MUST FAIL initially - error handling not implemented
    
    const mockError = new Error('Test error')
    const originalError = console.error
    console.error = jest.fn()
    
    try {
      // Simulate JavaScript error during page load
      throw mockError
    } catch (error) {
      // Should continue performance tracking even with errors
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
        metricType: 'page_load',
        value: expect.any(Number),
        route: expect.any(String),
        metadata: expect.objectContaining({
          error: true,
          errorMessage: 'Test error',
        }),
      })
    }
    
    console.error = originalError
  })

  it('should implement progressive loading for non-critical content', async () => {
    // This test MUST FAIL initially - progressive loading not implemented
    
    const criticalContentTime = performance.now()
    
    // Mock critical content loading (above fold)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const criticalLoadTime = performance.now() - criticalContentTime
    
    // Critical content should load quickly
    expect(criticalLoadTime).toBeLessThan(1000)
    
    // Should record critical vs non-critical loading metrics
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: criticalLoadTime,
      route: expect.any(String),
      metadata: expect.objectContaining({
        contentType: 'critical',
        priority: 'high',
      }),
    })
  })

  it('should measure cumulative layout shift (CLS)', async () => {
    // This test MUST FAIL initially - CLS measurement not implemented
    
    const mockLayoutShiftEntries = [
      {
        value: 0.05,
        entryType: 'layout-shift',
        hadRecentInput: false,
        lastInputTime: 0,
      },
    ]
    
    Object.defineProperty(window, 'PerformanceObserver', {
      value: jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(() => {
          callback({
            getEntries: () => mockLayoutShiftEntries,
          })
        }),
        disconnect: jest.fn(),
      })),
      writable: true,
    })
    
    // Trigger layout shift measurement
    const observer = new window.PerformanceObserver(() => {})
    observer.observe({ entryTypes: ['layout-shift'] })
    
    // Should capture CLS metric
    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith({
      metricType: 'page_load',
      value: 0.05,
      route: expect.any(String),
      metadata: expect.objectContaining({
        metricName: 'cumulative-layout-shift',
        hadRecentInput: false,
      }),
    })
    
    // CLS should be under target
    expect(mockLayoutShiftEntries[0].value).toBeLessThan(0.1) // Target: <0.1
  })
})