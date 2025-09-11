# Tasks: Performance Optimization with Caching and Loading States

**Input**: Design documents from `/specs/003-i-want-an/`
**Prerequisites**: research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: Next.js app structure with `src/` at repository root
- Paths shown below follow existing MySchool project structure

## Phase 3.1: Setup
- [ ] T001 Install React Query v5 and performance monitoring dependencies
- [ ] T002 [P] Configure React Query provider in `src/app/layout.tsx`
- [ ] T003 [P] Create cache utilities directory structure at `src/lib/cache/`
- [ ] T004 [P] Create loading components directory structure at `src/components/loading/`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test GET /api/cache/entries in `tests/contract/cache-entries.test.ts`
- [ ] T006 [P] Contract test DELETE /api/cache/entries in `tests/contract/cache-invalidation.test.ts`
- [ ] T007 [P] Contract test GET /api/cache/metrics in `tests/contract/cache-metrics.test.ts`
- [ ] T008 [P] Contract test POST /api/cache/metrics in `tests/contract/performance-metrics.test.ts`
- [ ] T009 [P] Contract test GET /api/cache/health in `tests/contract/cache-health.test.ts`
- [ ] T010 [P] ColourfulText loading component test in `tests/components/colourful-text-loading.test.tsx`
- [ ] T011 [P] LoadingWrapper component test in `tests/components/loading-wrapper.test.tsx`
- [ ] T012 [P] Integration test initial page load performance in `tests/integration/page-load-performance.test.ts`
- [ ] T013 [P] Integration test cached navigation performance in `tests/integration/cached-navigation.test.ts`
- [ ] T014 [P] Integration test cache invalidation flow in `tests/integration/cache-invalidation-flow.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models and Types
- [ ] T015 [P] CacheEntry interface in `src/types/cache.ts`
- [ ] T016 [P] LoadingState interface in `src/types/loading.ts`
- [ ] T017 [P] PerformanceMetric interface in `src/types/performance.ts`
- [ ] T018 [P] CacheConfig interface in `src/types/cache-config.ts`

### Cache System Core
- [ ] T019 [P] Cache utilities in `src/lib/cache/cache-utils.ts`
- [ ] T020 [P] Cache configuration in `src/lib/cache/cache-config.ts`
- [ ] T021 [P] Performance monitoring utility in `src/lib/cache/performance-monitor.ts`
- [ ] T022 React Query configuration in `src/lib/cache/query-client.ts`

### Loading Components
- [ ] T023 [P] Enhanced ColourfulText loading component in `src/components/loading/colourful-text-loading.tsx`
- [ ] T024 [P] LoadingSpinner component in `src/components/loading/loading-spinner.tsx`
- [ ] T025 [P] ProgressBar component in `src/components/loading/progress-bar.tsx`
- [ ] T026 [P] LoadingWrapper component in `src/components/loading/loading-wrapper.tsx`
- [ ] T027 [P] ErrorBoundary component in `src/components/loading/error-boundary.tsx`
- [ ] T028 [P] CacheStatus indicator in `src/components/loading/cache-status.tsx`

### React Hooks
- [ ] T029 [P] useLoadingState hook in `src/hooks/use-loading-state.ts`
- [ ] T030 [P] usePerformanceMonitor hook in `src/hooks/use-performance-monitor.ts`
- [ ] T031 [P] useCacheStatus hook in `src/hooks/use-cache-status.ts`

### API Endpoints
- [ ] T032 GET /api/cache/entries endpoint in `src/app/api/cache/entries/route.ts`
- [ ] T033 DELETE /api/cache/entries endpoint - add to existing file
- [ ] T034 GET /api/cache/metrics endpoint in `src/app/api/cache/metrics/route.ts`
- [ ] T035 POST /api/cache/metrics endpoint - add to existing file
- [ ] T036 [P] GET /api/cache/health endpoint in `src/app/api/cache/health/route.ts`
- [ ] T037 [P] PUT /api/cache/config endpoint in `src/app/api/cache/config/route.ts`

## Phase 3.4: Integration
- [ ] T038 Integrate React Query with existing data fetching
- [ ] T039 Update calendar components to use loading states
- [ ] T040 Update assignment components to use caching
- [ ] T041 Add performance monitoring to navigation
- [ ] T042 Connect cache invalidation to mutations
- [ ] T043 Add error boundaries to main routes

## Phase 3.5: Polish
- [ ] T044 [P] Unit tests for cache utilities in `tests/unit/cache-utils.test.ts`
- [ ] T045 [P] Unit tests for loading hooks in `tests/unit/loading-hooks.test.ts`
- [ ] T046 [P] Unit tests for performance monitoring in `tests/unit/performance-monitor.test.ts`
- [ ] T047 [P] Accessibility tests for loading components in `tests/accessibility/loading-a11y.test.ts`
- [ ] T048 Performance benchmarking tests (<2s page load, <500ms navigation)
- [ ] T049 Cache memory usage optimization
- [ ] T050 Add JSDoc documentation to public APIs
- [ ] T051 Run quickstart validation scenarios from `quickstart.md`

## Dependencies
- Setup (T001-T004) before all other phases
- Tests (T005-T014) before implementation (T015-T043)
- Types (T015-T018) before implementation that uses them
- Core utilities (T019-T022) before components and hooks that use them
- Components and hooks (T023-T031) before API endpoints that might use them
- API endpoints (T032-T037) before integration (T038-T043)
- Implementation before polish (T044-T051)

## Parallel Example
```
# Launch T005-T014 together (all contract and integration tests):
Task: "Contract test GET /api/cache/entries in tests/contract/cache-entries.test.ts"
Task: "Contract test DELETE /api/cache/entries in tests/contract/cache-invalidation.test.ts" 
Task: "Contract test GET /api/cache/metrics in tests/contract/cache-metrics.test.ts"
Task: "Integration test initial page load performance in tests/integration/page-load-performance.test.ts"

# Launch T015-T018 together (all type definitions):
Task: "CacheEntry interface in src/types/cache.ts"
Task: "LoadingState interface in src/types/loading.ts"
Task: "PerformanceMetric interface in src/types/performance.ts"
Task: "CacheConfig interface in src/types/cache-config.ts"

# Launch T023-T028 together (all loading components):
Task: "Enhanced ColourfulText loading component in src/components/loading/colourful-text-loading.tsx"
Task: "LoadingSpinner component in src/components/loading/loading-spinner.tsx"
Task: "ProgressBar component in src/components/loading/progress-bar.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing features
- Commit after each major task completion
- Use existing ColourfulText component as base for loading states
- Follow existing project patterns for file organization
- Ensure all loading states are accessible (ARIA compliance)

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - cache-api.yaml → 5 contract test tasks [P] + 5 endpoint implementation tasks
   - loading-components.yaml → 6 component test tasks [P] + 6 component implementation tasks
   
2. **From Data Model**:
   - CacheEntry, LoadingState, PerformanceMetric, CacheConfig → 4 interface tasks [P]
   - Cache relationships → utility and service layer tasks
   
3. **From User Stories (quickstart.md)**:
   - Initial page load → performance test [P]
   - Cached navigation → caching test [P] 
   - Loading states → UI component tests [P]
   - Cache invalidation → integration test [P]

4. **Ordering**:
   - Setup → Tests → Types → Core → Components → APIs → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T005-T014)
- [x] All entities have interface tasks (T015-T018)
- [x] All tests come before implementation (T005-T014 before T015+)
- [x] Parallel tasks truly independent (different files marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task