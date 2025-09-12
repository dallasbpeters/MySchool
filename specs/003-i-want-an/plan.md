# Implementation Plan: Performance Optimization with Caching and Loading States

**Branch**: `003-i-want-an` | **Date**: 2025-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-i-want-an/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: Optimize app performance through efficient routing, data fetching with caching implementation, and proper loading states following Next.js best practices. Technical approach focuses on reducing redundant server requests, implementing client-side caching strategies, and providing immediate user feedback during navigation and data operations.

## Technical Context
**Language/Version**: TypeScript 5.9, React 19.1.1, Next.js 15.5.2  
**Primary Dependencies**: Next.js (SSR/SSG), Supabase (backend), React Query/SWR (NEEDS CLARIFICATION - caching strategy), Framer Motion (animations)  
**Storage**: Supabase (PostgreSQL), Browser Cache, Local Storage for client-side caching  
**Testing**: Jest + React Testing Library (NEEDS CLARIFICATION - current testing setup)  
**Target Platform**: Web browsers (modern JS support), mobile-responsive
**Project Type**: web - Next.js full-stack application with frontend + API routes  
**Performance Goals**: <2s initial page load, <500ms subsequent navigation, 50% cache hit rate (NEEDS CLARIFICATION - specific targets)  
**Constraints**: <200ms API response time, progressive loading for slow networks, offline-first where possible (NEEDS CLARIFICATION)  
**Scale/Scope**: Educational app - 100+ concurrent users, 10+ pages/routes, real-time data sync requirements (NEEDS CLARIFICATION)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js full-stack app with API routes)
- Using framework directly? YES (Next.js native caching, no wrapper abstractions)
- Single data model? YES (shared TypeScript interfaces between frontend/backend)
- Avoiding patterns? YES (no Repository pattern - direct Supabase calls, simple cache layers)

**Architecture**:
- EVERY feature as library? NO - performance optimization is cross-cutting infrastructure
- Libraries listed: cache-utils (client caching), performance-monitor (metrics), loading-states (UI components)
- CLI per library: N/A (web application, no CLI needed)
- Library docs: Internal documentation only (not external library)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES
- Git commits show tests before implementation? YES
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual Supabase, browser cache APIs)
- Integration tests for: cache invalidation, loading state transitions, performance thresholds
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES (performance metrics, cache hit/miss rates)
- Frontend logs → backend? YES (performance data aggregation)
- Error context sufficient? YES (cache failures, network issues, loading timeouts)

**Versioning**:
- Version number assigned? YES (0.2.0 - minor feature addition)
- BUILD increments on every change? YES
- Breaking changes handled? N/A (infrastructure improvements, no API changes)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - Next.js app with src/ structure, API routes, and frontend components

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- **Cache Infrastructure**: Cache utility library, configuration system [P]
- **Performance Monitoring**: Metrics collection, API endpoints [P]
- **Loading Components**: Skeleton loaders, progress bars, error states [P]  
- **React Query Integration**: Query client setup, custom hooks
- **API Routes**: Cache management endpoints, health checks
- **Testing Suite**: Contract tests, integration tests, performance tests

**Ordering Strategy** (TDD Enforced):
1. **Contract Tests**: API and component interface tests (MUST FAIL)
2. **Integration Tests**: Cache behavior, loading state flows (MUST FAIL)
3. **Performance Tests**: Load time thresholds, cache metrics (MUST FAIL)
4. **Infrastructure**: Cache utilities, performance monitoring
5. **Components**: Loading states, error boundaries
6. **Hooks**: useLoadingState, usePerformanceMonitor, useCacheStatus
7. **API Endpoints**: Cache management, metrics collection
8. **Integration**: React Query setup, component integration
9. **E2E Tests**: User scenarios from quickstart.md

**Parallel Execution [P]**:
- Cache utilities and performance monitoring (independent)
- Loading components and error states (independent)
- API endpoints (independent of frontend)
- Contract tests (independent of implementation)

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**Dependencies**:
- React Query v5 installation and configuration
- TypeScript interfaces from data model
- Testing framework setup (Jest + RTL + MSW)
- Performance monitoring infrastructure

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (N/A - no violations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*