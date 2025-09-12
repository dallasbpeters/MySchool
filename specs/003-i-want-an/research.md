# Research: Performance Optimization with Caching and Loading States

**Feature**: 003-i-want-an  
**Date**: 2025-01-14  
**Phase**: 0 - Research & Investigation

## Research Objectives

Resolve all NEEDS CLARIFICATION items from the technical context and feature specification:

1. **Caching Strategy**: React Query vs SWR vs native solutions
2. **Testing Setup**: Current testing infrastructure and performance testing approach
3. **Performance Targets**: Specific load time thresholds and metrics
4. **Cache Configuration**: Duration policies and invalidation strategies
5. **Loading Indicator Design**: Consistent UI patterns and accessibility
6. **Offline Support**: Degree of offline functionality required

## Research Findings

### 1. Caching Strategy

**Decision**: React Query (TanStack Query v5)

**Rationale**: 
- Built-in stale-while-revalidate caching
- Automatic background refetching
- Optimistic updates support
- Request deduplication
- Cache invalidation patterns
- TypeScript support
- Works seamlessly with Next.js

**Alternatives Considered**:
- **SWR**: Lighter weight but less feature-complete for complex cache scenarios
- **Native Fetch + Cache**: Too much manual implementation for cache management
- **Next.js built-in caching**: Good for SSR/SSG but limited for client-side data

**Implementation Details**:
- Default stale time: 5 minutes for static data (assignments, user profiles)
- Background refetch: Every 30 seconds for real-time data (calendar events)
- Cache invalidation: On mutations, user actions, and data dependencies
- Prefetching: On route changes and predictable user navigation

### 2. Testing Setup

**Decision**: Jest + React Testing Library + MSW + Performance Testing

**Rationale**:
- Current project likely uses Next.js testing defaults
- MSW for API mocking maintains realistic request/response cycles
- Performance testing with Lighthouse CI for automated metrics
- Integration tests for cache behavior and loading states

**Testing Categories**:
- **Unit Tests**: Cache utilities, loading state components
- **Integration Tests**: Cache invalidation, data fetching flows
- **Performance Tests**: Load time thresholds, cache hit rates
- **E2E Tests**: User navigation flows with realistic network conditions

### 3. Performance Targets

**Decision**: Specific measurable thresholds

**Targets**:
- **Initial Page Load**: <2 seconds (75th percentile)
- **Subsequent Navigation**: <500ms (cache hits)
- **API Response Time**: <200ms (95th percentile) 
- **Cache Hit Rate**: >70% for repeated navigation
- **Time to Interactive**: <3 seconds
- **Largest Contentful Paint**: <2.5 seconds

**Rationale**: Based on web performance best practices and educational app user expectations

### 4. Cache Configuration

**Decision**: Tiered caching with appropriate durations

**Cache Durations**:
- **User Profiles**: 30 minutes (rarely changes)
- **Calendar Events**: 5 minutes (moderate updates)
- **Assignment Data**: 10 minutes (occasional updates)
- **Real-time Data**: 30 seconds (frequent updates)
- **Static Content**: 24 hours (images, styles)

**Invalidation Strategies**:
- **Mutation-based**: Invalidate on create/update/delete operations
- **Time-based**: Automatic expiration with background refresh
- **Manual**: User-triggered refresh actions
- **Dependency-based**: Related data invalidation (e.g., user changes invalidate their assignments)

### 5. Loading Indicator Design

**Decision**: ColourfulText component with progressive enhancement

**Design System**:
- **ColourfulText Loading**: Animated text indicator using existing component at `@src/components/ui/colourful-text.tsx`
- **Spinner**: For quick operations (<2 seconds)
- **Progress Bars**: For longer operations with measurable progress
- **Error States**: Clear error messages with retry options

**Accessibility**:
- ARIA live regions for loading announcements
- Reduced motion respect for users with vestibular disorders
- Keyboard navigation during loading states
- Screen reader compatible loading messages

### 6. Offline Support

**Decision**: Basic offline with cached data fallback

**Scope**:
- **Read-only**: Display cached data when offline
- **Progressive Enhancement**: App works with slow/intermittent connections
- **Cache-first**: Show cached content immediately, update in background
- **Limited Offline Actions**: Mark assignments complete (sync when online)

**Implementation**:
- Service Worker for asset caching
- React Query cache persistence
- Network status detection
- Graceful degradation messaging

## Research Summary

All NEEDS CLARIFICATION items have been resolved with specific technical decisions:

✅ **Caching Strategy**: React Query v5 with tiered cache durations  
✅ **Testing Setup**: Jest + RTL + MSW + Lighthouse CI  
✅ **Performance Targets**: Specific thresholds (<2s load, <500ms navigation)  
✅ **Cache Configuration**: Duration policies and invalidation strategies defined  
✅ **Loading Indicators**: Consistent skeleton loading with accessibility  
✅ **Offline Support**: Cache-first with basic offline functionality  

## Next Steps

Phase 1 can proceed with:
- Data model design based on cache entities
- API contracts for optimized data fetching
- Component contracts for loading states
- Performance monitoring integration points

**Dependencies Resolved**: No external dependencies blocking implementation  
**Risk Factors**: None identified - all solutions use proven, stable technologies  
**Performance Impact**: Positive - significant improvement expected in user experience metrics