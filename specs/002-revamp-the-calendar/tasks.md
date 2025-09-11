# Tasks: Calendar and Kanban Integration Revamp

**Input**: Design documents from `/specs/002-revamp-the-calendar/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x, React 18, Next.js 14, Supabase
   → Structure: Web application (existing Next.js structure)
2. Load optional design documents:
   → data-model.md: CalendarItem, StudentInitial, AssignmentDisplay entities
   → contracts/: calendar-api.yaml with enhanced events endpoint
   → research.md: Initial generation algorithm, visual differentiation patterns
3. Generate tasks by category:
   → Setup: TypeScript utilities, component structure
   → Tests: contract tests, integration tests, unit tests
   → Core: utilities, components, API enhancements
   → Integration: calendar state, permission checks
   → Polish: accessibility, performance, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `src/` at repository root (existing Next.js structure)
- **Tests**: `tests/` at repository root

## Phase 3.1: Setup
- [ ] T001 Create TypeScript utility types for calendar integration in `src/types/calendar-integration.ts`
- [ ] T002 [P] Create student initials generation utility in `src/utils/student-initials.ts`
- [ ] T003 [P] Create assignment display utility in `src/utils/assignment-display.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test GET /api/events enhanced endpoint in `tests/contract/test-events-api.test.ts`
- [ ] T005 [P] Contract test POST /api/assignments/{id}/toggle in `tests/contract/test-assignment-toggle.test.ts`
- [ ] T006 [P] Contract test POST /api/student-initials in `tests/contract/test-student-initials.test.ts`
- [ ] T007 [P] Integration test parent views calendar with student initials in `tests/integration/parent-calendar-view.test.tsx`
- [ ] T008 [P] Integration test student role-based access in `tests/integration/student-calendar-access.test.tsx`
- [ ] T009 [P] Integration test assignment completion toggle in `tests/integration/assignment-completion.test.tsx`
- [ ] T010 [P] Integration test kanban access permissions in `tests/integration/kanban-permissions.test.tsx`
- [ ] T011 [P] Unit test student initials generation with conflicts in `tests/unit/student-initials.test.ts`
- [ ] T012 [P] Unit test assignment display formatting in `tests/unit/assignment-display.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T013 [P] Implement CalendarItem type definitions in `src/types/calendar-integration.ts`
- [ ] T014 [P] Implement StudentInitial generation algorithm in `src/utils/student-initials.ts`
- [ ] T015 [P] Implement assignment display utilities in `src/utils/assignment-display.ts`
- [ ] T016 Enhance events API with assignment integration in `src/app/api/events/route.ts`
- [ ] T017 Create assignment toggle API endpoint in `src/app/api/assignments/[id]/toggle/route.ts`
- [ ] T018 Create student initials API endpoint in `src/app/api/student-initials/route.ts`
- [ ] T019 Update calendar interfaces with new types in `src/calendar/interfaces.ts`
- [ ] T020 Enhance calendar client container with assignment display in `src/calendar/components/client-container.tsx`
- [ ] T021 Create assignment calendar item component in `src/components/assignment-calendar-item.tsx`
- [ ] T022 [P] Create student initials display component in `src/components/student-initials-display.tsx`
- [ ] T023 Update kanban board with role-based access in `src/components/kanban-assignment-board.tsx`

## Phase 3.4: Integration
- [ ] T024 Integrate assignment service with calendar display in `src/services/assignment-service.ts`
- [ ] T025 Add role-based permission checks to calendar context in `src/calendar/contexts/calendar-context.tsx`
- [ ] T026 Implement calendar state synchronization for assignments in `src/calendar/contexts/calendar-context.tsx`
- [ ] T027 Add assignment completion optimistic updates in `src/services/assignment-service.ts`
- [ ] T028 Update global calendar styles for assignment differentiation in `src/app/globals.css`

## Phase 3.5: Polish
- [ ] T029 [P] Add accessibility labels for student initials in `src/components/student-initials-display.tsx`
- [ ] T030 [P] Implement keyboard navigation for assignment items in `src/components/assignment-calendar-item.tsx`
- [ ] T031 [P] Add performance optimization for initial generation in `src/utils/student-initials.ts`
- [ ] T032 [P] Create error boundary for calendar assignment display in `src/components/calendar-error-boundary.tsx`
- [ ] T033 [P] Update assignment card component with new display rules in `src/components/assignment-card.tsx`
- [ ] T034 Run quickstart validation scenarios from `specs/002-revamp-the-calendar/quickstart.md`
- [ ] T035 Performance test calendar rendering with multiple assignments
- [ ] T036 Update CLAUDE.md with implementation notes

## Dependencies
- Setup (T001-T003) before all other phases
- Tests (T004-T012) before implementation (T013-T028)
- T013 (types) blocks T019 (interfaces update)
- T014 (initials utility) blocks T022 (initials component)
- T015 (assignment display) blocks T021 (assignment item)
- T016 (API enhancement) blocks T024 (service integration)
- T020 (calendar container) blocks T025, T026 (context updates)
- Implementation before polish (T029-T036)

## Parallel Example
```
# Launch T004-T012 together (all test files):
Task: "Contract test GET /api/events in tests/contract/test-events-api.test.ts"
Task: "Contract test POST /api/assignments/{id}/toggle in tests/contract/test-assignment-toggle.test.ts"
Task: "Integration test parent calendar view in tests/integration/parent-calendar-view.test.tsx"
Task: "Unit test student initials generation in tests/unit/student-initials.test.ts"

# Launch T013-T015, T022 together (different utility files):
Task: "Implement CalendarItem types in src/types/calendar-integration.ts"
Task: "Implement StudentInitial generation in src/utils/student-initials.ts"
Task: "Implement assignment display utilities in src/utils/assignment-display.ts"
Task: "Create student initials component in src/components/student-initials-display.tsx"
```

## Key Implementation Notes

### Student Initials Algorithm (T014)
```typescript
// Must handle conflicts: "John Doe" + "Jane Doe" → "JD" + "JD2"
// Must support middle names: "John M. Doe" → "JMD"
// Must be deterministic and cached
```

### Assignment Display Rules (T015)
```typescript
// Hide time display completely for assignments
// Show student initials prominently
// Color coding: red=overdue, yellow=due, green=completed, gray=all completed
```

### Role-Based Access (T023, T025)
```typescript
// Students: Calendar view only, cannot edit assignment dates
// Parents: Calendar + Kanban, can create assignments
// Admins: Full access to all views
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Focus on visual differentiation between events (show time) and assignments (show initials)
- Maintain existing database schema - no migrations required

## Task Generation Rules Applied

1. **From Contracts**: 3 contract tests for API endpoints
2. **From Data Model**: 3 entities → utility and component tasks
3. **From User Stories**: 4 integration tests for role-based scenarios
4. **TDD Ordering**: All tests (T004-T012) before implementation (T013-T028)
5. **Parallel Marking**: Independent files marked [P], shared files sequential

## Validation Checklist

- [x] All contracts have corresponding tests (T004-T006)
- [x] All entities have implementation tasks (T013-T015)
- [x] All tests come before implementation (T004-T012 → T013-T028)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Role-based access requirements addressed (T008, T010, T023, T025)
- [x] Visual differentiation requirements covered (T015, T021, T028)