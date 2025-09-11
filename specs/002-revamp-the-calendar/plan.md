# Implementation Plan: Calendar and Kanban Integration Revamp

**Branch**: `002-revamp-the-calendar` | **Date**: 2025-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-revamp-the-calendar/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (frontend+backend)
   → Structure Decision: Option 2 (Web application)
3. Evaluate Constitution Check section below
   → No constitution violations identified
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → Researching calendar/kanban implementation patterns
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → No new violations
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Revamp calendar and kanban integration to improve assignment visibility and responsible party identification. The kanban view is specifically for creating assignments and is only viewable by parents and admins (no visual connection needed for students). Students can view the calendar but can only edit events they created, not assignment dates. Key improvements include hiding misleading time displays on assignments, showing student initials instead, and maintaining proper role-based access controls.

## Technical Context
**Language/Version**: TypeScript 5.x, Node.js 20.x  
**Primary Dependencies**: React 18, Next.js 14, Supabase, Radix UI  
**Storage**: Supabase (PostgreSQL)  
**Testing**: Jest, React Testing Library  
**Target Platform**: Web browser (Chrome, Safari, Firefox, Edge)
**Project Type**: web - determines source structure  
**Performance Goals**: Calendar renders < 200ms, smooth drag-drop at 60fps  
**Constraints**: Must maintain existing data structures, no breaking changes to APIs  
**Scale/Scope**: ~100 concurrent users, ~1000 assignments/events per month

**User-Provided Context**: 
- Kanban view is for creating assignments only (not for visual connection)
- Only parents and admins can view kanban
- Students can see calendar but cannot edit assignment dates
- Students can only edit events they created themselves

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend, backend)
- Using framework directly? YES (Next.js, Supabase client)
- Single data model? YES (shared TypeScript types)
- Avoiding patterns? YES (no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? N/A (template constitution not applicable)
- Libraries listed: calendar-utils, assignment-display
- CLI per library: N/A (web application)
- Library docs: Component documentation in Storybook format

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES
- Git commits show tests before implementation? YES
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (Supabase test instance)
- Integration tests for: calendar display, assignment rendering, permission checks
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES
- Frontend logs → backend? YES (error tracking)
- Error context sufficient? YES

**Versioning**:
- Version number assigned? 2.1.0
- BUILD increments on every change? YES
- Breaking changes handled? NO (none planned)

## Project Structure

### Documentation (this feature)
```
specs/002-revamp-the-calendar/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (when "frontend" + "backend" detected)
src/
├── app/
│   └── api/
│       └── events/
│           └── route.ts        # Events API with assignment integration
├── calendar/
│   ├── components/
│   │   └── client-container.tsx # Main calendar view
│   ├── contexts/
│   │   └── calendar-context.tsx # Calendar state management
│   └── interfaces.ts           # Calendar data types
├── components/
│   ├── kanban-assignment-board.tsx # Kanban for assignment creation
│   └── assignment-card.tsx     # Assignment display component
├── services/
│   └── assignment-service.ts   # Assignment business logic
└── types/
    └── index.ts                # Shared type definitions

tests/
├── integration/
│   ├── calendar-display.test.tsx
│   └── assignment-permissions.test.ts
└── unit/
    └── student-initials.test.ts
```

**Structure Decision**: Option 2 (Web application) - existing Next.js structure

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Best practices for displaying multiple assignees in limited space
   - Optimal approach for initial generation with name conflicts
   - Calendar event vs assignment visual differentiation patterns

2. **Generate and dispatch research agents**:
   ```
   Task: "Research compact multi-user display patterns for calendar items"
   Task: "Find best practices for initial generation from names"
   Task: "Research calendar UI patterns for different item types"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: Show initials with tooltip for full names
   - Rationale: Compact, scannable, accessible
   - Alternatives considered: Avatars (too space-consuming), truncated names (unclear)

**Output**: research.md with all design decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - CalendarItem (unified display entity)
   - AssignmentDisplay (assignment-specific rendering)
   - StudentInitials (name to initials conversion)

2. **Generate API contracts** from functional requirements:
   - GET /api/events (enhanced with assignee initials)
   - GET /api/assignments/calendar-view
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test assignment items have no time display
   - Test student initials are correctly generated
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Parent views calendar with student initials
   - Student views only their assignments
   - Admin sees all assignments with context

5. **Update CLAUDE.md incrementally**:
   - Add calendar/kanban integration context
   - Document role-based permissions
   - Update recent changes section

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Calendar display enhancement tasks
- Assignment rendering update tasks
- Permission enforcement tasks
- Initial generation utility tasks

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Utils before components before views
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations requiring justification*

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
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*